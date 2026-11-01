# MRSPETS — Portal (ambiente de prueba)

Portal de gestión para Mrs Pets: clientes, mascotas, citas de grooming, servicios,
facturación con PDF, inventario y el asistente Leia.

Servidor **FastAPI** + base de datos **PostgreSQL (Neon)**. En local puede correr con
SQLite si no hay `DATABASE_URL`.

---

## Arranque local

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # y completar los valores
uvicorn server:app --reload --port 8000
```

Abrir http://localhost:8000

---

## Despliegue en Render

1. Crear un **Web Service** apuntando a este repositorio.
2. Render detecta `render.yaml` automáticamente.
3. Cargar las variables de entorno (ver abajo).
4. Verificar en `https://<tu-servicio>.onrender.com/api/health`
   que responda `"motor":"postgres"`.

**Comando de arranque:**

```
uvicorn server:app --host 0.0.0.0 --port $PORT
```

**Versión de Python:** 3.11.9

---

## Variables de entorno

| Nombre | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí (en producción) | Cadena de conexión de Neon. Si falta, usa SQLite local. |
| `PORTAL_USER` | Sí | Usuario de la barrera de acceso al portal. |
| `PORTAL_PASSWORD` | Sí | Contraseña de la barrera de acceso. |
| `SECRET_KEY` | Sí | Clave para firmar las cookies de sesión. |
| `ADMIN_USER` | No | Usuario staff inicial. Por defecto `admin`. |
| `ADMIN_PASSWORD` | Sí | Contraseña del usuario staff inicial. |
| `COOKIE_SECURE` | No | `1` en producción (HTTPS). |
| `ALLOWED_ORIGIN` | No | Origen permitido para CORS. |
| `SQLITE_PATH` | No | Ruta del archivo SQLite en local. |

**Ningún valor está escrito en el código.** Todo se lee de variables de entorno.

---

## Estructura

```
server.py            Servidor FastAPI: portal + API REST + facturación
db.py                Capa de datos (PostgreSQL y SQLite con el mismo código)
security.py          Hash de contraseñas (PBKDF2) y sesiones firmadas
facturacion.py       Correlativo, cálculo fiscal, total en letras, PDF
schema.sql           Esquema PostgreSQL: 20 tablas, índices, triggers, vista
schema_sqlite.sql    Esquema equivalente para SQLite
static/              Portal: root.html, css, js, assets
requirements.txt     Dependencias
Procfile             Comando de arranque (Heroku/Render)
render.yaml          Configuración de despliegue en Render
.env.example         Plantilla de variables de entorno
```

---

## Notas

- El portal responde con `x-robots-tag: noindex, nofollow` y `robots.txt` bloquea todo.
- Las facturas emitidas no se pueden editar: la base lo impide con un trigger.
- Los hashes de contraseña nunca salen en las respuestas de la API.
