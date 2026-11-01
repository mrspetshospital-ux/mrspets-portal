"""
Capa de base de datos — Mrs Pets staging.

Soporta dos motores con el mismo código:
  * PostgreSQL  (producción / Neon)  -> DATABASE_URL = postgresql://...
  * SQLite      (prueba local)       -> DATABASE_URL vacío o sqlite:///...

La diferencia se resuelve aquí, no en el resto del servidor.
"""
import os
import re
import sqlite3
import logging
from contextlib import contextmanager

log = logging.getLogger("mrspets.db")

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
IS_POSTGRES = DATABASE_URL.startswith(("postgres://", "postgresql://"))

# Neon entrega "postgres://"; psycopg2 prefiere "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

SQLITE_PATH = os.getenv("SQLITE_PATH", "mrspets_local.db")


def _to_sqlite(sql: str) -> str:
    """Traduce lo mínimo indispensable de Postgres a SQLite."""
    sql = sql.replace("%s", "?")
    sql = re.sub(r"\bNOW\(\)", "CURRENT_TIMESTAMP", sql, flags=re.I)
    sql = re.sub(r"\bTRUE\b", "1", sql)
    sql = re.sub(r"\bFALSE\b", "0", sql)
    return sql


@contextmanager
def get_conn():
    """Devuelve una conexión. Commit automático si no hubo excepción."""
    if IS_POSTGRES:
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(SQLITE_PATH, timeout=10, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=5000")
        conn.execute("PRAGMA foreign_keys=ON")
        try:
            yield conn
        finally:
            conn.close()


def q(sql: str, params=None, one: bool = False):
    """SELECT que devuelve lista de dicts (o un dict si one=True)."""
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(sql if IS_POSTGRES else _to_sqlite(sql), params or ())
        rows = [dict(r) for r in cur.fetchall()]
        cur.close()
    if one:
        return rows[0] if rows else None
    return rows


def execute(sql: str, params=None, returning: bool = False):
    """INSERT/UPDATE/DELETE. Devuelve el id si returning=True."""
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(sql if IS_POSTGRES else _to_sqlite(sql), params or ())
        out = None
        if returning:
            row = cur.fetchone()
            if row:
                out = row[0] if not isinstance(row, dict) else list(row.values())[0]
        cur.close()
        return out


def executemany(sql: str, seq):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.executemany(sql if IS_POSTGRES else _to_sqlite(sql), seq)
        cur.close()


def init_schema():
    """Crea el esquema. En Postgres corre schema.sql; en SQLite, schema_sqlite.sql."""
    here = os.path.dirname(os.path.abspath(__file__))
    fname = "schema.sql" if IS_POSTGRES else "schema_sqlite.sql"
    path = os.path.join(here, fname)
    if not os.path.exists(path):
        log.warning("No se encontró %s — se omite init_schema", path)
        return False
    with open(path, "r", encoding="utf-8") as f:
        script = f.read()

    if IS_POSTGRES:
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute(script)
            cur.close()
    else:
        conn = sqlite3.connect(SQLITE_PATH)
        try:
            conn.executescript(script)
            conn.commit()
        finally:
            conn.close()
    log.info("Esquema aplicado (%s)", "postgres" if IS_POSTGRES else "sqlite")
    return True


def health():
    try:
        q("SELECT 1 AS ok", one=True)
        return {"ok": True, "motor": "postgres" if IS_POSTGRES else "sqlite"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
