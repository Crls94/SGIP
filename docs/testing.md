# Testing

SGIP cuenta con una suite de pruebas multi-capa que abarca tests unitarios, de integración, de aceptación (BDD), de interfaz (Selenium) y de rendimiento (JMeter), además de pruebas específicas para el frontend y el módulo de IA.

---

## Backend — Java / Spring Boot

### Suite principal

=== "Linux/macOS"
    ```bash
    ./mvnw test
    ```

=== "Windows (CMD)"
    ```cmd
    mvnw.cmd test
    ```

### Resultados actuales

```
Tests run: 42, Failures: 0, Errors: 0, Skipped: 3
```

| Categoría | Tests | Descripción |
|---|---|---|
| **JWT** | 4 | Generación, validación, expiración y claims de tokens |
| **Rate Limiting** | 4 | Límites por endpoint, IP y token |
| **Auth** | 4 | Login exitoso, credenciales inválidas, usuario inactivo, registro |
| **Movimientos** | 3 | Entrada, salida, ajuste de stock y alertas |
| **Pedidos** | 4 | Creación, cola, cambio de estado, detalles |
| **Productos** | 2 | CRUD y búsqueda |
| **Reportes** | 4 | Generación PDF/Excel, descarga, historial |
| **Dashboard** | 3 | Métricas, ventas 7 días, precisión IA desde datos almacenados |
| **IA Predictiva** | 8 | Extracción de datos, predicciones, precisión, alertas |
| **Seguridad** | 1 | UsuarioPrincipal |
| **BDD (Cucumber)** | 2 | Escenarios de aceptación |
| **Selenium** | 1 | Login en navegador (requiere `RUN_SELENIUM_TESTS=true`) |
| **DB Smoke** | 1 | Conexión a base de datos (requiere entorno configurado) |
| **Spring Context** | 1 | Carga del contexto (requiere entorno configurado) |

Los 3 tests skipped requieren condiciones de entorno específicas:

- `LoginSeleniumTest`: necesita `RUN_SELENIUM_TESTS=true` y un servidor frontend en ejecución.
- `IntegrationDatabaseSmokeTest`: necesita base de datos disponible.
- `SgipBackendApplicationTests`: necesita contexto Spring completo.

### Frameworks utilizados

| Framework | Propósito |
|---|---|
| **JUnit 5** | Motor de pruebas |
| **Mockito** | Mocking de dependencias |
| **Spring Test** | Contexto de aplicación para tests |
| **Cucumber** | Pruebas BDD con Gherkin |
| **Selenium** | Pruebas de interfaz en navegador |
| **Apache JMeter** | Pruebas de rendimiento y carga |

### Ejecutar un test específico

=== "Linux/macOS"
    ```bash
    ./mvnw -Dtest=InteligenciaServiceTest test
    ./mvnw -Dtest=DashboardServiceTest test
    ```

=== "Windows (CMD)"
    ```cmd
    mvnw.cmd -Dtest=InteligenciaServiceTest test
    mvnw.cmd -Dtest=DashboardServiceTest test
    ```

---

## Frontend — React / Vite

### Auditoría de dependencias

```bash
cd frontend
npm audit --omit=dev --audit-level=moderate
```

Resultado: `0 vulnerabilities`.

### Build de producción

```bash
cd frontend
npm run build
```

El build verifica que el código compila, que las dependencias son resolubles y que el bundle se genera correctamente. Una advertencia de chunk >500 kB es informativa y no bloquea el despliegue.

---

## IA — Python

### Pruebas unitarias

=== "Linux/macOS"
    ```bash
    source venv/bin/activate
    python -m unittest test_ia_prediccion.py
    ```

=== "Windows (CMD)"
    ```cmd
    venv\Scripts\activate
    python -m unittest test_ia_prediccion.py
    ```

Resultado: `Ran 5 tests, OK`.

| Test | Descripción |
|---|---|
| Carga de datos de entrenamiento | Verifica que la IA recibe datos del backend |
| Entrenamiento del modelo | Confirma que el modelo se entrena con los datos |
| Generación de predicciones | Valida que se generan predicciones semanales |
| Cálculo de precisión | Verifica el cálculo de error y precisión |
| Manejo de errores de API | Simula fallos de conexión y respuestas mal formadas |

---

## Rendimiento — JMeter

### Plan de pruebas

Archivo: `src/test/jmeter/sgip_Rendimiento_basico.jmx`

### Ejecución

```bash
jmeter -n -t src/test/jmeter/sgip_Rendimiento_basico.jmx \
  -l target/jmeter/sgip_resultados.jtl
```

El plan incluye autenticación JWT y peticiones a los endpoints principales con rate limiting activo. Si JMeter genera muchas peticiones desde una misma IP, el sistema responde `429 Too Many Requests`, lo cual es esperado y no representa un fallo de rendimiento.

---

## Cobertura de pruebas

### Criterios cubiertos

- **Funcionales**: CRUD de productos, categorías, proveedores, movimientos, pedidos, usuarios.
- **Seguridad**: Autenticación JWT, autorización por roles, rate limiting.
- **IA**: Entrenamiento, predicciones, precisión, alertas predictivas.
- **Reportes**: Generación PDF y Excel, descarga, historial.
- **Notificaciones**: Creación, lectura, conteo de no leídas.
- **Dashboard**: Métricas, ventas, cola de pedidos, precisión IA.
- **Rendimiento**: JMeter con rate limiting.

### Lo que no se prueba automáticamente

- Envío real de correos (SMTP opcional).
- Conexión a Supabase (prueba manual en despliegue).
- Streamlit UI (prueba manual).
