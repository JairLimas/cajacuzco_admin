# Caja Cusco — Core Financiero (Admin)

Sistema de gestión financiera para el personal de Caja Cusco. Permite administrar solicitudes de préstamos y créditos, gestionar usuarios, evaluar elegibilidad, resolver comités y gestionar cartera morosa.

## Stack tecnológico

- **Frontend:** React 18 + Vite
- **Estilos:** Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Roles por localStorage (DNI como usuario y contraseña)

## Estructura del proyecto

```
src/
├── components/
│   ├── Layout.jsx          # Estructura principal con header de sesión
│   └── Sidebar.jsx         # Navegación lateral por rol
├── pages/
│   ├── Login.jsx           # Autenticación con roles
│   ├── Dashboard.jsx       # KPIs y resumen general
│   ├── Usuarios.jsx        # CRUD completo de clientes
│   ├── Bandeja.jsx         # Bandeja de préstamos
│   ├── BandejaCreditos.jsx # Bandeja de créditos
│   ├── PreSolicitud.jsx    # Elegibilidad + scoring + RDS semáforo
│   ├── Registro.jsx        # Registro de solicitud
│   ├── Comite.jsx          # Resolución de comité con umbrales por rol
│   ├── Desembolso.jsx      # Desembolso con cronograma de pagos
│   └── BandejaMora.jsx     # Gestión de cartera morosa R1·R2·R3
├── supabase.js             # Cliente Supabase
└── App.jsx                 # Rutas protegidas con control de roles
```

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## Variables de entorno

Crear archivo `.env` en la raíz:

```
VITE_SUPABASE_URL=https://ykupntvwlltppfyjyxwh.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Credenciales de acceso

| DNI      | Contraseña | Nombre         | Rol               |
|----------|------------|----------------|-------------------|
| 10000001 | 10000001   | Carlos Mendoza | Asesor            |
| 10000002 | 10000002   | Maria Torres   | Administrador     |
| 10000003 | 10000003   | Pedro Huanca   | Jefe Regional     |
| 10000004 | 10000004   | Ana Quispe     | Comité de Riesgos |

## Matriz de permisos por rol

| Módulo            | Asesor | Administrador | Jefe Regional | Riesgos |
|-------------------|--------|---------------|---------------|---------|
| Dashboard         | ✅     | ✅            | ✅            | ✅      |
| Bandeja           | ✅     | ✅            | ✅            | ✅      |
| Pre-solicitud     | ✅     | ✅            | ✅            | ✅      |
| Registro          | ✅     | ✅            | ✅            | ✅      |
| Comité            | ✅     | ✅            | ✅            | ✅      |
| Desembolso        | ❌     | ✅            | ✅            | ✅      |
| Bandeja Mora      | ❌     | ✅            | ✅            | ✅      |
| Usuarios (CRUD)   | ❌     | ✅            | ❌            | ❌      |

## Umbrales de aprobación por monto

| Monto                  | Nivel requerido   |
|------------------------|-------------------|
| Hasta S/ 5,000         | Asesor            |
| S/ 5,001 – S/ 20,000   | Administrador     |
| S/ 20,001 – S/ 50,000  | Jefe Regional     |
| Mayor a S/ 50,000      | Comité de Riesgos |

## Módulo de Mora — Bandas normativas

| Banda        | Días de mora  | Acción                        |
|--------------|---------------|-------------------------------|
| Preventiva   | 1 – 8 días    | Llamada preventiva            |
| Temprana     | 9 – 30 días   | Gestión telefónica            |
| Tardía       | 31 – 90 días  | Visita domiciliaria           |
| Pre-judicial | 91 – 120 días | Carta notarial                |
| Judicial     | ≥ 121 días    | Derivación judicial           |
| Castigo      | > 180 días    | Castigo contable (solo Riesgos)|

## Tablas Supabase utilizadas

| Tabla            | Descripción                              |
|------------------|------------------------------------------|
| `usuarios`       | Clientes del banco                       |
| `cuentas`        | Cuentas de ahorro                        |
| `movimientos`    | Historial de transacciones               |
| `tarjetas`       | Tarjetas débito                          |
| `prestamos`      | Solicitudes y estado de préstamos        |
| `creditos`       | Solicitudes y estado de créditos         |
| `admin_usuarios` | Personal autorizado del Core Financiero  |
| `gestiones_mora` | Historial de gestiones de cobranza       |

## Flujo del crédito

```
Pre-solicitud (elegibilidad + scoring + RDS)
    ↓
Registro de solicitud
    ↓
Bandeja (revisión del asesor)
    ↓
Comité (resolución según rol y monto)
    ↓
Desembolso (cronograma de pagos generado)
    ↓
Seguimiento en Bandeja de Mora (R1·R2·R3)
```

## Reglas de negocio implementadas

- **Elegibilidad:** Edad 18–70, ingresos mínimos, sin deudas vencidas
- **Scoring:** Calculado sobre historial, ingresos, garantía y plazo (0–100)
- **RDS:** Ratio Deuda/Salario con semáforo (verde ≤20%, amarillo ≤30%, rojo >30%)
- **Comité:** Bloqueo automático si el rol no alcanza el umbral del monto
- **Mora R2:** Registro de gestiones (llamada, visita, carta notarial, acuerdo)
- **Mora R3:** Transición a judicial (≥121 días) y castigo contable (>180 días)