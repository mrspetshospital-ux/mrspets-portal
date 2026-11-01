-- =====================================================================
--  Mrs Pets — Esquema PostgreSQL (staging)
--  Compatible con Neon (Postgres 16). Idempotente: se puede correr 2 veces.
--  Regla de oro: nada se borra. Se marca activo = false.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. TUTORES (dueños de mascotas) — reemplaza mrs_pets_admin_patients
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tutores (
    id              BIGSERIAL PRIMARY KEY,
    nombre          TEXT        NOT NULL,
    rif             TEXT,                          -- V-18.452.910
    rif_norm        TEXT,                          -- 18452910 (para buscar)
    telefono        TEXT,
    telefono_norm   TEXT,                          -- 4143891102
    email           TEXT,
    direccion       TEXT,
    sector          TEXT,
    foto            TEXT,
    password_hash   TEXT,                          -- PBKDF2 (login de cliente)
    pin_hash        TEXT,                          -- PBKDF2 (PIN de perfil)
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tutores_rif_norm
    ON tutores (rif_norm) WHERE rif_norm IS NOT NULL AND activo;
CREATE INDEX IF NOT EXISTS ix_tutores_telefono_norm ON tutores (telefono_norm);
CREATE INDEX IF NOT EXISTS ix_tutores_email ON tutores (LOWER(email));

-- ---------------------------------------------------------------------
-- 2. MASCOTAS — reemplaza el array patientsStatus
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mascotas (
    id              BIGSERIAL PRIMARY KEY,
    codigo          TEXT        NOT NULL,          -- PET-101
    tutor_id        BIGINT      NOT NULL REFERENCES tutores(id) ON DELETE RESTRICT,
    nombre          TEXT        NOT NULL,
    especie         TEXT,
    raza            TEXT,
    sexo            TEXT,
    fecha_nacimiento DATE,
    peso_kg         NUMERIC(6,2),
    color           TEXT,
    foto            TEXT,
    alergias        TEXT,
    condiciones     TEXT,
    parasitos       BOOLEAN     DEFAULT FALSE,
    notas           TEXT,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_mascotas_codigo ON mascotas (codigo);
CREATE INDEX IF NOT EXISTS ix_mascotas_tutor ON mascotas (tutor_id);

-- ---------------------------------------------------------------------
-- 3. SERVICIOS (catálogo) — grooming, clínica, hotel, limusina
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicios (
    id              BIGSERIAL PRIMARY KEY,
    codigo          TEXT        NOT NULL,          -- SERV-GROOMING
    nombre          TEXT        NOT NULL,
    area            TEXT        NOT NULL,          -- grooming|clinica|hotel|tienda|limusina
    descripcion     TEXT,
    precio_usd      NUMERIC(12,2) NOT NULL DEFAULT 0,
    duracion_min    INTEGER,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_servicios_codigo ON servicios (codigo);
CREATE INDEX IF NOT EXISTS ix_servicios_area ON servicios (area) WHERE activo;

-- ---------------------------------------------------------------------
-- 4. PRODUCTOS / INVENTARIO — reemplaza mrs_pets_catalog
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
    id              BIGSERIAL PRIMARY KEY,
    codigo          TEXT        NOT NULL,          -- PROD-101
    nombre          TEXT        NOT NULL,
    categoria       TEXT,
    precio_usd      NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock           INTEGER     NOT NULL DEFAULT 0,   -- caché; la verdad son los movimientos
    stock_minimo    INTEGER     NOT NULL DEFAULT 0,
    barcode         TEXT,
    imagen          TEXT,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_productos_codigo ON productos (codigo);
CREATE INDEX IF NOT EXISTS ix_productos_barcode ON productos (barcode);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id              BIGSERIAL PRIMARY KEY,
    producto_id     BIGINT      NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    tipo            TEXT        NOT NULL,          -- entrada|salida|ajuste
    cantidad        INTEGER     NOT NULL,
    stock_resultante INTEGER    NOT NULL,
    motivo          TEXT,
    factura_id      BIGINT,                        -- FK se agrega abajo
    usuario_id      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_mov_inv_producto ON movimientos_inventario (producto_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 5. CITAS — reemplaza mrs_pets_booked_appointments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas (
    id              BIGSERIAL PRIMARY KEY,
    codigo          TEXT        NOT NULL,          -- G-001 / C-001 / H-001
    mascota_id      BIGINT      NOT NULL REFERENCES mascotas(id) ON DELETE RESTRICT,
    servicio_id     BIGINT      REFERENCES servicios(id) ON DELETE SET NULL,
    area            TEXT        NOT NULL,          -- grooming|clinica|hotel|tienda
    fecha_hora      TIMESTAMPTZ NOT NULL,
    -- Día local (America/Caracas) materializado: permite un índice único
    -- inmutable. fecha_hora::date NO sirve porque depende del TimeZone
    -- de la sesión y Postgres lo rechaza dentro de un índice.
    fecha_dia       DATE        GENERATED ALWAYS AS
                    ((fecha_hora AT TIME ZONE 'America/Caracas')::date) STORED,
    duracion_min    INTEGER     DEFAULT 60,
    estado          TEXT        NOT NULL DEFAULT 'pendiente',
                    -- pendiente|confirmada|en_proceso|completada|cancelada|no_asistio
    step_index      INTEGER     NOT NULL DEFAULT 0,
    notas           TEXT,
    precio_usd      NUMERIC(12,2),
    factura_id      BIGINT,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_citas_estado CHECK (estado IN
        ('pendiente','confirmada','en_proceso','completada','cancelada','no_asistio'))
);
-- El índice que resuelve la concurrencia: dos recepcionistas no pueden
-- emitir el mismo turno el mismo día.
CREATE UNIQUE INDEX IF NOT EXISTS ux_citas_turno_dia
    ON citas (codigo, fecha_dia) WHERE activo;
CREATE INDEX IF NOT EXISTS ix_citas_fecha ON citas (fecha_hora DESC);
CREATE INDEX IF NOT EXISTS ix_citas_mascota ON citas (mascota_id, fecha_hora DESC);

-- ---------------------------------------------------------------------
-- 6. HISTORIAL CLÍNICO — inmutable
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_clinico (
    id              BIGSERIAL PRIMARY KEY,
    mascota_id      BIGINT      NOT NULL REFERENCES mascotas(id) ON DELETE RESTRICT,
    cita_id         BIGINT      REFERENCES citas(id) ON DELETE SET NULL,
    fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    motivo          TEXT,
    diagnostico     TEXT,
    tratamiento     TEXT,
    peso_kg         NUMERIC(6,2),
    temperatura_c   NUMERIC(4,1),
    veterinario     TEXT,
    notas           TEXT,
    corrige_a       BIGINT      REFERENCES historial_clinico(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_hist_mascota ON historial_clinico (mascota_id, fecha DESC);

CREATE TABLE IF NOT EXISTS vacunas (
    id              BIGSERIAL PRIMARY KEY,
    mascota_id      BIGINT      NOT NULL REFERENCES mascotas(id) ON DELETE RESTRICT,
    nombre          TEXT        NOT NULL,
    lote            TEXT,
    fecha_aplicacion DATE       NOT NULL,
    proxima_dosis   DATE,
    veterinario     TEXT,
    notas           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_vacunas_mascota ON vacunas (mascota_id, fecha_aplicacion DESC);

-- ---------------------------------------------------------------------
-- 7. SERIES Y FACTURACIÓN
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS series_factura (
    id              BIGSERIAL PRIMARY KEY,
    codigo          TEXT        NOT NULL,          -- CLI, GRO, HOT, TIE, GEN
    descripcion     TEXT,
    prefijo         TEXT        NOT NULL,          -- F-CLI
    ultimo_numero   INTEGER     NOT NULL DEFAULT 0,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_series_codigo ON series_factura (codigo);

CREATE TABLE IF NOT EXISTS facturas (
    id              BIGSERIAL PRIMARY KEY,
    serie_id        BIGINT      NOT NULL REFERENCES series_factura(id) ON DELETE RESTRICT,
    numero          INTEGER     NOT NULL,
    numero_completo TEXT        NOT NULL,          -- F-CLI-000123
    tutor_id        BIGINT      REFERENCES tutores(id) ON DELETE RESTRICT,
    mascota_id      BIGINT      REFERENCES mascotas(id) ON DELETE SET NULL,
    cita_id         BIGINT      REFERENCES citas(id) ON DELETE SET NULL,
    fecha_emision   TIMESTAMPTZ,
    fecha_vencimiento DATE,
    cliente_nombre  TEXT        NOT NULL,          -- copia congelada
    cliente_rif     TEXT,
    cliente_telefono TEXT,
    cliente_email   TEXT,
    cliente_direccion TEXT,
    subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
    descuento       NUMERIC(14,2) NOT NULL DEFAULT 0,
    base_imponible  NUMERIC(14,2) NOT NULL DEFAULT 0,
    iva_pct         NUMERIC(5,2)  NOT NULL DEFAULT 16,
    iva_monto       NUMERIC(14,2) NOT NULL DEFAULT 0,
    igtf_pct        NUMERIC(5,2)  NOT NULL DEFAULT 0,
    igtf_monto      NUMERIC(14,2) NOT NULL DEFAULT 0,
    total           NUMERIC(14,2) NOT NULL DEFAULT 0,
    moneda          TEXT        NOT NULL DEFAULT 'USD',
    tasa_bcv        NUMERIC(14,4),
    total_ves       NUMERIC(16,2),
    total_letras    TEXT,                          -- congelado al emitir
    estado          TEXT        NOT NULL DEFAULT 'borrador',
                    -- borrador|emitida|pagada|anulada|vencida
    motivo_anulacion TEXT,
    anulada_por     BIGINT,
    anulada_at      TIMESTAMPTZ,
    usuario_emisor  BIGINT,
    notas           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_facturas_estado CHECK (estado IN
        ('borrador','emitida','pagada','anulada','vencida'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_facturas_serie_numero ON facturas (serie_id, numero);
CREATE UNIQUE INDEX IF NOT EXISTS ux_facturas_numero_completo ON facturas (numero_completo);
CREATE INDEX IF NOT EXISTS ix_facturas_tutor ON facturas (tutor_id, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS ix_facturas_estado ON facturas (estado, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS ix_facturas_fecha ON facturas (fecha_emision DESC);

CREATE TABLE IF NOT EXISTS factura_items (
    id              BIGSERIAL PRIMARY KEY,
    factura_id      BIGINT      NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    servicio_id     BIGINT      REFERENCES servicios(id) ON DELETE SET NULL,
    producto_id     BIGINT      REFERENCES productos(id) ON DELETE SET NULL,
    concepto        TEXT        NOT NULL,          -- copia congelada
    cantidad        NUMERIC(10,2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(14,2) NOT NULL DEFAULT 0,
    descuento_linea NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_linea     NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_items_factura ON factura_items (factura_id);

CREATE TABLE IF NOT EXISTS pagos (
    id              BIGSERIAL PRIMARY KEY,
    factura_id      BIGINT      NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT,
    metodo          TEXT        NOT NULL,
                    -- efectivo|pago_movil|transferencia|zinli|punto_venta|divisas|stripe
    referencia      TEXT,
    monto           NUMERIC(14,2) NOT NULL,
    moneda          TEXT        NOT NULL DEFAULT 'USD',
    monto_usd       NUMERIC(14,2) NOT NULL,        -- normalizado
    tasa_aplicada   NUMERIC(14,4),
    fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id      BIGINT,
    notas           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_pagos_factura ON pagos (factura_id);
CREATE INDEX IF NOT EXISTS ix_pagos_fecha ON pagos (fecha DESC);

CREATE TABLE IF NOT EXISTS notas_fiscales (
    id              BIGSERIAL PRIMARY KEY,
    tipo            TEXT        NOT NULL,          -- credito|debito
    serie_id        BIGINT      NOT NULL REFERENCES series_factura(id) ON DELETE RESTRICT,
    numero          INTEGER     NOT NULL,
    numero_completo TEXT        NOT NULL,
    factura_id      BIGINT      NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT,
    monto           NUMERIC(14,2) NOT NULL,
    motivo          TEXT        NOT NULL,
    usuario_id      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_notas_tipo CHECK (tipo IN ('credito','debito'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_notas_numero ON notas_fiscales (serie_id, numero);

-- FK diferidas (evitan ciclos de creación)
ALTER TABLE movimientos_inventario
    DROP CONSTRAINT IF EXISTS fk_mov_factura;
ALTER TABLE movimientos_inventario
    ADD CONSTRAINT fk_mov_factura FOREIGN KEY (factura_id)
    REFERENCES facturas(id) ON DELETE SET NULL;

ALTER TABLE citas DROP CONSTRAINT IF EXISTS fk_citas_factura;
ALTER TABLE citas ADD CONSTRAINT fk_citas_factura FOREIGN KEY (factura_id)
    REFERENCES facturas(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 8. STAFF, SESIONES, AUDITORÍA, CONFIGURACIÓN
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_users (
    id              BIGSERIAL PRIMARY KEY,
    username        TEXT        NOT NULL,
    nombre          TEXT,
    email           TEXT,
    password_hash   TEXT        NOT NULL,          -- PBKDF2
    rol             TEXT        NOT NULL DEFAULT 'recepcion',
                    -- admin|gerencia|recepcion|veterinario|groomer
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    ultimo_acceso   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_staff_rol CHECK (rol IN
        ('admin','gerencia','recepcion','veterinario','groomer'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_staff_username ON staff_users (LOWER(username));

CREATE TABLE IF NOT EXISTS sesiones (
    id              BIGSERIAL PRIMARY KEY,
    token_hash      TEXT        NOT NULL,          -- SHA-256 del token; nunca el token
    tipo            TEXT        NOT NULL,          -- staff|cliente
    staff_id        BIGINT      REFERENCES staff_users(id) ON DELETE CASCADE,
    tutor_id        BIGINT      REFERENCES tutores(id) ON DELETE CASCADE,
    ip              TEXT,
    user_agent      TEXT,
    expira_at       TIMESTAMPTZ NOT NULL,
    revocada        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_sesiones_token ON sesiones (token_hash);
CREATE INDEX IF NOT EXISTS ix_sesiones_expira ON sesiones (expira_at) WHERE NOT revocada;

CREATE TABLE IF NOT EXISTS auditoria (
    id              BIGSERIAL PRIMARY KEY,
    tabla           TEXT        NOT NULL,
    registro_id     BIGINT,
    accion          TEXT        NOT NULL,          -- INSERT|UPDATE|DELETE|LOGIN|ANULACION
    campo           TEXT,
    valor_anterior  TEXT,
    valor_nuevo     TEXT,
    usuario_tipo    TEXT,
    usuario_id      BIGINT,
    usuario_nombre  TEXT,
    ip              TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_auditoria_tabla ON auditoria (tabla, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_auditoria_usuario ON auditoria (usuario_id, created_at DESC);

CREATE TABLE IF NOT EXISTS configuracion (
    clave           TEXT        PRIMARY KEY,
    valor           TEXT,
    tipo            TEXT        NOT NULL DEFAULT 'texto',  -- texto|numero|json|bool
    descripcion     TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 9. LEIA (chat) Y REPORTES DE PROBLEMA
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leia_conversaciones (
    id              BIGSERIAL PRIMARY KEY,
    tutor_id        BIGINT      REFERENCES tutores(id) ON DELETE SET NULL,
    canal           TEXT        NOT NULL DEFAULT 'web',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leia_mensajes (
    id              BIGSERIAL PRIMARY KEY,
    conversacion_id BIGINT      NOT NULL REFERENCES leia_conversaciones(id) ON DELETE CASCADE,
    rol             TEXT        NOT NULL,          -- user|assistant
    contenido       TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_leia_rol CHECK (rol IN ('user','assistant'))
);
CREATE INDEX IF NOT EXISTS ix_leia_msg_conv ON leia_mensajes (conversacion_id, created_at);

CREATE TABLE IF NOT EXISTS reportes_problema (
    id              BIGSERIAL PRIMARY KEY,
    pantalla        TEXT,
    accion          TEXT,
    error_mensaje   TEXT,
    error_stack     TEXT,
    user_agent      TEXT,
    url             TEXT,
    usuario_tipo    TEXT,
    usuario_id      BIGINT,
    resuelto        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_reportes_fecha ON reportes_problema (created_at DESC);

-- ---------------------------------------------------------------------
-- 10. TRIGGERS: updated_at + inmutabilidad de facturas emitidas
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['tutores','mascotas','servicios','productos','citas',
                             'series_factura','facturas','staff_users','leia_conversaciones']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%1$s ON %1$s', t);
        EXECUTE format('CREATE TRIGGER trg_touch_%1$s BEFORE UPDATE ON %1$s
                        FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at()', t);
    END LOOP;
END $$;

-- Una factura emitida NO se edita: se anula con nota de crédito.
CREATE OR REPLACE FUNCTION fn_factura_inmutable() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado <> 'borrador' THEN
        IF NEW.total <> OLD.total
           OR NEW.numero_completo <> OLD.numero_completo
           OR NEW.subtotal <> OLD.subtotal
           OR NEW.iva_monto <> OLD.iva_monto THEN
            RAISE EXCEPTION 'Factura % emitida: no se puede editar. Use nota de credito.',
                OLD.numero_completo;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_facturas_inmutables ON facturas;
CREATE TRIGGER trg_facturas_inmutables BEFORE UPDATE ON facturas
    FOR EACH ROW EXECUTE FUNCTION fn_factura_inmutable();

-- ---------------------------------------------------------------------
-- 11. VISTAS
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_facturas_saldo AS
SELECT f.id,
       f.numero_completo,
       f.estado,
       f.total,
       COALESCE(SUM(p.monto_usd), 0)::NUMERIC(14,2) AS pagado,
       (f.total - COALESCE(SUM(p.monto_usd), 0))::NUMERIC(14,2) AS saldo
FROM facturas f
LEFT JOIN pagos p ON p.factura_id = f.id
GROUP BY f.id;

-- =====================================================================
-- 12. DATOS DE EJEMPLO MÍNIMOS
--    Contraseña de todos: "mrspets2026"  (PBKDF2-SHA256, 260000 iter)
--    PIN de todos: "1234"
-- =====================================================================
INSERT INTO series_factura (codigo, descripcion, prefijo, ultimo_numero) VALUES
    ('GEN','Factura general','F-GEN',0),
    ('GRO','Grooming','F-GRO',0),
    ('CLI','Clínica','F-CLI',0),
    ('HOT','Hotel','F-HOT',0),
    ('TIE','Tienda','F-TIE',0)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO staff_users (username, nombre, email, password_hash, rol) VALUES
    ('admin','Administrador Mrs Pets','admin@mrspets.local',
     'pbkdf2_sha256$260000$c2FsdGVkX21yc3BldHM$PLACEHOLDER_RUN_seed.py', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO servicios (codigo, nombre, area, precio_usd, duracion_min) VALUES
    ('SERV-GROOMING','Circuito Grooming Spa (7 Estaciones)','grooming',25.00,120),
    ('SERV-BANO','Baño Estándar Premium','grooming',12.00,60),
    ('SERV-CORTE','Corte de Raza','grooming',18.00,90),
    ('SERV-CONSULTA','Consulta Veterinaria','clinica',20.00,30),
    ('SERV-VACUNA','Vacunación','clinica',15.00,15),
    ('SERV-HOTEL','Hotel Suite Bioclimática (noche)','hotel',35.00,1440)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO productos (codigo, nombre, categoria, precio_usd, stock, stock_minimo, barcode) VALUES
    ('PROD-101','Royal Canin Mini Adult (3kg)','Alimento',28.50,15,5,'7501092834710'),
    ('PROD-102','Champú Ozono Hipoalergénico 500ml','Higiene',18.00,24,6,'7509823412093'),
    ('PROD-103','Bravecto Perros 10-20kg','Farmacia',42.00,8,3,'7508492019482')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES
    ('negocio.razon_social','MRS PETS CORP, C.A.','texto','Razón social para facturas'),
    ('negocio.rif','J-00000000-0','texto','RIF del negocio (EDITAR)'),
    ('negocio.direccion','Av. 4 Bella Vista, Maracaibo, Zulia','texto','Domicilio fiscal'),
    ('negocio.telefono','+58 414-0000000','texto','Teléfono del negocio'),
    ('fiscal.iva_pct','16','numero','IVA general'),
    ('fiscal.igtf_pct','3','numero','IGTF para pagos en divisas'),
    ('factura.serie_default','GEN','texto','Serie por defecto')
ON CONFLICT (clave) DO NOTHING;

COMMIT;
