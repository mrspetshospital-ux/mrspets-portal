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
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple

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


def init_security_schema() -> bool:
    """Crea las tablas de sesiones, palabras clave y auditoría en la base de datos."""
    sql = """
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL,
        staff_id TEXT,
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
    """
    try:
        # Ejecutar por declaraciones si es SQLite
        for stmt in sql.strip().split(";"):
            stmt_clean = stmt.strip()
            if stmt_clean:
                db.execute(stmt_clean)
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
    staff_display_name: Optional[str] = None,
    role: str = "visitor",
    auth_level: str = "anonymous",
    device_fp: str = "",
    ip: str = "",
    user_agent: str = ""
) -> Tuple[str, Dict[str, Any]]:
    """Crea una sesión firmada server-side y devuelve el token opaco junto a la sesión."""
    raw_token = secrets.token_urlsafe(32)
    token_h = _hash_str(raw_token)
    session_id = f"sess_{uuid.uuid4().hex}"
    jti = str(uuid.uuid4())
    now = _now_utc()
    expires_at = now + timedelta(hours=SESSION_TTL_HOURS)

    sql = """
    INSERT INTO sessions (
        session_id, token_hash, staff_id, staff_display_name, role, auth_level,
        passphrase_ok, device_fp, jti, issued_at, expires_at, elevation_expires_at, revoked_at
    ) VALUES (%s, %s, %s, %s, %s, %s, FALSE, %s, %s, NOW(), %s, NULL, NULL)
    """
    db.execute(sql, (
        session_id, token_h, staff_id, staff_display_name, role, auth_level,
        device_fp, jti, expires_at
    ))

    session_data = {
        "session_id": session_id,
        "staff_id": staff_id,
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

    return raw_token, session_data


def get_verified_session(request: Request) -> Dict[str, Any]:
    """
    Recupera y valida la sesión desde la cookie segura contra el store server-side.
    Principio fail-closed: Si la cookie no existe, expiró, fue revocada o falló el store,
    devuelve auth_level='anonymous', verified=False.
    """
    anon_session = {
        "verified": False,
        "session_id": None,
        "staff_id": None,
        "staff_display_name": None,
        "role": None,
        "auth_level": "anonymous",
        "passphrase_ok": False,
        "can_view_client_data": False,
        "can_view_pricing": False,
        "can_view_access": False
    }

    # 1. Leer cookie __Host-mp_session (o mp_session de respaldo)
    raw_token = request.cookies.get(COOKIE_HOST_NAME) or request.cookies.get(COOKIE_FALLBACK_NAME)
    if not raw_token:
        # También permitir token en Header Authorization Bearer para llamadas de test o CLI
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            raw_token = auth_header[7:].strip()

    if not raw_token:
        return anon_session

    token_h = _hash_str(raw_token)

    try:
        row = db.q(
            """SELECT session_id, staff_id, staff_display_name, role, auth_level, passphrase_ok,
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
    # Convertir a datetime si viene como string en SQLite
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
            # Degradar automáticamente elevación vencida
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
        # Posible secuestro de sesión
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
    is_verified_staff = (auth_lvl == "staff_verified")

    return {
        "verified": is_verified_staff,
        "session_id": row["session_id"],
        "staff_id": row.get("staff_id"),
        "staff_display_name": row.get("staff_display_name"),
        "role": role,
        "auth_level": auth_lvl,
        "passphrase_ok": passphrase_ok,
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

    # Rotar token de sesión
    new_raw_token = secrets.token_urlsafe(32)
    new_token_h = _hash_str(new_raw_token)
    new_session_id = f"sess_{uuid.uuid4().hex}"
    new_jti = str(uuid.uuid4())
    elev_exp = now + timedelta(minutes=ELEVATION_TTL_MINUTES)
    exp = now + timedelta(hours=SESSION_TTL_HOURS)

    # Invalidar sesión vieja
    if current_session.get("session_id"):
        db.execute(
            "UPDATE sessions SET revoked_at=NOW() WHERE session_id=%s",
            (current_session["session_id"],)
        )

    # Insertar nueva sesión elevada
    device_fp = get_device_fingerprint(request)
    staff_disp = current_session.get("staff_display_name") or ("Sr. Harryt Luzardo" if "harryt" in staff_id else "Dalybell Ramírez")
    db.execute(
        """INSERT INTO sessions (
            session_id, token_hash, staff_id, staff_display_name, role, auth_level,
            passphrase_ok, device_fp, jti, issued_at, expires_at, elevation_expires_at, revoked_at
        ) VALUES (%s, %s, %s, %s, %s, 'staff_verified', TRUE, %s, %s, NOW(), %s, %s, NULL)""",
        (new_session_id, new_token_h, staff_id, staff_disp, current_session.get("role", "staff_admin"), device_fp, new_jti, exp, elev_exp)
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
        "staff_display_name": staff_disp,
        "role": current_session.get("role", "staff_admin"),
        "auth_level": "staff_verified",
        "passphrase_ok": True,
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
    Regla: verified: true SOLO si auth_level == staff_verified.
    """
    is_verified = (session.get("auth_level") == "staff_verified" and bool(session.get("passphrase_ok")))
    now_iso = _now_utc().strftime("%Y-%m-%dT%H:%M:%SZ")

    if is_verified:
        return {
            "identity_directive": {
                "verified": True,
                "role": session.get("role", "staff_admin"),
                "auth_level": "staff_verified",
                "issued_by": "server",
                "staff_display_name": session.get("staff_display_name", "Sr. Harryt Luzardo"),
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
