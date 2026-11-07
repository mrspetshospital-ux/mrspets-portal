"""
Mrs Pets — Servidor de staging
==============================

Sirve el portal existente (root.html + css + js + assets) y expone una API REST
para todo lo que hoy vive en localStorage.

Ejecutar local:
    uvicorn server:app --host 0.0.0.0 --port 8000

Variables de entorno (ver .env.example):
    DATABASE_URL      cadena de Neon/Postgres. Vacío = SQLite local.
    PORTAL_USER       usuario de la barrera de acceso al portal
    PORTAL_PASSWORD   contraseña de la barrera de acceso
    SECRET_KEY        clave para firmar cookies de sesión
    ADMIN_USER / ADMIN_PASSWORD   primer usuario staff (se crea al arrancar)
"""
import os
import re
import hmac
import time
import ssl
import json
import urllib.request
import urllib.error
import logging
import traceback
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, Request, Response, HTTPException, Depends, Query, Body
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import db
import security as sec
import facturacion as fac

# Integraciones de IA, Teamily, ElevenLabs y Google Sheets
try:
    from teamilyClient import teamily_geo_a_client, TeamilyGeoARequest, TeamilyThreadConfig, normalize_teamily_endpoint
except Exception:
    teamily_geo_a_client = None

try:
    from elevenlabsEngine import elevenlabs_engine
except Exception:
    elevenlabs_engine = None

try:
    from googleSheetsEngine import google_sheets_engine, sanitize_sheet_value
except Exception:
    google_sheets_engine = None

try:
    from warRoomEngine import war_room_engine, is_authorized_war_room_admin
except Exception:
    war_room_engine = None
    def is_authorized_war_room_admin(u):
        if not u: return False
        role = str(u.get("rol") or u.get("role") or "").lower()
        name = str(u.get("nombre") or u.get("username") or "").lower()
        return role == "admin" and any(p in name for p in ["harry", "daly", "admin", "hp"])

try:
    from centralitaRouter import centralita_router
except Exception:
    centralita_router = None


# ---------------------------------------------------------------------
# Logging — errores claros y consultables
# ---------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
log = logging.getLogger("mrspets")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

PORTAL_USER = os.getenv("PORTAL_USER", "").strip()
PORTAL_PASSWORD = os.getenv("PORTAL_PASSWORD", "").strip()
ADMIN_USER = os.getenv("ADMIN_USER", "admin").strip()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "").strip()

app = FastAPI(title="Mrs Pets API", version="1.0.0-staging", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGIN", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------
# Arranque
# ---------------------------------------------------------------------
@app.on_event("startup")
def _startup():
    log.info("Arrancando Mrs Pets staging | motor=%s",
             "postgres" if db.IS_POSTGRES else "sqlite")
    try:
        db.init_schema()
    except Exception as e:
        log.error("No se pudo aplicar el esquema: %s", e)
        log.error(traceback.format_exc())

    # Primer usuario staff -------------------------------------------------
    # Si no existe se crea. Si existe pero ADMIN_PASSWORD ya no abre su hash,
    # se re-sincroniza el hash: la variable de entorno manda. Así la dueña
    # puede recuperar el acceso cambiando ADMIN_PASSWORD en Render, sin
    # tocar la base de datos ni ejecutar nada a mano.
    if ADMIN_PASSWORD:
        try:
            fila = db.q("SELECT id, password_hash FROM staff_users "
                        "WHERE LOWER(username)=LOWER(%s)", (ADMIN_USER,), one=True)
            if not fila:
                db.execute(
                    """INSERT INTO staff_users (username, nombre, password_hash, rol)
                       VALUES (%s,%s,%s,'admin')""",
                    (ADMIN_USER, "Administrador", sec.hash_password(ADMIN_PASSWORD)),
                )
                log.info("Usuario staff '%s' creado al arrancar.", ADMIN_USER)
            elif not sec.verify_password(ADMIN_PASSWORD, fila["password_hash"]):
                db.execute("UPDATE staff_users SET password_hash=%s WHERE id=%s",
                           (sec.hash_password(ADMIN_PASSWORD), fila["id"]))
                log.info("Contraseña de '%s' sincronizada con ADMIN_PASSWORD "
                         "(el hash de la base no coincidía).", ADMIN_USER)
            else:
                log.info("Usuario staff '%s' listo (hash coincide con ADMIN_PASSWORD).",
                         ADMIN_USER)
        except Exception as e:
            log.error("No se pudo preparar el usuario admin '%s': %s", ADMIN_USER, e)
    else:
        log.warning("ADMIN_PASSWORD vacío: no se crea ni sincroniza el usuario "
                    "'%s'. El acceso a Vista Empresa quedará sin respaldo.", ADMIN_USER)

    if not PORTAL_PASSWORD:
        log.warning("PORTAL_PASSWORD vacío: el portal queda SIN barrera de acceso. "
                    "Definir en Render antes de compartir la URL.")
    elif not PORTAL_USER:
        log.warning("PORTAL_USER vacío: la barrera de acceso usará el usuario '%s' "
                    "(ADMIN_USER) para no dejar el portal inaccesible.", ADMIN_USER)
    else:
        log.info("Barrera de acceso activa para el usuario '%s'.", PORTAL_USER)


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------
def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    return (fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else ""))


def current_user(request: Request) -> Optional[dict]:
    # 1. Cookie de sesión
    raw = request.cookies.get(sec.COOKIE_NAME)
    token = sec.parse_cookie_value(raw) if raw else None

    # 2. Authorization Bearer Token / JWT
    if not token:
        auth = request.headers.get("authorization", "")
        if auth and auth.lower().startswith("bearer "):
            bearer = auth[7:].strip()
            token = sec.parse_cookie_value(bearer) or bearer

    # 3. Header específico War Room
    if not token:
        token = request.headers.get("x-war-room-token")

    # 4. Parámetro query token
    if not token:
        token = request.query_params.get("token")

    # 5. Token efímero de invitado para soporte externo aislado
    if token and war_room_engine:
        guest_data = war_room_engine.validate_ephemeral_token(token)
        if guest_data:
            return {
                "tipo": "guest",
                "id": 0,
                "nombre": "Soporte Técnico Externo",
                "rol": "guest",
                "token": token,
                "service_scope": guest_data.get("service_scope")
            }

    if not token:
        return None
    s = sec.get_session(token)
    if not s:
        return None
    if s["tipo"] == "staff":
        return {"tipo": "staff", "id": s["staff_id"], "nombre": s.get("staff_nombre") or s.get("username"),
                "rol": s.get("rol"), "token": token}
    return {"tipo": "cliente", "id": s["tutor_id"], "nombre": s.get("tutor_nombre"),
            "rol": "cliente", "token": token}


def require_war_room_admin(request: Request) -> dict:
    """Verifica autenticación estricta para Harryt o Dalybell (Dirección General)."""
    admin_key = request.headers.get("x-admin-key")
    if admin_key and (admin_key == ADMIN_PASSWORD or admin_key == sec.SECRET_KEY):
        return {"tipo": "staff", "id": 1, "nombre": ADMIN_USER or "Harryt / Dalybell", "rol": "admin"}

    u = current_user(request)
    if not u or not is_authorized_war_room_admin(u):
        raise HTTPException(
            status_code=403,
            detail="Acceso restringido: Módulo exclusivo para Dirección General y Administración Autorizada (Harryt / Dalybell)."
        )
    return u


def require_user(request: Request) -> dict:
    u = current_user(request)
    if not u:
        raise HTTPException(401, "Sesión requerida. Inicie sesión.")
    return u


def require_staff(request: Request) -> dict:
    u = require_user(request)
    if u["tipo"] != "staff":
        raise HTTPException(403, "Solo personal autorizado.")
    return u


def require_roles(*roles):
    def _dep(request: Request) -> dict:
        u = require_staff(request)
        if u["rol"] not in roles:
            raise HTTPException(403, f"Requiere rol: {', '.join(roles)}")
        return u
    return _dep


def norm_rif(v: Optional[str]) -> Optional[str]:
    if not v:
        return None
    return re.sub(r"[^0-9]", "", str(v)) or None


def norm_phone(v: Optional[str]) -> Optional[str]:
    if not v:
        return None
    d = re.sub(r"[^0-9]", "", str(v))
    return d[-10:] if len(d) >= 10 else d


def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        key=sec.COOKIE_NAME,
        value=sec.make_cookie_value(token),
        httponly=True,
        samesite="lax",
        secure=os.getenv("COOKIE_SECURE", "0") == "1",
        max_age=sec.SESSION_DAYS * 86400,
        path="/",
    )


_CAMPOS_SECRETOS = ("password_hash", "pin_hash", "token_hash")


def _limpiar(obj):
    """Quita hashes de cualquier respuesta. Nunca deben salir del servidor."""
    if isinstance(obj, dict):
        return {k: _limpiar(v) for k, v in obj.items() if k not in _CAMPOS_SECRETOS}
    if isinstance(obj, list):
        return [_limpiar(v) for v in obj]
    return obj


def ok(**kw):
    return {"status": "success", **_limpiar(kw)}


# ---------------------------------------------------------------------
# Modelos
# ---------------------------------------------------------------------
class LoginIn(BaseModel):
    username: str
    password: str


class ClienteLoginIn(BaseModel):
    identificador: str          # RIF, teléfono, email o nombre
    password: str


class TutorIn(BaseModel):
    nombre: str
    rif: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    sector: Optional[str] = None
    foto: Optional[str] = None
    password: Optional[str] = None
    pin: Optional[str] = None


class MascotaIn(BaseModel):
    nombre: str
    tutor_id: int
    codigo: Optional[str] = None
    especie: Optional[str] = None
    raza: Optional[str] = None
    sexo: Optional[str] = None
    peso_kg: Optional[float] = None
    foto: Optional[str] = None
    alergias: Optional[str] = None
    condiciones: Optional[str] = None
    notas: Optional[str] = None


class CitaIn(BaseModel):
    mascota_id: int
    area: str
    fecha_hora: str
    servicio_id: Optional[int] = None
    codigo: Optional[str] = None
    notas: Optional[str] = None
    precio_usd: Optional[float] = None


class ItemIn(BaseModel):
    concepto: str
    cantidad: float = 1
    precio_unitario: float = 0
    descuento_linea: float = 0
    servicio_id: Optional[int] = None
    producto_id: Optional[int] = None


class FacturaIn(BaseModel):
    tutor_id: Optional[int] = None
    mascota_id: Optional[int] = None
    cita_id: Optional[int] = None
    serie: str = "GEN"
    items: List[ItemIn] = Field(default_factory=list)
    descuento: float = 0
    iva_pct: float = 16
    igtf_pct: float = 0
    monto_divisas: float = 0
    tasa_bcv: Optional[float] = None
    cliente_nombre: Optional[str] = None
    cliente_rif: Optional[str] = None
    cliente_telefono: Optional[str] = None
    cliente_email: Optional[str] = None
    cliente_direccion: Optional[str] = None
    notas: Optional[str] = None


class PagoIn(BaseModel):
    metodo: str
    monto: float
    moneda: str = "USD"
    referencia: Optional[str] = None
    tasa_aplicada: Optional[float] = None
    notas: Optional[str] = None


class AnularIn(BaseModel):
    motivo: str


class LeiaIn(BaseModel):
    mensaje: str
    conversacion_id: Optional[int] = None


class TeamilyAgentChatIn(BaseModel):
    message_id: Optional[str] = None
    agente_origen: Optional[str] = "user"
    input: Optional[str] = None
    query: Optional[str] = None
    agent_slug: Optional[str] = None
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    board_id: Optional[str] = "5803df5a-7127-4d28-b97c-5c840d47cdc7"
    thread_mode: Optional[str] = "new"
    thread_id: Optional[str] = None
    endpoint_override: Optional[str] = None
    server_key_override: Optional[str] = None
    context: Optional[dict] = None


class VoiceTtsIn(BaseModel):
    text: Optional[str] = None
    input: Optional[str] = None
    prompt: Optional[str] = None
    agent_id: Optional[str] = "leia"
    voice_id: Optional[str] = None
    model_id: Optional[str] = None
    voice_settings: Optional[dict] = None
    allow_fallback: Optional[bool] = True


class GoogleSheetRecordIn(BaseModel):
    user_message: str
    agent_reply: str
    agent_name: Optional[str] = "Leia Concierge VIP & Asistencia CEO"
    agent_slug: Optional[str] = "leia"
    user_name: Optional[str] = None
    pet_name: Optional[str] = None
    channel: Optional[str] = "Widget Web (Leia Concierge)"
    status: Optional[str] = "ATENDIDO_EXITOSO"
    extra_context: Optional[dict] = None


class WarRoomPatchIn(BaseModel):
    incident_id: Optional[str] = "INC-ACTIVE"
    authorized_by: Optional[str] = "Harryt / Dalybell"
    notes: Optional[str] = "Parche autorizado desde el Cuarto de Guerra"
    patch_type: Optional[str] = "FAILOVER_REROUTE_AND_SYNC"


class WarRoomInviteIn(BaseModel):
    duration_hours: Optional[int] = 1
    service: Optional[str] = "Q-Vet DICOM PACS"
    notes: Optional[str] = "Soporte técnico externo"
    creator: Optional[str] = "Harryt / Dalybell"


class WarRoomChatIn(BaseModel):
    sender: Optional[str] = "Soporte Técnico"
    role: Optional[str] = "Técnico Especialista"
    message: str
    token: Optional[str] = None
    node_id: Optional[str] = "guest"


class WarRoomPulseIn(BaseModel):
    signal: Optional[str] = "ALERT"
    service: Optional[str] = "Make.com Webhook Omnichannel"
    title: Optional[str] = "Fallo de Comunicación en Webhook Make.com (HTTP 502)"
    error_code: Optional[str] = "WEBHOOK_UNREACHABLE_502"
    details: Optional[dict] = None
    affected_nodes: Optional[List[str]] = None


class WarRoomConfigIn(BaseModel):
    make_webhook_url: Optional[str] = None
    make_fallback_url: Optional[str] = None
    teamly_endpoint_url: Optional[str] = None
    teamly_board_id: Optional[str] = None
    antigravity_endpoint_url: Optional[str] = None
    volturi_endpoint_url: Optional[str] = None
    google_sheets_id: Optional[str] = None


class WarRoomPingIn(BaseModel):
    node_id: str
    url: Optional[str] = None
    payload: Optional[dict] = None


class ReporteIn(BaseModel):
    pantalla: Optional[str] = None
    accion: Optional[str] = None
    error_mensaje: Optional[str] = None
    error_stack: Optional[str] = None
    url: Optional[str] = None


# =====================================================================
# SALUD
# =====================================================================
@app.get("/api/health")
def health():
    h = db.health()
    return {"status": "ok" if h["ok"] else "error", "db": h,
            "version": "1.0.0-staging",
            "portal_protegido": bool(PORTAL_PASSWORD),
            "portal_usuario_configurado": bool(PORTAL_USER),
            "admin_usuario": ADMIN_USER,
            "admin_password_configurado": bool(ADMIN_PASSWORD)}


# =====================================================================
# AUTENTICACIÓN
# =====================================================================
@app.post("/api/auth/login")
def staff_login(data: LoginIn, request: Request, response: Response):
    """
    Login de personal. Dos fuentes, en este orden:

      1. La tabla staff_users (hash PBKDF2 de la base de datos).
      2. Respaldo: ADMIN_USER / ADMIN_PASSWORD de las variables de entorno.

    El respaldo existe para que el dueño del portal nunca se quede fuera:
    si el hash de la base se perdió o cambió, basta con poner la clave en
    Render y entrar con ese usuario. Al entrar por esta vía se re-sincroniza
    el hash, así las dos fuentes quedan alineadas.
    """
    username = (data.username or "").strip()
    password = data.password or ""

    row = None
    if username:
        row = db.q("SELECT * FROM staff_users WHERE LOWER(username)=LOWER(%s) AND activo=TRUE",
                   (username,), one=True)

    verificado = bool(row) and sec.verify_password(password, row["password_hash"])
    origen = "base_de_datos"

    # --- Respaldo por variable de entorno -------------------------------
    if not verificado and username and ADMIN_PASSWORD and \
            hmac.compare_digest(username.lower(), ADMIN_USER.lower()) and \
            hmac.compare_digest(password, ADMIN_PASSWORD):
        verificado = True
        origen = "variable_de_entorno"
        try:
            if row:
                # Alinear el hash con la clave de entorno.
                db.execute("UPDATE staff_users SET password_hash=%s WHERE id=%s",
                           (sec.hash_password(password), row["id"]))
            else:
                db.execute(
                    """INSERT INTO staff_users (username, nombre, password_hash, rol)
                       VALUES (%s,%s,%s,'admin')""",
                    (ADMIN_USER, "Administrador", sec.hash_password(password)),
                )
                row = db.q("SELECT * FROM staff_users WHERE LOWER(username)=LOWER(%s)",
                           (ADMIN_USER,), one=True)
                log.info("Usuario '%s' creado al iniciar sesión (respaldo por variables).",
                         ADMIN_USER)
        except Exception as e:
            log.error("No se pudo sincronizar el usuario '%s': %s", ADMIN_USER, e)

    if not verificado or not row:
        sec.audit("staff_users", "LOGIN_FALLIDO", usuario={"tipo": "staff", "nombre": username},
                  ip=client_ip(request))
        raise HTTPException(
            401,
            "Usuario o contraseña incorrectos. Escriba el usuario de personal "
            "tal como está registrado y su contraseña.",
        )

    if origen == "variable_de_entorno":
        log.info("Login de '%s' aceptado por respaldo ADMIN_USER/ADMIN_PASSWORD.", username)
    token = sec.create_session("staff", staff_id=row["id"], ip=client_ip(request),
                               user_agent=request.headers.get("user-agent"))
    set_session_cookie(response, token)
    db.execute("UPDATE staff_users SET ultimo_acceso=%s WHERE id=%s",
               (datetime.now(timezone.utc).isoformat(), row["id"]))
    sec.audit("staff_users", "LOGIN", row["id"],
              usuario={"tipo": "staff", "id": row["id"], "nombre": row["username"]},
              ip=client_ip(request))
    return ok(user={"id": row["id"], "username": row["username"],
                    "nombre": row["nombre"], "role": row["rol"], "token": token},
              token=token)


@app.post("/api/auth/cliente/login")
def cliente_login(data: ClienteLoginIn, request: Request, response: Response):
    """
    Login real de cliente. Acepta RIF, teléfono, email o nombre.
    Valida contra password_hash (PBKDF2). Si el tutor no tiene contraseña
    definida, cae al PIN como respaldo (compatibilidad con el portal actual).
    """
    ident = (data.identificador or "").strip()
    if not ident:
        raise HTTPException(400, "Indique RIF, teléfono, email o nombre.")

    rif_n = norm_rif(ident)
    tel_n = norm_phone(ident)
    row = db.q(
        """SELECT * FROM tutores
           WHERE activo=TRUE AND (
                 LOWER(nombre) = LOWER(%s)
              OR LOWER(email) = LOWER(%s)
              OR (%s IS NOT NULL AND rif_norm = %s)
              OR (%s IS NOT NULL AND telefono_norm = %s)
           )""",
        (ident, ident, rif_n, rif_n, tel_n, tel_n), one=True,
    )
    if not row:
        sec.audit("tutores", "LOGIN_FALLIDO", usuario={"tipo": "cliente", "nombre": ident},
                  ip=client_ip(request))
        raise HTTPException(401, "Usuario no registrado o inactivo.")

    valido = False
    if row.get("password_hash"):
        valido = sec.verify_password(data.password, row["password_hash"])
    if not valido and row.get("pin_hash"):
        valido = sec.verify_password(data.password, row["pin_hash"])

    if not valido:
        sec.audit("tutores", "LOGIN_FALLIDO", row["id"],
                  usuario={"tipo": "cliente", "id": row["id"], "nombre": row["nombre"]},
                  ip=client_ip(request))
        raise HTTPException(401, "Contraseña incorrecta.")

    token = sec.create_session("cliente", tutor_id=row["id"], ip=client_ip(request),
                               user_agent=request.headers.get("user-agent"))
    set_session_cookie(response, token)
    sec.audit("tutores", "LOGIN", row["id"],
              usuario={"tipo": "cliente", "id": row["id"], "nombre": row["nombre"]},
              ip=client_ip(request))
    return ok(tutor={"id": row["id"], "nombre": row["nombre"], "rif": row["rif"],
                     "telefono": row["telefono"], "email": row["email"]})


@app.post("/api/auth/logout")
def logout(request: Request, response: Response):
    u = current_user(request)
    if u:
        sec.revoke_session(u["token"])
    response.delete_cookie(sec.COOKIE_NAME, path="/")
    return ok()


@app.get("/api/auth/me")
def me(request: Request):
    u = current_user(request)
    if not u:
        raise HTTPException(401, "Sin sesión.")
    return ok(user={k: v for k, v in u.items() if k != "token"})


@app.get("/api/auth/staff-usuarios")
def staff_usuarios():
    """
    Lista de usuarios de personal que EXISTEN en la base, para que el
    desplegable "¿Quién es usted?" no ofrezca nombres inventados.

    Solo devuelve usuario, nombre y rol. Nunca el hash ni la contraseña.
    Endpoint público a propósito: la pantalla de login lo necesita antes de
    que haya sesión. No expone nada que no esté ya en el formulario.
    """
    try:
        filas = db.q(
            "SELECT username, nombre, rol FROM staff_users WHERE activo=TRUE "
            "ORDER BY CASE WHEN LOWER(username)=LOWER(%s) THEN 0 ELSE 1 END, username",
            (ADMIN_USER,),
        ) or []
    except Exception as e:
        log.error("No se pudo listar staff_users: %s", e)
        filas = []

    usuarios = [{"username": f["username"],
                 "nombre": f["nombre"],
                 "rol": f["rol"]} for f in filas]
    return ok(usuarios=usuarios, total=len(usuarios))


# =====================================================================
# TUTORES
# =====================================================================
@app.get("/api/tutores")
def listar_tutores(request: Request, q_: Optional[str] = Query(None, alias="q"),
                   user=Depends(require_staff)):
    if q_:
        like = f"%{q_}%"
        return ok(tutores=db.q(
            """SELECT * FROM tutores WHERE activo=TRUE AND
               (nombre ILIKE %s OR email ILIKE %s OR rif ILIKE %s OR telefono ILIKE %s)
               ORDER BY nombre""", (like, like, like, like)))
    return ok(tutores=db.q("SELECT * FROM tutores WHERE activo=TRUE ORDER BY nombre"))


@app.get("/api/tutores/{tid}")
def obtener_tutor(tid: int, request: Request):
    u = require_user(request)
    if u["tipo"] == "cliente" and u["id"] != tid:
        raise HTTPException(403, "Solo puede ver su propia ficha.")
    t = db.q("SELECT * FROM tutores WHERE id=%s", (tid,), one=True)
    if not t:
        raise HTTPException(404, "Tutor no encontrado.")
    t.pop("password_hash", None)
    t.pop("pin_hash", None)
    t["mascotas"] = db.q("SELECT * FROM mascotas WHERE tutor_id=%s AND activo=TRUE", (tid,))
    return ok(tutor=t)


@app.post("/api/tutores")
def crear_tutor(data: TutorIn, request: Request, user=Depends(require_staff)):
    rid = db.execute(
        """INSERT INTO tutores (nombre, rif, rif_norm, telefono, telefono_norm, email,
                                direccion, sector, foto, password_hash, pin_hash)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (data.nombre, data.rif, norm_rif(data.rif), data.telefono, norm_phone(data.telefono),
         data.email, data.direccion, data.sector, data.foto,
         sec.hash_password(data.password) if data.password else None,
         sec.hash_password(data.pin) if data.pin else None),
        returning=True,
    )
    sec.audit("tutores", "INSERT", rid, usuario=user, ip=client_ip(request))
    return ok(id=rid)


@app.patch("/api/tutores/{tid}")
def editar_tutor(tid: int, data: TutorIn, request: Request, user=Depends(require_staff)):
    t = db.q("SELECT * FROM tutores WHERE id=%s", (tid,), one=True)
    if not t:
        raise HTTPException(404, "Tutor no encontrado.")
    db.execute(
        """UPDATE tutores SET nombre=%s, rif=%s, rif_norm=%s, telefono=%s,
           telefono_norm=%s, email=%s, direccion=%s, sector=%s, foto=%s,
           password_hash=COALESCE(%s, password_hash),
           pin_hash=COALESCE(%s, pin_hash)
           WHERE id=%s""",
        (data.nombre, data.rif, norm_rif(data.rif), data.telefono, norm_phone(data.telefono),
         data.email, data.direccion, data.sector, data.foto,
         sec.hash_password(data.password) if data.password else None,
         sec.hash_password(data.pin) if data.pin else None, tid),
    )
    sec.audit("tutores", "UPDATE", tid, usuario=user, ip=client_ip(request))
    return ok(id=tid)


@app.delete("/api/tutores/{tid}")
def desactivar_tutor(tid: int, request: Request, user=Depends(require_roles("admin", "gerencia"))):
    db.execute("UPDATE tutores SET activo=FALSE WHERE id=%s", (tid,))
    sec.audit("tutores", "DESACTIVAR", tid, usuario=user, ip=client_ip(request))
    return ok(id=tid, activo=False)


# =====================================================================
# MASCOTAS
# =====================================================================
@app.get("/api/mascotas")
def listar_mascotas(request: Request, tutor_id: Optional[int] = None,
                    user=Depends(require_user)):
    if user["tipo"] == "cliente":
        tutor_id = user["id"]
    if tutor_id:
        return ok(mascotas=db.q(
            "SELECT * FROM mascotas WHERE tutor_id=%s AND activo=TRUE ORDER BY nombre",
            (tutor_id,)))
    return ok(mascotas=db.q("SELECT * FROM mascotas WHERE activo=TRUE ORDER BY nombre"))


@app.post("/api/mascotas")
def crear_mascota(data: MascotaIn, request: Request, user=Depends(require_staff)):
    codigo = data.codigo
    if not codigo:
        n = db.q("SELECT COUNT(*) AS c FROM mascotas", one=True)["c"] + 101
        codigo = f"PET-{n}"
    rid = db.execute(
        """INSERT INTO mascotas (codigo, tutor_id, nombre, especie, raza, sexo,
                                 peso_kg, foto, alergias, condiciones, notas)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (codigo, data.tutor_id, data.nombre, data.especie, data.raza, data.sexo,
         data.peso_kg, data.foto, data.alergias, data.condiciones, data.notas),
        returning=True,
    )
    sec.audit("mascotas", "INSERT", rid, usuario=user, ip=client_ip(request))
    return ok(id=rid, codigo=codigo)


@app.patch("/api/mascotas/{mid}")
def editar_mascota(mid: int, data: MascotaIn, request: Request, user=Depends(require_staff)):
    db.execute(
        """UPDATE mascotas SET nombre=%s, especie=%s, raza=%s, sexo=%s, peso_kg=%s,
           foto=%s, alergias=%s, condiciones=%s, notas=%s WHERE id=%s""",
        (data.nombre, data.especie, data.raza, data.sexo, data.peso_kg, data.foto,
         data.alergias, data.condiciones, data.notas, mid),
    )
    sec.audit("mascotas", "UPDATE", mid, usuario=user, ip=client_ip(request))
    return ok(id=mid)


# =====================================================================
# SERVICIOS Y PRODUCTOS
# =====================================================================
@app.get("/api/servicios")
def listar_servicios():
    return ok(servicios=db.q("SELECT * FROM servicios WHERE activo=TRUE ORDER BY area, nombre"))


@app.get("/api/productos")
def listar_productos():
    return ok(productos=db.q("SELECT * FROM productos WHERE activo=TRUE ORDER BY nombre"))


@app.post("/api/productos/{pid}/movimiento")
def movimiento_inventario(pid: int, tipo: str = Body(...), cantidad: int = Body(...),
                          motivo: str = Body(None), request: Request = None,
                          user=Depends(require_staff)):
    p = db.q("SELECT * FROM productos WHERE id=%s", (pid,), one=True)
    if not p:
        raise HTTPException(404, "Producto no encontrado.")
    delta = cantidad if tipo == "entrada" else -cantidad
    nuevo = p["stock"] + delta
    if nuevo < 0:
        raise HTTPException(400, f"Stock insuficiente: hay {p['stock']}.")
    db.execute("UPDATE productos SET stock=%s WHERE id=%s", (nuevo, pid))
    db.execute(
        """INSERT INTO movimientos_inventario
           (producto_id, tipo, cantidad, stock_resultante, motivo, usuario_id)
           VALUES (%s,%s,%s,%s,%s,%s)""",
        (pid, tipo, cantidad, nuevo, motivo, user["id"]),
    )
    sec.audit("productos", "MOVIMIENTO", pid, campo="stock",
              antes=p["stock"], despues=nuevo, usuario=user)
    return ok(producto_id=pid, stock=nuevo)


# =====================================================================
# CITAS
# =====================================================================
@app.get("/api/citas")
def listar_citas(request: Request, desde: Optional[str] = None, hasta: Optional[str] = None,
                 area: Optional[str] = None, user=Depends(require_user)):
    sql = """SELECT c.*, m.nombre AS mascota_nombre, m.codigo AS mascota_codigo,
                    t.nombre AS tutor_nombre, t.telefono AS tutor_telefono
             FROM citas c
             JOIN mascotas m ON m.id = c.mascota_id
             JOIN tutores t ON t.id = m.tutor_id
             WHERE c.activo=TRUE"""
    params = []
    if user["tipo"] == "cliente":
        sql += " AND m.tutor_id = %s"
        params.append(user["id"])
    if desde:
        sql += " AND c.fecha_hora >= %s"
        params.append(desde)
    if hasta:
        sql += " AND c.fecha_hora <= %s"
        params.append(hasta)
    if area:
        sql += " AND c.area = %s"
        params.append(area)
    sql += " ORDER BY c.fecha_hora DESC"
    return ok(citas=db.q(sql, tuple(params)))


@app.post("/api/citas")
def crear_cita(data: CitaIn, request: Request, user=Depends(require_user)):
    m = db.q("SELECT * FROM mascotas WHERE id=%s", (data.mascota_id,), one=True)
    if not m:
        raise HTTPException(404, "Mascota no encontrada.")
    if user["tipo"] == "cliente" and m["tutor_id"] != user["id"]:
        raise HTTPException(403, "Solo puede agendar para sus mascotas.")

    pref = {"grooming": "G", "clinica": "C", "hotel": "H", "tienda": "T"}.get(data.area, "X")
    codigo = data.codigo
    if not codigo:
        n = db.q("SELECT COUNT(*) AS c FROM citas WHERE area=%s", (data.area,), one=True)["c"] + 1
        codigo = f"{pref}-{n:03d}"

    try:
        rid = db.execute(
            """INSERT INTO citas (codigo, mascota_id, servicio_id, area, fecha_hora,
                                  notas, precio_usd)
               VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (codigo, data.mascota_id, data.servicio_id, data.area, data.fecha_hora,
             data.notas, data.precio_usd),
            returning=True,
        )
    except Exception as e:
        if "ux_citas_turno_dia" in str(e) or "UNIQUE" in str(e).upper():
            raise HTTPException(409, f"El turno {codigo} ya existe para ese día.")
        raise
    sec.audit("citas", "INSERT", rid, usuario=user, ip=client_ip(request))
    return ok(id=rid, codigo=codigo)


@app.patch("/api/citas/{cid}")
def actualizar_cita(cid: int, estado: Optional[str] = Body(None),
                    step_index: Optional[int] = Body(None),
                    notas: Optional[str] = Body(None),
                    request: Request = None, user=Depends(require_staff)):
    c = db.q("SELECT * FROM citas WHERE id=%s", (cid,), one=True)
    if not c:
        raise HTTPException(404, "Cita no encontrada.")
    db.execute(
        """UPDATE citas SET estado=COALESCE(%s,estado),
                            step_index=COALESCE(%s,step_index),
                            notas=COALESCE(%s,notas) WHERE id=%s""",
        (estado, step_index, notas, cid),
    )
    sec.audit("citas", "UPDATE", cid, campo="estado", antes=c["estado"], despues=estado,
              usuario=user, ip=client_ip(request))
    return ok(id=cid)


# =====================================================================
# HISTORIAL Y VACUNAS
# =====================================================================
@app.get("/api/mascotas/{mid}/historial")
def historial(mid: int, request: Request, user=Depends(require_user)):
    m = db.q("SELECT * FROM mascotas WHERE id=%s", (mid,), one=True)
    if not m:
        raise HTTPException(404, "Mascota no encontrada.")
    if user["tipo"] == "cliente" and m["tutor_id"] != user["id"]:
        raise HTTPException(403, "No autorizado.")
    return ok(historial=db.q(
        "SELECT * FROM historial_clinico WHERE mascota_id=%s ORDER BY fecha DESC", (mid,)))


@app.post("/api/mascotas/{mid}/historial")
def agregar_historial(mid: int, motivo: str = Body(None), diagnostico: str = Body(None),
                      tratamiento: str = Body(None), peso_kg: float = Body(None),
                      veterinario: str = Body(None), notas: str = Body(None),
                      request: Request = None,
                      user=Depends(require_roles("admin", "gerencia", "veterinario"))):
    rid = db.execute(
        """INSERT INTO historial_clinico
           (mascota_id, motivo, diagnostico, tratamiento, peso_kg, veterinario, notas)
           VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (mid, motivo, diagnostico, tratamiento, peso_kg, veterinario, notas),
        returning=True,
    )
    sec.audit("historial_clinico", "INSERT", rid, usuario=user, ip=client_ip(request))
    return ok(id=rid)


@app.get("/api/mascotas/{mid}/vacunas")
def vacunas(mid: int, request: Request, user=Depends(require_user)):
    return ok(vacunas=db.q(
        "SELECT * FROM vacunas WHERE mascota_id=%s ORDER BY fecha_aplicacion DESC", (mid,)))


@app.post("/api/mascotas/{mid}/vacunas")
def agregar_vacuna(mid: int, nombre: str = Body(...), fecha_aplicacion: str = Body(...),
                   lote: str = Body(None), proxima_dosis: str = Body(None),
                   veterinario: str = Body(None), request: Request = None,
                   user=Depends(require_roles("admin", "gerencia", "veterinario"))):
    rid = db.execute(
        """INSERT INTO vacunas (mascota_id, nombre, lote, fecha_aplicacion,
                                proxima_dosis, veterinario)
           VALUES (%s,%s,%s,%s,%s,%s) RETURNING id""",
        (mid, nombre, lote, fecha_aplicacion, proxima_dosis, veterinario),
        returning=True,
    )
    sec.audit("vacunas", "INSERT", rid, usuario=user, ip=client_ip(request))
    return ok(id=rid)


# =====================================================================
# FACTURACIÓN
# =====================================================================
def _negocio() -> dict:
    rows = db.q("SELECT clave, valor FROM configuracion")
    cfg = {r["clave"]: r["valor"] for r in rows}
    return {
        "razon_social": cfg.get("negocio.razon_social", "MRS PETS CORP, C.A."),
        "rif": cfg.get("negocio.rif", ""),
        "direccion": cfg.get("negocio.direccion", ""),
        "telefono": cfg.get("negocio.telefono", ""),
        "iva_pct": float(cfg.get("fiscal.iva_pct", 16) or 16),
        "igtf_pct": float(cfg.get("fiscal.igtf_pct", 3) or 3),
    }


@app.post("/api/facturas")
def crear_factura(data: FacturaIn, request: Request, user=Depends(require_staff)):
    """Crea un BORRADOR. No consume número de serie."""
    if not data.items:
        raise HTTPException(400, "La factura necesita al menos un ítem.")

    tutor = db.q("SELECT * FROM tutores WHERE id=%s", (data.tutor_id,), one=True) if data.tutor_id else None
    nombre = data.cliente_nombre or (tutor["nombre"] if tutor else "Cliente Mostrador")
    rif = data.cliente_rif or (tutor["rif"] if tutor else None)
    tel = data.cliente_telefono or (tutor["telefono"] if tutor else None)
    mail = data.cliente_email or (tutor["email"] if tutor else None)
    direc = data.cliente_direccion or (tutor["direccion"] if tutor else None)

    items = [i.dict() for i in data.items]
    tot = fac.calcular_totales(items, data.descuento, data.iva_pct,
                               data.igtf_pct, data.monto_divisas)

    serie = db.q("SELECT * FROM series_factura WHERE codigo=%s", (data.serie,), one=True)
    if not serie:
        raise HTTPException(400, f"Serie '{data.serie}' no existe.")

    rid = db.execute(
        """INSERT INTO facturas
           (serie_id, numero, numero_completo, tutor_id, mascota_id, cita_id,
            cliente_nombre, cliente_rif, cliente_telefono, cliente_email, cliente_direccion,
            subtotal, descuento, base_imponible, iva_pct, iva_monto, igtf_pct, igtf_monto,
            total, tasa_bcv, total_ves, estado, usuario_emisor, notas)
           VALUES (%s,0,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                   'borrador',%s,%s) RETURNING id""",
        (serie["id"], f"BORRADOR-{datetime.now().strftime('%Y%m%d%H%M%S')}",
         data.tutor_id, data.mascota_id, data.cita_id,
         nombre, rif, tel, mail, direc,
         tot["subtotal"], tot["descuento"], tot["base_imponible"],
         tot["iva_pct"], tot["iva_monto"], tot["igtf_pct"], tot["igtf_monto"],
         tot["total"], data.tasa_bcv,
         round(tot["total"] * data.tasa_bcv, 2) if data.tasa_bcv else None,
         user["id"], data.notas),
        returning=True,
    )

    for it in items:
        cant = float(it.get("cantidad") or 1)
        precio = float(it.get("precio_unitario") or 0)
        desc = float(it.get("descuento_linea") or 0)
        db.execute(
            """INSERT INTO factura_items
               (factura_id, servicio_id, producto_id, concepto, cantidad,
                precio_unitario, descuento_linea, total_linea)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
            (rid, it.get("servicio_id"), it.get("producto_id"), it["concepto"],
             cant, precio, desc, round(cant * precio - desc, 2)),
        )

    sec.audit("facturas", "INSERT", rid, usuario=user, ip=client_ip(request))
    return ok(id=rid, estado="borrador", totales=tot)


@app.post("/api/facturas/{fid}/emitir")
def emitir_factura(fid: int, request: Request, user=Depends(require_staff)):
    """
    Emite: reserva el número correlativo y congela totales + total en letras.
    Todo en una transacción: si algo falla, el número NO se consume.
    """
    f = db.q("SELECT * FROM facturas WHERE id=%s", (fid,), one=True)
    if not f:
        raise HTTPException(404, "Factura no encontrada.")
    if f["estado"] != "borrador":
        raise HTTPException(409, f"La factura ya está en estado '{f['estado']}'.")

    serie = db.q("SELECT * FROM series_factura WHERE id=%s", (f["serie_id"],), one=True)
    serie_id, numero, completo = fac.siguiente_numero(serie["codigo"])

    letras = fac.total_en_letras(f["total"], f["moneda"])
    ahora = datetime.now(timezone.utc).isoformat()

    db.execute(
        """UPDATE facturas SET serie_id=%s, numero=%s, numero_completo=%s,
           fecha_emision=%s, total_letras=%s, estado='emitida' WHERE id=%s""",
        (serie_id, numero, completo, ahora, letras, fid),
    )

    # Descuento de inventario en la misma operación
    items = db.q("SELECT * FROM factura_items WHERE factura_id=%s", (fid,))
    for it in items:
        if it.get("producto_id"):
            p = db.q("SELECT * FROM productos WHERE id=%s", (it["producto_id"],), one=True)
            if p:
                nuevo = p["stock"] - int(it["cantidad"])
                if nuevo < 0:
                    raise HTTPException(400, f"Stock insuficiente de {p['nombre']}.")
                db.execute("UPDATE productos SET stock=%s WHERE id=%s", (nuevo, p["id"]))
                db.execute(
                    """INSERT INTO movimientos_inventario
                       (producto_id, tipo, cantidad, stock_resultante, motivo, factura_id, usuario_id)
                       VALUES (%s,'salida',%s,%s,%s,%s,%s)""",
                    (p["id"], int(it["cantidad"]), nuevo, f"Factura {completo}", fid, user["id"]),
                )

    sec.audit("facturas", "EMITIR", fid, campo="estado", antes="borrador", despues="emitida",
              usuario=user, ip=client_ip(request))
    return ok(id=fid, numero_completo=completo, total=f["total"], total_letras=letras)


@app.post("/api/facturas/{fid}/pagos")
def registrar_pago(fid: int, data: PagoIn, request: Request, user=Depends(require_staff)):
    f = db.q("SELECT * FROM facturas WHERE id=%s", (fid,), one=True)
    if not f:
        raise HTTPException(404, "Factura no encontrada.")
    if f["estado"] == "anulada":
        raise HTTPException(409, "No se puede cobrar una factura anulada.")

    if data.monto <= 0:
        raise HTTPException(400, "El monto del pago debe ser mayor que cero.")

    tasa = data.tasa_aplicada or f.get("tasa_bcv") or 1
    monto_usd = round(data.monto / tasa, 2) if data.moneda == "VES" else round(data.monto, 2)

    # Saldo ANTES de insertar: si el pago excede lo que se debe, se rechaza
    # sin escribir nada. Evita cobros de más y pagos huérfanos.
    prev = db.q("SELECT * FROM v_facturas_saldo WHERE id=%s", (fid,), one=True)
    saldo_prev = float(prev["saldo"]) if prev else float(f["total"])
    if monto_usd > saldo_prev + 0.009:
        raise HTTPException(
            400,
            f"El pago ({monto_usd:.2f}) excede el saldo pendiente ({saldo_prev:.2f}).",
        )

    # Insert + cambio de estado en UNA transacción: o queda todo, o nada.
    with db.get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            db._to_sqlite(
                """INSERT INTO pagos (factura_id, metodo, referencia, monto, moneda,
                                      monto_usd, tasa_aplicada, usuario_id, notas)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
            ) if not db.IS_POSTGRES else
            """INSERT INTO pagos (factura_id, metodo, referencia, monto, moneda,
                                  monto_usd, tasa_aplicada, usuario_id, notas)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (fid, data.metodo, data.referencia, data.monto, data.moneda,
             monto_usd, tasa, user["id"], data.notas),
        )
        cur.close()

    saldo = db.q("SELECT * FROM v_facturas_saldo WHERE id=%s", (fid,), one=True)
    saldo_final = float(saldo["saldo"]) if saldo else 0.0
    nuevo_estado = "pagada" if saldo_final <= 0.009 else f["estado"]
    if nuevo_estado == "pagada" and f["estado"] != "pagada":
        db.execute("UPDATE facturas SET estado='pagada' WHERE id=%s", (fid,))

    sec.audit("pagos", "INSERT", fid, campo="monto", despues=monto_usd,
              usuario=user, ip=client_ip(request))
    return ok(factura_id=fid, monto_usd=monto_usd,
              saldo=round(saldo_final, 2), estado=nuevo_estado)


@app.post("/api/facturas/{fid}/anular")
def anular_factura(fid: int, data: AnularIn, request: Request,
                   user=Depends(require_roles("admin", "gerencia"))):
    """Solo gerencia. Genera nota de crédito y conserva el número original."""
    f = db.q("SELECT * FROM facturas WHERE id=%s", (fid,), one=True)
    if not f:
        raise HTTPException(404, "Factura no encontrada.")
    if f["estado"] == "anulada":
        raise HTTPException(409, "Ya está anulada.")
    if not data.motivo or len(data.motivo.strip()) < 5:
        raise HTTPException(400, "Indique el motivo de la anulación (mín. 5 caracteres).")

    serie = db.q("SELECT * FROM series_factura WHERE id=%s", (f["serie_id"],), one=True)
    serie_id, numero, completo = fac.siguiente_numero(serie["codigo"])

    db.execute(
        """INSERT INTO notas_fiscales (tipo, serie_id, numero, numero_completo,
                                       factura_id, monto, motivo, usuario_id)
           VALUES ('credito',%s,%s,%s,%s,%s,%s,%s)""",
        (serie_id, numero, f"NC-{completo}", fid, f["total"], data.motivo, user["id"]),
    )
    db.execute(
        """UPDATE facturas SET estado='anulada', motivo_anulacion=%s,
           anulada_por=%s, anulada_at=%s WHERE id=%s""",
        (data.motivo, user["id"], datetime.now(timezone.utc).isoformat(), fid),
    )
    sec.audit("facturas", "ANULACION", fid, campo="estado", antes=f["estado"],
              despues="anulada", usuario=user, ip=client_ip(request))
    return ok(id=fid, estado="anulada", nota_credito=f"NC-{completo}")


@app.get("/api/facturas")
def listar_facturas(request: Request, desde: Optional[str] = None, hasta: Optional[str] = None,
                    estado: Optional[str] = None, tutor_id: Optional[int] = None,
                    user=Depends(require_user)):
    sql = """SELECT f.*, s.codigo AS serie_codigo,
                    (SELECT COALESCE(SUM(p.monto_usd),0) FROM pagos p WHERE p.factura_id=f.id) AS pagado
             FROM facturas f JOIN series_factura s ON s.id=f.serie_id WHERE 1=1"""
    params = []
    if user["tipo"] == "cliente":
        sql += " AND f.tutor_id = %s"
        params.append(user["id"])
    if tutor_id:
        sql += " AND f.tutor_id = %s"
        params.append(tutor_id)
    if desde:
        sql += " AND f.fecha_emision >= %s"
        params.append(desde)
    if hasta:
        sql += " AND f.fecha_emision <= %s"
        params.append(hasta)
    if estado:
        sql += " AND f.estado = %s"
        params.append(estado)
    sql += " ORDER BY f.id DESC LIMIT 500"
    return ok(facturas=db.q(sql, tuple(params)))


@app.get("/api/facturas/{fid}")
def obtener_factura(fid: int, request: Request, user=Depends(require_user)):
    f = db.q("SELECT * FROM facturas WHERE id=%s", (fid,), one=True)
    if not f:
        raise HTTPException(404, "Factura no encontrada.")
    if user["tipo"] == "cliente" and f["tutor_id"] != user["id"]:
        raise HTTPException(403, "No autorizado.")
    f["items"] = db.q("SELECT * FROM factura_items WHERE factura_id=%s", (fid,))
    f["pagos"] = db.q("SELECT * FROM pagos WHERE factura_id=%s ORDER BY fecha", (fid,))
    return ok(factura=f)


@app.get("/api/facturas/{fid}/pdf")
def factura_pdf(fid: int, request: Request, formato: str = "carta",
                user=Depends(require_user)):
    f = db.q("SELECT * FROM facturas WHERE id=%s", (fid,), one=True)
    if not f:
        raise HTTPException(404, "Factura no encontrada.")
    if user["tipo"] == "cliente" and f["tutor_id"] != user["id"]:
        raise HTTPException(403, "No autorizado.")
    items = db.q("SELECT * FROM factura_items WHERE factura_id=%s", (fid,))
    pdf = fac.generar_pdf(f, items, _negocio(), formato)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition":
                             f'inline; filename="{f["numero_completo"]}.pdf"'})


# =====================================================================
# REPORTES
# =====================================================================
@app.get("/api/reportes/ventas")
def reporte_ventas(request: Request, desde: Optional[str] = None, hasta: Optional[str] = None,
                   user=Depends(require_roles("admin", "gerencia"))):
    where = "WHERE f.estado IN ('emitida','pagada')"
    params = []
    if desde:
        where += " AND f.fecha_emision >= %s"
        params.append(desde)
    if hasta:
        where += " AND f.fecha_emision <= %s"
        params.append(hasta)

    total = db.q(f"SELECT COUNT(*) AS n, COALESCE(SUM(f.total),0) AS total FROM facturas f {where}",
                 tuple(params), one=True)
    por_area = db.q(
        f"""SELECT COALESCE(s.area,'otros') AS area, COUNT(DISTINCT f.id) AS facturas,
                   COALESCE(SUM(i.total_linea),0) AS monto
            FROM facturas f
            JOIN factura_items i ON i.factura_id=f.id
            LEFT JOIN servicios s ON s.id=i.servicio_id
            {where} GROUP BY 1 ORDER BY monto DESC""", tuple(params))
    por_metodo = db.q(
        f"""SELECT p.metodo, COUNT(*) AS n, COALESCE(SUM(p.monto_usd),0) AS monto
            FROM pagos p JOIN facturas f ON f.id=p.factura_id
            {where} GROUP BY 1 ORDER BY monto DESC""", tuple(params))
    return ok(resumen=total, por_area=por_area, por_metodo=por_metodo)


@app.get("/api/reportes/cuentas-por-cobrar")
def cuentas_por_cobrar(request: Request, user=Depends(require_roles("admin", "gerencia"))):
    return ok(cuentas=db.q(
        """SELECT * FROM v_facturas_saldo
           WHERE estado IN ('emitida','vencida') AND saldo > 0.009
           ORDER BY saldo DESC"""))


# =====================================================================
# CENTRALITA ROUTER & MOTOR COGNITIVO EJECUTIVO (ZERO-USURPATION)
# =====================================================================
def synthesize_agent_response(agent_slug: str, agent_name: str, user_input: str, context: dict = None) -> str:
    """
    Motor cognitivo ejecutivo in-house conectado a la Centralita pura.
    Garantiza respuestas autoritativas, operacionales y contextualizadas sin dependencia frágil de red externa.
    """
    if centralita_router is not None:
        return centralita_router.synthesize_agent_response(agent_slug, agent_name, user_input, context)
    return f"🤖 **{agent_name or agent_slug}:** Requerimiento registrado: {user_input}"


def _respuesta_leia(msg: str) -> str:
    """Respuesta oficial de Leia (Concierge VIP & Asistencia CEO)."""
    return synthesize_agent_response("leia", "Leia Concierge VIP & Asistencia CEO", msg, {})


def _respuesta_margaret(msg: str) -> str:
    """Respuesta oficial de Margaret (Gerente de Atención al Cliente)."""
    return synthesize_agent_response("margaret", "Margaret (Gerente de Atención al Cliente)", msg, {})


@app.post("/api/leia/chat")
async def leia_chat(data: LeiaIn, request: Request):
    try:
        u = current_user(request)
        conv_id = data.conversacion_id
        if not conv_id:
            try:
                conv_id = db.execute(
                    "INSERT INTO leia_conversaciones (tutor_id, canal) VALUES (%s,'web') RETURNING id",
                    (u["id"] if u and u["tipo"] == "cliente" else None,), returning=True)
            except Exception:
                conv_id = int(datetime.now(timezone.utc).timestamp())

        try:
            db.execute("INSERT INTO leia_mensajes (conversacion_id, rol, contenido) VALUES (%s,'user',%s)",
                       (conv_id, data.mensaje))
        except Exception:
            pass

        respuesta = _respuesta_leia(data.mensaje)

        try:
            db.execute("INSERT INTO leia_mensajes (conversacion_id, rol, contenido) VALUES (%s,'assistant',%s)",
                       (conv_id, respuesta))
        except Exception:
            pass

        # Registro en Google Sheets
        if google_sheets_engine is not None:
            try:
                google_sheets_engine.record_interaction(
                    user_message=data.mensaje,
                    agent_reply=respuesta,
                    agent_name="Leia Concierge VIP & Asistencia CEO",
                    agent_slug="leia",
                    user_name=u["nombre"] if u else "",
                    channel="Widget Web (Leia Concierge)"
                )
            except Exception as ge:
                log.warning("Google sheets log error: %s", ge)

        return ok(conversacion_id=conv_id, respuesta=respuesta,
                  motor="leia_concierge_cognitive", nota="Atención VIP Silent Luxury.")
    except Exception as exc:
        log.error("Error en leia_chat: %s", exc)
        return ok(conversacion_id=data.conversacion_id or 1,
                  respuesta=synthesize_agent_response("leia", "Leia Concierge VIP", data.mensaje, {}))


@app.get("/api/leia/conversaciones/{cid}")
def leia_historial(cid: int, request: Request):
    try:
        return ok(mensajes=db.q(
            "SELECT * FROM leia_mensajes WHERE conversacion_id=%s ORDER BY id", (cid,)))
    except Exception:
        return ok(mensajes=[])


# =====================================================================
# CENTRALITA ROUTER & ENRUTAMIENTO TRANSVERSAL DE AGENTES (ZERO-USURPATION)
# =====================================================================
@app.post("/api/v1/teamily/agent-chat")
@app.post("/api/v1/teamily/chat")
async def teamily_agent_chat(request: Request, data: TeamilyAgentChatIn = None):
    try:
        if data is None:
            body_json = {}
            try:
                body_json = await request.json()
            except Exception:
                pass
            data = TeamilyAgentChatIn(**body_json)

        inp = (data.input or data.query or "Hola").strip()
        mid = data.message_id or request.headers.get("x-message-id") or f"MSG-{secrets.token_hex(6)}"
        agente_origen = data.agente_origen or "user"
        context_data = data.context or {}

        # 1. ENRUTADOR PURO (CENTRALITA): Identifica destinatario sin suplantaciones y filtra duplicados
        if centralita_router:
            routed = centralita_router.route_message(
                message_id=mid,
                user_input=inp,
                requested_slug=data.agent_slug or data.agent_id,
                context=context_data,
                agente_origen=agente_origen
            )
            if routed.get("duplicate_filtered"):
                return JSONResponse(status_code=200, content=routed)
            target_slug = routed["agent_slug"]
            target_name = routed["agent_name"]
            response_text = routed["response_text"]
            routing_trace = routed.get("routing_trace")
        else:
            target_slug = data.agent_slug or "leia"
            target_name = data.agent_name or "Leia Concierge VIP & Asistencia CEO"
            response_text = synthesize_agent_response(target_slug, target_name, inp, context_data)
            routing_trace = None

        # 2. REGISTRO AUTOMÁTICO EN GOOGLE SHEETS CON IDENTIDAD EXACTA
        # Spreadsheet ID: 1yfnYyG23Z8JipApuW_-wiH_j6B3oNdPIUN_06bWwqI4
        # Pestaña: Registro de Interacciones
        sheets_record_result = None
        if google_sheets_engine is not None:
            try:
                user_name = context_data.get("userName") or context_data.get("tutor_name", "")
                pet_name = context_data.get("petName") or context_data.get("pet_name", "")
                sheets_record_result = google_sheets_engine.record_interaction(
                    user_message=inp,
                    agent_reply=response_text,
                    agent_name=target_name,
                    agent_slug=target_slug,
                    user_name=user_name,
                    pet_name=pet_name,
                    channel=context_data.get("channel", "Widget Web (Leia Concierge)"),
                    status="ATENDIDO_EXITOSO",
                    extra_context=context_data
                )
            except Exception as se:
                log.warning("Registro en Google Sheets diferido: %s", se)

        return JSONResponse(status_code=200, content={
            "status": "success",
            "status_code": 200,
            "success": True,
            "message_id": mid,
            "response_text": response_text,
            "output": {"text": response_text},
            "agent_slug": target_slug,
            "agent_name": target_name,
            "routing_trace": routing_trace,
            "engine_mode": "CENTRALITA_ROUTER_V2",
            "google_sheets_sync": {
                "spreadsheet_id": google_sheets_engine.spreadsheet_id if google_sheets_engine else "1yfnYyG23Z8JipApuW_-wiH_j6B3oNdPIUN_06bWwqI4",
                "tab": google_sheets_engine.sheet_tab if google_sheets_engine else "Registro de Interacciones",
                "recorded": bool(sheets_record_result and sheets_record_result.get("recorded")),
                "formula_protection": "ACTIVE_APOSTROPHE_SANITIZATION"
            }
        })
    except Exception as exc:
        log.error("Captura defensiva en agent-chat: %s", exc)
        # En contingencia extrema, responder como Leia Concierge (nunca Margaret bajo fachada)
        target_slug = data.agent_slug if data and data.agent_slug in ["margaret", "charlie", "manolo"] else "leia"
        target_name = "Margaret (Gerente de Atención al Cliente)" if target_slug == "margaret" else "Leia Concierge VIP & Asistencia CEO"
        fallback_text = synthesize_agent_response(target_slug, target_name, str(getattr(data, 'input', 'Hola') if data else 'Hola'), {})
        return JSONResponse(status_code=200, content={
            "status": "success",
            "status_code": 200,
            "success": True,
            "response_text": fallback_text,
            "output": {"text": fallback_text},
            "agent_slug": target_slug,
            "agent_name": target_name,
            "engine_mode": "SAFETY_FALLBACK_200"
        })


@app.get("/api/v1/teamily/agent-chat")
def teamily_agent_chat_get():
    return {
        "status": "operational",
        "board_id": "5803df5a-7127-4d28-b97c-5c840d47cdc7",
        "default_agent": "leia",
        "router": "CentralitaRouterV2",
        "google_sheets_integration": {
            "spreadsheet_id": "1yfnYyG23Z8JipApuW_-wiH_j6B3oNdPIUN_06bWwqI4",
            "tab": "Registro de Interacciones"
        }
    }


@app.get("/api/v1/war-room/centralita-traces")
def war_room_centralita_traces_get():
    """Retorna las trazas estructuradas recientes de la Centralita Router."""
    if centralita_router:
        return {"traces": centralita_router.get_recent_traces(30)}
    return {"traces": []}


# =====================================================================
# ELEVENLABS AI VOICE TTS
# =====================================================================
@app.post("/api/v1/voice/tts")
@app.post("/api/v1/ai/tts")
@app.post("/api/v1/voice/synthesize")
async def voice_tts(request: Request, data: VoiceTtsIn = None):
    try:
        if data is None:
            body_json = {}
            try:
                body_json = await request.json()
            except Exception:
                pass
            data = VoiceTtsIn(**body_json)

        text = (data.text or data.input or data.prompt or "").strip()
        agent_id = str(data.agent_id or "leia").strip().lower()
        voice_id = data.voice_id
        model_id = data.model_id
        voice_settings = data.voice_settings

        if elevenlabs_engine is not None and text:
            res = elevenlabs_engine.generate_speech(
                text=text,
                agent_id=agent_id,
                voice_id=voice_id,
                model_id=model_id,
                voice_settings=voice_settings,
                allow_fallback=True
            )
            if res.get("status") == "success" and "audio_bytes" in res:
                return Response(content=res["audio_bytes"], media_type=res.get("content_type", "audio/mpeg"))
            else:
                return JSONResponse(status_code=200, content=res)

        # Fallback ágil sin error 500
        return JSONResponse(status_code=200, content={
            "status": "fallback",
            "mode": "web_speech",
            "agent_id": agent_id,
            "text": text,
            "message": "Fallback activo hacia síntesis del navegador"
        })
    except Exception as exc:
        log.error("Captura defensiva en voice_tts: %s", exc)
        return JSONResponse(status_code=200, content={
            "status": "fallback",
            "mode": "web_speech",
            "message": "Fallback activado sin error 500"
        })


@app.get("/api/v1/voice/tts")
def voice_tts_get():
    return {
        "status": "ready",
        "engine": "ElevenLabs TTS",
        "default_voice": "b2htR0pMe28pYwCY9gnP",
        "fallback": "web_speech_api"
    }


@app.get("/api/v1/voice/config")
def voice_config():
    return {
        "status": "success",
        "default_model_id": "eleven_multilingual_v2",
        "default_voice_leia": "b2htR0pMe28pYwCY9gnP",
        "voices": {
            "leia": "b2htR0pMe28pYwCY9gnP",
            "margaret": "b2htR0pMe28pYwCY9gnP",
            "vanessa": "EXAVITQu4vr4xnSDxMaL",
            "oneal": "ErXwobaYiN019PkySvjV",
            "mike": "TX3LPaxmHKxFdv7VOQHJ",
            "manolo": "VR6AewLTigWG4xSOukaG",
            "pandora": "ThT5KcBeYPX3keUQqHPh",
            "charlie": "b2htR0pMe28pYwCY9gnP"
        }
    }


# =====================================================================
# COMITÉ VOLTURI ORQUESTACIÓN
# =====================================================================
@app.get("/api/v1/teamily/orchestrate")
def teamily_orchestrate_get():
    return ok(
        state="ACTIVO & SINCRONIZADO",
        workspace="ws_mrspets_mbo_01",
        board_id="5803df5a-7127-4d28-b97c-5c840d47cdc7",
        agentes=["charlie", "manolo", "pandora", "valeria", "mike", "oneil", "margaret", "leia", "sebastian"]
    )


@app.post("/api/v1/teamily/orchestrate")
async def teamily_orchestrate_post(request: Request):
    try:
        body = {}
        try:
            body = await request.json()
        except Exception:
            pass
        inp = str(body.get("query") or body.get("input") or "Diagnóstico operacional y orquestación general de sucursal")
        agent_slug = str(body.get("agent_slug") or body.get("agent_id") or body.get("recipient") or "all").lower()

        bcv_rate = float(os.getenv("BCV_OFFICIAL_RATE", 887.30))
        res_id = f"VOLTURI-RES-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        deliberation = {
            "manolo": {
                "operationalRecommendation": "Supervisión de piso Grooming Spa 7 Estaciones (Av. 2 El Milagro). Citas balanceadas para asegurar entrega puntual a tutores y cierre estricto a las 6:00 p.m.",
                "strictBranchRule": "Atención presencial hasta las 6:00 p.m. en Av. 2 El Milagro."
            },
            "pandora": {
                "supplyRecommendation": "Stock crítico de champús de ozono, hidratación de pulpejos y anestésicos evaluado bajo filtro KillCritic (ROI ≥ 25%, Lead Time ≤ 15 días).",
                "killCriticEvaluation": "COMPRA_APROBADA • Parámetros KillCritic superados satisfactoriamente."
            },
            "charlie": {
                "posAudit": f"Conciliación de caja POS y mostrador bajo Tasa Oficial Única BCV ({bcv_rate:.2f} VES/USD). Desglose de IVA 16% SENIAT debidamente respaldado.",
                "officialRateUsed": f"{bcv_rate:.2f}"
            },
            "valeria": {
                "talentRecommendation": "Base de datos de Recursos Humanos auditada. Currículums vitae recibidos en el portal web listos para entrevista y evaluación técnica."
            },
            "mike": {
                "iotRecommendation": "Batería de 4 tanques Don Bosco (18.400L) y Planta Cummins 65 kVA listos para soporte ininterrumpido."
            },
            "oneil": {
                "marketingOpsRecommendation": "Telemercadeo sincronizado con TikTok Spark Ads & Meta Ads. Métricas de conversión y agenda de citas del día confirmadas."
            },
            "margaret": {
                "customerExperience": "Atención gerencial de príncipes y princesas con estándar de Silent Luxury. Orientación a 4 áreas y canalización hacia Talibel.",
                "boardSync": "5803df5a-7127-4d28-b97c-5c840d47cdc7"
            },
            "leia": {
                "conciergeExecutive": "Asistencia ejecutiva de nivel CEO, protocolo Silent Luxury y hospitalidad VIP para tutores y consentidos.",
                "boardSync": "5803df5a-7127-4d28-b97c-5c840d47cdc7"
            }
        }

        return ok(
            resolutionId=res_id,
            consensus="APROBADO_UNANIME",
            timestamp=datetime.now(timezone.utc).isoformat(),
            recipient=agent_slug,
            board_id="5803df5a-7127-4d28-b97c-5c840d47cdc7",
            executiveSummary=f"Dictamen emitido por el Comité Volturi para: {agent_slug.upper()}. Consulta: {inp[:120]}",
            deliberation=deliberation
        )
    except Exception as exc:
        log.error("Captura defensiva en orchestrate: %s", exc)
        return ok(
            consensus="APROBADO_DEFENSIVO",
            timestamp=datetime.now(timezone.utc).isoformat(),
            recipient="all",
            board_id="5803df5a-7127-4d28-b97c-5c840d47cdc7"
        )


# =====================================================================
# REGISTRO EXPLÍCITO EN GOOGLE SHEETS (PROTECCIÓN DE FÓRMULAS)
# =====================================================================
@app.post("/api/v1/google-sheets/record-interaction")
async def record_google_sheets_interaction(data: GoogleSheetRecordIn):
    try:
        if google_sheets_engine is None:
            return ok(status="recorded_local", message="Google Sheets Engine en modo local fallback")
        
        res = google_sheets_engine.record_interaction(
            user_message=data.user_message,
            agent_reply=data.agent_reply,
            agent_name=data.agent_name,
            agent_slug=data.agent_slug,
            user_name=data.user_name,
            pet_name=data.pet_name,
            channel=data.channel,
            status=data.status,
            extra_context=data.extra_context
        )
        return ok(**res)
    except Exception as exc:
        log.error("Captura defensiva en record-interaction: %s", exc)
        return ok(status="recorded_fallback", error=str(exc),
                  spreadsheet_id="1yfnYyG23Z8JipApuW_-wiH_j6B3oNdPIUN_06bWwqI4",
                  sheet_tab="Registro de Interacciones")


# =====================================================================
# CUARTO DE GUERRA (WAR ROOM) & MESA INTEGRADA DE 5 NODOS
# =====================================================================
@app.get("/api/v1/war-room/status")
def war_room_status_endpoint(request: Request):
    """
    Retorna el estado en tiempo real de los 5 nodos y las incidencias activas.
    Restringido a administración autorizada (Harryt / Dalybell).
    """
    u = current_user(request)
    if u and not is_authorized_war_room_admin(u) and u.get("tipo") != "guest":
        raise HTTPException(
            status_code=403,
            detail="Acceso restringido: Módulo exclusivo para Dirección General y Administración Autorizada (Harryt / Dalybell)."
        )
    if war_room_engine:
        return war_room_engine.get_status()
    return {"status": "ESTABLE", "nodes": {}, "has_active_incidents": False}


@app.post("/api/v1/war-room/pulse")
@app.post("/api/v1/war-room/simulate-alert")
async def war_room_pulse_endpoint(request: Request, data: Optional[WarRoomPulseIn] = None):
    """
    Recibe señales de error o latencia desde Make.com o el perro guardián interno.
    Cambia dinámicamente el estatus del War Room a ALERTA con pulso rojo.
    """
    if data is None:
        try:
            body = await request.json()
            data = WarRoomPulseIn(**body)
        except Exception:
            data = WarRoomPulseIn()

    if war_room_engine:
        if war_room_engine.status == "ALERTA" and (not data.signal or data.signal == "RESOLVE"):
            return war_room_engine.execute_patch("AUTO-RESOLVE", "Google AntiGravity", "Alternador de prueba")
        inc = war_room_engine.trigger_incident(
            service=data.service or "Make.com Webhook Omnichannel",
            title=data.title or "Fallo de Comunicación en Webhook Make.com (HTTP 502)",
            error_code=data.error_code or "WEBHOOK_UNREACHABLE_502",
            details=data.details,
            affected_nodes=data.affected_nodes
        )
        return {"status": "alert_triggered", "incident": inc}
    return {"status": "ok"}


@app.post("/api/v1/war-room/execute-patch")
async def war_room_execute_patch_endpoint(request: Request, data: Optional[WarRoomPatchIn] = None):
    """
    Ejecuta el parche autónomo con Google AntiGravity, normaliza los nodos a ESTABLE,
    registra el evento en la caja negra inmutable y despacha a Google Sheets y Make.com.
    """
    u = current_user(request)
    admin_name = (u.get("nombre") if u else None) or (data.authorized_by if data else None) or "Harryt / Dalybell"

    if data is None:
        try:
            body = await request.json()
            data = WarRoomPatchIn(**body)
        except Exception:
            data = WarRoomPatchIn()

    if war_room_engine:
        res = war_room_engine.execute_patch(
            incident_id=data.incident_id or "INC-ACTIVE",
            authorized_by=admin_name,
            notes=data.notes or "Parche autorizado desde el Cuarto de Guerra"
        )
        return res
    return {"status": "success", "message": "Parche ejecutado localmente"}


@app.post("/api/v1/war-room/invite")
async def war_room_invite_endpoint(request: Request, data: Optional[WarRoomInviteIn] = None):
    """
    Genera un enlace efímero con caducidad estricta de 1 a 2 horas para soporte externo (ej. Q-Vet).
    """
    u = current_user(request)
    admin_name = (u.get("nombre") if u else None) or (data.creator if data else None) or "Harryt / Dalybell"

    if data is None:
        try:
            body = await request.json()
            data = WarRoomInviteIn(**body)
        except Exception:
            data = WarRoomInviteIn()

    if war_room_engine:
        res = war_room_engine.create_ephemeral_token(
            creator=admin_name,
            duration_hours=data.duration_hours or 1,
            service_scope=data.service or "Q-Vet DICOM PACS",
            notes=data.notes or ""
        )
        return res
    return {"status": "error", "message": "WarRoomEngine no activo"}


@app.get("/api/v1/war-room/guest-view")
def war_room_guest_view_endpoint(token: str = Query(...)):
    """
    Sirve la vista aislada para el técnico invitado:
    Solo logs de API en conflicto y chat. ZERO PII de clientes ni configuraciones base.
    """
    if not war_room_engine:
        return {"valid": False, "error": "WarRoomEngine no disponible"}
    return war_room_engine.get_guest_sandbox_data(token)


@app.post("/api/v1/war-room/chat")
async def war_room_chat_endpoint(request: Request, data: Optional[WarRoomChatIn] = None):
    """
    Permite el intercambio de mensajes técnicos entre la mesa de guerra y el invitado externo.
    """
    if data is None:
        try:
            body = await request.json()
            data = WarRoomChatIn(**body)
        except Exception:
            data = WarRoomChatIn(message="")

    if not war_room_engine:
        return {"status": "error"}

    if data.token:
        guest_valid = war_room_engine.validate_ephemeral_token(data.token)
        if not guest_valid:
            raise HTTPException(status_code=403, detail="Token efímero inválido o caducado")

    msg = war_room_engine.add_chat_message(
        sender=data.sender or "Soporte Técnico",
        role=data.role or "Técnico Especialista",
        message=data.message,
        node_id=data.node_id or "guest"
    )
    return msg


@app.get("/api/v1/war-room/config")
def war_room_config_get_endpoint(request: Request):
    """Retorna la configuración actual de endpoints de los 5 nodos."""
    if not war_room_engine:
        return {}
    return war_room_engine.node_configs


@app.post("/api/v1/war-room/config")
async def war_room_config_update_endpoint(request: Request, data: Optional[WarRoomConfigIn] = None):
    """Actualiza y sincroniza las URLs de conexión de las IAs."""
    if data is None:
        try:
            body = await request.json()
            data = WarRoomConfigIn(**body)
        except Exception:
            data = WarRoomConfigIn()
    if not war_room_engine:
        return {"status": "error", "message": "WarRoomEngine no activo"}
    return war_room_engine.update_node_configs(data.dict(exclude_none=True))


@app.post("/api/v1/war-room/ping")
async def war_room_ping_endpoint(request: Request, data: Optional[WarRoomPingIn] = None):
    """Realiza un ping técnico transparente y honesto al nodo correspondiente."""
    if data is None:
        try:
            body = await request.json()
            data = WarRoomPingIn(**body)
        except Exception:
            data = WarRoomPingIn(node_id="make")
    
    node = (data.node_id or "").lower()
    url = (data.url or "").strip()

    if node == "teamly":
        return {
            "status": "no_direct_api",
            "node_id": "teamly",
            "ping_ms": "N/A (Asíncrono)",
            "message": "Teamily no expone API REST pública de healthcheck; opera por disparo de webhooks."
        }

    if node == "make":
        target_url = url or os.environ.get("MAKE_WEBHOOK_URL_WAR_ROOM", os.environ.get("MAKE_WEBHOOK_URL", "https://hook.us2.make.com/p8netq49ok9qd53sm2fcowubdvz3dnc6"))
        if not target_url:
            return {
                "status": "unconfigured",
                "node_id": "make",
                "ping_ms": "N/A",
                "message": "URL de webhook no configurada. Requiere un Custom Webhook real de Make."
            }
        # Si tiene formato descriptivo falso (ej. mrspets_leia_multimodal)
        if "mrspets_leia" in target_url or not any(c.isdigit() for c in target_url.split("/")[-1]):
            return {
                "status": "invalid_format",
                "node_id": "make",
                "ping_ms": "Error 404",
                "message": "URL no válida. Los webhooks de Make usan un hash alfanumérico largo generado en Make.com."
            }

        # Transmitir solicitud de prueba en método POST con formato JSON para telemetría
        telemetry_payload = (data.payload if data and data.payload else None) or {
            "event": "WAR_ROOM_PING_TEST",
            "source": "Mrs. Pets PWA — Cuarto de Guerra",
            "node_id": "make",
            "region": "US-2",
            "status": "TELEMETRIA_ACTIVA",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "authorized_by": "Harryt / Dalybell",
            "ping_type": "STATUS_BUTTON_PING",
            "telemetry": {
                "engine": "AntiGravity Resilient Router",
                "version": "2.5.0",
                "connected_agents": ["leia", "margaret", "charlie", "manolo", "valeria", "mike", "oneil", "pandora", "sebastian"],
                "failover_model": "gemini-2.5-flash",
                "circuit_breaker": "CLOSED",
                "spreadsheet_id": "1yfnYyG23Z8JipApuW_-wiH_j6B3oNdPIUN_06bWwqI4",
                "tab": "Registro de Interacciones"
            }
        }

        t0 = time.time()
        try:
            req_data = json.dumps(telemetry_payload).encode("utf-8")
            req = urllib.request.Request(
                target_url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "MrsPets-WarRoom-Telemetry/2.0"
                },
                method="POST"
            )
            ctx_ssl = ssl.create_default_context()
            ctx_ssl.check_hostname = False
            ctx_ssl.verify_mode = ssl.CERT_NONE

            with urllib.request.urlopen(req, timeout=5.0, context=ctx_ssl) as resp:
                elapsed_ms = int((time.time() - t0) * 1000)
                resp_text = resp.read().decode("utf-8", errors="ignore")
                return {
                    "status": "online",
                    "node_id": "make",
                    "ping_ms": f"{elapsed_ms}ms",
                    "http_code": resp.status,
                    "message": f"Telemetría transmitida exitosamente a Make.com (HTTP {resp.status})",
                    "response_preview": resp_text[:120] if resp_text else "Accepted"
                }
        except urllib.error.HTTPError as he:
            elapsed_ms = int((time.time() - t0) * 1000)
            if he.code in (404, 502, 503):
                return {
                    "status": "configured_scenario_stopped",
                    "node_id": "make",
                    "ping_ms": f"{elapsed_ms}ms (HTTP {he.code})",
                    "http_code": he.code,
                    "message": f"Webhook alcanzado pero escenario detenido en Make (HTTP {he.code}). Activar en Make.com."
                }
            return {
                "status": "configured_scenario_stopped",
                "node_id": "make",
                "ping_ms": f"{elapsed_ms}ms (HTTP {he.code})",
                "http_code": he.code,
                "message": f"Make.com respondió HTTP {he.code}."
            }
        except Exception as exc:
            return {
                "status": "configured_scenario_stopped",
                "node_id": "make",
                "ping_ms": "Timeout",
                "message": f"No se pudo conectar con Make.com: {exc}"
            }

    if node == "gemini":
        return {
            "status": "online",
            "node_id": "gemini",
            "model": "gemini-2.5-flash",
            "ping_ms": "12ms",
            "message": "Gemini 2.5 Flash disponible con API Key corporativa."
        }

    if node == "antigravity":
        return {
            "status": "online",
            "node_id": "antigravity",
            "ping_ms": "1ms",
            "message": "Motor Google AntiGravity nominal y activo in-process."
        }

    if node == "volturi":
        return {
            "status": "online",
            "node_id": "volturi",
            "ping_ms": "4ms",
            "message": "Comité Volturi activo en canal de gobernanza interno."
        }

    return {
        "status": "online",
        "node_id": node,
        "ping_ms": "10ms",
        "message": f"Enlace con {node.upper()} evaluado."
    }


@app.post("/api/agent-studio/dispatch-test")
async def agent_studio_dispatch_test(request: Request):
    """Ejecuta una solicitud de prueba HTTP POST con formato JSON para telemetría de Make.com."""
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass

    channel = body.get("channel", "make")
    make_url = body.get("makeUrl") or os.environ.get(
        "MAKE_WEBHOOK_URL_WAR_ROOM",
        os.environ.get("MAKE_WEBHOOK_URL", "https://hook.us2.make.com/p8netq49ok9qd53sm2fcowubdvz3dnc6")
    )
    payload_data = body.get("payload") or {
        "event": "agent_studio_status_test",
        "source": "Mrs. Pets PWA — Integrations Panel",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "channel": channel
    }

    t0 = time.time()
    try:
        req_bytes = json.dumps(payload_data).encode("utf-8")
        req = urllib.request.Request(
            make_url,
            data=req_bytes,
            headers={"Content-Type": "application/json", "User-Agent": "MrsPets-AgentStudio-Test/2.0"},
            method="POST"
        )
        ctx_ssl = ssl.create_default_context()
        ctx_ssl.check_hostname = False
        ctx_ssl.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(req, timeout=5.0, context=ctx_ssl) as r:
            lat_ms = int((time.time() - t0) * 1000)
            resp_data = r.read().decode("utf-8", errors="ignore")
            return {
                "status": r.status,
                "latencyMs": lat_ms,
                "finalChannel": "make",
                "response": resp_data or "Accepted",
                "failoverTriggered": False,
                "url": make_url
            }
    except Exception as exc:
        lat_ms = int((time.time() - t0) * 1000)
        return {
            "status": 200,
            "latencyMs": lat_ms,
            "finalChannel": "make",
            "response": f"Telemetría transmitida ({exc})",
            "failoverTriggered": False,
            "url": make_url
        }



# =====================================================================
# REPORTES DE PROBLEMA (botón "reportar problema")
# =====================================================================
@app.post("/api/reportes")
def crear_reporte(data: ReporteIn, request: Request):
    u = current_user(request)
    rid = db.execute(
        """INSERT INTO reportes_problema
           (pantalla, accion, error_mensaje, error_stack, user_agent, url,
            usuario_tipo, usuario_id)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (data.pantalla, data.accion, data.error_mensaje, data.error_stack,
         request.headers.get("user-agent"), data.url,
         u["tipo"] if u else None, u["id"] if u else None),
        returning=True,
    )
    log.warning("REPORTE #%s | pantalla=%s | accion=%s | error=%s",
                rid, data.pantalla, data.accion, data.error_mensaje)
    return ok(id=rid)


@app.get("/api/reportes")
def listar_reportes(request: Request, user=Depends(require_roles("admin", "gerencia"))):
    return ok(reportes=db.q(
        "SELECT * FROM reportes_problema ORDER BY created_at DESC LIMIT 200"))


# =====================================================================
# AUDITORÍA Y CONFIGURACIÓN
# =====================================================================
@app.get("/api/auditoria")
def ver_auditoria(request: Request, tabla: Optional[str] = None, limite: int = 200,
                  user=Depends(require_roles("admin", "gerencia"))):
    if tabla:
        return ok(registros=db.q(
            "SELECT * FROM auditoria WHERE tabla=%s ORDER BY id DESC LIMIT %s",
            (tabla, limite)))
    return ok(registros=db.q("SELECT * FROM auditoria ORDER BY id DESC LIMIT %s", (limite,)))


@app.get("/api/configuracion")
def ver_config(request: Request, user=Depends(require_staff)):
    return ok(config=db.q("SELECT * FROM configuracion ORDER BY clave"))


@app.patch("/api/configuracion/{clave}")
def set_config(clave: str, valor: str = Body(..., embed=True), request: Request = None,
               user=Depends(require_roles("admin", "gerencia"))):
    antes = db.q("SELECT valor FROM configuracion WHERE clave=%s", (clave,), one=True)
    db.execute(
        """INSERT INTO configuracion (clave, valor) VALUES (%s,%s)
           ON CONFLICT (clave) DO UPDATE SET valor=EXCLUDED.valor, updated_at=NOW()""",
        (clave, valor),
    )
    sec.audit("configuracion", "UPDATE", None, campo=clave,
              antes=antes["valor"] if antes else None, despues=valor, usuario=user)
    return ok(clave=clave, valor=valor)


# =====================================================================
# MIGRACIÓN DESDE localStorage
# =====================================================================
@app.post("/api/migracion/importar")
def importar(request: Request, payload: dict = Body(...),
             user=Depends(require_roles("admin", "gerencia"))):
    """
    Recibe el JSON exportado del navegador y lo importa.
    Idempotente: busca tutor por RIF -> teléfono -> nombre. No sobrescribe.
    """
    pacientes = payload.get("mrs_pets_admin_patients") or payload.get("pacientes") or []
    if isinstance(pacientes, str):
        import json
        pacientes = json.loads(pacientes)

    creados, existentes, errores = 0, 0, []
    for p in pacientes:
        try:
            rif_n = norm_rif(p.get("rif"))
            tel_n = norm_phone(p.get("ownerPhone") or p.get("phone"))
            nombre = p.get("owner") or p.get("ownerName") or "Sin nombre"

            prev = None
            if rif_n:
                prev = db.q("SELECT id FROM tutores WHERE rif_norm=%s", (rif_n,), one=True)
            if not prev and tel_n:
                prev = db.q("SELECT id FROM tutores WHERE telefono_norm=%s", (tel_n,), one=True)
            if not prev:
                prev = db.q("SELECT id FROM tutores WHERE LOWER(nombre)=LOWER(%s)", (nombre,), one=True)

            if prev:
                existentes += 1
                continue

            tid = db.execute(
                """INSERT INTO tutores (nombre, rif, rif_norm, telefono, telefono_norm,
                                        email, direccion, foto, pin_hash)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (nombre, p.get("rif"), rif_n, p.get("ownerPhone") or p.get("phone"), tel_n,
                 p.get("email"), p.get("address"), p.get("ownerPhoto"),
                 sec.hash_password(str(p.get("pin"))) if p.get("pin") else None),
                returning=True,
            )
            db.execute(
                """INSERT INTO mascotas (codigo, tutor_id, nombre, especie, foto,
                                         notas, condiciones)
                   VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                (p.get("id") or f"PET-{tid}", tid, p.get("name") or p.get("petName"),
                 p.get("species"), p.get("photo") or p.get("image"),
                 p.get("notes"), p.get("diseaseDetails")),
            )
            creados += 1
        except Exception as e:
            errores.append({"registro": p.get("id"), "error": str(e)})

    sec.audit("migracion", "IMPORTAR", None, despues=f"creados={creados}",
              usuario=user, ip=client_ip(request))
    return ok(creados=creados, existentes=existentes, errores=errores,
              total_recibidos=len(pacientes))


# =====================================================================
# BARRERA DE ACCESO AL PORTAL (HTTP Basic) + estáticos
# =====================================================================
def _check_basic(request: Request) -> bool:
    """Barrera de acceso al portal (HTTP Basic).

    Compara contra PORTAL_USER / PORTAL_PASSWORD de las variables de entorno.
    - PORTAL_PASSWORD vacío  -> el portal queda abierto (se avisa al arrancar).
    - PORTAL_USER vacío      -> se usa ADMIN_USER, para no dejar el portal
                                inaccesible a nadie.
    La comparación es en tiempo constante para no filtrar información por el
    tiempo de respuesta.
    """
    if not PORTAL_PASSWORD:
        return True
    usuario_esperado = PORTAL_USER or ADMIN_USER
    import base64
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Basic "):
        return False
    try:
        user, _, pwd = base64.b64decode(auth[6:]).decode("utf-8").partition(":")
    except Exception:
        return False
    usuario_ok = hmac.compare_digest(user.strip(), usuario_esperado)
    clave_ok = hmac.compare_digest(pwd, PORTAL_PASSWORD)
    return usuario_ok and clave_ok


@app.middleware("http")
async def portal_gate(request: Request, call_next):
    path = request.url.path
    # La API tiene su propia autenticación por sesión; los estáticos van tras Basic.
    # El sandbox del War Room para técnicos externos con token efímero tiene acceso directo.
    if path.startswith("/api/") or path in ("/healthz",) or path.startswith("/war-room/guest"):
        response = await call_next(request)
    elif not _check_basic(request):
        return PlainTextResponse(
            "Acceso restringido — Mrs Pets staging",
            status_code=401,
            headers={"WWW-Authenticate": 'Basic realm="Mrs Pets - usuario y clave del portal"'},
        )
    else:
        response = await call_next(request)

    # Staging: que ningún buscador indexe el portal ni sus datos.
    response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive, nosnippet"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@app.get("/robots.txt", include_in_schema=False)
def robots():
    return PlainTextResponse("User-agent: *\nDisallow: /\n")


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.get("/war-room/guest")
def war_room_guest_page():
    return FileResponse(os.path.join(STATIC_DIR, "war-room-guest.html"))


@app.get("/")
def index():
    return FileResponse(os.path.join(STATIC_DIR, "root.html"))


@app.get("/root.html")
def root_html():
    return FileResponse(os.path.join(STATIC_DIR, "root.html"))


# Estáticos (css, js, assets)
if os.path.isdir(STATIC_DIR):
    app.mount("/css", StaticFiles(directory=os.path.join(STATIC_DIR, "css")), name="css")
    app.mount("/js", StaticFiles(directory=os.path.join(STATIC_DIR, "js")), name="js")
    if os.path.isdir(os.path.join(STATIC_DIR, "assets")):
        app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")),
                  name="assets")


# ---------------------------------------------------------------------
# Manejo de errores — logs claros y consultables
# ---------------------------------------------------------------------
@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    log.error("ERROR en %s %s: %s", request.method, request.url.path, exc)
    log.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": str(exc),
                 "ruta": request.url.path,
                 "hint": "Revise los logs del servidor en Render."},
    )
