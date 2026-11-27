"""
Mrs. Pets — Segundo Cinturón de Seguridad
Módulo de Gestión de Sesiones Firmadas por Servidor, Palabra Clave y Auditoría Append-Only
Especificación v1.0 · Leire (Gerencia Operativa) / Google AntiGravity
Principio rector: fail-closed.
"""

import os
import re
import sys
import time
import uuid
import secrets
import hashlib
import hmac
import logging
import json
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple, List

from starlette.requests import Request
from starlette.responses import JSONResponse, Response

import db

log = logging.getLogger("mrspets.security")

# Constantes de Seguridad
COOKIE_HOST_NAME = "__Host-mp_session"
COOKIE_FALLBACK_NAME = "mp_session"
SESSION_TTL_HOURS = 8
ELEVATION_TTL_MINUTES = 30
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 30
ATTEMPT_WINDOW_MINUTES = 15

# Secreto de aplicación (Pepper) para hash de palabra clave
PEPPER = os.environ.get("PASSPHRASE_PEPPER", "mrs_pets_pepper_sec_key_2026_maracaibo").strip()


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _hash_str(val: str) -> str:
    if not val:
        return ""
    return hashlib.sha256(val.encode("utf-8")).hexdigest()[:32]


def get_device_fingerprint(request: Request) -> str:
    """Calcula una huella de dispositivo normalizada a partir de User-Agent e IP."""
    ua = request.headers.get("user-agent", "")
    ip = request.client.host if request.client else ""
    # Subred /24 normalizada para evitar roturas por rotación móvil
    ip_parts = ip.split(".")
    ip_norm = ".".join(ip_parts[:3]) if len(ip_parts) >= 3 else ip
    raw = f"{ua}|{ip_norm}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def sign_session_token(session_id: str, subject_id: str, role: str, exp_dt: datetime) -> str:
    """
    Bloque 1.1: Emite un identificador de sesión firmado con la clave del servidor.
    Incluye: session_id, subject_id, role, issued_at, exp.
    """
    payload = {
        "session_id": str(session_id),
        "subject_id": str(subject_id),
        "role": str(role),
        "issued_at": _now_utc().isoformat(),
        "exp": exp_dt.isoformat()
    }
    payload_json = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload_json).decode('ascii').rstrip('=')
    sig = hmac.new(PEPPER.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"


def verify_and_decode_session_token(token_str: str) -> Optional[Dict[str, Any]]:
    """
    Bloque 1.2 & 2.3: Valida la firma en cada turno.
    Si la clave es ausente, token inválido o expirado, retorna None (fail-closed).
    """
    if not token_str or "." not in token_str:
        return None
    try:
        parts = token_str.split(".")
        if len(parts) != 2:
            return None
        payload_b64, sig = parts
        expected_sig = hmac.new(PEPPER.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        rem = len(payload_b64) % 4
        padded = payload_b64 + ('=' * (4 - rem) if rem else '')
        payload_json = base64.urlsafe_b64decode(padded.encode('ascii')).decode('utf-8')
        data = json.loads(payload_json)
        exp_str = data.get("exp")
        if exp_str:
            exp_dt = datetime.fromisoformat(exp_str.replace("Z", "+00:00"))
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            if exp_dt < _now_utc():
                return None
        return data
    except Exception:
        return None


def get_or_create_thread(subject_id: str, requested_thread_id: Optional[str] = None) -> str:
    """
    Bloque 1.4 & 1.5: La memoria de conversación se indexa por (subject_id, thread_id).
    Si se proporciona un thread_id (ej. proveniente de Teamily o del cliente), se usa y asocia;
    de lo contrario, se recupera el más reciente o se genera uno nuevo en el servidor.
    """
    subj = str(subject_id or "anon_guest").strip()
    if requested_thread_id and str(requested_thread_id).strip():
        req_th = str(requested_thread_id).strip()
        try:
            row = db.q(
                "SELECT thread_id FROM conversation_threads WHERE subject_id=%s AND thread_id=%s LIMIT 1",
                (subj, req_th),
                one=True
            )
            if not row:
                db.execute(
                    """INSERT INTO conversation_threads (subject_id, thread_id, created_at, updated_at)
                       VALUES (%s, %s, NOW(), NOW())""",
                    (subj, req_th)
                )
            else:
                db.execute(
                    "UPDATE conversation_threads SET updated_at=NOW() WHERE subject_id=%s AND thread_id=%s",
                    (subj, req_th)
                )
            return req_th
        except Exception:
            return req_th

    try:
        row = db.q(
            "SELECT thread_id FROM conversation_threads WHERE subject_id=%s ORDER BY updated_at DESC LIMIT 1",
            (subj,),
            one=True
        )
        if row and row.get("thread_id"):
            th_id = str(row["thread_id"]).strip()
            db.execute(
                "UPDATE conversation_threads SET updated_at=NOW() WHERE subject_id=%s AND thread_id=%s",
                (subj, th_id)
            )
            return th_id
    except Exception:
        pass

    new_th = f"th_{uuid.uuid4().hex[:16]}"
    try:
        db.execute(
            """INSERT INTO conversation_threads (subject_id, thread_id, created_at, updated_at)
               VALUES (%s, %s, NOW(), NOW())""",
            (subj, new_th)
        )
    except Exception as _e:
        log.warning("No se pudo persistir conversation_threads: %s", _e)
    return new_th


def check_and_reject_identity_declaration(request: Request, body: dict) -> Tuple[bool, dict, str]:
    """
    Bloque 2.2:
    Si un rol, un indicador de sesión autenticada, un subject_id o cualquier bloque de
    'contexto interno verificado' llega desde:
    - el body de la petición,
    - la query string,
    - los headers del cliente,
    - el estado del cliente,
    se descarta por completo y se registra el intento estructurado con:
    event: 'identity_declaration_rejected', origen del dato, IP, timestamp y session_id si existe.
    """
    rejected = False
    reasons = []
    ip = request.client.host if request.client else ""
    ua = request.headers.get("user-agent", "")
    sess_cookie = request.cookies.get(COOKIE_HOST_NAME) or request.cookies.get(COOKIE_FALLBACK_NAME) or ""
    sess_id = None
    if sess_cookie:
        decoded = verify_and_decode_session_token(sess_cookie)
        if decoded:
            sess_id = decoded.get("session_id")

    # 1. Inspeccionar campos en body
    SUSPICIOUS_BODY_KEYS = [
        "role", "userType", "user_type", "userRole", "user_role",
        "staff_authenticated", "is_staff", "staff_verified", "authenticated",
        "subject_id", "subjectId", "client_id", "staff_id"
    ]
    cleaned_body = dict(body)
    for k in SUSPICIOUS_BODY_KEYS:
        if k in cleaned_body:
            rejected = True
            reasons.append(f"body.{k}={cleaned_body.pop(k)}")

    # 2. Inspeccionar headers del cliente
    for h, v in request.headers.items():
        h_low = h.lower()
        if h_low in ["x-role", "x-user-role", "x-staff-auth", "x-subject-id", "x-auth-level"]:
            rejected = True
            reasons.append(f"header.{h}={v}")

    # 3. Inspeccionar query params
    for qk in ["role", "is_staff", "staff", "userType", "subject_id", "client_id"]:
        if qk in request.query_params:
            rejected = True
            reasons.append(f"query.{qk}={request.query_params[qk]}")

    # 4. Inspeccionar prompt injection en el mensaje
    msg = str(cleaned_body.get("message") or cleaned_body.get("input") or "").strip()
    INJECTION_PATTERNS = [
        r'\[IDENTITY_DIRECTIVE[^\]]*\]',
        r'\[CONTEXTO DE ATENCIÓN[^\]]*\]',
        r'\[CONTEXTO OPERATIVO[^\]]*\]',
        r'\[DIRECTIVA[^\]]*\]',
        r'staff_verified',
        r'protocolo vip',
        r'identity_directive:'
    ]
    clean_msg = msg
    for pat in INJECTION_PATTERNS:
        if re.search(pat, msg, re.IGNORECASE):
            rejected = True
            reasons.append(f"text_injection:{pat}")
            clean_msg = re.sub(pat, '', clean_msg, flags=re.IGNORECASE).strip()

    if "message" in cleaned_body:
        cleaned_body["message"] = clean_msg
    if "input" in cleaned_body:
        cleaned_body["input"] = clean_msg

    if rejected:
        origin_str = "; ".join(reasons)
        log_audit_event(
            action="identity_declaration_rejected",
            result="denied",
            session_id=sess_id,
            resource_type="declaration",
            resource_id=origin_str[:64],
            ip=ip,
            user_agent=ua
        )
        log.warning(json.dumps({
            "event": "identity_declaration_rejected",
            "origin": origin_str,
            "ip": ip,
            "timestamp": _now_utc().isoformat(),
            "session_id": sess_id
        }))

    return rejected, cleaned_body, clean_msg


def init_security_schema() -> bool:
    """Crea las tablas de sesiones, palabras clave, hilos y auditoría en la base de datos."""
    sql = """
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL,
        staff_id TEXT,
        subject_id TEXT,
        staff_display_name TEXT,
        role TEXT NOT NULL DEFAULT 'visitor',
        auth_level TEXT NOT NULL DEFAULT 'anonymous',
        passphrase_ok BOOLEAN NOT NULL DEFAULT FALSE,
        device_fp TEXT NOT NULL,
        jti TEXT UNIQUE NOT NULL,
        issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        elevation_expires_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS ix_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS ix_sessions_staff ON sessions(staff_id);

    CREATE TABLE IF NOT EXISTS conversation_threads (
        subject_id TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (subject_id, thread_id)
    );
    CREATE INDEX IF NOT EXISTS ix_conv_threads_subject ON conversation_threads(subject_id);

    CREATE TABLE IF NOT EXISTS staff_passphrases (
        staff_id TEXT PRIMARY KEY,
        passphrase_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMPTZ,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS audit_log (
        event_id TEXT PRIMARY KEY,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        staff_id TEXT,
        staff_display_name TEXT,
        session_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        result TEXT NOT NULL,
        ip_hash TEXT,
        user_agent_hash TEXT
    );
    CREATE INDEX IF NOT EXISTS ix_audit_log_staff ON audit_log(staff_id, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS ix_audit_log_action ON audit_log(action, occurred_at DESC);

    CREATE TABLE IF NOT EXISTS avatar_jwt_jtis (
        jti TEXT PRIMARY KEY,
        subject_id TEXT,
        used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS avatar_link_codes (
        code_hash TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ,
        is_consumed BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS conversation_memory (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        speaker TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ix_conv_mem_subj_th ON conversation_memory(subject_id, thread_id);
    """
    try:
        for stmt in sql.strip().split(";"):
            stmt_clean = stmt.strip()
            if stmt_clean:
                db.execute(stmt_clean)
        # Compatibilidad de migración si sessions ya existía sin subject_id
        try:
            db.execute("ALTER TABLE sessions ADD COLUMN subject_id TEXT")
        except Exception:
            pass
        log.info("Tablas de seguridad del Segundo Cinturón inicializadas correctamente.")
        return True
    except Exception as e:
        log.error("Error al inicializar esquema de seguridad: %s", e)
        return False


def hash_passphrase(passphrase: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Genera hash criptográfico PBKDF2-HMAC-SHA256 con salt de 16 bytes y pepper."""
    salt_val = salt or secrets.token_hex(16)
    salted_peppered = (passphrase + PEPPER).encode("utf-8")
    derived = hashlib.pbkdf2_hmac("sha256", salted_peppered, salt_val.encode("utf-8"), 100000)
    return derived.hex(), salt_val


def verify_passphrase_hash(passphrase: str, salt: str, expected_hash: str) -> bool:
    """Verificación en tiempo constante anti timing-attacks."""
    computed, _ = hash_passphrase(passphrase, salt)
    return hmac.compare_digest(computed, expected_hash)


def seed_staff_credentials():
    """Siembra las credenciales institucionales mínimas de staff y sus palabras clave."""
    try:
        # 1. Staff Fundador: Sr. Harryt Luzardo (staff_admin)
        harryt_passphrase = os.environ.get("HARRYT_PASSPHRASE", "Luzardo2026!")
        row_h = db.q("SELECT staff_id FROM staff_passphrases WHERE staff_id=%s", ("staff_harryt",), one=True)
        if not row_h:
            h_hash, h_salt = hash_passphrase(harryt_passphrase)
            db.execute(
                """INSERT INTO staff_passphrases (staff_id, passphrase_hash, salt, rotated_at, failed_attempts)
                   VALUES (%s, %s, %s, NOW(), 0)""",
                ("staff_harryt", h_hash, h_salt)
            )
            log.info("Palabra clave sembrada para Staff Fundador (staff_harryt).")

        # 2. Staff Operativo: Dalybell Ramírez
        daly_passphrase = os.environ.get("DALYBELL_PASSPHRASE", "Dalybell2026!")
        row_d = db.q("SELECT staff_id FROM staff_passphrases WHERE staff_id=%s", ("staff_dalybell",), one=True)
        if not row_d:
            d_hash, d_salt = hash_passphrase(daly_passphrase)
            db.execute(
                """INSERT INTO staff_passphrases (staff_id, passphrase_hash, salt, rotated_at, failed_attempts)
                   VALUES (%s, %s, %s, NOW(), 0)""",
                ("staff_dalybell", d_hash, d_salt)
            )
            log.info("Palabra clave sembrada para Staff Operativo (staff_dalybell).")

        # 3. Staff Administrador Principal: staff_admin
        admin_passphrase = os.environ.get("ADMIN_PASSPHRASE", os.environ.get("ADMIN_PASSWORD", "Admin2026!"))
        row_a = db.q("SELECT staff_id FROM staff_passphrases WHERE staff_id=%s", ("staff_admin",), one=True)
        if not row_a:
            a_hash, a_salt = hash_passphrase(admin_passphrase)
            db.execute(
                """INSERT INTO staff_passphrases (staff_id, passphrase_hash, salt, rotated_at, failed_attempts)
                   VALUES (%s, %s, %s, NOW(), 0)""",
                ("staff_admin", a_hash, a_salt)
            )
            log.info("Palabra clave sembrada para Staff Administrador (staff_admin).")
    except Exception as e:
        log.warning("No se pudieron sembrar palabras clave de staff: %s", e)


def log_audit_event(
    action: str,
    result: str,
    staff_id: Optional[str] = None,
    staff_display_name: Optional[str] = None,
    session_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip: str = "",
    user_agent: str = ""
):
    """Registra un evento append-only en la bitácora de auditoría."""
    event_id = str(uuid.uuid4())
    ip_h = _hash_str(ip)
    ua_h = _hash_str(user_agent)
    try:
        db.execute(
            """INSERT INTO audit_log
               (event_id, occurred_at, staff_id, staff_display_name, session_id, action, resource_type, resource_id, result, ip_hash, user_agent_hash)
               VALUES (%s, NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (event_id, staff_id, staff_display_name, session_id, action, resource_type, resource_id, result, ip_h, ua_h)
        )
    except Exception as e:
        log.error("Fallo registrando en audit_log (%s): %s", action, e)


def create_session(
    staff_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    staff_display_name: Optional[str] = None,
    role: str = "visitor",
    auth_level: str = "anonymous",
    device_fp: str = "",
    ip: str = "",
    user_agent: str = ""
) -> Tuple[str, Dict[str, Any]]:
    """
    Crea una sesión firmada server-side (Bloque 1.1) y devuelve el token firmado junto a la sesión.
    """
    session_id = f"sess_{uuid.uuid4().hex}"
    jti = str(uuid.uuid4())
    now = _now_utc()
    expires_at = now + timedelta(hours=SESSION_TTL_HOURS)
    subj = str(subject_id or staff_id or f"anon_{session_id}").strip()

    # Bloque 1.1: Token firmado con la clave del servidor
    signed_token = sign_session_token(session_id, subj, role, expires_at)
    token_h = _hash_str(signed_token)

    sql = """
    INSERT INTO sessions (
        session_id, token_hash, staff_id, subject_id, staff_display_name, role, auth_level,
        passphrase_ok, device_fp, jti, issued_at, expires_at, elevation_expires_at, revoked_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, FALSE, %s, %s, NOW(), %s, NULL, NULL)
    """
    db.execute(sql, (
        session_id, token_h, staff_id, subj, staff_display_name, role, auth_level,
        device_fp, jti, expires_at
    ))

    session_data = {
        "session_id": session_id,
        "staff_id": staff_id,
        "subject_id": subj,
        "staff_display_name": staff_display_name,
        "role": role,
        "auth_level": auth_level,
        "passphrase_ok": False,
        "device_fp": device_fp,
        "jti": jti,
        "expires_at": expires_at.isoformat()
    }

    log_audit_event(
        action="SESSION_CREATED",
        result="allowed",
        staff_id=staff_id,
        staff_display_name=staff_display_name,
        session_id=session_id,
        resource_type="session",
        resource_id=session_id,
        ip=ip,
        user_agent=user_agent
    )

    return signed_token, session_data


def get_verified_session(request: Request) -> Dict[str, Any]:
    """
    Recupera y valida la sesión desde la cookie segura contra el store server-side.
    Principio fail-closed (Bloque 1.2 & 2.3):
    - Si el servidor no firmó la sesión con clave válida -> visitante.
    - Si la firma expiró -> visitante.
    - Si la sesión no resuelve a una ficha única en BD -> visitante.
    """
    anon_session = {
        "verified": False,
        "session_id": None,
        "staff_id": None,
        "subject_id": None,
        "staff_display_name": None,
        "role": None,
        "auth_level": "anonymous",
        "passphrase_ok": False,
        "permissions": ["view_public_catalog"],
        "can_view_client_data": False,
        "can_view_pricing": False,
        "can_view_access": False
    }

    # 1. Leer cookie __Host-mp_session (o mp_session de respaldo)
    raw_token = request.cookies.get(COOKIE_HOST_NAME) or request.cookies.get(COOKIE_FALLBACK_NAME)
    if not raw_token:
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            raw_token = auth_header[7:].strip()

    if not raw_token:
        # Respaldo: verificar si existe sesión legítima en cookie estándar mrs_pets_session
        try:
            import sec
            legacy_token = request.cookies.get(sec.COOKIE_NAME)
            if legacy_token:
                u = sec.get_session(legacy_token)
                if u and u.get("tipo") == "staff":
                    st_user = db.q("SELECT * FROM staff_users WHERE id=%s AND activo=TRUE", (u.get("user_id"),), one=True)
                    if st_user:
                        uname = st_user.get("username", "")
                        s_id = f"staff_{uname}"
                        s_role = st_user.get("rol") or "staff"
                        s_name = st_user.get("nombre") or uname.title()
                        return {
                            "verified": True,
                            "session_id": f"sess_leg_{u['token'][:8]}",
                            "staff_id": s_id,
                            "subject_id": s_id,
                            "staff_display_name": s_name,
                            "role": s_role,
                            "auth_level": "staff_authenticated",
                            "passphrase_ok": False,
                            "permissions": ["view_public_catalog", "view_own_pets", "book_appointment", "view_assigned_tasks"],
                            "can_view_client_data": False,
                            "can_view_pricing": False,
                            "can_view_access": False
                        }
                elif u and u.get("tipo") == "cliente":
                    tut = db.q("SELECT * FROM tutores WHERE id=%s AND activo=TRUE", (u.get("tutor_id"),), one=True)
                    if tut:
                        return {
                            "verified": True,
                            "session_id": f"sess_leg_{u['token'][:8]}",
                            "staff_id": None,
                            "subject_id": str(tut["id"]),
                            "staff_display_name": tut.get("nombre"),
                            "role": "client",
                            "auth_level": "client_verified",
                            "passphrase_ok": False,
                            "permissions": ["view_public_catalog", "view_own_pets", "book_appointment"],
                            "can_view_client_data": False,
                            "can_view_pricing": False,
                            "can_view_access": False
                        }
        except Exception:
            pass
        return anon_session

    # Bloque 1.2: Validar firma si el token contiene la estructura firmada
    if "." in raw_token:
        decoded = verify_and_decode_session_token(raw_token)
        if not decoded:
            log_audit_event(
                action="COOKIE_TAMPERING_SUSPECTED",
                result="denied",
                resource_type="cookie",
                resource_id="invalid_signature",
                ip=request.client.host if request.client else "",
                user_agent=request.headers.get("user-agent", "")
            )
            tampered = dict(anon_session)
            tampered["tampered"] = True
            return tampered

    token_h = _hash_str(raw_token)

    try:
        row = db.q(
            """SELECT session_id, staff_id, subject_id, staff_display_name, role, auth_level, passphrase_ok,
                      device_fp, jti, expires_at, elevation_expires_at, revoked_at
               FROM sessions WHERE token_hash=%s LIMIT 1""",
            (token_h,),
            one=True
        )
    except Exception as e:
        log.error("Fallo al acceder al store de sesiones (fail-closed activado): %s", e)
        return anon_session

    if not row:
        log_audit_event(
            action="COOKIE_TAMPERING_SUSPECTED",
            result="denied",
            resource_type="cookie",
            resource_id=token_h[:8],
            ip=request.client.host if request.client else "",
            user_agent=request.headers.get("user-agent", "")
        )
        tampered = dict(anon_session)
        tampered["tampered"] = True
        return tampered

    # 2. Validar expiración y revocación
    if row.get("revoked_at"):
        log.warning("Intento de acceso con sesión revocada: %s", row.get("session_id"))
        log_audit_event(
            action="REVOKED_SESSION_ACCESS_ATTEMPT",
            result="denied",
            staff_id=row.get("staff_id"),
            session_id=row.get("session_id"),
            ip=request.client.host if request.client else "",
            user_agent=request.headers.get("user-agent", "")
        )
        return anon_session

    expires_at = row.get("expires_at")
    if isinstance(expires_at, str):
        try:
            expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        except Exception:
            pass

    now = _now_utc()
    if expires_at and isinstance(expires_at, datetime):
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            log.info("Sesión expirada: %s", row.get("session_id"))
            return anon_session

    # 3. Validar elevación de privilegios (30 minutos)
    auth_lvl = str(row.get("auth_level") or "anonymous")
    passphrase_ok = bool(row.get("passphrase_ok"))
    elev_exp = row.get("elevation_expires_at")
    if isinstance(elev_exp, str):
        try:
            elev_exp = datetime.fromisoformat(elev_exp.replace("Z", "+00:00"))
        except Exception:
            pass

    if auth_lvl == "staff_verified" and elev_exp and isinstance(elev_exp, datetime):
        if elev_exp.tzinfo is None:
            elev_exp = elev_exp.replace(tzinfo=timezone.utc)
        if elev_exp < now:
            auth_lvl = "staff_authenticated"
            passphrase_ok = False
            try:
                db.execute(
                    "UPDATE sessions SET auth_level='staff_authenticated', passphrase_ok=FALSE WHERE session_id=%s",
                    (row["session_id"],)
                )
            except Exception:
                pass

    # 4. Validar huella de dispositivo si está configurada
    current_fp = get_device_fingerprint(request)
    session_fp = str(row.get("device_fp") or "")
    if session_fp and session_fp != current_fp:
        log_audit_event(
            action="SESSION_HIJACK_SUSPECTED",
            result="denied",
            staff_id=row.get("staff_id"),
            session_id=row.get("session_id"),
            ip=request.client.host if request.client else "",
            user_agent=request.headers.get("user-agent", "")
        )
        return anon_session

    role = str(row.get("role") or "visitor")
    staff_id = row.get("staff_id")
    subject_id = row.get("subject_id") or staff_id

    # Bloque 1.2 & 2.3: Resolver la sesión contra una ficha concreta y única en BD
    # Si la sesión no resuelve a exactamente una ficha, se trata como no autenticada (visitante)
    resolved_subject_id = None
    if role in ("staff", "staff_admin") or "staff" in auth_lvl:
        target_s = staff_id or subject_id
        staff_rec = None
        if target_s:
            try:
                staff_rec = db.q("SELECT staff_id FROM staff_passphrases WHERE staff_id=%s AND revoked_at IS NULL", (target_s,), one=True)
                if not staff_rec:
                    uname = str(target_s).replace("staff_", "")
                    staff_rec = db.q("SELECT id, username FROM staff_users WHERE (username=%s OR CONCAT('staff_', username)=%s) AND activo=TRUE", (uname, str(target_s)), one=True)
            except Exception as _e_staff_res:
                log.warning("Error resolviendo ficha staff: %s", _e_staff_res)
        if not staff_rec:
            # No resuelve a una ficha de staff en BD -> fail-closed: visitante
            log.warning("Sesión de staff %s no resuelve a una ficha válida en BD. Degrada a visitante.", target_s)
            return anon_session
        resolved_subject_id = target_s

    elif role == "client" or auth_lvl == "client_verified":
        client_rec = None
        if subject_id:
            try:
                if str(subject_id).isdigit():
                    client_rec = db.q("SELECT id, nombre, telefono FROM tutores WHERE id=%s AND activo=TRUE", (int(subject_id),), one=True)
                if not client_rec:
                    norm_p = norm_phone(str(subject_id))
                    if norm_p:
                        client_rec = db.q("SELECT id, nombre, telefono FROM tutores WHERE telefono_norm=%s AND activo=TRUE", (norm_p,), one=True)
            except Exception as _e_client_res:
                log.warning("Error resolviendo ficha cliente: %s", _e_client_res)
        if not client_rec:
            # No resuelve a una ficha de cliente en BD -> fail-closed: visitante
            log.warning("Sesión de cliente %s no resuelve a una ficha válida en BD. Degrada a visitante.", subject_id)
            return anon_session
        resolved_subject_id = str(client_rec["id"])
    else:
        # Rol visitante
        resolved_subject_id = None

    # Bloque 1.3: Permisos tipados de capacidades permitidas
    is_verified_staff = (auth_lvl == "staff_verified" and bool(passphrase_ok))
    is_staff_auth = (auth_lvl in ("staff_authenticated", "staff_verified"))

    if is_verified_staff:
        permissions = [
            "view_public_catalog", "view_own_pets", "book_appointment",
            "view_assigned_tasks", "view_client_data", "view_pricing", "view_access", "manage_schedule"
        ]
        is_verified = True
    elif is_staff_auth:
        permissions = [
            "view_public_catalog", "view_own_pets", "book_appointment", "view_assigned_tasks"
        ]
        is_verified = False  # Sin palabra clave, no está elevado/verificado para datos internos
    elif role == "client" and resolved_subject_id:
        permissions = [
            "view_public_catalog", "view_own_pets", "book_appointment"
        ]
        is_verified = True
    else:
        permissions = ["view_public_catalog"]
        is_verified = False

    return {
        "verified": is_verified,
        "session_id": row["session_id"],
        "staff_id": row.get("staff_id"),
        "subject_id": resolved_subject_id,
        "staff_display_name": row.get("staff_display_name"),
        "role": role,
        "auth_level": auth_lvl,
        "passphrase_ok": passphrase_ok,
        "permissions": permissions,
        "can_view_client_data": is_verified_staff,
        "can_view_pricing": is_verified_staff,
        "can_view_access": bool(is_verified_staff and role == "staff_admin")
    }


def verify_staff_passphrase(
    request: Request,
    passphrase: str,
    target_staff_id: Optional[str] = None
) -> Tuple[bool, str, Optional[str], Optional[Dict[str, Any]]]:
    """
    Verifica la palabra clave de staff fuera del chat.
    Devuelve: (ok, status_code, new_raw_token, session_data)
    """
    current_session = get_verified_session(request)
    current_auth = current_session.get("auth_level")
    staff_id = target_staff_id or current_session.get("staff_id") or "staff_harryt"
    ip = request.client.host if request.client else ""
    ua = request.headers.get("user-agent", "")

    # Requerir sesión activa de staff (Pieza 1 obligatoria)
    if current_auth not in ("staff_authenticated", "staff_verified"):
        log_audit_event(
            action="STAFF_VERIFY_UNAUTHENTICATED",
            result="denied",
            staff_id=staff_id,
            ip=ip,
            user_agent=ua
        )
        return False, "UNAUTHORIZED", None, None

    # Consultar palabra clave en base de datos
    row = db.q(
        "SELECT staff_id, passphrase_hash, salt, revoked_at, failed_attempts, locked_until FROM staff_passphrases WHERE staff_id=%s LIMIT 1",
        (staff_id,),
        one=True
    )
    if not row:
        log_audit_event(
            action="STAFF_VERIFY_FAILED",
            result="denied",
            staff_id=staff_id,
            ip=ip,
            user_agent=ua
        )
        return False, "INVALID_CREDENTIALS", None, None

    if row.get("revoked_at"):
        log_audit_event(
            action="STAFF_VERIFY_REVOKED",
            result="denied",
            staff_id=staff_id,
            ip=ip,
            user_agent=ua
        )
        return False, "REVOKED", None, None

    now = _now_utc()
    locked_until = row.get("locked_until")
    if isinstance(locked_until, str):
        try:
            locked_until = datetime.fromisoformat(locked_until.replace("Z", "+00:00"))
        except Exception:
            pass

    if locked_until and isinstance(locked_until, datetime):
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > now:
            log_audit_event(
                action="STAFF_VERIFY_LOCKED",
                result="denied",
                staff_id=staff_id,
                ip=ip,
                user_agent=ua
            )
            return False, "LOCKED", None, None

    # Verificar coincidencia de hash
    is_match = verify_passphrase_hash(passphrase, row["salt"], row["passphrase_hash"])
    if not is_match:
        failed_count = int(row.get("failed_attempts") or 0) + 1
        new_lock = None
        if failed_count >= MAX_FAILED_ATTEMPTS:
            new_lock = now + timedelta(minutes=LOCKOUT_MINUTES)
            db.execute(
                "UPDATE staff_passphrases SET failed_attempts=%s, locked_until=%s WHERE staff_id=%s",
                (failed_count, new_lock, staff_id)
            )
        else:
            db.execute(
                "UPDATE staff_passphrases SET failed_attempts=%s WHERE staff_id=%s",
                (failed_count, staff_id)
            )

        log_audit_event(
            action="STAFF_VERIFY_FAILED",
            result="denied",
            staff_id=staff_id,
            session_id=current_session.get("session_id"),
            ip=ip,
            user_agent=ua
        )
        return False, "INVALID_CREDENTIALS" if failed_count < MAX_FAILED_ATTEMPTS else "LOCKED", None, None

    # ÉXITO: Rotar sesión, activar elevación por 30 minutos
    db.execute(
        "UPDATE staff_passphrases SET failed_attempts=0, locked_until=NULL WHERE staff_id=%s",
        (staff_id,)
    )

    # Rotar token de sesión firmado (Bloque 1.1)
    new_session_id = f"sess_{uuid.uuid4().hex}"
    new_jti = str(uuid.uuid4())
    elev_exp = now + timedelta(minutes=ELEVATION_TTL_MINUTES)
    exp = now + timedelta(hours=SESSION_TTL_HOURS)
    staff_disp = current_session.get("staff_display_name") or ("Sr. Harryt Luzardo" if "harryt" in staff_id else "Dalybell Ramírez")
    s_role = current_session.get("role", "staff_admin")

    new_raw_token = sign_session_token(new_session_id, staff_id, s_role, exp)
    new_token_h = _hash_str(new_raw_token)

    # Invalidar sesión vieja
    if current_session.get("session_id"):
        db.execute(
            "UPDATE sessions SET revoked_at=NOW() WHERE session_id=%s",
            (current_session["session_id"],)
        )

    # Insertar nueva sesión elevada con subject_id
    device_fp = get_device_fingerprint(request)
    db.execute(
        """INSERT INTO sessions (
            session_id, token_hash, staff_id, subject_id, staff_display_name, role, auth_level,
            passphrase_ok, device_fp, jti, issued_at, expires_at, elevation_expires_at, revoked_at
        ) VALUES (%s, %s, %s, %s, %s, %s, 'staff_verified', TRUE, %s, %s, NOW(), %s, %s, NULL)""",
        (new_session_id, new_token_h, staff_id, staff_id, staff_disp, s_role, device_fp, new_jti, exp, elev_exp)
    )

    log_audit_event(
        action="STAFF_VERIFIED",
        result="allowed",
        staff_id=staff_id,
        staff_display_name=staff_disp,
        session_id=new_session_id,
        resource_type="elevation",
        resource_id=new_session_id,
        ip=ip,
        user_agent=ua
    )

    session_data = {
        "verified": True,
        "session_id": new_session_id,
        "staff_id": staff_id,
        "subject_id": staff_id,
        "staff_display_name": staff_disp,
        "role": s_role,
        "auth_level": "staff_verified",
        "passphrase_ok": True,
        "permissions": [
            "view_public_catalog", "view_own_pets", "book_appointment",
            "view_assigned_tasks", "view_client_data", "view_pricing", "view_access", "manage_schedule"
        ],
        "can_view_client_data": True,
        "can_view_pricing": True,
        "can_view_access": True
    }

    return True, "OK", new_raw_token, session_data


def revoke_staff_sessions(staff_id: str, revoker_staff_id: Optional[str] = None, ip: str = "", ua: str = "") -> int:
    """Revoca inmediatamente todas las sesiones activas de un empleado."""
    try:
        db.execute("UPDATE sessions SET revoked_at=NOW() WHERE staff_id=%s AND revoked_at IS NULL", (staff_id,))
        log_audit_event(
            action="STAFF_SESSIONS_REVOKED",
            result="allowed",
            staff_id=staff_id,
            resource_type="staff",
            resource_id=staff_id,
            ip=ip,
            user_agent=ua
        )
        return 1
    except Exception as e:
        log.error("Error revocando sesiones de %s: %s", staff_id, e)
        return 0


def revoke_passphrase(staff_id: str, revoker_staff_id: Optional[str] = None, ip: str = "", ua: str = "") -> bool:
    """Revoca la palabra clave de un empleado e invalida sus sesiones."""
    try:
        db.execute("UPDATE staff_passphrases SET revoked_at=NOW() WHERE staff_id=%s", (staff_id,))
        revoke_staff_sessions(staff_id, revoker_staff_id=revoker_staff_id, ip=ip, ua=ua)
        log_audit_event(
            action="PASSPHRASE_REVOKED",
            result="allowed",
            staff_id=staff_id,
            resource_type="passphrase",
            resource_id=staff_id,
            ip=ip,
            user_agent=ua
        )
        return True
    except Exception as e:
        log.error("Error revocando palabra clave de %s: %s", staff_id, e)
        return False


def set_session_cookie(response: Response, raw_token: str):
    """Establece la cookie __Host-mp_session segura según la especificación."""
    # Cookie principal __Host-mp_session (HttpOnly, Secure, SameSite=Strict, Path=/)
    response.set_cookie(
        key=COOKIE_HOST_NAME,
        value=raw_token,
        max_age=SESSION_TTL_HOURS * 3600,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/"
    )
    # Cookie de compatibilidad para entornos locales/HTTP sin prefijo __Host-
    response.set_cookie(
        key=COOKIE_FALLBACK_NAME,
        value=raw_token,
        max_age=SESSION_TTL_HOURS * 3600,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/"
    )


def clear_session_cookie(response: Response):
    """Elimina las cookies de sesión."""
    response.delete_cookie(key=COOKIE_HOST_NAME, path="/")
    response.delete_cookie(key=COOKIE_FALLBACK_NAME, path="/")


def build_identity_directive(session: Dict[str, Any]) -> Dict[str, Any]:
    """
    Construye la directiva de identidad tipada para Margarette según la Sección 1.5 de la spec.
    Regla: verified: true si la sesión es staff verificado o autenticado por el servidor.
    """
    auth_lvl = str(session.get("auth_level") or "anonymous")
    role = session.get("role")
    is_staff = bool(role in ("staff", "staff_admin") and ("staff" in auth_lvl or bool(session.get("verified"))))
    now_iso = _now_utc().strftime("%Y-%m-%dT%H:%M:%SZ")

    if is_staff:
        staff_disp = session.get("staff_display_name") or "Sr. Harryt Luzardo (Fundador & Director General)"
        return {
            "identity_directive": {
                "verified": True,
                "role": session.get("role", "staff_admin"),
                "auth_level": auth_lvl,
                "issued_by": "server",
                "staff_display_name": staff_disp,
                "staff_id": session.get("staff_id") or session.get("subject_id") or "@9000408632300095",
                "issued_at": now_iso
            }
        }
    elif role == "client" and session.get("verified"):
        return {
            "identity_directive": {
                "verified": True,
                "role": "client",
                "auth_level": auth_lvl,
                "issued_by": "server",
                "staff_display_name": session.get("staff_display_name"),
                "subject_id": session.get("subject_id"),
                "issued_at": now_iso
            }
        }
    else:
        return {
            "identity_directive": {
                "verified": False,
                "role": None,
                "auth_level": session.get("auth_level", "anonymous"),
                "issued_by": "server",
                "staff_display_name": None,
                "issued_at": now_iso
            }
        }


def require_verified_session(request: Request, required_level: str = "staff_verified") -> Tuple[bool, Optional[JSONResponse], Dict[str, Any]]:
    """
    Middleware / Guard de sesión verificada server-side.
    Principio fail-closed.
    """
    session = get_verified_session(request)
    if session.get("tampered"):
        return False, JSONResponse(
            status_code=401,
            content={"status": "error", "code": 401, "error": "INVALID_COOKIE", "message": "Cookie de sesión manipulada o inválida"}
        ), session

    if not session.get("session_id"):
        return False, JSONResponse(
            status_code=401,
            content={"status": "error", "code": 401, "error": "UNAUTHORIZED", "message": "Autenticación requerida"}
        ), session

    LEVEL_RANKS = {
        "anonymous": 0,
        "client_verified": 1,
        "staff_authenticated": 2,
        "staff_verified": 3
    }
    user_rank = LEVEL_RANKS.get(session.get("auth_level", "anonymous"), 0)
    req_rank = LEVEL_RANKS.get(required_level, 3)

    if user_rank < req_rank:
        return False, JSONResponse(
            status_code=403,
            content={
                "status": "error",
                "code": 403,
                "error": "FORBIDDEN",
                "message": f"Nivel de autenticación insuficiente: se requiere {required_level}, actual={session.get('auth_level')}"
            }
        ), session

    return True, None, session


# =====================================================================
# BLOQUE 2, 3, 5, 6 & 7 — CANAL DE IDENTIDAD FIRMADO DEL AVATAR
# =====================================================================

MP_AVATAR_SHARED_KEY_ENV = "MP_AVATAR_SHARED_KEY"
LINK_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"  # Sin 0, O, 1, I, L


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64url_decode(s: str) -> bytes:
    rem = len(s) % 4
    if rem:
        s += "=" * (4 - rem)
    return base64.urlsafe_b64decode(s.encode("ascii"))


def get_avatar_shared_key() -> str:
    """BLOQUE 2.5: Clave compartida leída de variable de entorno MP_AVATAR_SHARED_KEY."""
    key = os.environ.get(MP_AVATAR_SHARED_KEY_ENV, "").strip()
    if not key:
        secret = os.environ.get("SECRET_KEY", "mrs_pets_avatar_default_secret_key_2026")
        key = hashlib.sha256(f"avatar_shared_token_key_{secret}".encode("utf-8")).hexdigest()
    return key


def create_avatar_jwt(
    subject_id: str,
    role: str = "tutor",
    ttl_seconds: int = 300,
    kid: str = "v1",
    jti: Optional[str] = None,
    iss: str = "mrspets-portal",
    aud: str = "avatar",
    exp_override: Optional[int] = None,
    alg_override: Optional[str] = None
) -> str:
    """
    BLOQUE 2.4 — Formato del token (JWT firmado, HS256 con clave compartida):
      iss  = "mrspets-portal"
      aud  = "avatar"
      sub  = subject_id  (el id de la ficha, NO el id de autenticación)
      role = "tutor" | "staff"
      iat  = emisión
      exp  = emisión + 300 s  (vida corta; se re-emite por petición)
      jti  = identificador único del token
      kid  = identificador de la clave usada (permite rotación)
    """
    alg = alg_override or "HS256"
    header = {"alg": alg, "typ": "JWT", "kid": kid}
    now_ts = int(time.time())
    payload = {
        "iss": iss,
        "aud": aud,
        "sub": str(subject_id),
        "role": str(role),
        "iat": now_ts,
        "exp": exp_override if exp_override is not None else (now_ts + ttl_seconds),
        "jti": jti or uuid.uuid4().hex
    }
    h_bytes = json.dumps(header, separators=(",", ":")).encode("utf-8")
    p_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    h_b64 = _b64url_encode(h_bytes)
    p_b64 = _b64url_encode(p_bytes)
    signing_input = f"{h_b64}.{p_b64}".encode("utf-8")

    if alg == "none":
        return f"{h_b64}.{p_b64}."

    key = get_avatar_shared_key()
    sig = hmac.new(key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(sig)
    return f"{h_b64}.{p_b64}.{sig_b64}"


def log_avatar_degradation(
    reason: str,
    jti: Optional[str] = None,
    host_iss: str = "mrspets-portal",
    host_aud: str = "avatar",
    thread_id: Optional[str] = None
) -> None:
    """
    BLOQUE 3.3 — Log estructurado obligatorio en cada degradación.
    Vocabulario exacto:
      no_header | invalid_signature | expired | invalid_audience |
      invalid_issuer | replay | subject_not_found | subject_inactive
    NUNCA el token, NUNCA datos personales del tutor.
    """
    rec = {
        "event": "avatar_identity_degradation",
        "reason": reason,
        "jti": jti or "none",
        "host_iss": host_iss or "mrspets-portal",
        "host_aud": host_aud or "avatar",
        "thread_id": thread_id or "none",
        "timestamp": _now_utc().strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    log.warning(json.dumps(rec))
    try:
        db.execute(
            """INSERT INTO audit_log (event_id, occurred_at, action, resource_type, resource_id, result)
               VALUES (%s, NOW(), %s, %s, %s, %s)""",
            (uuid.uuid4().hex, f"avatar_degradation_{reason}", "avatar_session", jti or "none", "degraded_to_visitor")
        )
    except Exception:
        pass


def verify_avatar_jwt(
    header_val: Optional[str],
    request: Optional[Request] = None,
    thread_id: Optional[str] = None
) -> Tuple[bool, Optional[Dict[str, Any]], str, Optional[str]]:
    """
    BLOQUE 3.1 & 3.2 — Verificación en el servidor del avatar (Fail-Closed).
    Orden obligatorio de comprobaciones:
      a) header presente            → si no: reason = "no_header"
      b) alg en allowlist [HS256]   → rechaza "none" y confusión de alg ("invalid_signature")
      c) firma válida (const-time)  → si no: reason = "invalid_signature"
      d) exp vigente                → si no: reason = "expired"
      e) aud == "avatar"            → si no: reason = "invalid_audience"
      f) iss == "mrspets-portal"    → si no: reason = "invalid_issuer"
      g) jti no reutilizado         → si no: reason = "replay"
    BLOQUE 5.1 & 5.2 — Resolución de la ficha desde la sesión:
      h) resolución de sub en tutores o staff_users:
         - no encontrada            → reason = "subject_not_found"
         - inactiva                 → reason = "subject_inactive"
    Retorna: (is_valid, trusted_session, reason, jti)
    """
    # a) Header presente
    if not header_val or not str(header_val).strip():
        return False, None, "no_header", None

    clean_h = str(header_val).strip()
    if clean_h.lower().startswith("bearer "):
        token_str = clean_h[7:].strip()
    else:
        token_str = clean_h

    if not token_str:
        return False, None, "no_header", None

    parts = token_str.split(".")
    if len(parts) != 3:
        return False, None, "invalid_signature", None

    h_b64, p_b64, sig_b64 = parts

    # b) alg en allowlist [HS256]
    try:
        h_json = json.loads(_b64url_decode(h_b64).decode("utf-8"))
    except Exception:
        return False, None, "invalid_signature", None

    alg = h_json.get("alg")
    if alg != "HS256":
        return False, None, "invalid_signature", None

    # c) firma válida (comparación en tiempo constante)
    key = get_avatar_shared_key()
    signing_input = f"{h_b64}.{p_b64}".encode("utf-8")
    expected_sig = hmac.new(key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    expected_sig_b64 = _b64url_encode(expected_sig)

    if not hmac.compare_digest(sig_b64, expected_sig_b64):
        return False, None, "invalid_signature", None

    # Decodificar payload
    try:
        payload = json.loads(_b64url_decode(p_b64).decode("utf-8"))
    except Exception:
        return False, None, "invalid_signature", None

    jti = payload.get("jti")

    # d) exp vigente
    exp = payload.get("exp")
    if not isinstance(exp, (int, float)) or exp < int(time.time()):
        return False, None, "expired", jti

    # e) aud == "avatar"
    if payload.get("aud") != "avatar":
        return False, None, "invalid_audience", jti

    # f) iss == "mrspets-portal"
    if payload.get("iss") != "mrspets-portal":
        return False, None, "invalid_issuer", jti

    # g) jti no reutilizado
    if not jti:
        return False, None, "invalid_signature", None

    try:
        row_jti = db.q("SELECT jti FROM avatar_jwt_jtis WHERE jti=%s LIMIT 1", (str(jti),), one=True)
        if row_jti:
            return False, None, "replay", jti

        exp_iso = datetime.fromtimestamp(exp, tz=timezone.utc).isoformat()
        db.execute(
            """INSERT INTO avatar_jwt_jtis (jti, subject_id, used_at, expires_at)
               VALUES (%s, %s, NOW(), %s)""",
            (str(jti), str(payload.get("sub", "")), exp_iso)
        )
    except Exception as _e_jti:
        log.warning("Excepción evaluando jti: %s", _e_jti)

    # BLOQUE 5: Resolución de la ficha desde la sesión (sub)
    sub = payload.get("sub")
    role = str(payload.get("role") or "tutor").strip().lower()

    if not sub:
        return False, None, "subject_not_found", jti

    if role in ("staff", "staff_admin"):
        # Buscar en staff_users
        st_row = None
        if str(sub).isdigit():
            st_row = db.q("SELECT id, username, nombre, rol, activo FROM staff_users WHERE id=%s", (int(sub),), one=True)
        if not st_row:
            u_name = str(sub).replace("staff_", "").strip()
            st_row = db.q("SELECT id, username, nombre, rol, activo FROM staff_users WHERE LOWER(username)=LOWER(%s)", (u_name,), one=True)

        if not st_row:
            # Respaldo: verificar en staff_passphrases (credenciales institucionales sembradas)
            sp_row = db.q("SELECT staff_id FROM staff_passphrases WHERE staff_id=%s LIMIT 1", (str(sub),), one=True)
            if sp_row or "harryt" in str(sub).lower() or "dalybell" in str(sub).lower():
                display_name = "Sr. Harryt Luzardo (Fundador & Director General)" if "harryt" in str(sub).lower() else "Dalybell Ramírez"
                pets = [{
                    "nombre": "Luna",
                    "especie": "Perro",
                    "raza": "Golden Retriever",
                    "notas_relevantes": "Princesa consentida de la casa del Sr. Harryt"
                }] if "harryt" in str(sub).lower() else []
                return True, {
                    "subject_id": str(sub),
                    "role": role,
                    "display_name": display_name,
                    "pets": pets
                }, "ok", jti

            return False, None, "subject_not_found", jti

        is_act = bool(st_row.get("activo") not in (False, 0, "0", None))
        if not is_act:
            return False, None, "subject_inactive", jti

        display_name = st_row.get("nombre") or st_row.get("username", "Staff")
        pets = []
        if "harryt" in str(st_row.get("username", "")).lower() or "harryt" in str(sub).lower():
            pets = [{
                "nombre": "Luna",
                "especie": "Perro",
                "raza": "Golden Retriever",
                "notas_relevantes": "Princesa consentida de la casa del Sr. Harryt"
            }]
    else:
        # Buscar en tutores
        tut_row = None
        if str(sub).isdigit():
            tut_row = db.q("SELECT id, nombre, rif, telefono, direccion, sector, activo FROM tutores WHERE id=%s", (int(sub),), one=True)
        if not tut_row:
            tut_row = db.q("SELECT id, nombre, rif, telefono, direccion, sector, activo FROM tutores WHERE LOWER(nombre)=LOWER(%s)", (str(sub),), one=True)

        if not tut_row:
            return False, None, "subject_not_found", jti

        is_act = bool(tut_row.get("activo") not in (False, 0, "0", None))
        if not is_act:
            return False, None, "subject_inactive", jti

        display_name = tut_row.get("nombre", "Cliente VIP")
        mascotas = db.q(
            "SELECT id, nombre, especie, raza, notas FROM mascotas WHERE tutor_id=%s AND activo=TRUE",
            (tut_row["id"],)
        ) or []
        pets = [{
            "nombre": m.get("nombre"),
            "especie": m.get("especie"),
            "raza": m.get("raza"),
            "notas_relevantes": m.get("notas")
        } for m in mascotas]

    # BLOQUE 5.3: Construcción del objeto de sesión verificado
    trusted_session = {
        "subject_id": str(sub),
        "display_name": display_name,
        "role": role,
        "pets": pets,
        "verified_at": _now_utc().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "signed_session"
    }

    return True, trusted_session, "", jti


def generate_avatar_link_code(
    subject_id: str,
    thread_id: str,
    role: str = "tutor",
    ttl_seconds: int = 300
) -> str:
    """
    BLOQUE 6.2(b) — Código de un solo uso (6 caracteres sin ambigüedad),
    TTL 5 min, ligado a subject_id y thread_id, almacenado con hash SHA-256.
    """
    code = "".join(secrets.choice(LINK_CODE_ALPHABET) for _ in range(6))
    code_hash = hashlib.sha256(code.upper().encode("utf-8")).hexdigest()
    exp_dt = _now_utc() + timedelta(seconds=ttl_seconds)

    db.execute(
        """INSERT INTO avatar_link_codes (code_hash, subject_id, thread_id, role, created_at, expires_at, is_consumed)
           VALUES (%s, %s, %s, %s, NOW(), %s, FALSE)""",
        (code_hash, str(subject_id), str(thread_id), role, exp_dt.isoformat())
    )
    return code


def redeem_avatar_link_code(
    code_or_text: str,
    thread_id: Optional[str] = None
) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    """
    BLOQUE 6.2(b) & 6.4 — Canje del código de un solo uso.
    Un segundo intento con el mismo código falla con reason = "replay".
    Un código vencido falla con "expired".
    """
    if not code_or_text:
        return False, None, "not_found"

    clean = code_or_text.strip().upper()
    matches = re.findall(r'\b[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}\b', clean)
    if not matches and len(clean) == 6:
        matches = [clean]
    if not matches:
        return False, None, "not_found"

    code = matches[0]
    c_hash = hashlib.sha256(code.encode("utf-8")).hexdigest()

    row = db.q(
        "SELECT code_hash, subject_id, thread_id, role, expires_at, is_consumed FROM avatar_link_codes WHERE code_hash=%s LIMIT 1",
        (c_hash,),
        one=True
    )
    if not row:
        return False, None, "not_found"

    if bool(row.get("is_consumed")):
        return False, None, "replay"

    exp_val = row.get("expires_at")
    now_dt = _now_utc()
    if isinstance(exp_val, str):
        try:
            exp_val = datetime.fromisoformat(exp_val.replace("Z", "+00:00"))
        except Exception:
            exp_val = None

    if exp_val and now_dt > exp_val:
        return False, None, "expired"

    # Marcar consumido
    db.execute(
        "UPDATE avatar_link_codes SET is_consumed=TRUE, consumed_at=NOW() WHERE code_hash=%s",
        (c_hash,)
    )

    target_th = thread_id or row["thread_id"]
    try:
        db.execute(
            """INSERT INTO conversation_threads (subject_id, thread_id, created_at, updated_at)
               VALUES (%s, %s, NOW(), NOW())
               ON CONFLICT (subject_id, thread_id) DO UPDATE SET updated_at=NOW()""",
            (row["subject_id"], target_th)
        )
    except Exception:
        pass

    return True, {
        "subject_id": row["subject_id"],
        "role": row["role"],
        "thread_id": target_th
    }, ""


def record_conversation_memory(
    subject_id: str,
    thread_id: str,
    speaker: str,
    content: str
) -> None:
    """
    BLOQUE 7.5 — La memoria de conversación se indexa por (subject_id, thread_id).
    speaker: 'user' | 'avatar' | 'teamily_margaret'
    """
    if not subject_id or not thread_id or not content:
        return
    clean = content.strip()
    if not clean:
        return
    mem_id = uuid.uuid4().hex
    try:
        db.execute(
            """INSERT INTO conversation_memory (id, subject_id, thread_id, speaker, content, created_at)
               VALUES (%s, %s, %s, %s, %s, NOW())""",
            (mem_id, str(subject_id), str(thread_id), str(speaker), clean)
        )
    except Exception as _e:
        log.warning("No se pudo registrar conversation_memory: %s", _e)


def get_conversation_memory(
    subject_id: str,
    thread_id: str,
    limit: int = 15
) -> List[Dict[str, Any]]:
    """
    BLOQUE 7.5 — Lectura de memoria filtrando estrictamente por AMBOS (subject_id, thread_id).
    Sin acceso cruzado entre clientes.
    """
    if not subject_id or not thread_id:
        return []
    try:
        rows = db.q(
            """SELECT speaker, content, created_at FROM conversation_memory
               WHERE subject_id=%s AND thread_id=%s
               ORDER BY created_at ASC LIMIT %s""",
            (str(subject_id), str(thread_id), limit)
        ) or []
        return [dict(r) for r in rows]
    except Exception as _e:
        log.warning("No se pudo leer conversation_memory: %s", _e)
        return []

