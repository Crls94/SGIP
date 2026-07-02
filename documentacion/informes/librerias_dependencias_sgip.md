# Librerias, Dependencias y Tecnologias del Proyecto SGIP

## 1. Objetivo del documento

Este documento describe las librerias, dependencias y tecnologias utilizadas en el proyecto **SGIP - Sistema de Gestion Inteligente de Inventarios y Pedidos para Metro Ica**. Para cada tecnologia se explica:

- Que es.
- Para que se usa dentro del proyecto.
- Por que fue incorporada.
- Que valor aporta al sistema.
- A que requerimiento funcional o no funcional contribuye.

Tambien se incluyen recomendaciones de librerias que podrian agregarse en una evolucion futura para mejorar documentacion, seguridad, monitoreo, pruebas, mantenibilidad y experiencia de desarrollo.

La referencia funcional principal es el documento **Avance V4.0_markdown.docx**. La verificacion tecnica se realizo sobre:

- Backend: `pom.xml` y `src/main/java`.
- Frontend: `frontend/package.json` y `frontend/src`.
- Modulo IA: `requirements.txt` e `ia_prediccion.py`.
- Configuracion: `application.properties` y `frontend/vite.config.js`.

## 2. Resumen tecnologico del proyecto

SGIP esta compuesto por tres bloques principales:

| Componente | Tecnologia principal | Funcion en SGIP |
|---|---|---|
| Backend | Java 21 + Spring Boot | API REST, seguridad, reglas de negocio, persistencia, reportes y notificaciones. |
| Frontend | React + Vite | Interfaz web para administradores, operarios y gerentes. |
| Base de datos | PostgreSQL | Almacenamiento centralizado de usuarios, productos, pedidos, movimientos, alertas, predicciones y reportes. |
| Modulo IA | Python | Prediccion semanal de demanda a partir de movimientos historicos de salida. |

El sistema implementado se entiende como un **monolito modular en backend**, una **SPA en frontend** y un **modulo IA desacoplado**. Esta estructura es coherente con el alcance academico del proyecto y con los requerimientos de Avance V4.0.

## 3. Relacion entre requerimientos y librerias

| RF | Requerimiento | Librerias / tecnologias principales |
|---|---|---|
| RF-01 | Autenticacion | Spring Security, BCrypt, JJWT, React Router, Axios. |
| RF-02 | Gestion de Productos | Spring WebMVC, Spring Data JPA, PostgreSQL, Validation, React. |
| RF-03 | Control de Stock | Spring Data JPA, transacciones, PostgreSQL, bloqueo pesimista. |
| RF-04 | Alertas de Stock Critico | Spring Mail, JPA, React, Axios. |
| RF-05 | Gestion de Pedidos | Spring WebMVC, JPA, Validation, React. |
| RF-06 | Cola de Pedidos Priorizada | JPA, consultas JPQL, React. |
| RF-07 | Pronostico de Demanda | Python, Streamlit, requests, pandas, scikit-learn, backend REST. |
| RF-08 | Dashboard Gerencial | React, Recharts, Axios, Spring WebMVC. |
| RF-09 | Reportes Exportables | Apache POI, PDFBox, Spring WebMVC. |

## 4. Librerias y dependencias del backend

### 4.1 Java 21

**Tecnologia:** Java 21  
**Declaracion:** `pom.xml`, propiedad `java.version`.

Java es el lenguaje usado para el backend del sistema. Permite construir una API robusta, tipada y mantenible.

**Para que se usa en SGIP:**

- Implementar controladores REST.
- Definir servicios con reglas de negocio.
- Modelar entidades como `Producto`, `Pedido`, `Usuario`, `InventarioMovimiento`, `Reporte`.
- Integrar seguridad, persistencia, reportes y correo.

**Por que se usa:**

Java es una tecnologia madura para aplicaciones empresariales. En un sistema como SGIP, donde existen reglas transaccionales sensibles como descuento de stock y creacion atomica de pedidos, Java aporta estabilidad, tipado fuerte y amplio soporte de frameworks.

### 4.2 Spring Boot

**Tecnologia:** Spring Boot 4.0.5  
**Declaracion:** `spring-boot-starter-parent` en `pom.xml`.

Spring Boot es el framework base del backend. Simplifica la configuracion de aplicaciones Java y permite integrar facilmente web, seguridad, persistencia, validacion y correo.

**Para que se usa en SGIP:**

- Levantar la aplicacion backend.
- Configurar beans, inyeccion de dependencias y servicios.
- Integrar Spring MVC, Security, JPA, Validation y Mail.
- Ejecutar el backend como servicio REST.

**Por que se usa:**

Reduce configuracion manual, acelera el desarrollo y ofrece una arquitectura ordenada para sistemas empresariales. Para SGIP, permite concentrarse en las reglas del negocio: inventario, pedidos, alertas y predicciones.

### 4.3 Spring Boot Starter WebMVC

**Dependencia:** `spring-boot-starter-webmvc`

Esta libreria permite construir la API REST del backend.

**Para que se usa en SGIP:**

- Crear endpoints HTTP.
- Responder en JSON o archivos descargables.
- Recibir parametros, rutas y cuerpos de solicitud.
- Exponer modulos como productos, pedidos, movimientos, reportes e inteligencia.

**Evidencia en codigo:**

- `@RestController`
- `@RequestMapping`
- `@GetMapping`
- `@PostMapping`
- `@PutMapping`
- `@PatchMapping`
- `@DeleteMapping`
- `ResponseEntity`

**Por que se incorporo:**

Avance V4.0 define que el sistema debe ser web, con frontend React y backend Spring Boot. WebMVC es la base para que el frontend consuma datos mediante API REST.

**RF relacionados:** RF-01 a RF-09.

### 4.4 Spring Data JPA

**Dependencia:** `spring-boot-starter-data-jpa`

Spring Data JPA facilita el acceso a la base de datos usando entidades y repositories.

**Para que se usa en SGIP:**

- Mapear clases Java a tablas PostgreSQL.
- Implementar repositories como DAO.
- Ejecutar consultas personalizadas.
- Gestionar transacciones.
- Aplicar bloqueo pesimista en operaciones de stock.

**Entidades principales:**

- `Usuario`
- `Sesion`
- `Producto`
- `Categoria`
- `Proveedor`
- `InventarioMovimiento`
- `Pedido`
- `PedidoDetalle`
- `AlertaStock`
- `Notificacion`
- `PrediccionDemanda`
- `Reporte`

**Repositories principales:**

- `ProductoRepository`
- `MovimientoRepository`
- `PedidoRepository`
- `UsuarioRepository`
- `ReporteRepository`

**Por que se incorporo:**

SGIP necesita persistencia transaccional confiable. JPA evita escribir SQL repetitivo y permite mantener las consultas agrupadas por modulo.

**RF relacionados:** RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08, RF-09.

### 4.5 PostgreSQL Driver

**Dependencia:** `postgresql`

Es el driver JDBC que permite al backend conectarse con PostgreSQL.

**Para que se usa en SGIP:**

- Conectar Spring Boot con `metroDB`.
- Ejecutar operaciones JPA.
- Leer y escribir datos transaccionales.
- Validar el esquema mediante `spring.jpa.hibernate.ddl-auto=validate`.

**Por que se incorporo:**

PostgreSQL es la base central del sistema. El driver es obligatorio para que Java pueda comunicarse con ella.

**RF relacionados:** todos los requerimientos que dependen de persistencia.

### 4.6 Spring Security

**Dependencia:** `spring-boot-starter-security`

Spring Security protege la API mediante autenticacion y autorizacion.

**Para que se usa en SGIP:**

- Proteger endpoints por rol.
- Configurar sesiones stateless.
- Validar tokens JWT en cada solicitud.
- Restringir operaciones administrativas.
- Usar `BCryptPasswordEncoder` para contrasenas.

**Ejemplos de reglas:**

- `/api/v1/auth/login` es publico.
- `/api/v1/auth/register` requiere `ADMINISTRADOR`.
- `/api/v1/dashboard/**` requiere `ADMINISTRADOR` o `GERENTE`.
- `/api/v1/reportes/**` requiere `ADMINISTRADOR` o `GERENTE`.
- `/api/v1/movimientos/**` requiere `ADMINISTRADOR` u `OPERARIO`.

**Por que se incorporo:**

El sistema gestiona informacion sensible: inventario, usuarios, pedidos, reportes y predicciones. Se requiere control de acceso para evitar modificaciones no autorizadas.

**RF relacionado:** RF-01.

### 4.7 BCrypt

**Incluido por:** Spring Security.

BCrypt es el algoritmo usado para hashear contrasenas.

**Para que se usa en SGIP:**

- Guardar contrasenas de usuarios como hash.
- Evitar almacenamiento de contrasenas en texto plano.
- Validar credenciales durante login.

**Por que se incorporo:**

Avance V4.0 menciona explicitamente BCrypt como mecanismo de seguridad. Es adecuado porque es lento de forma controlada y resistente a ataques de fuerza bruta.

**RF/RNF relacionado:** RF-01 y requerimiento no funcional de seguridad.

### 4.8 JJWT

**Dependencias:**

- `jjwt-api`
- `jjwt-impl`
- `jjwt-jackson`

JJWT permite generar, firmar, parsear y validar tokens JWT.

**Para que se usa en SGIP:**

- Generar token al iniciar sesion.
- Incluir claims como email, userId y rol.
- Validar tokens en `JwtAuthFilter`.
- Mantener autenticacion stateless entre frontend y backend.

**Por que se incorporo:**

El frontend React esta desacoplado del backend. JWT permite que cada solicitud lleve su autenticacion sin depender de sesiones tradicionales en servidor.

**RF relacionado:** RF-01.

### 4.9 Spring Validation

**Dependencia:** `spring-boot-starter-validation`

Permite validar DTOs y entidades mediante anotaciones.

**Para que se usa en SGIP:**

- Validar login y registro.
- Validar productos.
- Validar movimientos.
- Validar pedidos e items.
- Validar roles.

**Anotaciones usadas:**

- `@Valid`
- `@NotBlank`
- `@NotNull`
- `@Email`
- `@Min`
- `@Max`
- `@Size`
- `@PositiveOrZero`

**Por que se incorporo:**

Evita que datos invalidos lleguen a la logica de negocio o a la base de datos. En un sistema de inventario, una cantidad negativa o un producto sin proveedor podria generar inconsistencias operativas.

**RF relacionados:** RF-01, RF-02, RF-03, RF-05.

### 4.10 Lombok

**Dependencia:** `lombok`

Lombok reduce codigo repetitivo en Java.

**Para que se usa en SGIP:**

- Generar getters y setters.
- Generar constructores.
- Facilitar inyeccion de dependencias con `@RequiredArgsConstructor`.
- Crear builders en DTOs.
- Agregar logging con `@Slf4j`.

**Anotaciones usadas:**

- `@Data`
- `@RequiredArgsConstructor`
- `@Builder`
- `@Getter`
- `@NoArgsConstructor`
- `@AllArgsConstructor`
- `@Slf4j`

**Por que se incorporo:**

El backend tiene muchas entidades, DTOs y servicios. Lombok reduce ruido y permite que las clases se enfoquen en estructura y comportamiento.

**Observacion:**

En entidades JPA debe usarse con criterio, especialmente `@Data`, porque genera `equals`, `hashCode` y `toString`, lo cual puede ser delicado si existen relaciones bidireccionales o lazy loading.

### 4.11 Spring Mail

**Dependencia:** `spring-boot-starter-mail`

Permite enviar correos mediante SMTP.

**Para que se usa en SGIP:**

- Enviar correos de alerta o notificacion.
- Complementar las alertas visuales del sistema.
- Cumplir RF-04: alertas visuales y por correo.

**Codigo relacionado:**

- `EmailService`
- `JavaMailSender`
- `SimpleMailMessage`

**Por que se incorporo:**

El documento Avance V4.0 exige alertas de stock critico. El correo permite que responsables reciban avisos incluso sin estar mirando el sistema.

**Observacion:**

El servicio esta implementado, pero el envio real depende de configurar variables SMTP como `MAIL_HOST`, `MAIL_USERNAME` y `MAIL_PASSWORD`.

### 4.12 Bucket4j

**Dependencia:** `bucket4j-core`

Bucket4j permite limitar la cantidad de solicitudes a endpoints sensibles.

**Para que se usa en SGIP:**

- Limitar `POST /api/v1/pedidos`.
- Limitar `POST /api/v1/movimientos`.
- Evitar abuso o repeticion accidental de operaciones criticas.

**Codigo relacionado:**

- `RateLimitInterceptor`
- `WebConfig`

**Por que se incorporo:**

Pedidos y movimientos modifican stock. Si el frontend envia muchas solicitudes repetidas, podria generar carga innecesaria o errores operativos. Bucket4j reduce ese riesgo.

**Observacion:**

Actualmente el limite esta en memoria con `ConcurrentHashMap`. Es adecuado para una sola instancia, pero si el sistema escala horizontalmente se recomienda usar Redis u otro backend distribuido.

### 4.13 Apache POI

**Dependencia:** `poi-ooxml`

Apache POI permite generar archivos Excel `.xlsx` desde Java.

**Para que se usa en SGIP:**

- Generar reporte Excel de inventario.
- Generar reporte Excel de pedidos.
- Crear hojas, filas y celdas desde `ReporteService`.

**Codigo relacionado:**

- `Workbook`
- `Sheet`
- `Row`
- `XSSFWorkbook`
- `ReporteService.generarInventarioExcel`
- `ReporteService.generarPedidosExcel`

**Por que se incorporo:**

RF-09 exige reportes exportables en Excel o PDF. Excel es util para gerencia porque permite filtrar, ordenar, calcular y compartir informacion operativa.

**RF relacionado:** RF-09.

### 4.14 Apache PDFBox

**Dependencia:** `pdfbox`

PDFBox permite generar documentos PDF desde Java.

**Para que se usa en SGIP:**

- Generar reporte PDF de inventario.
- Generar reporte PDF de pedidos.
- Crear paginas, texto y contenido descargable.

**Codigo relacionado:**

- `PDDocument`
- `PDPage`
- `PDPageContentStream`
- `PDType1Font`
- `Standard14Fonts`
- `ReporteService.generarInventarioPDF`
- `ReporteService.generarPedidosPDF`

**Por que se incorporo:**

PDF es adecuado para reportes formales, envio a gerencia o conservacion como evidencia documental. A diferencia de Excel, PDF mantiene formato fijo.

**RF relacionado:** RF-09.

### 4.15 Dependencias de test de Spring Boot

**Dependencias:**

- `spring-boot-starter-data-jpa-test`
- `spring-boot-starter-security-test`
- `spring-boot-starter-validation-test`
- `spring-boot-starter-webmvc-test`

**Para que se usan o podrian usarse en SGIP:**

- Probar repositories y persistencia.
- Probar seguridad y roles.
- Probar validaciones de DTOs.
- Probar endpoints REST.

**Pruebas existentes:**

- `JwtUtilTest`
- `UsuarioPrincipalTest`
- `SgipBackendApplicationTests`

**Por que se incorporaron:**

El sistema tiene reglas sensibles como autenticacion, stock y pedidos. Las pruebas ayudan a evitar regresiones.

## 5. Librerias y dependencias del frontend

### 5.1 React

**Dependencia:** `react`

React es la libreria principal para construir la interfaz de usuario.

**Para que se usa en SGIP:**

- Crear pantallas modulares.
- Manejar estado local de formularios, tablas y modales.
- Renderizar la SPA administrativa.
- Separar componentes reutilizables.

**Paginas principales:**

- Login
- Dashboard
- Productos
- Proveedores
- Movimientos
- Pedidos
- Alertas
- Notificaciones
- Inteligencia
- Reportes
- Usuarios

**Por que se incorporo:**

Avance V4.0 exige una interfaz web intuitiva, responsiva y accesible desde distintos dispositivos. React permite construir esa interfaz mediante componentes.

**RF relacionados:** todos los RF con interaccion del usuario.

### 5.2 React DOM

**Dependencia:** `react-dom`

React DOM permite montar React en el DOM del navegador.

**Para que se usa en SGIP:**

- Renderizar la aplicacion en `main.jsx`.
- Usar `ReactDOM.createRoot` para iniciar la SPA.

**Por que se incorporo:**

React necesita React DOM para ejecutarse en navegador web.

### 5.3 React Router DOM

**Dependencia:** `react-router-dom`

Permite manejar rutas del frontend sin recargar la pagina.

**Para que se usa en SGIP:**

- Definir rutas como `/login`, `/dashboard`, `/productos`, `/pedidos`, `/reportes`.
- Proteger rutas por rol.
- Redirigir usuarios no autenticados.
- Navegar desde sidebar y topbar.

**Codigo relacionado:**

- `BrowserRouter`
- `Routes`
- `Route`
- `Navigate`
- `useNavigate`
- `NavLink`

**Por que se incorporo:**

SGIP tiene multiples modulos. React Router permite que cada modulo tenga su ruta y que la navegacion sea fluida.

**RF relacionados:** RF-01 a RF-09.

### 5.4 Axios

**Dependencia:** `axios`

Axios es el cliente HTTP usado por el frontend para consumir la API REST.

**Para que se usa en SGIP:**

- Ejecutar `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Enviar token JWT en cada solicitud.
- Descargar archivos tipo blob para reportes.
- Manejar errores 401/403.

**Codigo relacionado:**

- `frontend/src/api/client.js`
- `baseURL: '/api/v1'`
- Interceptor de request para Authorization Bearer.
- Interceptor de response para limpiar sesion si hay 401/403.

**Por que se incorporo:**

Centraliza la comunicacion HTTP y evita repetir logica de autenticacion en cada pagina.

**RF relacionados:** todos los modulos que consumen API.

### 5.5 Recharts

**Dependencia:** `recharts`

Recharts permite construir graficos en React.

**Para que se usa en SGIP:**

- Mostrar graficos del dashboard.
- Mostrar tendencias y predicciones.
- Visualizar pedidos por estado/canal.
- Visualizar ventas y stock.

**Componentes usados:**

- `BarChart`
- `PieChart`
- `AreaChart`
- `ResponsiveContainer`
- `XAxis`
- `YAxis`
- `Tooltip`
- `Legend`
- `Cell`

**Por que se incorporo:**

RF-08 exige dashboard gerencial con metricas. Los graficos ayudan a interpretar rapidamente la situacion operativa.

**RF relacionado:** RF-08 y RF-07.

### 5.6 Vite

**Dependencia de desarrollo:** `vite`

Vite es la herramienta de desarrollo y build del frontend.

**Para que se usa en SGIP:**

- Levantar servidor de desarrollo en puerto 3000.
- Compilar el frontend para produccion.
- Usar proxy `/api` hacia `localhost:8080`.
- Mejorar velocidad de recarga durante desarrollo.

**Por que se incorporo:**

Vite es rapido, simple y adecuado para proyectos React modernos.

### 5.7 Plugin React para Vite

**Dependencia de desarrollo:** `@vitejs/plugin-react`

Permite integrar React correctamente con Vite.

**Para que se usa en SGIP:**

- Habilitar compilacion de JSX.
- Integrar React con el flujo de desarrollo de Vite.

**Por que se incorporo:**

Es necesario para que el frontend React funcione correctamente dentro de Vite.

## 6. Librerias del modulo IA

### 6.1 Python

Python es el lenguaje usado para el modulo de prediccion.

**Para que se usa en SGIP:**

- Consumir datos historicos del backend.
- Transformar movimientos de salida en series semanales.
- Entrenar un modelo de regresion lineal.
- Guardar predicciones en PostgreSQL.

**Por que se incorporo:**

Python es el lenguaje mas usado en ciencia de datos y machine learning. Permite construir prototipos predictivos de forma rapida y clara.

### 6.2 Streamlit

**Dependencia:** `streamlit`

Streamlit permite crear una interfaz web simple para scripts de datos.

**Para que se usa en SGIP:**

- Mostrar interfaz del modulo IA.
- Mostrar mensajes de carga, error y exito.
- Presentar tablas historicas.
- Mostrar graficos de ventas semanales.
- Mostrar metricas de prediccion.

**Por que se incorporo:**

Permite validar visualmente el modelo predictivo sin construir una aplicacion frontend separada para IA.

**RF relacionado:** RF-07.

### 6.3 Requests

**Dependencia:** `requests`

Requests permite consumir endpoints HTTP desde Python.

**Para que se usa en SGIP:**

- Consultar `http://localhost:8080/api/v1/inteligencia/datos-entrenamiento`.
- Obtener movimientos historicos de salida.
- Mantener desacoplado el modulo IA del backend.

**Por que se incorporo:**

El modulo IA no accede directamente al backend Java por clases internas. Se comunica por REST, como cualquier cliente externo.

**RF relacionado:** RF-07.

### 6.4 Pandas

**Dependencia:** `pandas`

Pandas permite manipular datos tabulares.

**Para que se usa en SGIP:**

- Convertir JSON del backend a `DataFrame`.
- Transformar fechas.
- Agrupar ventas por producto y semana.
- Calcular series historicas de demanda.
- Preparar variables para el modelo.

**Por que se incorporo:**

La prediccion requiere limpiar y agrupar datos historicos. Pandas es la herramienta mas adecuada para ese procesamiento.

**RF relacionado:** RF-07.

### 6.5 Scikit-learn

**Dependencia:** `scikit-learn`

Scikit-learn ofrece algoritmos de machine learning.

**Para que se usa en SGIP:**

- Entrenar `LinearRegression`.
- Predecir demanda de la siguiente semana.
- Calcular `R2` como indicador de ajuste del modelo.

**Por que se incorporo:**

Avance V4.0 menciona regresion lineal para series temporales. Scikit-learn permite implementar este modelo de forma sencilla, explicable y aceptable para un proyecto academico.

**RF relacionado:** RF-07.

### 6.6 NumPy

**Dependencia:** `numpy`

NumPy es una libreria de calculo numerico.

**Para que se usa en SGIP:**

- Actualmente esta importada como `np`, pero no tiene uso directo fuerte en el script actual.
- Actua como soporte comun del ecosistema de pandas y scikit-learn.

**Por que se incorporo:**

Es frecuente en proyectos de datos y machine learning. Puede ser util para futuras transformaciones numericas, arreglos y calculos estadisticos.

**Observacion:**

Si se quiere mantener el script limpio, podria eliminarse el import directo mientras no se use. Si se planea evolucionar el modelo, puede mantenerse justificado como dependencia numerica.

### 6.7 Persistencia de predicciones via backend

El modulo IA usa `requests` para enviar las predicciones al backend mediante `/api/v1/inteligencia/predicciones`.

**Para que se usa en SGIP:**

- Enviar `productoId`, `semanaInicio`, `cantidadPredicha`, `confianza` y `modeloVersion` al backend.
- Permitir que Spring Boot valide y persista en `predicciones_demanda`.
- Evitar credenciales directas de PostgreSQL dentro del modulo Python.

**Por que se incorporo:**

El backend queda como punto unico de autorizacion, validacion y persistencia de predicciones, manteniendo el flujo IA dentro del alcance REST del sistema.

**RF relacionado:** RF-07.

## 7. Observaciones tecnicas actuales

### 7.1 Reportes implementados

El modulo de reportes esta implementado.

Se verifico la existencia de:

- `ReporteController`
- `ReporteService`
- `ReporteRepository`
- `ReporteDTO`
- `Reporte`

Tambien se verifico uso real de:

- Apache POI para Excel.
- PDFBox para PDF.

Por tanto, RF-09 puede considerarse implementado a nivel tecnico.

### 7.2 Endpoint IA protegido

El endpoint `/api/v1/inteligencia/datos-entrenamiento` esta protegido por roles `ADMINISTRADOR` y `GERENTE`.

Esto permite la integracion con Python sin exponer historicos de venta de forma publica. Para produccion se recomienda usar:

- token JWT de un usuario autorizado.
- credenciales operativas controladas.
- red privada cuando aplique.
- rate limiting.

### 7.3 Rate limiting en memoria

Bucket4j usa `ConcurrentHashMap` en memoria.

Esto es suficiente para una instancia local, pero no para multiples instancias en cloud. Si el sistema escala, conviene usar Redis u otro almacenamiento compartido.

### 7.4 Base de datos con `ddl-auto=validate`

La configuracion JPA usa:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

Esto es positivo porque evita que Hibernate modifique automaticamente el esquema. Sin embargo, exige tener migraciones o scripts SQL controlados.

Por eso se recomienda Flyway.

### 7.5 Pruebas aun limitadas

Existen pruebas para JWT y `UsuarioPrincipal`, pero faltan pruebas para reglas criticas:

- Salidas sin stock suficiente.
- Creacion atomica de pedidos.
- Reportes Excel/PDF.
- Alertas de stock.
- Predicciones IA.

## 8. Librerias recomendadas para evolucion futura

### 8.1 Springdoc OpenAPI

**Libreria:** `springdoc-openapi`  
**Componente:** Backend  
**Prioridad:** Alta

**Para que serviria:**

- Generar documentacion Swagger/OpenAPI.
- Probar endpoints desde navegador.
- Facilitar exposicion academica.
- Ayudar al frontend a conocer contratos de API.

**Por que conviene en SGIP:**

SGIP tiene muchos endpoints: autenticacion, productos, movimientos, pedidos, reportes, dashboard e inteligencia. Swagger permitiria documentarlos de forma clara.

### 8.2 Flyway

**Libreria:** `flyway-core`  
**Componente:** Backend / Base de datos  
**Prioridad:** Alta

**Para que serviria:**

- Versionar scripts SQL.
- Controlar cambios de tablas, indices, enums y restricciones.
- Evitar inconsistencias entre ambientes.

**Por que conviene en SGIP:**

El proyecto usa PostgreSQL con enums, relaciones y tablas transaccionales. Con `ddl-auto=validate`, Flyway es una solucion natural para mantener el esquema.

### 8.3 Spring Boot Actuator

**Libreria:** `spring-boot-starter-actuator`  
**Componente:** Backend  
**Prioridad:** Alta

**Para que serviria:**

- Exponer health checks.
- Revisar estado de la aplicacion.
- Monitorear metricas basicas.
- Integrarse con plataformas cloud.

**Por que conviene en SGIP:**

Avance V4.0 menciona disponibilidad del 99%. Actuator ayuda a monitorear si el backend esta vivo y listo.

### 8.4 Testcontainers

**Libreria:** `testcontainers`  
**Componente:** Backend  
**Prioridad:** Media/Alta

**Para que serviria:**

- Ejecutar pruebas con PostgreSQL real en contenedores.
- Probar repositories y transacciones.
- Validar bloqueo pesimista y reglas de stock.

**Por que conviene en SGIP:**

Las reglas de inventario dependen del comportamiento real de PostgreSQL. Testcontainers daria mas confianza que usar mocks.

### 8.5 MapStruct

**Libreria:** `mapstruct`  
**Componente:** Backend  
**Prioridad:** Media

**Para que serviria:**

- Automatizar conversion entidad-DTO.
- Reducir codigo manual de mappers.
- Mantener tipado y rendimiento.

**Por que podria convenir:**

SGIP ya usa mapeo manual. Si crecen los DTOs, MapStruct puede reducir repeticion.

**Observacion:**

No es urgente porque el proyecto actual aun puede mantenerse con mappers manuales.

### 8.6 Resilience4j

**Libreria:** `resilience4j`  
**Componente:** Backend  
**Prioridad:** Media

**Para que serviria:**

- Timeouts.
- Reintentos.
- Circuit breakers.
- Proteccion ante servicios externos inestables.

**Por que podria convenir:**

Si el sistema empieza a depender de servicios externos como SMTP, cloud storage o un API IA separada, Resilience4j ayudaria a tolerar fallos.

### 8.7 Sentry

**Libreria:** Sentry Java / Sentry React  
**Componente:** Backend y Frontend  
**Prioridad:** Media

**Para que serviria:**

- Capturar errores en produccion.
- Registrar stack traces.
- Agrupar errores por frecuencia.
- Facilitar diagnostico.

**Por que conviene en SGIP:**

Un sistema con inventario y pedidos requiere trazabilidad ante errores. Sentry ayudaria a detectar fallos no visibles durante pruebas.

### 8.8 TanStack Query

**Libreria:** `@tanstack/react-query`  
**Componente:** Frontend  
**Prioridad:** Alta/Media

**Para que serviria:**

- Manejar cache de datos remotos.
- Reintentar solicitudes fallidas.
- Invalidar consultas tras crear/actualizar datos.
- Reducir codigo repetido de carga y error.

**Por que conviene en SGIP:**

Muchas paginas usan Axios manualmente con `loading`, `error` y `fetch`. TanStack Query centralizaria ese patron.

### 8.9 React Hook Form

**Libreria:** `react-hook-form`  
**Componente:** Frontend  
**Prioridad:** Media

**Para que serviria:**

- Manejar formularios de manera eficiente.
- Reducir estados manuales.
- Validar campos de productos, pedidos, usuarios y proveedores.

**Por que podria convenir:**

SGIP tiene muchos formularios. Esta libreria haria mas mantenible su gestion.

### 8.10 Zod

**Libreria:** `zod`  
**Componente:** Frontend  
**Prioridad:** Media

**Para que serviria:**

- Validar formularios.
- Definir esquemas de datos.
- Validar respuestas de API.

**Por que podria convenir:**

Complementa a React Hook Form y ayuda a evitar enviar datos invalidos al backend.

### 8.11 Date-fns

**Libreria:** `date-fns`  
**Componente:** Frontend  
**Prioridad:** Baja/Media

**Para que serviria:**

- Formatear fechas.
- Manejar rangos de fechas en reportes.
- Evitar inconsistencias de formato.

**Por que podria convenir:**

El proyecto trabaja con fechas en pedidos, predicciones, reportes y dashboard.

### 8.12 Pytest

**Libreria:** `pytest`  
**Componente:** Modulo IA  
**Prioridad:** Alta

**Para que serviria:**

- Probar transformaciones de datos.
- Probar agrupacion semanal.
- Probar guardado de predicciones.
- Validar comportamiento con datasets vacios o insuficientes.

**Por que conviene en SGIP:**

RF-07 depende de resultados confiables. Pytest ayudaria a validar que el modulo IA no falle con datos reales incompletos.

### 8.13 Joblib

**Libreria:** `joblib`  
**Componente:** Modulo IA  
**Prioridad:** Media

**Para que serviria:**

- Guardar modelos entrenados.
- Reutilizar modelos sin entrenar cada vez.
- Versionar modelos por fecha o producto.

**Por que podria convenir:**

Actualmente el modelo se entrena durante la ejecucion. Si el dataset crece, guardar modelos puede mejorar rendimiento.

### 8.14 Plotly o Matplotlib

**Libreria:** `plotly` o `matplotlib`  
**Componente:** Modulo IA  
**Prioridad:** Baja

**Para que serviria:**

- Mejorar visualizaciones analiticas.
- Comparar ventas historicas vs predicciones.
- Mostrar curvas de tendencia.

**Por que podria convenir:**

Streamlit ya puede graficar, pero Plotly permitiria visualizaciones mas interactivas.

### 8.15 Redis

**Tecnologia:** Redis  
**Componente:** Backend / Infraestructura  
**Prioridad:** Futuro

**Para que serviria:**

- Rate limiting distribuido.
- Cache de consultas frecuentes.
- Contadores compartidos entre instancias.

**Por que podria convenir:**

Si SGIP se despliega en varias instancias cloud, el rate limit en memoria dejaria de ser suficiente.

## 9. Priorizacion recomendada

### Prioridad 1: documentacion y operacion

Estas deberian ser las primeras incorporaciones:

- `springdoc-openapi`
- `flyway`
- `spring-boot-starter-actuator`

Motivo: documentan, estabilizan y monitorean el sistema.

### Prioridad 2: pruebas y calidad

Luego conviene agregar:

- `testcontainers`
- `pytest`

Motivo: validan reglas criticas de inventario, pedidos, seguridad e IA.

### Prioridad 3: experiencia frontend

Despues se recomienda evaluar:

- `@tanstack/react-query`
- `react-hook-form`
- `zod`

Motivo: reducen codigo repetido y hacen mas mantenibles formularios y consumo de API.

### Prioridad 4: produccion y escalabilidad

Para despliegue real:

- Sentry.
- Redis.
- Resilience4j.
- Cloud storage para reportes.

Motivo: mejoran observabilidad, resiliencia y escalabilidad.

## 10. Conclusion

Las librerias seleccionadas para SGIP son coherentes con el documento Avance V4.0 y con la implementacion real del sistema. Spring Boot aporta la base para seguridad, API REST, persistencia y reportes; React permite construir una interfaz web modular; PostgreSQL centraliza la informacion del negocio; y Python permite implementar la prediccion de demanda con herramientas de ciencia de datos.

La seleccion tecnica responde directamente a los requerimientos funcionales:

- Seguridad y login: Spring Security, BCrypt y JJWT.
- Inventario y pedidos: WebMVC, JPA, PostgreSQL y Validation.
- Alertas: Spring Mail.
- Dashboard: React, Axios y Recharts.
- IA: Streamlit, requests, pandas, scikit-learn y backend REST.
- Reportes: Apache POI y PDFBox.

El proyecto tiene una base tecnica solida. Las mejoras mas importantes para una siguiente etapa son documentacion OpenAPI, migraciones con Flyway, monitoreo con Actuator, pruebas con Testcontainers/Pytest y mejor gestion de datos remotos en frontend con TanStack Query.
