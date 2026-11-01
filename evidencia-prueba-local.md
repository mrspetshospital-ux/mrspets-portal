# Evidencia de prueba local — Mrs Pets staging

**Fecha:** 1 de noviembre de 2026
**Entorno:** sandbox Linux, Python 3.11.15, uvicorn 0.34.0, FastAPI 0.115.12
**Motor de base:** SQLite (espejo local del esquema Postgres)
**Servidor:** `http://127.0.0.1:8099`

> Todas las salidas de abajo son copias literales de las respuestas del servidor.
> No hay datos inventados.

---

## 1. Arranque

```
INFO | mrspets | Arrancando Mrs Pets staging | motor=sqlite
INFO | mrspets.db | Esquema aplicado (sqlite)
INFO | mrspets | Usuario staff 'admin' creado
INFO: Application startup complete.
INFO: Uvicorn running on http://127.0.0.1:8099
```

---

## 2. Salud y barrera de acceso

| Prueba | Comando | Resultado |
|---|---|---|
| Health | `GET /api/health` | `{"status":"ok","db":{"ok":true,"motor":"sqlite"},"version":"1.0.0-staging","portal_protegido":true}` |
| Portal sin credenciales | `GET /` | **HTTP 401** |
| Portal con credenciales | `GET /` con Basic auth | **HTTP 200**, 648.263 bytes |
| Adaptador JS servido | `GET /js/apiClient.js` | **HTTP 200**, 7.605 bytes |
| `noindex` presente | `grep` en root.html | `noindex, nofollow, noarchive` |

---

## 3. Autenticación

| Prueba | Resultado |
|---|---|
| Login staff con clave incorrecta | **HTTP 401** — `{"detail":"Credenciales inválidas."}` |
| Login staff correcto | **HTTP 200** — `{"status":"success","user":{"id":1,"username":"admin","nombre":"Administrador","role":"admin"}}` |
| Cookie emitida | `mrspets_session` (HttpOnly, firmada con HMAC) |
| Login cliente por RIF `V-18.452.910` | **HTTP 200** — tutor Dalybell Ramírez Montilla |
| Login cliente por teléfono `4143891102` | **HTTP 200** — mismo tutor |
| Login cliente con clave incorrecta | **HTTP 401** — `{"detail":"Contraseña incorrecta."}` |
| Leia sin sesión | **HTTP 401** — `{"detail":"Sesión requerida. Inicie sesión."}` |

---

## 4. Entidades

| Prueba | Resultado |
|---|---|
| Crear tutor | **HTTP 200** — `{"status":"success","id":1}` |
| Crear mascota | **HTTP 200** — `{"id":1,"codigo":"PET-101"}` |
| Crear cita | **HTTP 200** — `{"id":1,"codigo":"G-001"}` |
| Cita duplicada mismo día | **HTTP 409** — `{"detail":"El turno G-001 ya existe para ese día."}` |

El 409 confirma que el índice único `ux_citas_turno_dia` funciona: dos recepcionistas
no pueden emitir el mismo turno el mismo día.

---

## 5. Facturación — cálculo fiscal

**Entrada:** 1 × Circuito Grooming ($25) + 2 × Champú ($18) = $61, descuento $3, IVA 16%.

```json
{"status":"success","id":1,"estado":"borrador",
 "totales":{"subtotal":61.0,"descuento":3.0,"base_imponible":58.0,
            "iva_pct":16.0,"iva_monto":9.28,"igtf_pct":0.0,
            "igtf_monto":0.0,"total":67.28}}
```

**Verificación manual:** 61 − 3 = 58 base → 58 × 0.16 = 9.28 IVA → 58 + 9.28 = **67.28**. Correcto.

---

## 6. Emisión y numeración correlativa

```
POST /api/facturas/1/emitir
{"status":"success","id":1,"numero_completo":"F-GRO-000001",
 "total":67.28,"total_letras":"SESENTA Y SIETE DÓLARES CON 28/100"}
```

| Prueba | Resultado |
|---|---|
| Emitir por segunda vez | **HTTP 409** — `{"detail":"La factura ya está en estado 'emitida'."}` |

El número se consume una sola vez. El total en letras queda congelado al emitir.

---

## 7. Pagos — BUG ENCONTRADO Y CORREGIDO

### 7.1 El bug

En la primera versión, el pago se insertaba y **después** se consultaba el saldo.
Si la consulta fallaba (la vista no existía en SQLite), el `INSERT` ya estaba confirmado
y la petición devolvía 500. Resultado: **pagos huérfanos** y saldo negativo.

Evidencia del fallo:

```
POST /api/facturas/1/pagos  →  HTTP 500  "no such table: v_facturas_saldo"
pagos en tabla: 4        (2 llamadas reales)
suma pagada: 134.56      (el doble de 67.28)
saldo: -67.28
```

### 7.2 La corrección

Dos cambios en `server.py` → `registrar_pago()`:

1. **Validar el saldo ANTES de insertar.** Si el pago excede lo pendiente, se rechaza
   con 400 sin escribir nada.
2. **Insertar dentro de una transacción explícita** (`with db.get_conn()`), de modo que
   un fallo posterior no deje el pago a medias.

### 7.3 Verificación después del arreglo

Base recreada desde cero, misma secuencia, una sola vez:

```
=== EMITIR ===
{"status":"success","id":1,"numero_completo":"F-GRO-000001","total":67.28,
 "total_letras":"SESENTA Y SIETE DÓLARES CON 28/100"} [200]

=== PAGO 1: 30 USD ===
{"status":"success","factura_id":1,"monto_usd":30.0,"saldo":37.28,"estado":"emitida"} [200]

=== PAGO 2: 37.28 USD ===
{"status":"success","factura_id":1,"monto_usd":37.28,"saldo":0.0,"estado":"pagada"} [200]

=== PAGO 3: SOBREPAGO 10 (debe 400) ===
{"detail":"El pago (10.00) excede el saldo pendiente (0.00)."} [400]
```

**Verificación directa en la base:**

```
pagos en tabla: 2
suma pagada: 67.28
saldo: 0.0 | estado: pagada
```

✅ **2 pagos, no 4. Saldo 0.00, no negativo. Sobrepago rechazado.**

---

## 8. PDF

| Formato | Resultado |
|---|---|
| Carta | **HTTP 200**, 2.955 bytes, `application/pdf`, 1 página |
| Ticket 80mm | **HTTP 200**, 2.423 bytes, `application/pdf`, 1 página |

```
/tmp/factura_carta.pdf:  PDF document, version 1.4, 1 pages
/tmp/factura_ticket.pdf: PDF document, version 1.3, 1 pages
```

---

## 9. Permisos por rol

| Prueba | Resultado |
|---|---|
| Cliente consulta sus facturas | **HTTP 200** — 1 factura, `F-GRO-000001` |
| Cliente intenta anular | **HTTP 403** — `{"detail":"Solo personal autorizado."}` |

El cliente ve solo lo suyo y no puede anular. La anulación exige rol `admin` o `gerencia`.

---

## 10. Leia con sesión real

```
POST /api/leia/chat  {"mensaje":"mi perro se esta muriendo"}
{"status":"success","conversacion_id":1,
 "respuesta":"⚠️ Esto suena a una emergencia. Por favor llame ahora mismo a la clínica
              o traiga a su mascota de inmediato. No espere respuesta por este chat.",
 "motor":"reglas","nota":"Respuesta por reglas, no por modelo de lenguaje."}
```

**Diferencia clave con el portal actual:** aquí la urgencia se detecta y se responde
como urgencia. En el portal en producción, el mismo mensaje devolvía una frase sobre
"príncipes y princesas".

El campo `motor: "reglas"` es deliberado: **no finge ser IA**. Cuando se conecte un
modelo real, ese campo cambiará.

---

## 11. Reporte de problema

```
POST /api/reportes
{"pantalla":"login","accion":"intenté entrar","error_mensaje":"no carga","url":"http://x/"}
→ {"status":"success","id":1} [200]
```

El botón flotante 🐞 está inyectado en el portal por `apiClient.js`. Si el envío falla,
guarda el reporte en `localStorage` para reintentar.

---

## 12. Reportes de ventas

```json
{"resumen":{"n":1,"total":67.28},
 "por_area":[{"area":"otros","facturas":1,"monto":36.0},
             {"area":"grooming","facturas":1,"monto":25.0}],
 "por_metodo":[{"metodo":"zinli","n":1,"monto":37.28},
               {"metodo":"pago_movil","n":1,"monto":30.0}]}
```

Estos números salen de la base. En el portal actual, los reportes por área son
constantes escritas a mano en `adminFinanceEngine.js:259-264`.

---

## 13. Resumen

| Componente | Estado |
|---|---|
| Servidor arranca | ✅ |
| Esquema aplicado | ✅ 20 tablas + 1 vista |
| Barrera de acceso al portal | ✅ 401 sin credenciales |
| Login staff (PBKDF2) | ✅ |
| Login cliente (RIF / teléfono) | ✅ |
| Sesión con cookie firmada | ✅ |
| Tutores y mascotas | ✅ |
| Citas con índice único | ✅ 409 en duplicado |
| Factura: cálculo IVA | ✅ 67.28 exacto |
| Factura: correlativo | ✅ F-GRO-000001 |
| Factura: inmutabilidad | ✅ 409 al re-emitir |
| Pagos parciales | ✅ **corregido y verificado** |
| Sobrepago rechazado | ✅ 400 |
| PDF carta y ticket | ✅ |
| Permisos por rol | ✅ 403 al cliente |
| Leia con sesión + urgencia | ✅ |
| Reporte de problema | ✅ |
| Reportes de ventas | ✅ |

---

## 14. Limitaciones conocidas

1. **Probado con SQLite, no con Postgres.** El código tiene la rama Postgres
   (`psycopg2`, `BEGIN IMMEDIATE`, `RETURNING`) pero no se ejecutó contra Neon
   porque no hay cadena de conexión todavía. **Es la primera prueba a hacer al desplegar.**
2. **Leia responde por reglas**, no por modelo de lenguaje. Es honesto, no inteligente.
3. **El adaptador del frontend es un puente**, no una reescritura. Hidrata localStorage
   desde el servidor y refleja las escrituras hacia la API. Las 36 archivos JS siguen
   leyendo localStorage — por eso el portal no se rompe, pero tampoco usa la API
   de forma nativa todavía.
4. **No se probó en navegador real.** Las pruebas son HTTP con `curl`. Falta abrir
   el portal y verificar visualmente que la interfaz carga igual.
