"""
Seguridad — Mrs Pets staging.

* Hash de contraseñas: PBKDF2-HMAC-SHA256, 260.000 iteraciones (mismo esquema
  que ya usa el staff del portal). Nunca se guarda la contraseña en claro.
* Sesiones: token aleatorio de 32 bytes; en la base solo se guarda su SHA-256.
  La cookie va firmada con HMAC-SHA256 y es HttpOnly + SameSite=Lax.
"""
import os
import hmac
import hashlib
import secrets
import base64
import logging
from datetime import datetime, timedelta, timezone

from db import q, execute

log = logging.getLogger("mrspets.security")

PBKDF2_ITERATIONS = 260_000
SESSION_DAYS = 7
COOKIE_NAME = "mrspets_session"

SECRET_KEY = os.getenv("SECRET_KEY", "").strip()
if not SECRET_KEY:
    # En staging sin SECRET_KEY se genera uno efímero y se avisa.
    SECRET_KEY = secrets.token_hex(32)
    log.warning("SECRET_KEY no definida: se generó una efímera. "
                "Las sesiones se invalidan al reiniciar. Definir en Render.")


# ---------------------------------------------------------------------
# Contraseñas
# ---------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Devuelve 'pbkdf2_sha256$iter$salt_b64$hash_b64'."""
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        PBKDF2_ITERATIONS,
        base64.b64encode(salt).decode(),
        base64.b64encode(dk).decode(),
    )


def verify_password(password: str, stored: str) -> bool:
    """Comparación en tiempo constante. Tolera hashes corruptos sin lanzar."""
    if not stored or not password:
        return False
    try:
        algo, iters, salt_b64, hash_b64 = stored.split("$")
        if algo != "pbkdf2_sha256":
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iters))
        return hmac.compare_digest(dk, expected)
    except Exception as e:
        log.error("Hash inválido: %s", e)
        return False


# ---------------------------------------------------------------------
# Tokens de sesión
# ---------------------------------------------------------------------
def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _sign(token: str) -> str:
    return hmac.new(SECRET_KEY.encode(), token.encode(), hashlib.sha256).hexdigest()


def make_cookie_value(token: str) -> str:
    """token.firma — la firma detecta cookies manipuladas sin tocar la base."""
    return f"{token}.{_sign(token)}"


def parse_cookie_value(value: str):
    """Devuelve el token si la firma es válida, si no None."""
    if not value or "." not in value:
        return None
    token, sig = value.rsplit(".", 1)
    if not hmac.compare_digest(sig, _sign(token)):
        return None
    return token


def create_session(tipo: str, staff_id=None, tutor_id=None, ip=None, user_agent=None) -> str:
    token = secrets.token_urlsafe(32)
    expira = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    execute(
        """INSERT INTO sesiones (token_hash, tipo, staff_id, tutor_id, ip, user_agent, expira_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (_sha256(token), tipo, staff_id, tutor_id, ip, (user_agent or "")[:300],
         expira.isoformat()),
    )
    return token


def get_session(token: str):
    """Devuelve dict con tipo/staff_id/tutor_id, o None si no vale."""
    if not token:
        return None
    row = q(
        """SELECT s.*, st.username, st.nombre AS staff_nombre, st.rol,
                  t.nombre AS tutor_nombre
           FROM sesiones s
           LEFT JOIN staff_users st ON st.id = s.staff_id
           LEFT JOIN tutores t ON t.id = s.tutor_id
           WHERE s.token_hash = %s AND s.revocada = FALSE""",
        (_sha256(token),), one=True,
    )
    if not row:
        return None
    try:
        exp = row["expira_at"]
        if isinstance(exp, str):
            exp = datetime.fromisoformat(exp.replace("Z", "+00:00"))
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            return None
    except Exception:
        return None
    return row


def revoke_session(token: str):
    if token:
        execute("UPDATE sesiones SET revocada = TRUE WHERE token_hash = %s", (_sha256(token),))


# ---------------------------------------------------------------------
# Auditoría
# ---------------------------------------------------------------------
def audit(tabla, accion, registro_id=None, campo=None, antes=None, despues=None,
          usuario=None, ip=None):
    """Registra un cambio. Nunca lanza: la auditoría no debe tumbar la operación."""
    try:
        execute(
            """INSERT INTO auditoria
               (tabla, registro_id, accion, campo, valor_anterior, valor_nuevo,
                usuario_tipo, usuario_id, usuario_nombre, ip)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (tabla, registro_id, accion, campo,
             None if antes is None else str(antes)[:2000],
             None if despues is None else str(despues)[:2000],
             (usuario or {}).get("tipo"), (usuario or {}).get("id"),
             (usuario or {}).get("nombre"), ip),
        )
    except Exception as e:
        log.error("No se pudo escribir auditoría: %s", e)
