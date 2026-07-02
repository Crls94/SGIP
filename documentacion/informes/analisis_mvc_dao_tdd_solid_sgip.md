# Analisis MVC, DAO, TDD y SOLID del Proyecto SGIP

## 1. Objetivo del documento

Este documento analiza la estructura tecnica del proyecto **SGIP - Sistema de Gestion Inteligente de Inventarios y Pedidos para Metro Ica**, tomando como referencia principal el documento academico **Avance V4.0_markdown.docx** y contrastandolo con la implementacion real del codigo fuente.

El proposito es explicar como el sistema aplica los conceptos de **MVC**, **DAO**, **TDD** y **principios SOLID**, y por que estos enfoques son adecuados para un sistema de inventario, pedidos, alertas, reportes y prediccion de demanda.

La revision se basa en:

- Documento base: `Avance V4.0_markdown.docx`.
- Backend: `src/main/java/com/metroica/sgip_backend`.
- Frontend: `frontend/src`.
- Modulo IA: `ia_prediccion.py`.
- Pruebas: `src/test/java`.

## 2. Contexto del proyecto SGIP

Segun el documento Avance V4.0, Metro Ica presenta tres problemas principales:

- Discrepancias entre stock fisico y stock digital.
- Desorden en la gestion de pedidos locales y delivery.
- Ausencia de prediccion de demanda.

Para resolverlos, el proyecto implementa una plataforma web con:

- **Frontend React** para la interfaz de usuarios operativos, administradores y gerentes.
- **Backend Spring Boot** para la API REST, reglas de negocio, seguridad y persistencia.
- **PostgreSQL** como base de datos central.
- **Modulo IA en Python** para prediccion semanal de demanda.

Los requerimientos funcionales principales definidos en Avance V4.0 son:

| ID | Modulo | Descripcion sintetica |
|---|---|---|
| RF-01 | Autenticacion | Login por usuario/contrasena y roles. |
| RF-02 | Gestion de Productos | CRUD de productos, categorias y proveedores. |
| RF-03 | Control de Stock | Entradas y salidas de mercaderia en tiempo real. |
| RF-04 | Alertas de Stock Critico | Alertas visuales y por correo. |
| RF-05 | Gestion de Pedidos | Registro de pedidos local/delivery. |
| RF-06 | Cola de Pedidos Priorizada | Priorizacion por canal y hora. |
| RF-07 | Pronostico de Demanda | Prediccion semanal con IA. |
| RF-08 | Dashboard Gerencial | Metricas, graficos y resumen operativo. |
| RF-09 | Reportes Exportables | Reportes Excel/PDF de inventario y pedidos. |

## 3. Analisis MVC en SGIP

MVC significa **Modelo - Vista - Controlador**. Es un patron arquitectonico que separa responsabilidades para evitar que una sola parte del sistema concentre demasiada logica.

En SGIP, MVC no se implementa como una aplicacion monolitica tradicional con vistas renderizadas desde Spring Boot. Se adapta a una arquitectura web moderna:

- La **Vista** esta en React.
- El **Controlador** esta en Spring Boot mediante controladores REST.
- El **Modelo** esta formado por entidades JPA, DTOs, servicios, repositorios y reglas de negocio.

### 3.1 Vista

La vista es el frontend desarrollado con React. Su responsabilidad es mostrar informacion al usuario, capturar entradas y comunicarse con la API REST.

En SGIP, la vista se encuentra principalmente en:

- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Productos.jsx`
- `frontend/src/pages/Proveedores.jsx`
- `frontend/src/pages/Movimientos.jsx`
- `frontend/src/pages/Pedidos.jsx`
- `frontend/src/pages/Alertas.jsx`
- `frontend/src/pages/Notificaciones.jsx`
- `frontend/src/pages/Inteligencia.jsx`
- `frontend/src/pages/Reportes.jsx`
- `frontend/src/pages/Usuarios.jsx`

Tambien existen componentes reutilizables:

- `Sidebar.jsx`
- `TopBar.jsx`
- `Modal.jsx`
- `SearchableSelect.jsx`
- `ProductSelect.jsx`
- `Toast.jsx`
- `Spinner.jsx`

La vista no accede directamente a la base de datos. Para obtener informacion, utiliza Axios mediante `frontend/src/api/client.js`, enviando solicitudes HTTP al backend.

Ejemplo:

```text
Usuario abre pantalla Productos
Frontend React ejecuta api.get('/productos')
Backend responde con JSON paginado
React renderiza la tabla de productos
```

### 3.2 Controlador

El controlador recibe solicitudes HTTP del frontend, valida la entrada y delega el trabajo a los servicios.

En SGIP, los controladores REST estan organizados por modulo:

| Modulo | Controlador | Responsabilidad |
|---|---|---|
| Autenticacion | `AuthController` | Login y registro. |
| Usuarios | `UsuarioController` | Gestion de usuarios y roles. |
| Productos | `ProductoController` | CRUD de productos. |
| Categorias | `CategoriaController` | Listado de categorias. |
| Proveedores | `ProveedorController` | CRUD de proveedores. |
| Movimientos | `MovimientoController` | Entradas y salidas de inventario. |
| Pedidos | `PedidoController` | Creacion, cola y cambio de estado. |
| Alertas | `AlertaStockController` | Consulta y resolucion de alertas. |
| Notificaciones | `NotificacionController` | Notificaciones del usuario. |
| Inteligencia | `InteligenciaController` | Datos de entrenamiento y predicciones. |
| Dashboard | `DashboardController` | Metricas gerenciales. |
| Reportes | `ReporteController` | Generacion y descarga de Excel/PDF. |

Los controladores usan anotaciones como:

- `@RestController`
- `@RequestMapping`
- `@GetMapping`
- `@PostMapping`
- `@PutMapping`
- `@PatchMapping`
- `@DeleteMapping`
- `@RequestBody`
- `@PathVariable`
- `@RequestParam`
- `@Valid`

Esto mantiene la capa de entrada separada de la logica de negocio.

### 3.3 Modelo

El modelo representa los datos, reglas y estructuras del dominio.

En SGIP, el modelo no es solo una entidad. Incluye:

- Entidades JPA.
- DTOs.
- Services.
- Repositories.
- Mappers.
- Enums.

Entidades principales:

| Entidad | Funcion |
|---|---|
| `Usuario` | Cuenta de acceso y rol. |
| `Sesion` | Registro de sesiones. |
| `Producto` | Producto de inventario. |
| `Categoria` | Clasificacion del producto. |
| `Proveedor` | Datos del proveedor. |
| `InventarioMovimiento` | Historial de entradas, salidas, ajustes, mermas y devoluciones. |
| `Pedido` | Encabezado del pedido. |
| `PedidoDetalle` | Items del pedido. |
| `AlertaStock` | Alerta de stock critico. |
| `Notificacion` | Notificacion visual/correo. |
| `PrediccionDemanda` | Resultado del modulo IA. |
| `Reporte` | Historial de reportes generados. |

DTOs importantes:

- `LoginRequestDTO`
- `LoginResponseDTO`
- `RegisterRequestDTO`
- `UsuarioResponseDTO`
- `ProductoCreateDTO`
- `ProductoResponseDTO`
- `MovimientoRequestDTO`
- `MovimientoResponseDTO`
- `PedidoCreateDTO`
- `PedidoItemDTO`
- `PedidoResponseDTO`
- `AlertaStockResponseDTO`
- `NotificacionResponseDTO`
- `MovimientoExportDTO`
- `PrediccionResponseDTO`
- `ReporteDTO`

Los DTOs evitan exponer directamente las entidades JPA al frontend y permiten controlar que datos entran y salen de la API.

## 4. Flujos MVC principales

### 4.1 Flujo MVC de gestion de productos

Este flujo corresponde al RF-02.

```text
Vista: Productos.jsx
  -> api.get('/productos') o api.post('/productos')
Controlador: ProductoController
  -> valida DTO con @Valid
Servicio: ProductoService
  -> aplica reglas de negocio
Mapper: ProductoMapper
  -> convierte entidad <-> DTO
DAO: ProductoRepository
  -> consulta o guarda datos
Base de datos: PostgreSQL
  -> tabla productos
```

Este flujo separa claramente responsabilidades:

- React no conoce SQL.
- Controller no contiene reglas complejas.
- Service concentra reglas de negocio.
- Repository encapsula acceso a datos.
- Mapper separa entidad y DTO.

### 4.2 Flujo MVC de movimientos de inventario

Este flujo corresponde al RF-03.

```text
Vista: Movimientos.jsx
  -> api.post('/movimientos')
Controlador: MovimientoController
  -> recibe MovimientoRequestDTO
Servicio: MovimientoService
  -> valida stock, tipo de movimiento y usuario autenticado
Repository: ProductoRepository.findByIdWithLock()
  -> bloquea el producto para evitar concurrencia
Repository: MovimientoRepository
  -> registra historial
Base de datos: PostgreSQL
```

La parte critica de este flujo es el control de stock. El sistema debe impedir que una salida supere el stock disponible. Para eso utiliza transacciones y bloqueo pesimista.

### 4.3 Flujo MVC de pedidos

Este flujo corresponde a RF-05 y RF-06.

```text
Vista: Pedidos.jsx
  -> api.post('/pedidos')
Controlador: PedidoController
  -> recibe PedidoCreateDTO
Servicio: PedidoService
  -> calcula prioridad, valida productos, descuenta stock
Repositories: PedidoRepository, PedidoDetalleRepository, ProductoRepository
  -> guardan pedido, detalles y actualizan stock
Base de datos: PostgreSQL
```

La prioridad de pedidos permite que delivery tenga preferencia frente a local, alineandose con el requerimiento de cola priorizada.

### 4.4 Flujo MVC de reportes

Este flujo corresponde al RF-09.

```text
Vista: Reportes.jsx
  -> api.get('/reportes/inventario?formato=xlsx')
Controlador: ReporteController
  -> selecciona endpoint inventario/pedidos
Servicio: ReporteService
  -> consulta datos, genera Excel/PDF, registra historial
Librerias: Apache POI / PDFBox
DAO: ReporteRepository
  -> guarda historial en tabla reportes
Respuesta: archivo descargable
```

Este modulo demuestra una integracion clara entre requerimiento academico y tecnologia concreta: el documento Avance V4.0 exige reportes Excel/PDF y el codigo lo implementa con POI y PDFBox.

### 4.5 Flujo MVC/REST del modulo IA

Este flujo corresponde al RF-07.

```text
Modulo IA Python
  -> requests.get('/api/v1/inteligencia/datos-entrenamiento')
Controlador: InteligenciaController
  -> expone datos historicos de salidas
Servicio: InteligenciaService
  -> consulta movimientos historicos
Python: pandas + scikit-learn
  -> agrupa ventas semanales y entrena regresion lineal
Python: requests.post('/api/v1/inteligencia/predicciones')
  -> envia predicciones al backend
Servicio: InteligenciaService
  -> valida y guarda predicciones en PostgreSQL
Frontend: Inteligencia.jsx
  -> muestra predicciones al usuario
```

Aqui se observa que el modulo IA esta desacoplado de la base de datos directa y se integra mediante API REST protegida por el backend.

## 5. Analisis DAO en SGIP

DAO significa **Data Access Object**. Es un patron que encapsula el acceso a datos para que la logica de negocio no dependa directamente de SQL ni de detalles internos de la base de datos.

En SGIP, el patron DAO se implementa mediante **Spring Data JPA Repositories**.

### 5.1 Repositories como DAO

Cada repository extiende `JpaRepository` y representa una puerta de acceso a una tabla o agregado del dominio.

| DAO / Repository | Entidad | Funcion |
|---|---|---|
| `UsuarioRepository` | `Usuario` | Buscar usuarios, login, gestion de cuentas. |
| `SesionRepository` | `Sesion` | Persistencia de sesiones. |
| `ProductoRepository` | `Producto` | CRUD de productos, stock critico, bloqueo por ID. |
| `CategoriaRepository` | `Categoria` | Listado de categorias. |
| `ProveedorRepository` | `Proveedor` | CRUD de proveedores. |
| `MovimientoRepository` | `InventarioMovimiento` | Historial de movimientos y filtros. |
| `PedidoRepository` | `Pedido` | Cola de pedidos y resumen por estado/canal. |
| `PedidoDetalleRepository` | `PedidoDetalle` | Detalles asociados a un pedido. |
| `AlertaStockRepository` | `AlertaStock` | Alertas activas y conteos. |
| `NotificacionRepository` | `Notificacion` | Notificaciones por usuario. |
| `PrediccionRepository` | `PrediccionDemanda` | Predicciones generadas por IA. |
| `ReporteRepository` | `Reporte` | Historial de reportes exportados. |

### 5.2 Ventajas del uso de DAO con JPA

El uso de repositories aporta varias ventajas:

- Evita repetir SQL en services.
- Centraliza consultas por modulo.
- Permite paginacion y filtros.
- Permite consultas JPQL y nativas cuando se requieren.
- Integra transacciones con Spring.
- Facilita pruebas de repositorios.
- Reduce acoplamiento entre negocio y base de datos.

### 5.3 DAO y concurrencia de stock

Una regla critica del sistema es evitar inconsistencias cuando varios usuarios modifican el mismo producto al mismo tiempo.

Para esto, `ProductoRepository` utiliza bloqueo pesimista mediante:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Producto p WHERE p.id = :id")
Optional<Producto> findByIdWithLock(@Param("id") UUID id);
```

Esto es importante porque en inventario una condicion de carrera podria permitir que dos usuarios retiren mas unidades de las disponibles.

Ejemplo del problema que se evita:

```text
Stock actual: 5 unidades
Usuario A registra salida de 4
Usuario B registra salida de 4 al mismo tiempo
Sin bloqueo: ambos podrian leer stock 5 y aprobar la salida
Con bloqueo: uno espera al otro y el segundo valida sobre el stock actualizado
```

## 6. TDD en SGIP

TDD significa **Test Driven Development**. Consiste en escribir primero una prueba que define el comportamiento esperado, luego implementar el codigo minimo para pasarla y finalmente refactorizar.

Aunque el proyecto no fue desarrollado completamente bajo TDD estricto, si permite identificar pruebas clave que deberian guiar el desarrollo de reglas criticas.

### 6.1 Prueba TDD prioritaria: stock insuficiente

La prueba mas importante para SGIP es impedir una salida de inventario cuando la cantidad solicitada supera el stock disponible.

Escenario:

```text
Dado un producto con stock actual de 5 unidades
Cuando un operario intenta registrar una salida de 10 unidades
Entonces el sistema debe rechazar la operacion
Y debe conservar el stock original
Y debe mostrar un error de stock insuficiente
```

Esta prueba se relaciona directamente con RF-03 y con el problema principal del proyecto: discrepancias de inventario.

### 6.2 Prueba TDD para pedidos atomicos

El pedido debe descontar stock automaticamente. Si un item falla por stock insuficiente, no debe crearse ningun pedido parcial.

Escenario:

```text
Dado un pedido con dos productos
Y uno de ellos no tiene stock suficiente
Cuando se intenta registrar el pedido
Entonces el sistema debe rechazar el pedido completo
Y no debe descontar stock de ningun producto
Y no debe guardar detalles parciales
```

Esta prueba se relaciona con RF-05 y RF-06.

### 6.3 Prueba TDD para autenticacion JWT

El proyecto ya cuenta con pruebas para `JwtUtil`.

Comportamientos cubiertos:

- Generar token con claims correctos.
- Extraer email, user ID y rol.
- Rechazar tokens expirados.
- Rechazar tokens invalidos.
- Generar tokens con diferentes roles.

Esta prueba se relaciona con RF-01.

### 6.4 Prueba TDD para reportes

RF-09 exige reportes Excel/PDF. Una prueba recomendable seria:

```text
Dado que existen productos registrados
Cuando un administrador solicita /api/v1/reportes/inventario?formato=xlsx
Entonces el sistema debe responder HTTP 200
Y el Content-Type debe ser application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Y el archivo debe contener una hoja llamada Inventario
```

Para PDF:

```text
Dado que existen pedidos registrados
Cuando un gerente solicita /api/v1/reportes/pedidos?formato=pdf
Entonces el sistema debe responder HTTP 200
Y el Content-Type debe ser application/pdf
Y el reporte debe registrarse en la tabla reportes
```

### 6.5 Pruebas existentes y pruebas faltantes

Pruebas existentes (suite completa implementada, 42 tests automatizados, 0 fallos):

- `JwtUtilTest.java`
- `UsuarioPrincipalTest.java`
- `SgipBackendApplicationTests.java`
- `AuthServiceTest.java`
- `MovimientoServiceTest.java`
- `PedidoServiceTest.java`
- `ProductoServiceTest.java`
- `ReporteServiceTest.java`
- `DashboardServiceTest.java`
- `InteligenciaServiceTest.java`
- `RateLimitInterceptorTest.java`
- `CucumberAcceptanceTest.java` (BDD)
- `LoginSeleniumTest.java` (condicional)
- `IntegrationDatabaseSmokeTest.java` (condicional)
- `test_ia_prediccion.py` (5 pruebas IA)

Pruebas recomendadas para evolucion futura:

- Pruebas de integracion con PostgreSQL real usando Testcontainers.
- Pruebas del modulo IA con mayor cobertura.

## 7. Principios SOLID en SGIP

SOLID es un conjunto de cinco principios de diseno orientado a objetos que ayudan a crear sistemas mantenibles, extensibles y menos acoplados.

### 7.1 SRP - Single Responsibility Principle

Una clase debe tener una sola razon para cambiar.

SGIP aplica SRP separando capas:

| Clase | Responsabilidad |
|---|---|
| Controller | Recibir solicitudes HTTP y responder. |
| Service | Aplicar reglas de negocio. |
| Repository | Acceder a datos. |
| Entity | Representar tablas y relaciones. |
| DTO | Transportar datos de entrada/salida. |
| Mapper | Convertir entre entidad y DTO. |

Ejemplo en productos:

- `ProductoController`: expone endpoints.
- `ProductoService`: valida y ejecuta reglas.
- `ProductoRepository`: consulta PostgreSQL.
- `ProductoMapper`: convierte entre `Producto` y `ProductoResponseDTO`.
- `ProductoCreateDTO`: recibe datos del frontend.

Esta separacion evita que una sola clase haga todo.

### 7.2 OCP - Open/Closed Principle

El sistema debe estar abierto a extension, pero cerrado a modificacion innecesaria.

SGIP permite agregar nuevos modulos sin romper los existentes porque esta organizado por funcionalidades:

- `seguridad`
- `productos`
- `movimientos`
- `pedidos`
- `alertas`
- `notificaciones`
- `inteligencia`
- `dashboard`
- `reportes`

Si se desea agregar un nuevo modulo, por ejemplo compras o devoluciones avanzadas, puede crearse un nuevo paquete con su controller, service, repository, DTOs y entidades sin modificar excesivamente los modulos actuales.

### 7.3 LSP - Liskov Substitution Principle

Las implementaciones deben poder reemplazar a sus abstracciones sin romper el sistema.

En SGIP este principio se observa principalmente en el uso de interfaces de Spring Data JPA:

```java
public interface ProductoRepository extends JpaRepository<Producto, UUID>
```

Los servicios dependen del contrato del repository, no de una implementacion concreta escrita manualmente.

### 7.4 ISP - Interface Segregation Principle

Las clases no deberian depender de interfaces que no utilizan.

SGIP mantiene repositories separados por entidad y modulo. No existe un unico DAO gigante con metodos para productos, pedidos, usuarios y reportes. Cada repository contiene operaciones relacionadas con su dominio.

Esto reduce dependencias innecesarias.

### 7.5 DIP - Dependency Inversion Principle

Los modulos de alto nivel no deben depender de detalles de bajo nivel, sino de abstracciones.

En SGIP, los services dependen de repositories inyectados por Spring:

```text
PedidoService -> PedidoRepository
PedidoService -> ProductoRepository
MovimientoService -> MovimientoRepository
MovimientoService -> ProductoRepository
```

El service no crea conexiones JDBC manuales ni construye SQL directamente para cada operacion. Delega el acceso a datos al repository.

## 8. Relacion entre MVC, DAO, TDD y SOLID

Estos conceptos se complementan:

| Concepto | Como ayuda a SGIP |
|---|---|
| MVC | Ordena la comunicacion entre frontend, backend y modelo de datos. |
| DAO | Separa el acceso a PostgreSQL de la logica de negocio. |
| TDD | Permite validar reglas criticas como stock insuficiente y pedidos atomicos. |
| SOLID | Facilita mantenimiento, extension y reduccion de acoplamiento. |

En conjunto, estos enfoques ayudan a que SGIP sea mas facil de mantener y evolucionar.

## 9. Observaciones tecnicas

- El proyecto implementa una arquitectura web moderna: React como SPA, Spring Boot como API REST y Python como modulo IA desacoplado.
- El documento Avance V4.0 menciona arquitectura de microservicios. La implementacion actual se entiende mejor como **monolito modular con modulo IA desacoplado**, lo cual es adecuado para el alcance academico y permite evolucionar hacia microservicios si el sistema crece.
- El rol `GERENTE` aparece en el codigo aunque Avance V4.0 menciona principalmente `Administrador` y `Operario`. Este rol esta justificado por RF-08, ya que existe un dashboard gerencial.
- El modulo de reportes esta implementado y cumple RF-09 mediante Excel/PDF.
- El endpoint de datos de entrenamiento de IA esta protegido por roles `ADMINISTRADOR` y `GERENTE`, manteniendo la integracion con Python mediante API REST autenticada.

## 10. Conclusion

SGIP aplica una separacion tecnica adecuada para un sistema de inventario y pedidos. El frontend React cumple el rol de vista; los controllers REST de Spring Boot actuan como controladores; las entidades, DTOs, services, mappers y repositories conforman el modelo y las reglas de negocio.

El patron DAO se implementa mediante Spring Data JPA, permitiendo aislar el acceso a PostgreSQL. Las reglas criticas del negocio, especialmente stock y pedidos, deberian reforzarse con pruebas TDD. Los principios SOLID se reflejan en la division por capas y por modulos funcionales, lo que facilita mantenimiento, escalabilidad y evolucion futura del sistema.
