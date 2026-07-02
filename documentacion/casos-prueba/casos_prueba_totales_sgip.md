# Casos de prueba totales SGIP

Documento consolidado de pruebas para la demostracion del sistema SGIP. Incluye pruebas automatizadas de backend, BDD, Selenium, Python IA y pruebas RNF ejecutables con herramientas externas.

## Resumen ejecutivo

| Grupo | Herramienta | Ubicacion | Cantidad | Comando / ejecucion |
|---|---|---|---:|---|
| Backend unitario, integracion y seguridad | JUnit, Mockito, Spring Test | `src/test/java` | 38 metodos `@Test` | `./mvnw test` |
| Aceptacion BDD | Cucumber | `src/test/resources/features` | 2 escenarios | `./mvnw test` |
| IA predictiva | Python unittest | `test_ia_prediccion.py` | 5 pruebas | `/tmp/opencode/sgip-ia-venv/bin/python -m unittest test_ia_prediccion.py` |
| Rendimiento y abuso controlado | Apache JMeter | `src/test/jmeter/*.jmx` | 2 planes versionados | Abrir/ejecutar con Apache JMeter |

Resultado verificado el 27/06/2026:

| Suite | Resultado |
|---|---|
| Maven backend + Cucumber | `Tests run: 40, Failures: 0, Errors: 0, Skipped: 3`, `BUILD SUCCESS` |
| Python IA | `Ran 5 tests`, `OK` |

Nota: las pruebas omitidas en Maven corresponden a escenarios dependientes de ambiente, como Selenium con navegador/frontend activo, smoke de base de datos y contexto completo cuando el ambiente no esta habilitado.

## Comandos de verificacion

| Proposito | Comando |
|---|---|
| Ejecutar pruebas backend, seguridad, BDD y smoke | `./mvnw test` |
| Ejecutar pruebas IA | `/tmp/opencode/sgip-ia-venv/bin/python -m unittest test_ia_prediccion.py` |
| Ejecutar build frontend | `cd frontend && npm run build` |
| Ejecutar auditoria frontend productiva | `cd frontend && npm audit --omit=dev --audit-level=moderate` |
| Ejecutar Selenium login | `RUN_SELENIUM_TESTS=true SGIP_FRONTEND_URL=http://localhost:3000 ./mvnw -Dtest=LoginSeleniumTest test` |
| Ejecutar JMeter rendimiento | Abrir `src/test/jmeter/sgip_Rendimiento_basico.jmx` en Apache JMeter y ejecutar el plan |

## Matriz total de casos automatizados y demostrables

| ID | RF/RNF | Tipo | Caso de prueba | Procedimiento de verificacion | Evidencia / comando | Estado |
|---|---|---|---|---|---|---|
| TC-001 | RF-01 / RNF Seguridad | Unitaria backend | Login correcto genera token JWT | Preparar usuario activo con password BCrypt, ejecutar login y validar token/rol. | `AuthServiceTest.loginCorrectoGeneraToken`; `./mvnw test` | Automatizado |
| TC-002 | RF-01 / RNF Seguridad | Negativa backend | Login con password incorrecto falla | Preparar usuario existente, enviar password invalido y validar error controlado. | `AuthServiceTest.loginConPasswordIncorrectoFalla`; `./mvnw test` | Automatizado |
| TC-003 | RF-01 / RNF Seguridad | Seguridad backend | Registro guarda password cifrado | Registrar usuario y validar que el hash coincide con BCrypt, no texto plano. | `AuthServiceTest.registerGuardaPasswordCifrado`; `./mvnw test` | Automatizado |
| TC-004 | RF-01 | Negativa backend | Registro rechaza email duplicado | Simular email existente y validar rechazo antes de guardar. | `AuthServiceTest.registerRechazaEmailDuplicado`; `./mvnw test` | Automatizado |
| TC-005 | RF-01 / RNF Seguridad | Seguridad backend | JWT se genera con claims correctos | Generar token y extraer email, usuario y rol. | `JwtUtilTest.debeGenerarTokenConClaimsCorrectos`; `./mvnw test` | Automatizado |
| TC-006 | RF-01 / RNF Seguridad | Seguridad backend | JWT expirado es invalido | Crear token con expiracion negativa y validar rechazo. | `JwtUtilTest.tokenExpiradoDebeSerInvalido`; `./mvnw test` | Automatizado |
| TC-007 | RF-01 / RNF Seguridad | Seguridad backend | JWT falso, vacio o nulo es invalido | Validar variantes invalidas sin romper la aplicacion. | `JwtUtilTest.tokenInvalidoDebeRetornarFalse`; `./mvnw test` | Automatizado |
| TC-008 | RF-01 | Seguridad backend | JWT conserva roles distintos | Generar tokens ADMINISTRADOR y GERENTE y validar rol extraido. | `JwtUtilTest.debeGenerarTokensConDiferentesRoles`; `./mvnw test` | Automatizado |
| TC-009 | RF-01 | Unitaria backend | Principal de usuario expone datos de seguridad | Construir principal y validar username/authorities/datos base. | `UsuarioPrincipalTest`; `./mvnw test` | Automatizado |
| TC-010 | RF-02 | Unitaria backend | Producto rechaza SKU duplicado | Simular categoria/proveedor validos y SKU existente; validar que no guarda. | `ProductoServiceTest.crearProductoRechazaSkuDuplicado`; `./mvnw test` | Automatizado |
| TC-011 | RF-02 | Funcional backend | Producto valido se crea con categoria y proveedor | Crear DTO valido, simular categoria/proveedor y validar respuesta. | `ProductoServiceTest.crearProductoGuardaProductoConCategoriaYProveedor`; `./mvnw test` | Automatizado |
| TC-012 | RF-03 | Negativa backend | Salida rechaza cantidad mayor al stock | Producto con 5 unidades, salida de 10, validar error y no persistencia. | `MovimientoServiceTest.registrarMovimientoRealRechazaSalidaSiCantidadSuperaStockDisponible`; `./mvnw test` | Automatizado |
| TC-013 | RF-03 | Funcional backend | Entrada actualiza stock y registra movimiento | Producto con stock 5, entrada 3, validar stock 8 y movimiento ENTRADA. | `MovimientoServiceTest.registrarMovimientoRealEntradaActualizaStockYGuardaMovimiento`; `./mvnw test` | Automatizado |
| TC-014 | RF-04 / RF-03 | Integracion backend | Stock critico genera alerta y notificacion | Verificar producto bajo punto de pedido y validar alerta/notificacion a administrador. | `MovimientoServiceTest.verificarAlertaStockGeneraAlertaYNotificacionCuandoStockEsCritico`; `./mvnw test` | Automatizado |
| TC-015 | RF-05 | Regresion backend | Cancelar pedido ya cancelado no duplica reposicion | Pedido CANCELADO, volver a cancelar y validar que no restaura stock otra vez. | `PedidoServiceTest.actualizarEstadoNoRestauraStockSiPedidoYaEstaCancelado`; `./mvnw test` | Automatizado |
| TC-016 | RF-05 / RNF Integridad | Negativa backend | Pedido rechaza stock insuficiente | Pedido solicita mas unidades que stock disponible y no guarda detalle/movimiento. | `PedidoServiceTest.crearPedidoRechazaItemConStockInsuficiente`; `./mvnw test` | Automatizado |
| TC-017 | RF-05 / RF-06 | Integracion backend | Pedido delivery descuenta stock y asigna prioridad | Crear pedido delivery, validar prioridad 3, stock descontado y movimiento SALIDA. | `PedidoServiceTest.crearPedidoDeliveryAsignaPrioridadAltaYDescuentaStock`; `./mvnw test` | Automatizado |
| TC-018 | RF-06 | Aceptacion backend | Cola conserva orden priorizado | Simular delivery y local, consultar cola y validar delivery primero. | `PedidoServiceTest.verColaPedidosRespetaOrdenPriorizadoDelRepositorio`; `./mvnw test` | Automatizado |
| TC-019 | RF-06 | BDD aceptacion | Cola prioriza delivery | Ejecutar escenario Given/When/Then de cola de pedidos. | `sgip_aceptacion.feature`; `./mvnw test` | Automatizado |
| TC-020 | RF-08 | BDD aceptacion | Dashboard gerencial disponible para administrador | Ejecutar escenario BDD de acceso a metricas gerenciales. | `sgip_aceptacion.feature`; `./mvnw test` | Automatizado |
| TC-021 | RF-08 | Unitaria backend | Dashboard completa 7 dias sin ventas con cero | Simular ventas parciales y validar 7 dias con ceros donde faltan datos. | `DashboardServiceTest.getVentasUltimos7DiasCompletaDiasSinVentasConCero`; `./mvnw test` | Automatizado |
| TC-022 | RF-08 | Unitaria backend | Dashboard devuelve ventas en orden cronologico | Simular repositorio vacio y validar secuencia de fechas ascendente. | `DashboardServiceTest.getVentasUltimos7DiasDevuelveOrdenCronologico`; `./mvnw test` | Automatizado |
| TC-023 | RF-09 | Regresion backend | Reporte rechaza formato no soportado | Solicitar `csv` y validar error por formato fuera de alcance. | `ReporteServiceTest.generarReporteInventarioRechazaFormatoNoSoportado`; `./mvnw test` | Automatizado |
| TC-024 | RF-09 | Negativa backend | Reporte pedidos rechaza rango de fechas invertido | Usar fecha inicial posterior a final y validar error. | `ReporteServiceTest.generarReportePedidosRechazaRangoDeFechasInvertido`; `./mvnw test` | Automatizado |
| TC-025 | RF-09 | Funcional backend | Reporte inventario Excel devuelve contenido | Generar reporte `xlsx` con producto simulado y validar bytes no vacios. | `ReporteServiceTest.generarReporteInventarioExcelDevuelveContenido`; `./mvnw test` | Automatizado |
| TC-026 | RF-09 / RNF Seguridad | Seguridad backend | Descarga de reporte rechaza ruta fuera del directorio | Reporte apunta a `/etc/passwd` y el servicio debe rechazar path traversal. | `ReporteServiceTest.descargarReporteRechazaRutaFueraDelDirectorioConfigurado`; `./mvnw test` | Automatizado |
| TC-027 | RF-07 | IA backend | Guardar prediccion crea registro con semana fin y modelo por defecto | Enviar prediccion sin modelo, validar semana fin +6 dias y version default. | `InteligenciaServiceTest.guardarPrediccionCreaRegistroConSemanaFinYModeloPorDefecto`; `./mvnw test` | Automatizado |
| TC-028 | RF-07 | IA backend | Guardar prediccion actualiza producto/semana existente | Simular prediccion existente, guardar nueva cantidad y validar actualizacion. | `InteligenciaServiceTest.guardarPrediccionActualizaRegistroExistenteParaProductoYSemana`; `./mvnw test` | Automatizado |
| TC-029 | RF-07 | Negativa IA backend | Guardar prediccion rechaza producto inexistente | Enviar producto inexistente y validar que no se guarda prediccion. | `InteligenciaServiceTest.guardarPrediccionRechazaProductoInexistente`; `./mvnw test` | Automatizado |
| TC-030 | RF-07 | IA backend | Predicciones calculan riesgo alto, medio y bajo | Preparar tres predicciones y validar clasificacion de riesgo. | `InteligenciaServiceTest.obtenerPrediccionesCalculaRiesgoAltoMedioYBajo`; `./mvnw test` | Automatizado |
| TC-031 | RF-07 / RF-04 | IA backend | Alerta predictiva se crea para riesgo alto | Prediccion mayor al stock genera alerta IA con faltante estimado. | `InteligenciaServiceTest.generarAlertasPredictivasCreaAlertaParaRiesgoAlto`; `./mvnw test` | Automatizado |
| TC-032 | RF-07 / RF-04 | Regresion IA backend | Alerta predictiva no se duplica si ya existe activa | Simular alerta IA activa para producto/semana y validar que no guarda otra. | `InteligenciaServiceTest.generarAlertasPredictivasNoDuplicaAlertaActiva`; `./mvnw test` | Automatizado |
| TC-033 | RF-07 / RF-04 | IA backend | Riesgo bajo no genera alerta predictiva | Prediccion con stock suficiente no debe crear alerta. | `InteligenciaServiceTest.generarAlertasPredictivasIgnoraRiesgoBajo`; `./mvnw test` | Automatizado |
| TC-034 | RF-07 | Python IA | Normalizar confianza limita rango | Validar valores menores a 0, mayores a 1 y valor normal. | `test_ia_prediccion.py::test_normalizar_confianza_limita_rango`; Python unittest | Automatizado |
| TC-035 | RF-07 | Python IA | Agrupar ventas por producto y semana | Preparar dataframe diario y validar agregacion semanal. | `test_ia_prediccion.py::test_preparar_ventas_semanales_agrupa_por_producto_y_semana`; Python unittest | Automatizado |
| TC-036 | RF-07 | Python IA | IA requiere al menos dos semanas para entrenar | Enviar una sola semana y validar que no retorna prediccion. | `test_ia_prediccion.py::test_entrenar_prediccion_requiere_dos_semanas`; Python unittest | Automatizado |
| TC-037 | RF-07 | Python IA | Riesgo compara stock y prediccion | Validar resultados ALTO, MEDIO y BAJO desde la logica Python. | `test_ia_prediccion.py::test_calcular_riesgo_compara_stock_y_prediccion`; Python unittest | Automatizado |
| TC-038 | RF-07 | Python IA | Tendencia porcentual se calcula correctamente | Ventas 10 a 15 deben producir tendencia de 50%. | `test_ia_prediccion.py::test_calcular_tendencia_porcentaje`; Python unittest | Automatizado |
| TC-039 | RNF Seguridad / Disponibilidad | Rate limit backend | Login bloquea exceso de intentos por IP | Enviar 10 intentos y validar `429` en el intento adicional. | `RateLimitInterceptorTest.loginDebeBloquearDespuesDelLimitePorIp`; `./mvnw test` | Automatizado |
| TC-040 | RNF Seguridad / Disponibilidad | Rate limit backend | Pedidos y movimientos no comparten bucket | Saturar bucket de pedidos y validar que movimientos sigue permitido. | `RateLimitInterceptorTest.pedidosYMovimientosNoCompartenBucket`; `./mvnw test` | Automatizado |
| TC-041 | RNF Rendimiento / Disponibilidad | Rate limit backend | API general permite 100 solicitudes por ruta y usuario | Ejecutar 100 llamadas y validar bloqueo posterior. | `RateLimitInterceptorTest.apiGeneralDebePermitirCienSolicitudesPorRutaYUsuario`; `./mvnw test` | Automatizado |
| TC-042 | RNF Disponibilidad | Rate limit backend | Rutas fuera de API no se limitan | Ejecutar 120 llamadas a `/` y validar que no responde `429`. | `RateLimitInterceptorTest.rutasFueraDeApiNoDebenLimitarse`; `./mvnw test` | Automatizado |
| TC-043 | RF-01 | Funcional UI | Pagina login carga formulario principal | Abrir frontend con navegador headless y validar presencia de login/campos. | `LoginSeleniumTest.paginaLoginCargaFormularioPrincipal`; `RUN_SELENIUM_TESTS=true ...` | Automatizado condicional |
| TC-044 | RF-01 a RF-09 | Humo backend | Contexto Spring Boot carga correctamente | Levantar contexto de aplicacion para detectar errores criticos de wiring. | `SgipBackendApplicationTests`; `./mvnw test` | Automatizado condicional |
| TC-045 | RNF Disponibilidad / Mantenibilidad | Humo base de datos | Conexion de base de datos disponible | Validar DataSource cuando el ambiente de integracion esta configurado. | `IntegrationDatabaseSmokeTest`; `./mvnw test` | Automatizado condicional |

## Casos RNF complementarios con JMeter

| ID | RNF | Tipo | Caso | Procedimiento de verificacion | Evidencia |
|---|---|---|---|---|---|
| TC-JM-001 | RNF Rendimiento | Carga | Consulta autenticada de inventario responde bajo el limite definido | Ejecutar plan JMeter con login JWT y consulta de inventario; revisar tiempos promedio, maximo y percentil 95. | `src/test/jmeter/sgip_Rendimiento_basico.jmx` |
| TC-JM-002 | RNF Rendimiento / RF-09 | Carga | Generacion de reporte responde bajo el limite definido | Ejecutar plan JMeter con generacion de reporte inventario y validar tiempos bajo 5 segundos. | `src/test/jmeter/sgip_Rendimiento_basico.jmx` |
| TC-JM-003 | RNF Seguridad / Disponibilidad | Abuso controlado | Rate limit de login responde `429` ante exceso de intentos | Ejecutar escenario controlado con muchas peticiones de login desde la misma IP y verificar bloqueo. | `src/test/jmeter/README.md` y plan JMeter |

## Procedimiento recomendado para demostracion

1. Ejecutar `./mvnw test` y mostrar el resumen `Tests run: 40, Failures: 0, Errors: 0`.
2. Ejecutar `/tmp/opencode/sgip-ia-venv/bin/python -m unittest test_ia_prediccion.py` y mostrar `Ran 5 tests OK`.
3. Mostrar `src/test/java` como evidencia de pruebas backend en codigo.
4. Mostrar `src/test/resources/features/sgip_aceptacion.feature` como evidencia BDD.
5. Mostrar `src/test/jmeter` como evidencia RNF externa versionada.
6. Si se requiere UI, levantar frontend y ejecutar Selenium con `RUN_SELENIUM_TESTS=true`.

## Observaciones

- La mayoria de casos demostrables esta dentro de `src/test`, como pruebas de codigo backend.
- JMeter se conserva dentro del repositorio solo como plan versionado, pero se ejecuta con una aplicacion externa.
- Las pruebas Python cubren el modulo IA porque el entrenamiento y preparacion de datos viven fuera del backend Java.
- No se agregaron herramientas externas nuevas como Postman porque JUnit, Cucumber, Selenium, Python unittest y JMeter ya cubren el alcance RF/RNF.
