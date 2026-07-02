# Casos de Prueba

Esta matriz consolida los casos de prueba del sistema SGIP en base a la documentación formal de requisitos funcionales (RF) y no funcionales (RNF). Incluye pruebas unitarias, integración, funcionales, seguridad, aceptación, regresión, humo, rendimiento, frontend e IA predictiva.

---

## Alcance RF/RNF

| Código | Alcance validado |
|---|---|
| `RF-01` | Autenticación, registro, roles y sesión JWT |
| `RF-02` | Gestión de productos, categorías y proveedores |
| `RF-03` | Control de stock y movimientos de inventario |
| `RF-04` | Alertas de stock crítico y alertas predictivas |
| `RF-05` | Gestión de pedidos |
| `RF-06` | Cola priorizada de pedidos |
| `RF-07` | IA predictiva y predicciones de demanda |
| `RF-08` | Dashboard gerencial |
| `RF-09` | Reportes exportables PDF/Excel |
| `RNF Seguridad` | JWT, BCrypt, autorización, rate limiting, path traversal |
| `RNF Rendimiento` | Tiempos de respuesta y carga con JMeter |
| `RNF Disponibilidad` | Arranque, contexto Spring, límites antiabuso |
| `RNF Integridad` | Consistencia de stock, pedidos, movimientos y datos |
| `RNF Mantenibilidad` | Pruebas automatizadas, documentación y validaciones repetibles |

---

## Resumen Por Tipo

| Tipo de prueba | Herramienta | Cantidad | Estado |
|---|---|---:|---|
| Unitarias backend | JUnit 5 + Mockito | 18 | Automatizadas |
| Integración backend | JUnit 5 + Spring/Mockito | 6 | Automatizadas |
| Funcionales backend | JUnit 5 | 8 | Automatizadas |
| Seguridad | JUnit 5 + Spring Security + Bucket4j | 9 | Automatizadas |
| BDD / aceptación | Cucumber | 2 | Automatizadas |
| IA Python | `unittest` | 5 | Automatizadas |
| UI | Selenium | 1 | Condicional |
| Humo | Spring Context + DB Smoke | 2 | Condicional |
| Rendimiento | Apache JMeter | 3 | Manual / externa |

---

## Comandos De Verificación

### Suite Backend Completa

Ejecuta pruebas unitarias, integración, seguridad y BDD. Algunas pruebas condicionales pueden quedar como `skipped` si no está preparado el ambiente externo.

=== "Linux/macOS"
    ```bash
    ./mvnw test
    ```

=== "Windows (CMD)"
    ```cmd
    mvnw.cmd test
    ```

### Test Backend Específico

=== "Linux/macOS"
    ```bash
    ./mvnw -Dtest=AuthServiceTest test
    ./mvnw -Dtest=ProductoServiceTest test
    ./mvnw -Dtest=MovimientoServiceTest test
    ./mvnw -Dtest=PedidoServiceTest test
    ./mvnw -Dtest=ReporteServiceTest test
    ./mvnw -Dtest=InteligenciaServiceTest test
    ./mvnw -Dtest=DashboardServiceTest test
    ./mvnw -Dtest=RateLimitInterceptorTest test
    ```

=== "Windows (CMD)"
    ```cmd
    mvnw.cmd -Dtest=AuthServiceTest test
    mvnw.cmd -Dtest=ProductoServiceTest test
    mvnw.cmd -Dtest=MovimientoServiceTest test
    mvnw.cmd -Dtest=PedidoServiceTest test
    mvnw.cmd -Dtest=ReporteServiceTest test
    mvnw.cmd -Dtest=InteligenciaServiceTest test
    mvnw.cmd -Dtest=DashboardServiceTest test
    mvnw.cmd -Dtest=RateLimitInterceptorTest test
    ```

### BDD Cucumber

=== "Linux/macOS"
    ```bash
    ./mvnw -Dtest=CucumberAcceptanceTest test
    ```

=== "Windows (CMD)"
    ```cmd
    mvnw.cmd -Dtest=CucumberAcceptanceTest test
    ```

### Selenium UI

Requiere frontend levantado en `http://localhost:3000`.

=== "Linux/macOS"
    ```bash
    cd frontend && npm install && npm run dev
    RUN_SELENIUM_TESTS=true SGIP_FRONTEND_URL=http://localhost:3000 ./mvnw -Dtest=LoginSeleniumTest test
    ```

=== "Windows (CMD)"
    ```cmd
    cd frontend && npm install && npm run dev
    set RUN_SELENIUM_TESTS=true && set SGIP_FRONTEND_URL=http://localhost:3000 && mvnw.cmd -Dtest=LoginSeleniumTest test
    ```

### Smoke De Base De Datos

Requiere variables de entorno de base de datos y esquema aplicado.

=== "Linux/macOS"
    ```bash
    SPRING_PROFILES_ACTIVE=prod ./mvnw -Dtest=IntegrationDatabaseSmokeTest test
    ```

=== "Windows (CMD)"
    ```cmd
    set SPRING_PROFILES_ACTIVE=prod && mvnw.cmd -Dtest=IntegrationDatabaseSmokeTest test
    ```

### Contexto Spring Completo

Requiere entorno productivo/local válido porque el proyecto usa `ddl-auto=validate`.

=== "Linux/macOS"
    ```bash
    SPRING_PROFILES_ACTIVE=prod ./mvnw -Dtest=SgipBackendApplicationTests test
    ```

=== "Windows (CMD)"
    ```cmd
    set SPRING_PROFILES_ACTIVE=prod && mvnw.cmd -Dtest=SgipBackendApplicationTests test
    ```

### Frontend

=== "Linux/macOS"
    ```bash
    cd frontend
    npm audit --omit=dev --audit-level=moderate
    npm run build
    ```

=== "Windows (CMD)"
    ```cmd
    cd frontend
    npm audit --omit=dev --audit-level=moderate
    npm run build
    ```

### IA Python

=== "Linux/macOS"
    ```bash
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python -m unittest test_ia_prediccion.py
    ```

=== "Windows (CMD)"
    ```cmd
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    python -m unittest test_ia_prediccion.py
    ```

### JMeter Rendimiento

Requiere backend activo y Apache JMeter instalado.

=== "Linux/macOS"
    ```bash
    jmeter -n -t src/test/jmeter/sgip_Rendimiento_basico.jmx \
      -l target/jmeter/sgip_resultados.jtl
    ```

=== "Windows (CMD)"
    ```cmd
    jmeter -n -t src/test/jmeter/sgip_Rendimiento_basico.jmx ^
      -l target/jmeter/sgip_resultados.jtl
    ```

---

## Matriz General De Casos

| ID | RF/RNF | Tipo | Caso | Evidencia | Comando |
|---|---|---|---|---|---|
| `TC-001` | `RF-01` / `RNF Seguridad` | Unitaria backend | Login correcto genera token JWT | `AuthServiceTest.loginCorrectoGeneraToken` | Suite backend o `AuthServiceTest` |
| `TC-002` | `RF-01` / `RNF Seguridad` | Negativa backend | Login con password incorrecto falla | `AuthServiceTest.loginConPasswordIncorrectoFalla` | Suite backend o `AuthServiceTest` |
| `TC-003` | `RF-01` / `RNF Seguridad` | Seguridad backend | Registro guarda password cifrado | `AuthServiceTest.registerGuardaPasswordCifrado` | Suite backend o `AuthServiceTest` |
| `TC-004` | `RF-01` | Negativa backend | Registro rechaza email duplicado | `AuthServiceTest.registerRechazaEmailDuplicado` | Suite backend o `AuthServiceTest` |
| `TC-005` | `RF-01` / `RNF Seguridad` | Seguridad backend | JWT se genera con claims correctos | `JwtUtilTest.debeGenerarTokenConClaimsCorrectos` | Suite backend o `JwtUtilTest` |
| `TC-006` | `RF-01` / `RNF Seguridad` | Seguridad backend | JWT expirado es inválido | `JwtUtilTest.tokenExpiradoDebeSerInvalido` | Suite backend o `JwtUtilTest` |
| `TC-007` | `RF-01` / `RNF Seguridad` | Seguridad backend | JWT falso, vacío o nulo es inválido | `JwtUtilTest.tokenInvalidoDebeRetornarFalse` | Suite backend o `JwtUtilTest` |
| `TC-008` | `RF-01` | Seguridad backend | JWT conserva roles distintos | `JwtUtilTest.debeGenerarTokensConDiferentesRoles` | Suite backend o `JwtUtilTest` |
| `TC-009` | `RF-01` | Unitaria backend | Principal de usuario expone datos de seguridad | `UsuarioPrincipalTest` | Suite backend o `UsuarioPrincipalTest` |
| `TC-010` | `RF-02` | Unitaria backend | Producto rechaza SKU duplicado | `ProductoServiceTest.crearProductoRechazaSkuDuplicado` | Suite backend o `ProductoServiceTest` |
| `TC-011` | `RF-02` | Funcional backend | Producto válido se crea con categoría y proveedor | `ProductoServiceTest.crearProductoGuardaProductoConCategoriaYProveedor` | Suite backend o `ProductoServiceTest` |
| `TC-012` | `RF-03` | Negativa backend | Salida rechaza cantidad mayor al stock | `MovimientoServiceTest.registrarMovimientoRealRechazaSalidaSiCantidadSuperaStockDisponible` | Suite backend o `MovimientoServiceTest` |
| `TC-013` | `RF-03` | Funcional backend | Entrada actualiza stock y registra movimiento | `MovimientoServiceTest.registrarMovimientoRealEntradaActualizaStockYGuardaMovimiento` | Suite backend o `MovimientoServiceTest` |
| `TC-014` | `RF-04` / `RF-03` | Integración backend | Stock crítico genera alerta y notificación | `MovimientoServiceTest.verificarAlertaStockGeneraAlertaYNotificacionCuandoStockEsCritico` | Suite backend o `MovimientoServiceTest` |
| `TC-015` | `RF-05` | Regresión backend | Cancelar pedido ya cancelado no duplica reposición | `PedidoServiceTest.actualizarEstadoNoRestauraStockSiPedidoYaEstaCancelado` | Suite backend o `PedidoServiceTest` |
| `TC-016` | `RF-05` / `RNF Integridad` | Negativa backend | Pedido rechaza stock insuficiente | `PedidoServiceTest.crearPedidoRechazaItemConStockInsuficiente` | Suite backend o `PedidoServiceTest` |
| `TC-017` | `RF-05` / `RF-06` | Integración backend | Pedido delivery descuenta stock y asigna prioridad | `PedidoServiceTest.crearPedidoDeliveryAsignaPrioridadAltaYDescuentaStock` | Suite backend o `PedidoServiceTest` |
| `TC-018` | `RF-06` | Aceptación backend | Cola conserva orden priorizado | `PedidoServiceTest.verColaPedidosRespetaOrdenPriorizadoDelRepositorio` | Suite backend o `PedidoServiceTest` |
| `TC-019` | `RF-06` | BDD aceptación | Cola prioriza delivery | `sgip_aceptacion.feature` | BDD Cucumber |
| `TC-020` | `RF-08` | BDD aceptación | Dashboard gerencial disponible para administrador | `sgip_aceptacion.feature` | BDD Cucumber |
| `TC-021` | `RF-08` | Unitaria backend | Dashboard completa 7 días sin ventas con cero | `DashboardServiceTest.getVentasUltimos7DiasCompletaDiasSinVentasConCero` | Suite backend o `DashboardServiceTest` |
| `TC-022` | `RF-08` | Unitaria backend | Dashboard devuelve ventas en orden cronológico | `DashboardServiceTest.getVentasUltimos7DiasDevuelveOrdenCronologico` | Suite backend o `DashboardServiceTest` |
| `TC-023` | `RF-09` | Regresión backend | Reporte rechaza formato no soportado | `ReporteServiceTest.generarReporteInventarioRechazaFormatoNoSoportado` | Suite backend o `ReporteServiceTest` |
| `TC-024` | `RF-09` | Negativa backend | Reporte pedidos rechaza rango de fechas invertido | `ReporteServiceTest.generarReportePedidosRechazaRangoDeFechasInvertido` | Suite backend o `ReporteServiceTest` |
| `TC-025` | `RF-09` | Funcional backend | Reporte inventario Excel devuelve contenido | `ReporteServiceTest.generarReporteInventarioExcelDevuelveContenido` | Suite backend o `ReporteServiceTest` |
| `TC-026` | `RF-09` / `RNF Seguridad` | Seguridad backend | Descarga de reporte rechaza ruta fuera del directorio | `ReporteServiceTest.descargarReporteRechazaRutaFueraDelDirectorioConfigurado` | Suite backend o `ReporteServiceTest` |
| `TC-027` | `RF-07` | IA backend | Guardar predicción crea registro con semana fin y modelo por defecto | `InteligenciaServiceTest.guardarPrediccionCreaRegistroConSemanaFinYModeloPorDefecto` | Suite backend o `InteligenciaServiceTest` |
| `TC-028` | `RF-07` | IA backend | Guardar predicción actualiza producto/semana existente | `InteligenciaServiceTest.guardarPrediccionActualizaRegistroExistenteParaProductoYSemana` | Suite backend o `InteligenciaServiceTest` |
| `TC-029` | `RF-07` | Negativa IA backend | Guardar predicción rechaza producto inexistente | `InteligenciaServiceTest.guardarPrediccionRechazaProductoInexistente` | Suite backend o `InteligenciaServiceTest` |
| `TC-030` | `RF-07` | IA backend | Predicciones calculan riesgo alto, medio y bajo | `InteligenciaServiceTest.obtenerPrediccionesCalculaRiesgoAltoMedioYBajo` | Suite backend o `InteligenciaServiceTest` |
| `TC-031` | `RF-07` / `RF-04` | IA backend | Alerta predictiva se crea para riesgo alto | `InteligenciaServiceTest.generarAlertasPredictivasCreaAlertaParaRiesgoAlto` | Suite backend o `InteligenciaServiceTest` |
| `TC-032` | `RF-07` / `RF-04` | Regresión IA backend | Alerta predictiva no se duplica si ya existe activa | `InteligenciaServiceTest.generarAlertasPredictivasNoDuplicaAlertaActiva` | Suite backend o `InteligenciaServiceTest` |
| `TC-033` | `RF-07` / `RF-04` | IA backend | Riesgo bajo no genera alerta predictiva | `InteligenciaServiceTest.generarAlertasPredictivasIgnoraRiesgoBajo` | Suite backend o `InteligenciaServiceTest` |
| `TC-034` | `RF-07` | Python IA | Normalizar confianza limita rango | `test_normalizar_confianza_limita_rango` | IA Python |
| `TC-035` | `RF-07` | Python IA | Agrupar ventas por producto y semana | `test_preparar_ventas_semanales_agrupa_por_producto_y_semana` | IA Python |
| `TC-036` | `RF-07` | Python IA | IA requiere al menos dos semanas para entrenar | `test_entrenar_prediccion_requiere_dos_semanas` | IA Python |
| `TC-037` | `RF-07` | Python IA | Riesgo compara stock y predicción | `test_calcular_riesgo_compara_stock_y_prediccion` | IA Python |
| `TC-038` | `RF-07` | Python IA | Tendencia porcentual se calcula correctamente | `test_calcular_tendencia_porcentaje` | IA Python |
| `TC-039` | `RNF Seguridad` / `RNF Disponibilidad` | Rate limit backend | Login bloquea exceso de intentos por IP | `RateLimitInterceptorTest.loginDebeBloquearDespuesDelLimitePorIp` | Suite backend o `RateLimitInterceptorTest` |
| `TC-040` | `RNF Seguridad` / `RNF Disponibilidad` | Rate limit backend | Pedidos y movimientos no comparten bucket | `RateLimitInterceptorTest.pedidosYMovimientosNoCompartenBucket` | Suite backend o `RateLimitInterceptorTest` |
| `TC-041` | `RNF Rendimiento` / `RNF Disponibilidad` | Rate limit backend | API general permite 100 solicitudes por ruta y usuario | `RateLimitInterceptorTest.apiGeneralDebePermitirCienSolicitudesPorRutaYUsuario` | Suite backend o `RateLimitInterceptorTest` |
| `TC-042` | `RNF Disponibilidad` | Rate limit backend | Rutas fuera de API no se limitan | `RateLimitInterceptorTest.rutasFueraDeApiNoDebenLimitarse` | Suite backend o `RateLimitInterceptorTest` |
| `TC-043` | `RF-01` | Funcional UI | Página login carga formulario principal | `LoginSeleniumTest.paginaLoginCargaFormularioPrincipal` | Selenium UI |
| `TC-044` | `RF-01` a `RF-09` | Humo backend | Contexto Spring Boot carga correctamente | `SgipBackendApplicationTests` | Contexto Spring completo |
| `TC-045` | `RNF Disponibilidad` / `RNF Mantenibilidad` | Humo base de datos | Conexión de base de datos disponible | `IntegrationDatabaseSmokeTest` | Smoke de base de datos |

---

## Casos RNF Con JMeter

| ID | RF/RNF | Tipo | Caso | Evidencia | Comando |
|---|---|---|---|---|---|
| `TC-JM-001` | `RNF Rendimiento` | Carga | Consulta autenticada de inventario responde bajo el límite definido | `src/test/jmeter/sgip_Rendimiento_basico.jmx` | JMeter Rendimiento |
| `TC-JM-002` | `RNF Rendimiento` / `RF-09` | Carga | Generación de reporte responde bajo 5 segundos | `src/test/jmeter/sgip_Rendimiento_basico.jmx` | JMeter Rendimiento |
| `TC-JM-003` | `RNF Seguridad` / `RNF Disponibilidad` | Abuso controlado | Rate limit de login responde `429` ante exceso de intentos | `src/test/jmeter/README.md` | JMeter Rendimiento |

---

## Procedimiento Recomendado Para Evidencia

1. Ejecutar suite backend completa y conservar el resumen de Maven.
2. Ejecutar pruebas Python de IA y conservar `Ran 5 tests, OK`.
3. Ejecutar build y auditoría frontend.
4. Si hay ambiente preparado, ejecutar Selenium y smoke DB.
5. Si se requiere evidencia RNF, ejecutar JMeter con backend activo y usuario válido.
6. Documentar pruebas omitidas por ambiente como condicionales, no como fallidas.

---

## Notas De Ambiente

- En `prod`, el backend usa `ddl-auto=validate`; por eso la base debe tener el esquema aplicado antes de arrancar.
- `DataSeeder` solo corre en perfiles `dev` y `demo`, no en `prod`.
- Selenium requiere frontend activo y navegador compatible.
- JMeter requiere credenciales válidas del ambiente y puede recibir `429 Too Many Requests` si se ejecutan demasiados logins desde la misma IP.
- Las pruebas de Streamlit UI son manuales; la lógica IA se cubre con `test_ia_prediccion.py`.
