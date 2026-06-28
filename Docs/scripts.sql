-- ============================================================
-- 00_extensiones.sql
-- Extensiones y configuración inicial de la base de datos
-- Proyecto: CajaCuzco — Sistema Core Bancario + Homebanking
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 01_tablas_core.sql
-- Creación de tablas principales del sistema
-- ============================================================

-- Tabla de clientes / usuarios homebanking
CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre        TEXT NOT NULL,
  dni           TEXT NOT NULL UNIQUE,
  email         TEXT,
  telefono      TEXT,
  clave         TEXT NOT NULL,
  username      TEXT,
  password_plano TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Tabla de cuentas de ahorro
CREATE TABLE IF NOT EXISTS cuentas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id  UUID REFERENCES usuarios(id),
  numero      TEXT NOT NULL UNIQUE,
  tipo        TEXT DEFAULT 'Ahorro',
  saldo       NUMERIC DEFAULT 0,
  tarjeta     TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Tabla de movimientos / transacciones
CREATE TABLE IF NOT EXISTS movimientos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id   UUID REFERENCES cuentas(id),
  descripcion TEXT,
  monto       NUMERIC NOT NULL,
  tipo        TEXT CHECK (tipo IN ('entrada', 'salida')),
  categoria   TEXT,
  fecha       TIMESTAMP DEFAULT NOW()
);

-- Tabla de tarjetas débito
CREATE TABLE IF NOT EXISTS tarjetas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id  UUID REFERENCES usuarios(id),
  numero      TEXT NOT NULL,
  tipo        TEXT DEFAULT 'débito',
  estado      TEXT DEFAULT 'activa',
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Tabla de préstamos
CREATE TABLE IF NOT EXISTS prestamos (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id       UUID REFERENCES usuarios(id),
  nombre           TEXT,
  dni              TEXT,
  monto            NUMERIC NOT NULL,
  plazo            INTEGER NOT NULL,
  ingresos         NUMERIC,
  gastos           NUMERIC,
  garantia         TEXT,
  asesor           TEXT,
  scoring          INTEGER DEFAULT 0,
  estado           TEXT DEFAULT 'pendiente',
  observaciones    TEXT,
  dias_mora        INTEGER DEFAULT 0,
  banda_mora       TEXT DEFAULT 'al_dia',
  fecha_desembolso TIMESTAMP,
  fecha_judicial   TIMESTAMP,
  fecha_castigo    TIMESTAMP,
  aprobado_por     TEXT,
  aprobado_rol     TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- Tabla de créditos
CREATE TABLE IF NOT EXISTS creditos (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id    UUID REFERENCES usuarios(id),
  nombre        TEXT,
  dni           TEXT,
  monto         NUMERIC NOT NULL,
  plazo         INTEGER NOT NULL,
  ingresos      NUMERIC,
  gastos        NUMERIC,
  garantia      TEXT,
  asesor        TEXT,
  scoring       INTEGER DEFAULT 0,
  estado        TEXT DEFAULT 'pendiente',
  observaciones TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 02_tablas_admin.sql
-- Tablas del Core Financiero (personal administrativo)
-- ============================================================

-- Tabla de usuarios administrativos
CREATE TABLE IF NOT EXISTS admin_usuarios (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numerodni  TEXT NOT NULL,
  nombre     TEXT NOT NULL,
  cargo      TEXT NOT NULL,
  rol        TEXT NOT NULL CHECK (rol IN ('asesor', 'administrador', 'jefe_regional', 'riesgos')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de gestiones de cobranza (mora R2)
CREATE TABLE IF NOT EXISTS gestiones_mora (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prestamo_id    UUID REFERENCES prestamos(id),
  fecha          TIMESTAMP DEFAULT NOW(),
  tipo_gestion   TEXT NOT NULL,
  resultado      TEXT NOT NULL,
  observaciones  TEXT,
  gestionado_por TEXT,
  gestionado_rol TEXT
);

-- Deshabilitar RLS para desarrollo
ALTER TABLE usuarios       DISABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas        DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos    DISABLE ROW LEVEL SECURITY;
ALTER TABLE tarjetas       DISABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos      DISABLE ROW LEVEL SECURITY;
ALTER TABLE creditos       DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE gestiones_mora DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- 03_datos_admin.sql
-- Datos iniciales del personal administrativo
-- ============================================================

INSERT INTO admin_usuarios (numerodni, nombre, cargo, rol) VALUES
  ('10000001', 'Carlos Mendoza', 'Asesor de Créditos',  'asesor'),
  ('10000002', 'Maria Torres',   'Administrador',        'administrador'),
  ('10000003', 'Pedro Huanca',   'Jefe Regional',        'jefe_regional'),
  ('10000004', 'Ana Quispe',     'Analista de Riesgos',  'riesgos')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 04_datos_clientes.sql
-- Datos de clientes y cuentas (30 usuarios de prueba)
-- ============================================================

INSERT INTO usuarios (id, nombre, dni, email, telefono, clave, username, password_plano) VALUES
(gen_random_uuid(), 'Jair Limas Chagua',       '123456789', 'jair@email.com',              '+51 987 654 321', '300806', 'cli000001', '300806'),
(gen_random_uuid(), 'Castor Perez',             '111111',    'perez@caja.com',              '+51 987 654 322', '300806', 'cli000002', '300806'),
(gen_random_uuid(), 'Ana Quispe Huanca',        '40000001',  'ana.quispe@cajacusco.com',    '+51 984 111 001', '123456', 'cli000003', '123456'),
(gen_random_uuid(), 'Carlos Mamani Ticona',     '40000002',  'carlos.mamani@cajacusco.com', '+51 984 111 002', '123456', 'cli000004', '123456'),
(gen_random_uuid(), 'Maria Flores Condori',     '40000003',  'maria.flores@cajacusco.com',  '+51 984 111 003', '123456', 'cli000005', '123456'),
(gen_random_uuid(), 'Pedro Ccallo Huillca',     '40000004',  'pedro.ccallo@cajacusco.com',  '+51 984 111 004', '123456', 'cli000006', '123456'),
(gen_random_uuid(), 'Rosa Ttito Apaza',         '40000005',  'rosa.ttito@cajacusco.com',    '+51 984 111 005', '123456', 'cli000007', '123456'),
(gen_random_uuid(), 'Luis Hancco Vargas',       '40000006',  'luis.hancco@cajacusco.com',   '+51 984 111 006', '123456', 'cli000008', '123456'),
(gen_random_uuid(), 'Elena Puma Ccorimanya',    '40000007',  'elena.puma@cajacusco.com',    '+51 984 111 007', '123456', 'cli000009', '123456'),
(gen_random_uuid(), 'Jorge Huanca Quispe',      '40000008',  'jorge.huanca@cajacusco.com',  '+51 984 111 008', '123456', 'cli000010', '123456'),
(gen_random_uuid(), 'Sofia Cusi Ramos',         '40000009',  'sofia.cusi@cajacusco.com',    '+51 984 111 009', '123456', 'cli000011', '123456'),
(gen_random_uuid(), 'David Atauchi Medina',     '40000010',  'david.atauchi@cajacusco.com', '+51 984 111 010', '123456', 'cli000012', '123456'),
(gen_random_uuid(), 'Carmen Huallpa Ttito',     '40000011',  'carmen.huallpa@cajacusco.com','+51 984 111 011', '123456', 'cli000013', '123456'),
(gen_random_uuid(), 'Miguel Sutta Ccori',       '40000012',  'miguel.sutta@cajacusco.com',  '+51 984 111 012', '123456', 'cli000014', '123456'),
(gen_random_uuid(), 'Lucia Anco Hancco',        '40000013',  'lucia.anco@cajacusco.com',    '+51 984 111 013', '123456', 'cli000015', '123456'),
(gen_random_uuid(), 'Roberto Cjuno Apaza',      '40000014',  'roberto.cjuno@cajacusco.com', '+51 984 111 014', '123456', 'cli000016', '123456'),
(gen_random_uuid(), 'Patricia Quispe Ccopa',    '40000015',  'patricia.quispe@cajacusco.com','+51 984 111 015','123456', 'cli000017', '123456'),
(gen_random_uuid(), 'Fernando Chura Mamani',    '40000016',  'fernando.chura@cajacusco.com', '+51 984 111 016','123456', 'cli000018', '123456'),
(gen_random_uuid(), 'Gladys Yucra Condori',     '40000017',  'gladys.yucra@cajacusco.com',  '+51 984 111 017','123456', 'cli000019', '123456'),
(gen_random_uuid(), 'Hector Catacora Flores',   '40000018',  'hector.catacora@cajacusco.com','+51 984 111 018','123456','cli000020', '123456'),
(gen_random_uuid(), 'Isabel Turpo Huanca',      '40000019',  'isabel.turpo@cajacusco.com',  '+51 984 111 019','123456', 'cli000021', '123456'),
(gen_random_uuid(), 'Juan Ccama Quispe',        '40000020',  'juan.ccama@cajacusco.com',    '+51 984 111 020','123456', 'cli000022', '123456'),
(gen_random_uuid(), 'Kelly Pillco Ramos',       '40000021',  'kelly.pillco@cajacusco.com',  '+51 984 111 021','123456', 'cli000023', '123456'),
(gen_random_uuid(), 'Leonardo Quispe Puma',     '40000022',  'leonardo.quispe@cajacusco.com','+51 984 111 022','123456','cli000024', '123456'),
(gen_random_uuid(), 'Martha Ccari Huillca',     '40000023',  'martha.ccari@cajacusco.com',  '+51 984 111 023','123456', 'cli000025', '123456'),
(gen_random_uuid(), 'Nicolas Soncco Apaza',     '40000024',  'nicolas.soncco@cajacusco.com','+51 984 111 024','123456', 'cli000026', '123456'),
(gen_random_uuid(), 'Olga Mamani Vargas',       '40000025',  'olga.mamani@cajacusco.com',   '+51 984 111 025','123456', 'cli000027', '123456'),
(gen_random_uuid(), 'Pablo Huanca Ccorimanya',  '40000026',  'pablo.huanca@cajacusco.com',  '+51 984 111 026','123456', 'cli000028', '123456'),
(gen_random_uuid(), 'Quenia Ramos Ttito',       '40000027',  'quenia.ramos@cajacusco.com',  '+51 984 111 027','123456', 'cli000029', '123456'),
(gen_random_uuid(), 'Raul Condori Quispe',      '40000028',  'raul.condori@cajacusco.com',  '+51 984 111 028','123456', 'cli000030', '123456')
ON CONFLICT (dni) DO NOTHING;


-- ============================================================
-- 05_datos_cuentas.sql
-- Cuentas de ahorro para los 30 clientes
-- ============================================================

INSERT INTO cuentas (id, usuario_id, numero, tipo, saldo)
SELECT
  gen_random_uuid(),
  u.id,
  '4821' || LPAD((ROW_NUMBER() OVER (ORDER BY u.username))::TEXT, 12, '0'),
  'Ahorro',
  (ARRAY[12000,1000,1500,2000,3500,5000,8000,1200,4500,6700,
         2300,9800,3100,7200,4800,1900,6300,2700,5500,8900,
         3300,4100,7600,2100,9200,1800,5100,6800,3700,4300
  ])[ROW_NUMBER() OVER (ORDER BY u.username)]
FROM usuarios u
WHERE u.username IS NOT NULL
ON CONFLICT (numero) DO NOTHING;


-- ============================================================
-- 06_datos_prestamos_mora.sql
-- Préstamos de ejemplo con distintos niveles de mora
-- para demostrar R1·R2·R3
-- ============================================================

INSERT INTO prestamos (usuario_id, nombre, dni, monto, plazo, ingresos, gastos, garantia, asesor, scoring, estado, dias_mora, banda_mora)
SELECT
  u.id,
  u.nombre,
  u.dni,
  monto, plazo, ingresos, gastos, garantia, 'Carlos Mendoza', scoring, 'desembolsado', dias_mora,
  CASE
    WHEN dias_mora = 0    THEN 'al_dia'
    WHEN dias_mora <= 8   THEN 'preventiva'
    WHEN dias_mora <= 30  THEN 'temprana'
    WHEN dias_mora <= 90  THEN 'tardia'
    WHEN dias_mora <= 120 THEN 'pre_judicial'
    WHEN dias_mora <= 180 THEN 'judicial'
    ELSE 'castigo'
  END
FROM usuarios u
JOIN (VALUES
  ('40000001', 15000, 24, 3500, 800,  'Inmueble',  82, 0),
  ('40000002', 8000,  18, 2800, 600,  'Vehículo',  75, 15),
  ('40000003', 25000, 36, 5000, 1200, 'Inmueble',  88, 45),
  ('40000004', 3000,  12, 1800, 400,  'Sin garantía', 65, 95),
  ('40000005', 50000, 48, 8000, 2000, 'Inmueble',  91, 130),
  ('40000006', 12000, 24, 3200, 700,  'Vehículo',  78, 200),
  ('40000007', 6000,  18, 2200, 500,  'Sin garantía', 70, 0),
  ('40000008', 35000, 36, 7000, 1500, 'Inmueble',  85, 60)
) AS datos(dni, monto, plazo, ingresos, gastos, garantia, scoring, dias_mora)
ON u.dni = datos.dni;


-- ============================================================
-- 07_verificacion.sql
-- Consultas de verificación del sistema completo
-- ============================================================

-- Verificar usuarios y cuentas (equivalente al script del profesor)
SELECT
  u.username       AS usuario,
  u.password_plano AS contrasena,
  u.dni            AS dni,
  u.nombre         AS nombre,
  c.numero         AS tarjeta,
  c.saldo          AS saldo
FROM usuarios u
JOIN cuentas c ON c.usuario_id = u.id
ORDER BY u.username;

-- Verificar personal administrativo
SELECT numerodni, nombre, cargo, rol FROM admin_usuarios ORDER BY rol;

-- Verificar préstamos por banda de mora
SELECT
  nombre,
  monto,
  dias_mora,
  banda_mora,
  estado
FROM prestamos
ORDER BY dias_mora DESC;

-- KPIs de mora
SELECT
  COUNT(*) FILTER (WHERE dias_mora = 0)              AS al_dia,
  COUNT(*) FILTER (WHERE dias_mora BETWEEN 1 AND 8)  AS preventiva,
  COUNT(*) FILTER (WHERE dias_mora BETWEEN 9 AND 30) AS temprana,
  COUNT(*) FILTER (WHERE dias_mora BETWEEN 31 AND 90)AS tardia,
  COUNT(*) FILTER (WHERE dias_mora > 90)             AS judicial_castigo,
  ROUND(COUNT(*) FILTER (WHERE dias_mora > 0)::NUMERIC / NULLIF(COUNT(*),0) * 100, 1) AS ratio_mora_pct
FROM prestamos
WHERE estado IN ('desembolsado','judicial','castigado');