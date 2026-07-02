# Librerias y Dependencias del Proyecto SGIP

## 1. Objetivo del Documento

Este documento presenta las librerias usadas actualmente en el proyecto SGIP, explicando por que fueron incorporadas, para que se usan y que valor aportan dentro de la arquitectura del sistema. Tambien se incluyen observaciones tecnicas y recomendaciones de librerias que podrian anadirse para fortalecer mantenibilidad, seguridad, monitoreo, pruebas y documentacion.

La revision se basa en los archivos de dependencias y en el uso observado dentro del codigo fuente actual:

- Backend: `pom.xml` y `src/main/java`.
- Frontend: `frontend/package.json` y `frontend/src`.
- Modulo IA: `requirements.txt` e `ia_prediccion.py`.

## 2. Resumen Tecnologico

SGIP esta compuesto por tres bloques principales:

| Componente | Tecnologia principal | Funcion dentro del sistema |
|---|---|---|
| Backend | Java 21 + Spring Boot | API REST, seguridad, reglas de negocio, persistencia y comunicacion con PostgreSQL. |
| Frontend | React + Vite | Interfaz web para usuarios operativos, administradores y gerentes. |
| Modulo IA | Python | Prediccion de demanda a partir de movimientos historicos de salida. |

La arquitectura actual corresponde a un monolito modular en backend, una SPA independiente en frontend y un modulo de inteligencia artificial desacoplado.

## 3. Librerias Usadas en el Backend

### Spring Boot Starter WebMVC

**Dependencia:** `spring-boot-starter-webmvc`

Se usa para construir la API REST del sistema. Permite definir controladores, rutas HTTP y respuestas JSON mediante anotaciones como `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, entre otras.

En SGIP se utiliza para exponer endpoints de autenticacion, productos, proveedores, movimientos, pedidos, alertas, notificaciones, inteligencia y dashboard.

**Justificacion:** es la base de comunicacion entre frontend y backend. Permite mantener una arquitectura REST clara, escalable y compatible con cualquier cliente web o futuro servicio externo.

### Spring Data JPA

**Dependencia:** `spring-boot-starter-data-jpa`

Se usa para mapear entidades Java contra tablas PostgreSQL y acceder a datos mediante repositorios. En el proyecto aparecen entidades como `Producto`, `Pedido`, `PedidoDetalle`, `Usuario`, `InventarioMovimiento`, `AlertaStock`, `Notificacion` y `PrediccionDemanda`.

Tambien se utilizan repositorios basados en `JpaRepository`, consultas personalizadas y bloqueo pesimista con `@Lock(LockModeType.PESSIMISTIC_WRITE)` para proteger operaciones criticas de stock.

**Justificacion:** reduce la cantidad de SQL manual, centraliza el acceso a datos y permite expresar reglas de persistencia de forma mantenible.

### Spring Security

**Dependencia:** `spring-boot-starter-security`

Se usa para proteger los endpoints del backend mediante autenticacion y autorizacion por roles. La configuracion se encuentra en `SecurityConfig`, donde se restringen rutas segun los roles `ADMINISTRADOR`, `OPERARIO` y `GERENTE`.

Tambien se usa `BCryptPasswordEncoder` para cifrar contrasenas.

**Justificacion:** el sistema maneja operaciones sensibles, como usuarios, inventario, pedidos y reportes. Por eso requiere control de acceso robusto y separacion de permisos.

### Spring Validation

**Dependencia:** `spring-boot-starter-validation`

Se usa para validar datos de entrada en DTOs y entidades mediante anotaciones como `@NotBlank`, `@NotNull`, `@Email`, `@Min`, `@Size` y `@Valid`.

Ejemplos de uso aparecen en `LoginRequestDTO`, `RegisterRequestDTO`, `ProductoCreateDTO`, `MovimientoRequestDTO`, `PedidoCreateDTO` y `PedidoItemDTO`.

**Justificacion:** evita que datos invalidos lleguen a la capa de negocio o a la base de datos. Mejora la consistencia y reduce errores operativos.

### JJWT

**Dependencias:** `jjwt-api`, `jjwt-impl`, `jjwt-jackson`

Se usa para generar, firmar y validar tokens JWT. La clase `JwtUtil` genera tokens con datos como email, ID de usuario, rol, fecha de emision y expiracion.

El filtro `JwtAuthFilter` permite validar el token enviado por el frontend en cada solicitud protegida.

**Justificacion:** permite una autenticacion stateless, adecuada para aplicaciones web modernas donde el frontend y backend estan desacoplados.

### PostgreSQL Driver

**Dependencia:** `postgresql`

Es el driver JDBC que permite a Spring Boot conectarse con PostgreSQL.

**Justificacion:** PostgreSQL es la base de datos central del sistema, por lo que el driver es necesario para ejecutar operaciones de lectura, escritura, transacciones y consultas JPA.

### Lombok

**Dependencia:** `lombok`

Se usa para reducir codigo repetitivo mediante anotaciones como `@Data`, `@RequiredArgsConstructor`, `@Builder`, `@Getter`, `@NoArgsConstructor` y `@AllArgsConstructor`.

En SGIP aparece de forma amplia en entidades, DTOs, controladores y servicios.

**Justificacion:** mejora la productividad y reduce ruido en clases simples. Sin embargo, debe usarse con criterio en entidades JPA para evitar problemas con metodos generados automaticamente en relaciones complejas.

### Spring Mail

**Dependencia:** `spring-boot-starter-mail`

Se usa en `EmailService` mediante `JavaMailSender` y `SimpleMailMessage` para enviar correos relacionados con alertas o notificaciones.

**Justificacion:** el sistema contempla alertas de stock critico tanto visuales como por correo. Esta libreria permite integrar SMTP sin implementar manualmente el protocolo de correo.

### Bucket4j

**Dependencia:** `bucket4j-core`

Se usa en `RateLimitInterceptor` para limitar la frecuencia de solicitudes a endpoints sensibles, especificamente operaciones `POST` sobre pedidos y movimientos.

**Justificacion:** protege el sistema contra abuso, errores repetitivos del frontend o uso excesivo accidental de endpoints que modifican datos criticos.

### Apache POI

**Dependencia:** `poi-ooxml`

Esta dependencia esta declarada para la generacion de reportes Excel en formato `.xlsx`.

**Observacion verificada:** en la rama actual se encuentra declarada en `pom.xml`, y el frontend solicita reportes Excel mediante `/reportes/inventario` y `/reportes/pedidos`. Sin embargo, en el codigo fuente backend actual no se evidencia uso directo de clases de Apache POI, como `XSSFWorkbook`, `Workbook` o `Sheet`.

**Justificacion prevista:** es una libreria adecuada para generar reportes Excel de inventario, pedidos e historial operativo.

### Apache PDFBox

**Dependencia:** `pdfbox`

Esta dependencia esta declarada para la generacion de reportes PDF.

**Observacion verificada:** en la rama actual se encuentra declarada en `pom.xml`, y el frontend contempla descarga en formato PDF. Sin embargo, en el codigo fuente backend actual no se evidencia uso directo de clases como `PDDocument`, `PDPage` o `PDPageContentStream`.

**Justificacion prevista:** PDFBox es util para generar documentos PDF descargables, por ejemplo reportes de pedidos, inventario o resumen gerencial.

## 4. Librerias Usadas en el Frontend

### React

**Dependencia:** `react`

Se usa para construir la interfaz de usuario mediante componentes. Las paginas principales incluyen `Dashboard`, `Productos`, `Proveedores`, `Movimientos`, `Pedidos`, `Alertas`, `Notificaciones`, `Inteligencia`, `Reportes`, `Usuarios` y `Login`.

**Justificacion:** React permite construir una SPA modular, reutilizable y mantenible, adecuada para un sistema administrativo con varias pantallas y estados de interfaz.

### React DOM

**Dependencia:** `react-dom`

Se usa para renderizar la aplicacion React dentro del navegador mediante `createRoot`.

**Justificacion:** es necesario para montar la aplicacion React en el DOM real del navegador.

### React Router DOM

**Dependencia:** `react-router-dom`

Se usa para manejar rutas de la SPA, rutas protegidas y redirecciones. En `App.jsx` se definen rutas como `/login`, `/dashboard`, `/productos`, `/movimientos`, `/pedidos`, `/alertas`, `/inteligencia`, `/reportes`, `/usuarios`, `/proveedores` y `/notificaciones`.

**Justificacion:** permite separar vistas por modulo y aplicar proteccion por rol desde el frontend.

### Axios

**Dependencia:** `axios`

Se usa para consumir la API REST del backend. En `frontend/src/api/client.js` se configura una instancia con `baseURL: '/api/v1'`, interceptor para adjuntar el token JWT y manejo de respuestas `401` o `403`.

**Justificacion:** centraliza la comunicacion HTTP y evita repetir logica de autenticacion en cada pagina.

### Recharts

**Dependencia:** `recharts`

Se usa para mostrar graficos en el dashboard y en el modulo de inteligencia. Hay uso de componentes como `BarChart`, `PieChart`, `AreaChart`, `ResponsiveContainer`, `XAxis`, `YAxis`, `Tooltip`, `Legend` y `Cell`.

**Justificacion:** facilita la visualizacion de metricas de inventario, pedidos, ventas y predicciones, lo cual es clave para el rol gerencial.

### Vite

**Dependencia de desarrollo:** `vite`

Se usa como herramienta de desarrollo y construccion del frontend.

**Justificacion:** ofrece arranque rapido, recarga eficiente en desarrollo y empaquetado optimizado para produccion.

### Plugin React para Vite

**Dependencia de desarrollo:** `@vitejs/plugin-react`

Permite integrar React correctamente dentro del entorno Vite.

**Justificacion:** habilita el soporte necesario para compilar y desarrollar componentes React usando Vite.

## 5. Librerias Usadas en el Modulo IA

### Streamlit

**Dependencia:** `streamlit`

Se usa en `ia_prediccion.py` para crear una interfaz simple del modulo de prediccion. Permite mostrar datos historicos, metricas, graficos y resultados del modelo.

**Justificacion:** acelera el desarrollo de prototipos de analisis de datos y permite validar visualmente las predicciones.

### Requests

**Dependencia:** `requests`

Se usa para consumir el endpoint protegido del backend `/api/v1/inteligencia/datos-entrenamiento` y obtener movimientos historicos de tipo salida. Tambien se usa para enviar las predicciones calculadas al endpoint `/api/v1/inteligencia/predicciones`.

**Justificacion:** permite desacoplar el modulo IA de la base de datos directa, comunicandose mediante API REST autenticada.

### Pandas

**Dependencia:** `pandas`

Se usa para convertir los datos recibidos en un `DataFrame`, transformar fechas, agrupar ventas por producto y semana, y preparar datos de entrenamiento.

**Justificacion:** es una herramienta estandar para limpieza, transformacion y analisis de datos tabulares.

### Scikit-learn

**Dependencia:** `scikit-learn`

Se usa mediante `LinearRegression` para entrenar un modelo de regresion lineal por producto y estimar la demanda de la siguiente semana.

**Justificacion:** permite implementar modelos predictivos de forma sencilla y validable. Para el alcance academico actual, una regresion lineal es entendible, explicable y suficiente como primera aproximacion.

### NumPy

**Dependencia:** `numpy`

Se importa en el modulo IA como soporte para calculos numericos.

**Justificacion:** es una dependencia comun en procesamiento numerico y ciencia de datos. Aunque su uso directo actual es limitado, suele ser necesaria junto con pandas y scikit-learn.

### Persistencia de predicciones via backend

El modulo IA no requiere conexion directa a PostgreSQL. Luego de entrenar el modelo, envia la prediccion al backend usando `requests` y el endpoint `/api/v1/inteligencia/predicciones`.

**Justificacion:** mantiene el backend como punto unico de validacion, autorizacion y persistencia, evitando credenciales de base de datos dentro del modulo Python.

## 6. Dependencias Declaradas con Uso Parcial o Pendiente de Confirmacion

### Apache POI y PDFBox

Las dependencias de Excel y PDF estan declaradas y el frontend contempla descargas de reportes, pero el codigo fuente backend actual no muestra la implementacion de generacion de archivos.

Desde una perspectiva arquitectonica, esto significa que el modulo esta disenado y preparado, pero se debe verificar que en la rama final existan las clases responsables de generar y exponer los reportes, por ejemplo:

- `ReporteController`
- `ReporteService`
- `ReporteRepository`
- `ReporteDTO`
- Generadores para Excel y PDF

Recomendacion: antes de presentar RF-09 como funcional, asegurar que el backend de reportes este presente en la rama final y que tenga pruebas manuales o automaticas de descarga.

## 7. Observaciones Arquitectonicas

### Buena separacion modular

El backend esta organizado por funcionalidades como seguridad, productos, movimientos, pedidos, alertas, notificaciones, inteligencia y dashboard. Esta organizacion es adecuada para un monolito modular porque facilita ubicar reglas de negocio por dominio.

### Seguridad bien orientada, pero mejorable

El uso de Spring Security, JWT y BCrypt es correcto. El endpoint `/api/v1/inteligencia/datos-entrenamiento` esta protegido por roles `ADMINISTRADOR` y `GERENTE`, por lo que el modulo IA debe autenticarse antes de extraer historicos.

Recomendacion: en produccion, usar un token emitido para un usuario autorizado o credenciales operativas controladas para el modulo IA.

### Manejo de stock con criterio transaccional

El uso de `@Transactional` y bloqueo pesimista en productos es positivo para evitar inconsistencias de inventario en operaciones concurrentes.

Recomendacion: complementar con pruebas de concurrencia o pruebas de integracion que validen salidas simultaneas de stock.

### Rate limiting presente, pero en memoria

Bucket4j se usa correctamente para limitar operaciones sensibles. Sin embargo, el almacenamiento actual del limite esta en memoria mediante `ConcurrentHashMap`.

Esto funciona para una instancia unica, pero en despliegues con multiples instancias cada nodo tendria sus propios contadores.

Recomendacion: si el sistema escala horizontalmente, usar un backend distribuido para rate limiting, por ejemplo Redis.

### Frontend funcional, pero podria mejorar la gestion de datos remotos

Axios esta correctamente centralizado, pero cada pagina maneja estados de carga, error y recarga manualmente.

Recomendacion: considerar TanStack Query para cache, reintentos, invalidacion y sincronizacion de datos remotos.

### Modulo IA simple y explicable

El uso de regresion lineal es adecuado como primer modelo porque es entendible para exposicion academica y permite justificar facilmente el calculo.

Recomendacion: para evolucion futura, comparar el modelo con medias moviles, Random Forest, Prophet o modelos de series temporales si se dispone de mas datos.

## 8. Librerias Recomendadas para Anadir

| Libreria | Componente | Prioridad | Para que serviria |
|---|---|---|---|
| `springdoc-openapi` | Backend | Alta | Generar documentacion Swagger/OpenAPI de los endpoints. |
| `flyway` | Backend/BD | Alta | Versionar cambios de base de datos mediante migraciones. |
| `spring-boot-starter-actuator` | Backend | Alta | Exponer health checks, metricas y estado de la aplicacion. |
| `testcontainers` | Backend | Media | Probar repositorios y servicios usando PostgreSQL real en contenedores. |
| `mapstruct` | Backend | Media | Automatizar mapeo entre entidades y DTOs. |
| `resilience4j` | Backend | Media | Agregar reintentos, timeouts y circuit breakers ante servicios externos. |
| `sentry` | Backend/Frontend | Media | Capturar errores en produccion y facilitar diagnostico. |
| `tanstack-query` | Frontend | Alta | Mejorar carga, cache, reintentos e invalidacion de datos de API. |
| `react-hook-form` | Frontend | Media | Simplificar formularios complejos y validaciones. |
| `zod` | Frontend | Media | Validar esquemas de formularios y respuestas de API. |
| `date-fns` | Frontend | Baja | Formatear y manipular fechas de forma consistente. |
| `pytest` | IA | Alta | Agregar pruebas automatizadas al modulo Python. |
| `joblib` | IA | Media | Guardar y reutilizar modelos entrenados. |
| `matplotlib` o `plotly` | IA | Baja | Mejorar visualizaciones analiticas del modulo predictivo. |

## 9. Prioridad Recomendada de Incorporacion

### Prioridad 1: documentacion y operacion

Las primeras librerias recomendadas son `springdoc-openapi`, `flyway` y `spring-boot-starter-actuator`.

Estas tres cubren necesidades criticas:

- Documentar endpoints para frontend, pruebas y exposicion academica.
- Versionar correctamente la base de datos.
- Monitorear estado y salud del backend.

### Prioridad 2: calidad y pruebas

Luego conviene incorporar `testcontainers` y `pytest`.

Esto permitiria probar reglas importantes como:

- Login y generacion de JWT.
- Registro de movimientos.
- Descuento atomico de stock en pedidos.
- Bloqueo pesimista de productos.
- Registro de predicciones mediante el backend.

### Prioridad 3: experiencia frontend

Despues conviene evaluar `tanstack-query`, `react-hook-form` y `zod`.

Estas librerias ayudarian a reducir codigo repetido en pantallas con formularios y consultas frecuentes.

## 10. Conclusion

Las librerias seleccionadas para SGIP son coherentes con una arquitectura web moderna basada en React, Spring Boot, PostgreSQL y Python. Spring Boot aporta una base solida para API REST, seguridad y persistencia; React permite una interfaz modular; y Python facilita la prediccion de demanda mediante herramientas de ciencia de datos.

Desde el punto de vista arquitectonico, el proyecto tiene una buena base tecnica. Las mejoras mas importantes no pasan por cambiar el stack principal, sino por fortalecer documentacion, migraciones de base de datos, monitoreo, pruebas automatizadas y proteccion de integraciones internas.

La principal observacion detectada es el modulo de reportes: las dependencias, la base de datos y el frontend contemplan Excel/PDF, pero en la rama actual debe verificarse que la implementacion backend completa este presente antes de considerarlo cerrado tecnicamente.
