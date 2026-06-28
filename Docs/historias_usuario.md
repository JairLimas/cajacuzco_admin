# Historias de Usuario — Sistema CajaCuzco
## Core Financiero + Homebanking

---

## ÉPICA 1 — Autenticación y Control de Acceso

### HU-01: Login del cliente (Homebanking)
**Como** cliente de Caja Cusco  
**Quiero** iniciar sesión con mi número de tarjeta, DNI y clave  
**Para** acceder a mis cuentas de forma segura

**Criterios de aceptación:**
- El sistema valida número de tarjeta existente en BD
- El DNI debe coincidir con el titular de la cuenta
- La clave de 6 dígitos debe ser correcta
- Se incluye captcha para evitar ataques automatizados
- Sesión almacenada en localStorage con usuario_id y cuenta_id
- Sin sesión válida, redirige al login automáticamente

---

### HU-02: Login del personal administrativo (Core)
**Como** personal autorizado de Caja Cusco  
**Quiero** iniciar sesión con mi DNI y contraseña  
**Para** acceder al Core Financiero según mi rol

**Criterios de aceptación:**
- El sistema valida DNI en tabla admin_usuarios
- La contraseña es el mismo DNI del usuario
- El rol se guarda en localStorage (asesor/administrador/jefe_regional/riesgos)
- El nombre y cargo se muestran en el header
- Rutas protegidas según rol (RolRoute)

---

### HU-03: Control de acceso por rol
**Como** administrador del sistema  
**Quiero** que cada rol solo acceda a las secciones permitidas  
**Para** garantizar la seguridad y segregación de funciones

**Criterios de aceptación:**
- Asesor: no puede acceder a Desembolso, Mora ni Usuarios
- Administrador: acceso completo excepto acciones de Riesgos
- Jefe Regional: puede aprobar hasta S/ 50,000
- Riesgos: acceso total, único que puede castigar créditos
- Acceso no autorizado muestra pantalla 🔒 con mensaje explicativo

---

## ÉPICA 2 — Gestión de Cuentas (Homebanking)

### HU-04: Consulta de saldo y movimientos
**Como** cliente  
**Quiero** ver mi saldo actual y el historial de movimientos  
**Para** controlar mis finanzas personales

**Criterios de aceptación:**
- Dashboard muestra saldo actualizado en tiempo real
- Lista de últimos 10 movimientos con fecha, descripción y monto
- Diferencia visual entre entradas (verde) y salidas (rojo)

---

### HU-05: Transferencias entre cuentas
**Como** cliente  
**Quiero** transferir dinero a otra cuenta  
**Para** realizar pagos sin ir a la agencia

**Criterios de aceptación:**
- Validar que el número de cuenta destino exista
- Validar saldo suficiente antes de procesar
- Registrar movimiento de salida en cuenta origen
- Registrar movimiento de entrada en cuenta destino
- Actualizar saldos en tiempo real

---

### HU-06: Solicitud de préstamo desde homebanking
**Como** cliente  
**Quiero** solicitar un préstamo desde la app  
**Para** acceder a financiamiento sin ir a la agencia

**Criterios de aceptación:**
- Formulario con monto, plazo, ingresos y propósito
- La solicitud aparece en la Bandeja del Core Financiero
- El cliente puede ver el estado de su solicitud
- Al aprobarse y desembolsarse, el saldo se actualiza automáticamente

---

## ÉPICA 3 — Evaluación Crediticia (Core Financiero)

### HU-07: Pre-solicitud y elegibilidad
**Como** asesor de créditos  
**Quiero** evaluar si un cliente es sujeto de crédito  
**Para** filtrar solicitudes inelegibles antes de procesarlas

**Criterios de aceptación:**
- Validar edad entre 18 y 70 años
- Validar ingresos mínimos requeridos
- Verificar que no tenga deudas vencidas
- Calcular scoring crediticio (0–100)
- Mostrar semáforo RDS (Ratio Deuda/Salario):
  - Verde: RDS ≤ 20%
  - Amarillo: RDS ≤ 30%
  - Rojo: RDS > 30%

---

### HU-08: Resolución del comité con umbrales por monto
**Como** personal autorizado  
**Quiero** aprobar o rechazar solicitudes según mi nivel de autorización  
**Para** cumplir con la normativa de aprobación por montos

**Criterios de aceptación:**
- Hasta S/ 5,000: puede aprobar el Asesor
- S/ 5,001 – S/ 20,000: requiere Administrador
- S/ 20,001 – S/ 50,000: requiere Jefe Regional
- Mayor a S/ 50,000: requiere Comité de Riesgos
- Si el rol no alcanza, los botones de decisión se bloquean (🔒)
- La resolución registra quién aprobó y con qué rol

---

### HU-09: Desembolso con cronograma de pagos
**Como** administrador  
**Quiero** desembolsar un crédito aprobado  
**Para** acreditar el monto al cliente y generar su cronograma

**Criterios de aceptación:**
- Solo créditos en estado "aprobado" pueden desembolsarse
- El monto se acredita a la cuenta del cliente
- Se registra movimiento de entrada en historial
- Se genera cronograma de cuotas con fecha y monto por mes
- El estado cambia a "desembolsado"

---

## ÉPICA 4 — Gestión de Mora (Core Financiero)

### HU-10: Consulta de cartera morosa por bandas (R1)
**Como** gestor de cobranza  
**Quiero** visualizar los créditos vencidos clasificados por banda  
**Para** priorizar las acciones de recuperación

**Criterios de aceptación:**
- Bandas: Preventiva (1–8d), Temprana (9–30d), Tardía (31–90d), Pre-judicial (91–120d), Judicial (121–180d), Castigo (>180d)
- KPIs: total cartera, en mora, ratio de mora, monto en riesgo
- Contador de créditos por cada banda
- Filtro por banda activo

---

### HU-11: Registro de gestiones de cobranza (R2)
**Como** gestor de cobranza  
**Quiero** registrar cada gestión realizada sobre un crédito moroso  
**Para** mantener un historial de acciones de recuperación

**Criterios de aceptación:**
- Tipos de gestión: llamada telefónica, visita domiciliaria, carta notarial, acuerdo de pago, refinanciamiento
- Resultado: contactado con promesa, sin compromiso, no contactado, pago parcial, pago total
- Historial visible con fecha, tipo, resultado y responsable
- Cada gestión registra quién la realizó y con qué rol

---

### HU-12: Transición a judicial y castigo contable (R3)
**Como** jefe regional o analista de riesgos  
**Quiero** derivar créditos a cobranza judicial o castigarlos  
**Para** gestionar la cartera irrecuperable según normativa

**Criterios de aceptación:**
- Derivación judicial disponible solo si días_mora ≥ 121
- Solo jefe_regional, administrador o riesgos pueden derivar a judicial
- Castigo contable disponible solo si días_mora > 180
- Solo el rol "riesgos" puede registrar el castigo
- Ambas acciones se registran automáticamente en gestiones_mora
- El estado del préstamo cambia a "judicial" o "castigado"

---

## Resumen de Historias

| ID    | Historia                        | Épica         | Actor principal    |
|-------|---------------------------------|---------------|--------------------|
| HU-01 | Login cliente homebanking       | Autenticación | Cliente            |
| HU-02 | Login personal admin            | Autenticación | Personal admin     |
| HU-03 | Control de acceso por rol       | Autenticación | Administrador      |
| HU-04 | Consulta saldo y movimientos    | Cuentas       | Cliente            |
| HU-05 | Transferencias                  | Cuentas       | Cliente            |
| HU-06 | Solicitud préstamo homebanking  | Cuentas       | Cliente            |
| HU-07 | Pre-solicitud y elegibilidad    | Crédito       | Asesor             |
| HU-08 | Comité con umbrales por monto   | Crédito       | Comité             |
| HU-09 | Desembolso con cronograma       | Crédito       | Administrador      |
| HU-10 | Cartera morosa por bandas (R1)  | Mora          | Gestor cobranza    |
| HU-11 | Registro de gestiones (R2)      | Mora          | Gestor cobranza    |
| HU-12 | Judicial y castigo (R3)         | Mora          | Jefe / Riesgos     |