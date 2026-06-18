# Herramientas de pruebas agregadas - SGIP

Cambios 17/07: Se separaron las pruebas por herramienta para demostrar los tipos de testing solicitados.

## Estructura creada

| Herramienta | Ubicacion | Uso |
|---|---|---|
| JUnit / Mockito | `src/test/java/com/metroica/sgip_backend/...` | Unitarias, integracion, regresion, humo y seguridad basica. |
| Cucumber BDD | `src/test/java/com/metroica/sgip_backend/bdd` y `src/test/resources/features` | Aceptacion en formato Given/When/Then. |
| Selenium | `src/test/java/com/metroica/sgip_backend/selenium` | Funcionales web sobre el frontend. |
| JMeter | `src/test/jmeter` | Rendimiento, carga, estres y resistencia. |
| TestNG | `src/test/testng` | Carpeta reservada para humo con TestNG si se exige. |
| Jenkins | `Jenkinsfile` | Integracion continua y automatizacion de pruebas. |

## Comandos

### Suite normal Maven/JUnit/Cucumber

```bash
./mvnw test
```

### Solo Cucumber

```bash
./mvnw -Dtest=CucumberAcceptanceTest test
```

### Selenium funcional web

Requiere frontend levantado y navegador disponible.

```bash
RUN_SELENIUM_TESTS=true SGIP_FRONTEND_URL=http://localhost:5173 ./mvnw -Dtest=LoginSeleniumTest test
```

### JMeter rendimiento

Requiere backend levantado y credenciales validas configuradas dentro del plan JMeter.
El plan realiza login, extrae el JWT y lo envia como `Authorization: Bearer ${token}` para evitar respuestas `401 Unauthorized` en endpoints protegidos.

```bash
jmeter -n -t src/test/jmeter/sgip_rendimiento_basico.jmx -l target/jmeter/sgip_resultados.jtl
```

Escenarios incluidos:

- TC-REN-001: consulta de inventario autenticada.
- TC-REN-001: consulta de cola de pedidos autenticada.
- TC-REN-002: generacion de reporte de inventario autenticada.

## Resultado validado

La suite base fue validada con Maven:

```text
Tests run: 26, Failures: 0, Errors: 0, Skipped: 3
BUILD SUCCESS
```

Los 3 omitidos corresponden a pruebas condicionadas por entorno: Selenium, smoke de contexto Spring y smoke de base de datos.
