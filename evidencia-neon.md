# Evidencia — Conexión real a Neon y pruebas de staging

**Fecha:** 2026-11-01
**Base:** Neon PostgreSQL 18.6 · `<host-de-neon>` · db `neondb`
**Servidor:** FastAPI + uvicorn, `motor=postgres`

---

## 1. Conexión a Neon

Se probaron las dos variantes de la cadena.

| Variante | Resultado | Latencia |
|---|---|---|
| CON `channel_binding=require` | **OK** | 0,11 s |
| SIN `channel_binding` | no fue necesario probarla | — |

```
PostgreSQL 18.6 (4e5fd08) on aarch64-unknown-linux-gnu
database: neondb | user: neondb_owner
server time: 2026-11-01 01:43:34.614920+00:00
tablas en public: 0
```

**Conclusión:** `channel_binding=require` **no** causa problema con `psycopg2 2.9.13`.
La cadena se usa tal cual, sin recortar parámetros.

---

## 2. Esquema aplicado

Primer intento **falló**:

```
FALLO: functions in index expression must be marked IMMUTABLE
```

**Causa:** `CREATE UNIQUE INDEX ... ON citas (codigo, (fecha_hora::date))`.
`fecha_hora::date` depende del `TimeZone` de la sesión, así que Postgres lo rechaza
dentro de un índice.

**Corrección aplicada** (`schema.sql`, tabla `citas`):

```sql
-- antes
CREATE UNIQUE INDEX ux_citas_turno_dia
    ON citas (codigo, (fecha_hora::date)) WHERE activo;

-- después
fecha_dia DATE GENERATED ALWAYS AS
    ((fecha_hora AT TIME ZONE 'America/Caracas')::date) STORED,

CREATE UNIQUE INDEX ux_citas_turno_dia
    ON citas (codigo, fecha_dia) WHERE activo;
```

Segundo intento:

```
ESQUEMA EJECUTADO: OK
TABLAS (20): auditoria, citas, configuracion, factura_items, facturas,
  historial_clinico, leia_conversaciones, leia_mensajes, mascotas,
  movimientos_inventario, notas_fiscales, pagos, productos,
  reportes_problema, series_factura, servicios, sesiones, staff_users,
  tutores, vacunas
VISTAS: ['v_facturas_saldo']
INDICES: 52
TRIGGERS (10): trg_facturas_inmutables, trg_touch_citas, trg_touch_facturas,
  trg_touch_leia_conversaciones, trg_touch_mascotas, trg_touch_productos,
  trg_touch_series_factura, trg_touch_servicios, trg_touch_staff_users,
  trg_touch_tutores
series_factura: 5 | servicios: 6 | staff_users: 1
```

---

## 3. Bugs encontrados y corregidos al probar contra Postgres

Los tres son **específicos de Postgres**: con SQLite no aparecían.

### 3.1 `activo=1` sobre columna BOOLEAN — 11 ocurrencias

```
operator does not exist: boolean = integer
LINE 1: ...taff_users WHERE LOWER(username)=LOWER('admin') AND activo=1
```

**Efecto:** el login de staff devolvía **500**. El portal era inaccesible.
**Corrección:** `activo=1` → `activo=TRUE`, `activo=0` → `activo=FALSE` (10 + 1 en `server.py`).

### 3.2 `revocada = 0` sobre BOOLEAN — 2 ocurrencias

```
operator does not exist: boolean = integer
LINE 6: ... AND s.revocada = 0
```

**Efecto:** `/api/auth/me` devolvía **500**; ninguna sesión se podía validar.
**Corrección:** `security.py:112` y `:132` → `FALSE` / `TRUE`.

### 3.3 Hash de contraseña expuesto en la API

`GET /api/tutores` devolvía `password_hash` completo:

```
"password_hash":"pbkdf2_sha256$260000$nqDgSEfKcNZyxvL0FHG1/w==$jPn2g8O9..."
```

**Efecto:** cualquiera con sesión podía descargar los hashes y atacarlos offline.
**Corrección:** saneador `_limpiar()` en `ok()` que elimina `password_hash`,
`pin_hash` y `token_hash` de toda respuesta. Verificado: **0 apariciones**.

### 3.4 `static/assets/` vacío — 8 imágenes 404

El paquete anterior no incluía las imágenes. `leia_avatar.jpg` devolvía **404**.
**Corrección:** se generaron 8 marcadores de posición rotulados «imagen pendiente».
**No son las fotos reales** — hay que reemplazarlas por los originales.

### 3.5 Faltaba `noindex`

**Corrección:** middleware que añade a toda respuesta:

```
x-robots-tag: noindex, nofollow, noarchive, nosnippet
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
referrer-policy: no-referrer
```

Más `GET /robots.txt` → `User-agent: * / Disallow: /`.

---

## 4. Usuario administrador

```
USUARIO: (1, 'admin', 'admin')
PASSWORD_TEMPORAL: 04y1-r54c-r8n0-ztus
VERIFY correcta  : True
VERIFY incorrecta: False
```

Hash almacenado: `pbkdf2_sha256$260000$...` (260.000 iteraciones, sal de 16 bytes).
**La contraseña no se guarda en texto plano en ningún lado.**

---

## 5. Pruebas de extremo a extremo

| # | Prueba | HTTP | Resultado |
|---|---|---|---|
| 1 | `/healthz` | 200 | `{"ok":true}` |
| 2 | Portal sin credenciales | **401** | barrera activa |
| 3 | Portal con credenciales | 200 | 648.263 bytes |
| 4 | Login staff clave mala | **401** | `Credenciales inválidas.` |
| 5 | Login staff correcto | 200 | cookie firmada |
| 6 | `/api/auth/me` | 200 | `{"tipo":"staff","rol":"admin"}` |
| 7 | Crear tutor | 200 | `{"id":1}` |
| 8 | Crear mascota | 200 | `PET-101` |
| 9 | Login cliente por RIF | 200 | Dalybell Ramírez Montilla |
| 10 | Login cliente por teléfono | 200 | mismo tutor |
| 11 | Login cliente clave mala | **401** | `Contraseña incorrecta.` |
| 12 | Crear factura borrador | 200 | subtotal 43,00 · desc 3,00 · base 40,00 · IVA 6,40 · **total 46,40** |
| 13 | Emitir | 200 | `F-GRO-000001` · `CUARENTA Y SEIS DÓLARES CON 40/100` |
| 14 | Re-emitir | **409** | `La factura ya está en estado 'emitida'.` |
| 15 | Pago parcial 20,00 | 200 | saldo 26,40 · `emitida` |
| 16 | Pago resto 26,40 | 200 | saldo 0,00 · `pagada` |
| 17 | Sobrepago 10,00 | **400** | `El pago (10.00) excede el saldo pendiente (0.00).` |
| 18 | PDF carta | 200 | 2.867 b · PDF 1.4, 1 página |
| 19 | PDF ticket | 200 | 2.399 b |
| 20 | Cliente intenta anular | **403** | `Solo personal autorizado.` |
| 21 | Leia sin sesión | **401** | `Sesión requerida.` |
| 22 | Leia con urgencia | 200 | respuesta de emergencia correcta |
| 23 | Reporte de problema | 200 | `{"id":1}` |
| 24 | Reporte ventas | 200 | 1 factura · 46,40 · por método |
| 25 | Cuentas por cobrar | 200 | `[]` (todo cobrado) |
| 26 | Auditoría | 200 | registros con IP y usuario |

### Leia con urgencia

```
"mi perro se esta muriendo"
→ "⚠️ Esto suena a una emergencia. Por favor llame ahora mismo a la clínica
   o traiga a su mascota de inmediato. No espere respuesta por este chat."
motor: "reglas"  ·  nota: "Respuesta por reglas, no por modelo de lenguaje."
```

---

## 6. Persistencia verificada directamente en Neon

Consulta independiente del servidor, contra la base:

```
=== DATOS PERSISTIDOS EN NEON ===
  tutores                1
  mascotas               1
  facturas               1
  factura_items          2
  pagos                  2
  staff_users            1
  sesiones               4
  leia_mensajes          2

=== FACTURA ===
('F-GRO-000001', 'pagada', 43.00, 3.00, 40.00, 6.40, 46.40,
 'CUARENTA Y SEIS DÓLARES CON 40/100')

=== SALDO (vista) ===
('F-GRO-000001', 46.40, 46.40, 0.00, 'pagada')

=== PAGOS ===
('pago_movil', 20.00, 'USD', 'PM-001')
('efectivo',   26.40, 'USD', None)
```

### Trigger de inmutabilidad

```
UPDATE facturas SET total = 999 WHERE id=1;
→ OK, rechazado: Factura F-GRO-000001 emitida: no se puede editar. Use nota de credito.
```

**La base rechaza la edición de una factura emitida.** No depende del código.

### Hash de claves

```
('Dalybell Ramírez Montilla', 'pbkdf2_sha256$260000$nqDgSEf...')
```

---

## 7. Lo que NO se probó

| Pendiente | Por qué |
|---|---|
| Navegador real | Las pruebas son HTTP con `curl`. Falta abrir el portal y ver la interfaz. |
| Despliegue en Render | No se creó la cuenta. El paquete está listo. |
| Leia con modelo de lenguaje | Sigue respondiendo por reglas (`motor: "reglas"`). |
| Fotos reales | Los 8 assets son marcadores de posición. |
| Migración de datos reales | El portal original sigue en localStorage; no se exportó nada. |

---

## 8. Estado del paquete

```
server.py           ~51 KB   FastAPI, 40+ rutas
schema.sql          ~23 KB   20 tablas, 52 índices, 10 triggers, 1 vista
schema_sqlite.sql   ~13 KB   espejo para pruebas locales
db.py               ~4 KB    Postgres + SQLite
security.py         ~5,5 KB  PBKDF2 + sesiones HMAC
facturacion.py      ~16 KB   correlativo, fiscal, PDF
static/js/apiClient.js 7,6 KB  adaptador + botón reportar
static/assets/      8 imágenes (marcadores)
requirements.txt · Procfile · render.yaml · .env.example
guia-despliegue.html · evidencia-neon.md
```
