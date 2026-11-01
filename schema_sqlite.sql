-- =====================================================================
--  Mrs Pets — Esquema SQLite (solo para prueba local en el sandbox)
--  Espejo del schema.sql de Postgres. En producción se usa Postgres.
-- =====================================================================

CREATE TABLE IF NOT EXISTS tutores (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre          TEXT NOT NULL,
    rif             TEXT,
    rif_norm        TEXT,
    telefono        TEXT,
    telefono_norm   TEXT,
    email           TEXT,
    direccion       TEXT,
    sector          TEXT,
    foto            TEXT,
    password_hash   TEXT,
    pin_hash        TEXT,
    activo          INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tutores_rif_norm ON tutores (rif_norm);
CREATE INDEX IF NOT EXISTS ix_tutores_telefono_norm ON tutores (telefono_norm);

CREATE TABLE IF NOT EXISTS mascotas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo          TEXT NOT NULL UNIQUE,
    tutor_id        INTEGER NOT NULL REFERENCES tutores(id),
    nombre          TEXT NOT NULL,
    especie         TEXT,
    raza            TEXT,
    sexo            TEXT,
    fecha_nacimiento TEXT,
    peso_kg         REAL,
    color           TEXT,
    foto            TEXT,
    alergias        TEXT,
    condiciones     TEXT,
    parasitos       INTEGER DEFAULT 0,
    notas           TEXT,
    activo          INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_mascotas_tutor ON mascotas (tutor_id);

CREATE TABLE IF NOT EXISTS servicios (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo          TEXT NOT NULL UNIQUE,
    nombre          TEXT NOT NULL,
    area            TEXT NOT NULL,
    descripcion     TEXT,
    precio_usd      REAL NOT NULL DEFAULT 0,
    duracion_min    INTEGER,
    activo          INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo          TEXT NOT NULL UNIQUE,
    nombre          TEXT NOT NULL,
    categoria       TEXT,
    precio_usd      REAL NOT NULL DEFAULT 0,
    stock           INTEGER NOT NULL DEFAULT 0,
    stock_minimo    INTEGER NOT NULL DEFAULT 0,
    barcode         TEXT,
    imagen          TEXT,
    activo          INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id     INTEGER NOT NULL REFERENCES productos(id),
    tipo            TEXT NOT NULL,
    cantidad        INTEGER NOT NULL,
    stock_resultante INTEGER NOT NULL,
    motivo          TEXT,
    factura_id      INTEGER,
    usuario_id      INTEGER,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS citas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo          TEXT NOT NULL,
    mascota_id      INTEGER NOT NULL REFERENCES mascotas(id),
    servicio_id     INTEGER REFERENCES servicios(id),
    area            TEXT NOT NULL,
    fecha_hora      TEXT NOT NULL,
    duracion_min    INTEGER DEFAULT 60,
    estado          TEXT NOT NULL DEFAULT 'pendiente',
    step_index      INTEGER NOT NULL DEFAULT 0,
    notas           TEXT,
    precio_usd      REAL,
    factura_id      INTEGER,
    activo          INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_citas_turno_dia ON citas (codigo, date(fecha_hora));
CREATE INDEX IF NOT EXISTS ix_citas_fecha ON citas (fecha_hora);

CREATE TABLE IF NOT EXISTS historial_clinico (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    mascota_id      INTEGER NOT NULL REFERENCES mascotas(id),
    cita_id         INTEGER REFERENCES citas(id),
    fecha           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo          TEXT,
    diagnostico     TEXT,
    tratamiento     TEXT,
    peso_kg         REAL,
    temperatura_c   REAL,
    veterinario     TEXT,
    notas           TEXT,
    corrige_a       INTEGER,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vacunas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    mascota_id      INTEGER NOT NULL REFERENCES mascotas(id),
    nombre          TEXT NOT NULL,
    lote            TEXT,
    fecha_aplicacion TEXT NOT NULL,
    proxima_dosis   TEXT,
    veterinario     TEXT,
    notas           TEXT,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS series_factura (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo          TEXT NOT NULL UNIQUE,
    descripcion     TEXT,
    prefijo         TEXT NOT NULL,
    ultimo_numero   INTEGER NOT NULL DEFAULT 0,
    activo          INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facturas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    serie_id        INTEGER NOT NULL REFERENCES series_factura(id),
    numero          INTEGER NOT NULL,
    numero_completo TEXT NOT NULL UNIQUE,
    tutor_id        INTEGER REFERENCES tutores(id),
    mascota_id      INTEGER REFERENCES mascotas(id),
    cita_id         INTEGER REFERENCES citas(id),
    fecha_emision   TEXT,
    fecha_vencimiento TEXT,
    cliente_nombre  TEXT NOT NULL,
    cliente_rif     TEXT,
    cliente_telefono TEXT,
    cliente_email   TEXT,
    cliente_direccion TEXT,
    subtotal        REAL NOT NULL DEFAULT 0,
    descuento       REAL NOT NULL DEFAULT 0,
    base_imponible  REAL NOT NULL DEFAULT 0,
    iva_pct         REAL NOT NULL DEFAULT 16,
    iva_monto       REAL NOT NULL DEFAULT 0,
    igtf_pct        REAL NOT NULL DEFAULT 0,
    igtf_monto      REAL NOT NULL DEFAULT 0,
    total           REAL NOT NULL DEFAULT 0,
    moneda          TEXT NOT NULL DEFAULT 'USD',
    tasa_bcv        REAL,
    total_ves       REAL,
    total_letras    TEXT,
    estado          TEXT NOT NULL DEFAULT 'borrador',
    motivo_anulacion TEXT,
    anulada_por     INTEGER,
    anulada_at      TEXT,
    usuario_emisor  INTEGER,
    notas           TEXT,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_facturas_serie_numero ON facturas (serie_id, numero);
CREATE INDEX IF NOT EXISTS ix_facturas_tutor ON facturas (tutor_id);
CREATE INDEX IF NOT EXISTS ix_facturas_estado ON facturas (estado);

CREATE TABLE IF NOT EXISTS factura_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    factura_id      INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    servicio_id     INTEGER,
    producto_id     INTEGER,
    concepto        TEXT NOT NULL,
    cantidad        REAL NOT NULL DEFAULT 1,
    precio_unitario REAL NOT NULL DEFAULT 0,
    descuento_linea REAL NOT NULL DEFAULT 0,
    total_linea     REAL NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pagos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    factura_id      INTEGER NOT NULL REFERENCES facturas(id),
    metodo          TEXT NOT NULL,
    referencia      TEXT,
    monto           REAL NOT NULL,
    moneda          TEXT NOT NULL DEFAULT 'USD',
    monto_usd       REAL NOT NULL,
    tasa_aplicada   REAL,
    fecha           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id      INTEGER,
    notas           TEXT,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notas_fiscales (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo            TEXT NOT NULL,
    serie_id        INTEGER NOT NULL REFERENCES series_factura(id),
    numero          INTEGER NOT NULL,
    numero_completo TEXT NOT NULL,
    factura_id      INTEGER NOT NULL REFERENCES facturas(id),
    monto           REAL NOT NULL,
    motivo          TEXT NOT NULL,
    usuario_id      INTEGER,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT NOT NULL UNIQUE,
    nombre          TEXT,
    email           TEXT,
    password_hash   TEXT NOT NULL,
    rol             TEXT NOT NULL DEFAULT 'recepcion',
    activo          INTEGER NOT NULL DEFAULT 1,
    ultimo_acceso   TEXT,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sesiones (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash      TEXT NOT NULL UNIQUE,
    tipo            TEXT NOT NULL,
    staff_id        INTEGER,
    tutor_id        INTEGER,
    ip              TEXT,
    user_agent      TEXT,
    expira_at       TEXT NOT NULL,
    revocada        INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auditoria (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tabla           TEXT NOT NULL,
    registro_id     INTEGER,
    accion          TEXT NOT NULL,
    campo           TEXT,
    valor_anterior  TEXT,
    valor_nuevo     TEXT,
    usuario_tipo    TEXT,
    usuario_id      INTEGER,
    usuario_nombre  TEXT,
    ip              TEXT,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracion (
    clave           TEXT PRIMARY KEY,
    valor           TEXT,
    tipo            TEXT NOT NULL DEFAULT 'texto',
    descripcion     TEXT,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leia_conversaciones (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tutor_id        INTEGER,
    canal           TEXT NOT NULL DEFAULT 'web',
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leia_mensajes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    conversacion_id INTEGER NOT NULL REFERENCES leia_conversaciones(id) ON DELETE CASCADE,
    rol             TEXT NOT NULL,
    contenido       TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reportes_problema (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    pantalla        TEXT,
    accion          TEXT,
    error_mensaje   TEXT,
    error_stack     TEXT,
    user_agent      TEXT,
    url             TEXT,
    usuario_tipo    TEXT,
    usuario_id      INTEGER,
    resuelto        INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Datos mínimos
INSERT OR IGNORE INTO series_factura (codigo, descripcion, prefijo, ultimo_numero) VALUES
    ('GEN','Factura general','F-GEN',0),
    ('GRO','Grooming','F-GRO',0),
    ('CLI','Clínica','F-CLI',0),
    ('HOT','Hotel','F-HOT',0),
    ('TIE','Tienda','F-TIE',0);

INSERT OR IGNORE INTO servicios (codigo, nombre, area, precio_usd, duracion_min) VALUES
    ('SERV-GROOMING','Circuito Grooming Spa (7 Estaciones)','grooming',25.00,120),
    ('SERV-BANO','Baño Estándar Premium','grooming',12.00,60),
    ('SERV-CORTE','Corte de Raza','grooming',18.00,90),
    ('SERV-CONSULTA','Consulta Veterinaria','clinica',20.00,30),
    ('SERV-VACUNA','Vacunación','clinica',15.00,15),
    ('SERV-HOTEL','Hotel Suite Bioclimática (noche)','hotel',35.00,1440);

INSERT OR IGNORE INTO productos (codigo, nombre, categoria, precio_usd, stock, stock_minimo, barcode) VALUES
    ('PROD-101','Royal Canin Mini Adult (3kg)','Alimento',28.50,15,5,'7501092834710'),
    ('PROD-102','Champú Ozono Hipoalergénico 500ml','Higiene',18.00,24,6,'7509823412093'),
    ('PROD-103','Bravecto Perros 10-20kg','Farmacia',42.00,8,3,'7508492019482');

INSERT OR IGNORE INTO configuracion (clave, valor, tipo, descripcion) VALUES
    ('negocio.razon_social','MRS PETS CORP, C.A.','texto','Razón social para facturas'),
    ('negocio.rif','J-00000000-0','texto','RIF del negocio (EDITAR)'),
    ('negocio.direccion','Av. 4 Bella Vista, Maracaibo, Zulia','texto','Domicilio fiscal'),
    ('negocio.telefono','+58 414-0000000','texto','Teléfono del negocio'),
    ('fiscal.iva_pct','16','numero','IVA general'),
    ('fiscal.igtf_pct','3','numero','IGTF para pagos en divisas'),
    ('factura.serie_default','GEN','texto','Serie por defecto');

CREATE VIEW IF NOT EXISTS v_facturas_saldo AS
SELECT f.id,
       f.numero_completo,
       f.estado,
       f.total,
       COALESCE((SELECT SUM(p.monto_usd) FROM pagos p WHERE p.factura_id = f.id), 0) AS pagado,
       f.total - COALESCE((SELECT SUM(p.monto_usd) FROM pagos p WHERE p.factura_id = f.id), 0) AS saldo
FROM facturas f;
