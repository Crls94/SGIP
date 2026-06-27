# Casos de prueba RF/RNF - SGIP

Documento base para la demostracion de pruebas del proyecto SGIP. Los casos se trazan contra los RF/RNF definidos en `Avance3/Avance3_VF.docx` y se organizan usando los 8 tipos de pruebas vistos en clase.

## Criterio de seleccion

- Se priorizan los RF/RNF mas importantes para la operacion de Metro Ica.
- Se definen 2 casos por cada tipo de prueba, para un total base de 16 casos.
- Se agrega un caso adicional de seguridad predespliegue para validar rate limit en autenticacion.
- Los casos automatizables se complementan con pruebas JUnit en `src/test/java`.
- Los casos no automatizables directamente con JUnit quedan documentados para ejecucion manual o con herramientas especializadas.

## Matriz resumida

| Tipo de prueba | Caso 1 | Caso 2 |
|---|---|---|
| Unitaria | TC-UNIT-001 RF-01 Login correcto | TC-UNIT-002 RF-02 SKU duplicado |
| Integracion | TC-INT-001 RF-05 Pedido descuenta stock | TC-INT-002 RF-03 Movimiento genera alerta |
| Funcional | TC-FUN-001 RF-03 Entrada de stock | TC-FUN-002 RF-09 Reporte inventario Excel |
| Rendimiento | TC-REN-001 RNF Rendimiento consulta inventario | TC-REN-002 RNF Rendimiento generacion reporte |
| Seguridad | TC-SEG-001 RNF Seguridad password BCrypt | TC-SEG-002 RNF Seguridad token invalido / TC-SEG-003 Rate limit login |
| Aceptacion | TC-ACE-001 RF-06 Cola priorizada | TC-ACE-002 RF-08 Dashboard gerencial |
| Regresion | TC-REG-001 RF-05 Cancelar pedido no duplica stock | TC-REG-002 RF-09 Rechazar formato no soportado |
| Humo | TC-HUMO-001 Carga contexto backend | TC-HUMO-002 Conexion base de datos |

## Casos detallados

| Campo | Descripcion |
|---|---|
| ID | TC-UNIT-001 |
| Tipo | Prueba unitaria |
| Requisito asociado | RF-01 Autenticacion / RNF Seguridad |
| Nombre | Login correcto genera token JWT |
| Precondiciones | Usuario activo registrado con contrasena cifrada en BCrypt. |
| Datos de prueba | Email: `admin@metroica.com`, password: `admin123`, rol: `ADMINISTRADOR`. |
| Pasos | 1. Preparar usuario activo. 2. Ejecutar login. 3. Validar token y rol devuelto. |
| Resultado esperado | El sistema devuelve token JWT y rol correcto. |
| Automatizacion | `AuthServiceTest.loginCorrectoGeneraToken` |

| Campo | Descripcion |
|---|---|
| ID | TC-UNIT-002 |
| Tipo | Prueba unitaria |
| Requisito asociado | RF-02 Gestion de Productos |
| Nombre | Registro de producto rechaza SKU duplicado |
| Precondiciones | Existe un producto registrado con el SKU solicitado. |
| Datos de prueba | SKU: `SKU-001`, nombre: `Arroz Extra`. |
| Pasos | 1. Preparar DTO de producto. 2. Simular SKU existente. 3. Intentar crear producto. |
| Resultado esperado | El sistema rechaza la operacion y no guarda el producto. |
| Automatizacion | `ProductoServiceTest.crearProductoRechazaSkuDuplicado` |

| Campo | Descripcion |
|---|---|
| ID | TC-INT-001 |
| Tipo | Prueba de integracion |
| Requisito asociado | RF-05 Gestion de Pedidos / RF-03 Control de Stock / RNF Integridad de datos |
| Nombre | Pedido delivery descuenta stock y registra salida |
| Precondiciones | Usuario autenticado y producto con stock suficiente. |
| Datos de prueba | Producto: `Leche Gloria`, stock: 10, cantidad pedida: 3, canal: `DELIVERY`. |
| Pasos | 1. Crear pedido con item valido. 2. Validar prioridad delivery. 3. Verificar descuento de stock y movimiento. |
| Resultado esperado | El pedido se registra, el stock baja a 7 y se registra movimiento de salida. |
| Automatizacion | `PedidoServiceTest.crearPedidoDeliveryAsignaPrioridadAltaYDescuentaStock` |

| Campo | Descripcion |
|---|---|
| ID | TC-INT-002 |
| Tipo | Prueba de integracion |
| Requisito asociado | RF-04 Alertas de Stock Critico / RF-03 Control de Stock |
| Nombre | Movimiento genera alerta si stock llega al punto de pedido |
| Precondiciones | Producto activo con punto de pedido configurado y sin alerta activa. |
| Datos de prueba | Stock despues: 2, punto de pedido: 3. |
| Pasos | 1. Ejecutar verificacion de stock. 2. Validar creacion de alerta. 3. Validar notificacion a administrador. |
| Resultado esperado | Se crea alerta activa y notificacion de stock critico. |
| Automatizacion | `MovimientoServiceTest.verificarAlertaStockGeneraAlertaYNotificacionCuandoStockEsCritico` |

| Campo | Descripcion |
|---|---|
| ID | TC-FUN-001 |
| Tipo | Prueba funcional |
| Requisito asociado | RF-03 Control de Stock |
| Nombre | Entrada de mercaderia actualiza inventario |
| Precondiciones | Usuario operario autenticado y producto existente. |
| Datos de prueba | Stock inicial: 5, entrada: 3. |
| Pasos | 1. Registrar movimiento de entrada. 2. Verificar stock final. 3. Verificar registro de movimiento. |
| Resultado esperado | El stock cambia de 5 a 8 y queda registrado el movimiento. |
| Automatizacion | `MovimientoServiceTest.registrarMovimientoRealEntradaActualizaStockYGuardaMovimiento` |

| Campo | Descripcion |
|---|---|
| ID | TC-FUN-002 |
| Tipo | Prueba funcional |
| Requisito asociado | RF-09 Reportes Exportables |
| Nombre | Generar reporte de inventario en Excel |
| Precondiciones | Usuario administrador autenticado y productos registrados. |
| Datos de prueba | Formato: `xlsx`, producto: `Arroz Extra`. |
| Pasos | 1. Solicitar reporte de inventario. 2. Validar contenido generado. |
| Resultado esperado | El sistema devuelve un archivo Excel con contenido. |
| Automatizacion | `ReporteServiceTest.generarReporteInventarioExcelDevuelveContenido` |

| Campo | Descripcion |
|---|---|
| ID | TC-REN-001 |
| Tipo | Prueba de rendimiento |
| Requisito asociado | RNF Rendimiento |
| Nombre | Consulta de inventario responde antes de 5 segundos |
| Precondiciones | Backend activo y base de datos disponible. |
| Datos de prueba | Endpoint de inventario con paginacion normal. |
| Pasos | 1. Ejecutar consulta de inventario. 2. Medir tiempo de respuesta. |
| Resultado esperado | La respuesta no supera los 5 segundos en condiciones normales. |
| Automatizacion | JMeter con login JWT y header `Authorization: Bearer ${token}`. |

| Campo | Descripcion |
|---|---|
| ID | TC-REN-002 |
| Tipo | Prueba de rendimiento |
| Requisito asociado | RNF Rendimiento / RF-09 Reportes Exportables |
| Nombre | Generacion de reporte responde antes de 5 segundos |
| Precondiciones | Usuario administrador autenticado y datos de inventario cargados. |
| Datos de prueba | Reporte inventario `xlsx`. |
| Pasos | 1. Solicitar reporte. 2. Medir tiempo total de generacion. |
| Resultado esperado | El reporte se genera en menos de 5 segundos en condiciones normales. |
| Automatizacion | JMeter con login JWT y generacion de `/api/v1/reportes/inventario?formato=xlsx`. |

| Campo | Descripcion |
|---|---|
| ID | TC-SEG-001 |
| Tipo | Prueba de seguridad |
| Requisito asociado | RNF Seguridad / RF-01 Autenticacion |
| Nombre | Registro guarda password cifrado con BCrypt |
| Precondiciones | Email no registrado. |
| Datos de prueba | Email: `carlos@metroica.pe`, password: `segura123`. |
| Pasos | 1. Registrar usuario. 2. Capturar entidad guardada. 3. Validar que el hash coincida con BCrypt. |
| Resultado esperado | La contrasena no se guarda en texto plano y BCrypt la valida correctamente. |
| Automatizacion | `AuthServiceTest.registerGuardaPasswordCifrado` |

| Campo | Descripcion |
|---|---|
| ID | TC-SEG-002 |
| Tipo | Prueba de seguridad |
| Requisito asociado | RNF Seguridad / RF-01 Autenticacion |
| Nombre | Token JWT invalido es rechazado |
| Precondiciones | Servicio JWT inicializado. |
| Datos de prueba | Token: `token.falso.invalido`, token vacio y token nulo. |
| Pasos | 1. Validar token invalido. 2. Validar token vacio. 3. Validar token nulo. |
| Resultado esperado | El sistema marca todos los tokens como invalidos. |
| Automatizacion | `JwtUtilTest.tokenInvalidoDebeRetornarFalse` |

| Campo | Descripcion |
|---|---|
| ID | TC-SEG-003 |
| Tipo | Prueba de seguridad |
| Requisito asociado | RNF Seguridad / RNF Disponibilidad |
| Nombre | Rate limit bloquea exceso de intentos de login |
| Precondiciones | Backend activo y solicitudes realizadas desde la misma IP de prueba. |
| Datos de prueba | Endpoint: `POST /api/v1/auth/login`, mas de 10 intentos en menos de un minuto. |
| Pasos | 1. Enviar 10 solicitudes de login. 2. Enviar una solicitud adicional dentro del mismo minuto. 3. Validar codigo HTTP. |
| Resultado esperado | El sistema responde `429 Too Many Requests` para proteger contra fuerza bruta o abuso. |
| Automatizacion | `RateLimitInterceptorTest.loginDebeBloquearDespuesDelLimitePorIp` y escenario JMeter de abuso controlado. |

| Campo | Descripcion |
|---|---|
| ID | TC-ACE-001 |
| Tipo | Prueba de aceptacion |
| Requisito asociado | RF-06 Cola de Pedidos Priorizada |
| Nombre | Cola muestra delivery antes que local segun prioridad operativa |
| Precondiciones | Existen pedidos pendientes locales y delivery. |
| Datos de prueba | Pedido delivery prioridad 3 y pedido local prioridad 5. |
| Pasos | 1. Consultar cola de pedidos. 2. Validar orden recibido. |
| Resultado esperado | El pedido delivery aparece antes que el local. |
| Automatizacion | `PedidoServiceTest.verColaPedidosRespetaOrdenPriorizadoDelRepositorio` |

| Campo | Descripcion |
|---|---|
| ID | TC-ACE-002 |
| Tipo | Prueba de aceptacion |
| Requisito asociado | RF-08 Dashboard Gerencial |
| Nombre | Dashboard muestra metricas clave para gerencia |
| Precondiciones | Usuario administrador o gerente autenticado. |
| Datos de prueba | Productos con stock critico, pedidos en cola y predicciones existentes. |
| Pasos | 1. Ingresar al dashboard. 2. Validar metricas principales. |
| Resultado esperado | Se visualizan productos criticos, pedidos en cola y datos de prediccion. |
| Automatizacion | Manual o prueba de controller/frontend. |

| Campo | Descripcion |
|---|---|
| ID | TC-REG-001 |
| Tipo | Prueba de regresion |
| Requisito asociado | RF-05 Gestion de Pedidos / RNF Integridad de datos |
| Nombre | Cancelar pedido ya cancelado no restaura stock nuevamente |
| Precondiciones | Pedido ya se encuentra en estado `CANCELADO`. |
| Datos de prueba | Pedido cancelado sin detalles activos. |
| Pasos | 1. Solicitar cambio a `CANCELADO`. 2. Verificar que no se duplique reposicion. |
| Resultado esperado | No se modifica stock ni se registran movimientos adicionales. |
| Automatizacion | `PedidoServiceTest.actualizarEstadoNoRestauraStockSiPedidoYaEstaCancelado` |

| Campo | Descripcion |
|---|---|
| ID | TC-REG-002 |
| Tipo | Prueba de regresion |
| Requisito asociado | RF-09 Reportes Exportables |
| Nombre | Reportes rechazan formato no soportado |
| Precondiciones | Servicio de reportes disponible. |
| Datos de prueba | Formato: `csv`. |
| Pasos | 1. Solicitar reporte de inventario en formato `csv`. 2. Validar error controlado. |
| Resultado esperado | El sistema lanza error de formato no soportado. |
| Automatizacion | `ReporteServiceTest.generarReporteInventarioRechazaFormatoNoSoportado` |

| Campo | Descripcion |
|---|---|
| ID | TC-HUMO-001 |
| Tipo | Prueba de humo |
| Requisito asociado | RF-01 a RF-09 |
| Nombre | Backend Spring Boot carga correctamente |
| Precondiciones | Dependencias Maven disponibles. |
| Datos de prueba | Contexto de aplicacion. |
| Pasos | 1. Ejecutar pruebas. 2. Levantar contexto Spring. |
| Resultado esperado | La aplicacion carga sin errores criticos. |
| Automatizacion | `SgipBackendApplicationTests` |

| Campo | Descripcion |
|---|---|
| ID | TC-HUMO-002 |
| Tipo | Prueba de humo |
| Requisito asociado | RNF Disponibilidad / RNF Mantenibilidad |
| Nombre | Conexion base de datos disponible para pruebas de integracion |
| Precondiciones | Base de datos configurada para el entorno de pruebas. |
| Datos de prueba | DataSource de Spring. |
| Pasos | 1. Ejecutar prueba smoke de base de datos. 2. Validar conexion. |
| Resultado esperado | La conexion se establece correctamente o reporta fallo de ambiente. |
| Automatizacion | `IntegrationDatabaseSmokeTest` |
