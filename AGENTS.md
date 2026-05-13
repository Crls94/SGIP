# SGIP - Guia Tecnica del Proyecto

## 1. Project Overview

**SGIP** (Sistema de Gestion de Inventario y Pedidos) es una plataforma web integral dise&#241;ada para la sucursal de **Metro Ica**, Peru. El sistema busca resolver tres ineficiencias operativas criticas identificadas en la sucursal:

1. **Discrepancias entre el stock fisico y el stock digital**, que generan perdidas por sobrestock o quiebres de inventario.
2. **Desorden en la gestion de pedidos locales y delivery**, que provoca errores operativos de despacho.
3. **Ausencia de prediccion de demanda**, lo que impide anticipar la cantidad necesaria de productos.

La solucion se desarrolla con React en el frontend, Spring Boot en el backend, PostgreSQL como base de datos centralizada y Python para el modulo de prediccion de demanda.

---

## 2. Alcance del Proyecto

### Incluye

- Modulo de control de inventario (productos, categorias, proveedores).
- Modulo de gestion de pedidos locales y delivery.
- Modulo de alertas de stock critico (visuales y por correo).
- Modulo de prediccion de demanda semanal con horizonte minimo de 7 dias.
- Dashboard gerencial con metricas clave.
- Reportes exportables en Excel y PDF.
- Gestion de usuarios y roles.
- Despliegue en infraestructura cloud.

### No incluye

- Aplicacion movil nativa.
- Integracion con facturacion electronica externa.
- Pasarelas de pago.
- Modulo de recursos humanos o nomina.

---

## 3. Tecnologias del Proyecto

| Categoria | Tecnologia |
|---|---|
| Frontend | React |
| Backend | Java + Spring Boot |
| Base de datos | PostgreSQL |
| ORM | JPA / Hibernate |
| Seguridad | Spring Security, JWT, BCrypt |
| Modulo IA | Python, pandas, scikit-learn |
| Reportes Excel | Apache POI |
| Reportes PDF | PDFBox / OpenPDF |
| Correo | Spring Mail (SMTP) |
| Despliegue | AWS / Azure / Google Cloud |
| Comunicacion | API REST |

**Nota:** Las versiones especificas de cada tecnologia se determinaran en fase de desarrollo, alineadas a las necesidades del proyecto y la documentacion academica.

---

## 4. Justificacion de Tecnologias

### React (Frontend)

React permite construir interfaces de usuario interactivas y responsivas mediante un modelo de componentes reutilizables. Su capacidad de actualizacion eficiente del DOM virtual lo hace ideal para aplicaciones que requieren datos en tiempo real, como el control de inventario y la cola de pedidos. Ademas, React es multiplataforma en cuanto a que la misma base de codigo puede ejecutarse en escritorio, tablets y smartphones mediante una interfaz web responsiva.

### Spring Boot (Backend)

Spring Boot proporciona un framework robusto y maduro para el desarrollo de aplicaciones empresariales en Java. Su arquitectura modular permite organizar el codigo por funcionalidad del negocio (seguridad, productos, pedidos, etc.), facilitando el mantenimiento y la escalabilidad. Spring Boot integra de manera nativa Spring Security para autenticacion y autorizacion, Spring Data para acceso a datos, y soporte para validacion de datos con Jakarta Bean Validation. Esto acelera el desarrollo y reduce la configuracion necesaria.

### PostgreSQL (Base de datos)

PostgreSQL es un sistema de base de datos relacional de codigo abierto con soporte para tipos de datos avanzados, incluyendo JSON, arrays y tipos enumerados. Su robustez, confiabilidad y cumplimiento de estandares ACID lo hacen adecuado para un sistema transaccional como SGIP. PostgreSQL soporta triggers, procedimientos almacenados y funciones de ventana que permiten implementar reglas de negocio a nivel de base de datos, como la generacion automatica de alertas de stock critico.

### Python (Modulo IA)

Python es el lenguaje predominante en la comunidad de ciencia de datos y machine learning. Librerias como pandas para manipulacion de datos y scikit-learn para modelado predictivo son estandares de la industria. La sintaxis legible y la vasta cantidad de librerias de ML hacen de Python la opcion natural para desarrollar el modulo de prediccion de demanda, permitiendo a los cientificos de datos modificar el modelo sin intervenir en el codigo del backend.

### API REST (Comunicacion)

La arquitectura REST permite la comunicacion entre componentes mediante protocolos estandar HTTP. Esto garantiza interoperabilidad entre el frontend (React), el backend (Spring Boot) y el modulo de IA (Python), ya que cualquier componente puede consumir o producir endpoints REST sin dependencia directa del lenguaje o plataforma. Ademas, REST es ideal para arquitecturas que pueden evolucionar hacia microservicios.

### BCrypt (Seguridad de contraseñas)

BCrypt es un algoritmo de hash adaptativo diseñado especificamente para contraseñas. Incorpora un factor de costo que permite aumentar la dificultad de calculo del hash con el paso del tiempo, protegiendo contra ataques de fuerza bruta y tablas arcoiris. A diferencia de algoritmos simples como MD5 o SHA-1, BCrypt esta diseñado para ser lento, lo que lo hace resistente a ataques even when hardware improves.

### Infraestructura Cloud (Despliegue)

El despliegue en infraestructura cloud (AWS, Azure o Google Cloud) permite alcanzar la disponibilidad minima del 99% mensual requerida. Los servicios administrados de base de datos, almacenamiento de archivos y balanceo de carga reducen la complejidad operativa y permiten escalar recursos segun la demanda sin interrupcion del servicio.

---

## 5. Arquitectura

SGIP utiliza una arquitectura web modular con un modulo de Inteligencia Artificial desacoplado.

```
+----------------+      +--------------------+      +----------------+
|   Frontend     |      |   Backend          |      |  Modulo IA     |
|   React        |<---->|   Spring Boot      |<---->|  Python        |
|   (SPA)        | HTTPS|   (Monolito        | REST |  (Streamlit /  |
|                | JWT  |    Modular)        |      |   FastAPI)     |
+----------------+      +--------------------+      +----------------+
                               |
                               | JDBC
                               v
                    +--------------------+
                    |   PostgreSQL       |
                    |   (Centralizado)   |
                    +--------------------+
```

### Descripcion de componentes

**Frontend React:** Aplicacion de una sola pagina (SPA) independiente. Se comunica exclusivamente con el backend mediante HTTPS y tokens JWT. Puede desplegarse en un servidor estatico o CDN completamente separado del backend.

**Backend Spring Boot (Monolito Modular):** Un solo proceso Java que contiene internamente modulos separados por paquete (seguridad, productos, movimientos, alertas, pedidos, inteligencia, dashboard, reportes). Comparten la misma JVM, el mismo proceso y la misma base de datos. Cada modulo tiene su propio Controller, Service y Repository.

**Modulo IA Python (Desacoplado):** Script o aplicacion web independiente. Lenguaje diferente (Python), ciclo de vida diferente, responsabilidad completamente diferente (entrenamiento y prediccion ML). Se comunica con el backend via API REST para leer datos, y escribe predicciones directo en PostgreSQL.

**Base de datos PostgreSQL:** Un solo origen de verdad centralizado. Tanto el backend Java como el modulo Python escriben a la misma base de datos.

### Evolucion hacia microservicios

La arquitectura actual esta disenada de forma que, si el proyecto crece y el modulo de IA necesita ejecutarse on-demand (no solo semanal), el script Python puede convertirse facilmente en una API FastAPI siempre levantada. De igual manera, si la carga del sistema lo requiere, los modulos del backend podrian extraerse como servicios independientes con cambios minimos, ya que la comunicacion esta basada en API REST.

---

## 6. Modulos del Sistema

| Modulo | Descripcion |
|---|---|
| **seguridad** | Autenticacion JWT, registro de usuarios, gestion de sesiones. |
| **usuarios** | Gestion de cuentas, asignacion de roles, activacion/desactivacion. |
| **productos** | CRUD de productos, gestion de categorias y proveedores. |
| **proveedores** | Informacion de contacto, direccion y datos de proveedores. |
| **movimientos** | Registro de entradas y salidas de mercaderia, historial paginado. |
| **pedidos** | Creacion y gestion de pedidos locales y delivery, cola priorizada. |
| **alertas** | Alertas automaticas de stock critico, resolucion e ignorado. |
| **notificaciones** | Alertas visuales dentro de la aplicacion y notificaciones por correo electronico. |
| **inteligencia** | Puente de datos para el modulo IA, visualizacion de predicciones. |
| **dashboard** | Metric as resumen: alertas activas, pedidos en cola, stock bajo, ultima prediccion. |
| **reportes** | Generacion y exportacion de reportes de inventario y pedidos en Excel y PDF. |

---

## 7. Estructura del Backend

```
com.metroica.sgip/
├── config/
│   ├── SecurityConfig.java          # JWT filter, role-based access, BCrypt encoder
│   ├── JwtUtil.java                 # Generacion y validacion de JWT
│   ├── JwtAuthFilter.java           # Filtro de autenticacion Bearer token
│   └── WebConfig.java               # Configuracion de MVC
├── shared/
│   ├── enums/                       # Tipos enumerados compartidos
│   │   ├── CanalPedido              # LOCAL, DELIVERY
│   │   ├── EstadoAlerta             # ACTIVA, RESUELTA, IGNORADA
│   │   ├── EstadoPedido             # PENDIENTE, EN_PROCESO, LISTO, DESPACHADO, CANCELADO
│   │   ├── EstadoProducto           # ACTIVO, INACTIVO, DESCONTINUADO
│   │   ├── RolUsuario               # ADMINISTRADOR, OPERARIO, GERENTE
│   │   └── TipoMovimiento           # ENTRADA, SALIDA, AJUSTE, MERMA, DEVOLUCION
│   └── exceptions/
│       └── GlobalExceptionHandler   # Manejo centralizado de excepciones
├── seguridad/
│   ├── controller/
│   │   └── AuthController.java      # POST /login, POST /register
│   ├── service/
│   │   └── AuthService.java         # Login BCrypt + JWT
│   ├── model/
│   │   ├── Usuario.java
│   │   └── Sesion.java
│   ├── repository/
│   │   └── UsuarioRepository.java
│   └── dto/
│       ├── LoginRequestDTO.java
│       ├── LoginResponseDTO.java
│       ├── RegisterRequestDTO.java
│       └── UsuarioResponseDTO.java
├── productos/
│   ├── controller/
│   │   ├── ProductoController.java
│   │   ├── CategoriaController.java
│   │   └── ProveedorController.java
│   ├── service/
│   │   ├── ProductoService.java
│   │   ├── CategoriaService.java
│   │   └── ProveedorService.java
│   ├── model/
│   │   ├── Producto.java
│   │   ├── Categoria.java
│   │   └── Proveedor.java
│   ├── repository/
│   │   ├── ProductoRepository.java
│   │   ├── CategoriaRepository.java
│   │   └── ProveedorRepository.java
│   └── dto/
│       ├── ProductoCreateDTO.java
│       └── ProductoResponseDTO.java
├── movimientos/
│   ├── controller/
│   │   └── MovimientoController.java
│   ├── service/
│   │   └── MovimientoService.java
│   ├── model/
│   │   └── InventarioMovimiento.java
│   ├── repository/
│   │   └── MovimientoRepository.java
│   └── dto/
│       └── MovimientoRequestDTO.java
├── pedidos/
│   ├── controller/
│   │   └── PedidoController.java
│   ├── service/
│   │   └── PedidoService.java
│   ├── model/
│   │   ├── Pedido.java
│   │   └── PedidoDetalle.java
│   ├── repository/
│   │   ├── PedidoRepository.java
│   │   └── PedidoDetalleRepository.java
│   └── dto/
│       ├── PedidoCreateDTO.java
│       ├── PedidoItemDTO.java
│       └── PedidoResponseDTO.java
├── alertas/
│   ├── controller/
│   │   └── AlertaStockController.java
│   ├── service/
│   │   └── AlertaStockService.java
│   ├── model/
│   │   └── AlertaStock.java
│   ├── repository/
│   │   └── AlertaStockRepository.java
│   └── dto/
│       └── AlertaStockResponseDTO.java
├── notificaciones/
│   ├── controller/
│   │   └── NotificacionController.java
│   ├── service/
│   │   ├── NotificacionService.java
│   │   └── EmailService.java
│   ├── model/
│   │   └── Notificacion.java
│   ├── repository/
│   │   └── NotificacionRepository.java
│   └── dto/
│       └── NotificacionResponseDTO.java
├── inteligencia/
│   ├── controller/
│   │   └── InteligenciaController.java
│   ├── service/
│   │   └── InteligenciaService.java
│   ├── model/
│   │   └── PrediccionDemanda.java
│   ├── repository/
│   │   └── PrediccionRepository.java
│   └── dto/
│       ├── MovimientoExportDTO.java
│       └── PrediccionResponseDTO.java
├── dashboard/
│   ├── controller/
│   │   └── DashboardController.java
│   └── service/
│       └── DashboardService.java
└── reportes/
    ├── controller/
    │   └── ReporteController.java
    ├── service/
    │   └── ReporteService.java
    ├── model/
    │   └── Reporte.java
    ├── repository/
    │   └── ReporteRepository.java
    └── dto/
        └── ReporteDTO.java
```

Esta estructura por funcionalidad tiene mas sentido que una estructura puramente por capas porque cada modulo representa una responsabilidad del negocio. Un desarrollador que trabaje en el modulo de pedidos solo necesita leer y modificar archivos dentro del paquete `pedidos/`, sin necesidad de navegar por capas horizontales (todos los controllers juntos, todos los services juntos, etc.).

---

## 8. Estructura del Frontend

```
frontend/src/
├── main.jsx                         # Punto de entrada
├── App.jsx                          # Rutas: /login + 10 rutas protegidas
├── api/
│   └── client.js                    # Instancia Axios con interceptor de JWT
├── context/
│   └── AuthContext.jsx              # Estado de autenticacion (login, logout, roles)
├── pages/
│   ├── Login.jsx                   # Pagina de inicio de sesion
│   ├── Dashboard.jsx               # Graficos: pedidos, inventario, predicciones
│   ├── Productos.jsx               # CRUD con selectores con busqueda
│   ├── Proveedores.jsx             # CRUD de proveedores
│   ├── Movimientos.jsx             # Entradas/salidas de stock
│   ├── Pedidos.jsx                 # Cola priorizada con busqueda de productos
│   ├── Alertas.jsx                 # Alertas de stock critico
│   ├── Notificaciones.jsx          # Notificaciones visuales y por correo
│   ├── Inteligencia.jsx            # Visualizacion de predicciones IA
│   ├── Reportes.jsx                # Generacion Excel/PDF + historial
│   └── Usuarios.jsx                # Gestion de cuentas (solo ADMIN)
├── components/
│   ├── Sidebar.jsx                 # Navegacion lateral
│   ├── TopBar.jsx                  # Barra superior con usuario y logout
│   ├── Modal.jsx                   # Modal accesible
│   ├── SearchableSelect.jsx        # Selector con busqueda
│   ├── ProductSelect.jsx           # Selector de productos con info de stock
│   ├── Toast.jsx                   # Notificaciones toast
│   └── Spinner.jsx                 # Indicador de carga
├── styles/
│   └── global.css                  # Estilos globales con design tokens
└── utils/
    └── helpers.js                  # Funciones de utilidad
```

---

## 9. Base de Datos

### Tablas principales

| Tabla | Descripcion |
|---|---|
| `usuarios` | Cuentas de usuario con email, contrasenia hash y rol |
| `productos` | Catalogo de productos con nombre, sku, precio, stock, punto de pedido |
| `categorias` | Categorias de productos (bebidas, snacks, limpieza, etc.) |
| `proveedores` | Informacion de proveedores: nombre, contacto, direccion, lead time |
| `inventario_movimientos` | Historial de entradas y salidas de mercaderia |
| `pedidos` | Encabezado de pedidos con cliente, canal y prioridad |
| `pedido_detalle` | Lineas de detalle del pedido (producto, cantidad, precio unitario, subtotal) |
| `alertas_stock` | Alertas generadas automaticamente cuando stock <= punto de pedido |
| `notificaciones` | Registro de notificaciones visuales y por correo enviadas |
| `predicciones_demanda` | Pronosticos de demanda generados por el modulo IA |
| `reportes` | Auditoria de reportes generados con parametros y ruta de archivo |
| `auditoria` | Log de cambios importantes en el sistema |
| `configuracion` | Parametros configurables del sistema |
| `sesiones` | Sesiones activas de usuarios autenticados |

### Tipos enumerados en base de datos

| Enum | Valores |
|---|---|
| `rol_usuario` | ADMINISTRADOR, OPERARIO, GERENTE |
| `estado_producto` | ACTIVO, INACTIVO, DESCONTINUADO |
| `canal_pedido` | LOCAL, DELIVERY |
| `estado_pedido` | PENDIENTE, EN_PROCESO, LISTO, DESPACHADO, CANCELADO |
| `tipo_movimiento` | ENTRADA, SALIDA, AJUSTE, MERMA, DEVOLUCION |
| `estado_alerta` | ACTIVA, RESUELTA, IGNORADA |

### Relaciones entre tablas

- Un **producto** pertenece a una **categoria** y a un **proveedor**.
- Un **inventario_movimiento** esta asociado a un **producto** y a un **usuario** que lo registro.
- Un **pedido** tiene muchos **pedido_detalle**.
- Cada **pedido_detalle** esta asociado a un **producto**.
- Una **alerta_stock** esta asociada a un **producto**.
- Una **prediccion_demanda** esta asociada a un **producto**.
- Un **reporte** esta asociado a un **usuario** que lo genero.
- Una **notificacion** esta asociada a un **usuario** destinatario.

---

## 10. API Endpoints

### Autenticacion (RF-01)

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Publica | Inicio de sesion con email y contrasenia, retorna JWT |
| POST | `/api/v1/auth/register` | ADMINISTRADOR | Crear nuevo usuario (rol por defecto: OPERARIO) |

### Usuarios (RF-01)

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| GET | `/api/v1/usuarios` | ADMINISTRADOR | Listar todos los usuarios |
| PATCH | `/api/v1/usuarios/{id}/rol` | ADMINISTRADOR | Cambiar rol de un usuario |
| PATCH | `/api/v1/usuarios/{id}/desactivar` | ADMINISTRADOR | Desactivar cuenta |
| PATCH | `/api/v1/usuarios/{id}/activar` | ADMINISTRADOR | Reactivar cuenta |

### Productos (RF-02)

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| GET | `/api/v1/productos` | Autenticado | Listar inventario (paginado) |
| POST | `/api/v1/productos` | ADMINISTRADOR | Crear producto |
| PUT | `/api/v1/productos/{id}` | ADMINISTRADOR | Actualizar producto |
| DELETE | `/api/v1/productos/{id}` | ADMINISTRADOR | Eliminar producto |

### Categorias

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| GET | `/api/v1/categorias` | Autenticado | Listar todas las categorias |

### Proveedores (vinculado a RF-02)

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| GET | `/api/v1/proveedores` | Autenticado | Listar todos los proveedores |
| POST | `/api/v1/proveedores` | ADMINISTRADOR | Crear proveedor |
| PUT | `/api/v1/proveedores/{id}` | ADMINISTRADOR | Actualizar proveedor |
| DELETE | `/api/v1/proveedores/{id}` | ADMINISTRADOR | Eliminar proveedor |

### Movimientos (RF-03)

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| GET | `/api/v1/movimientos` | Autenticado | Historial paginado con filtros |
| POST | `/api/v1/movimientos` | Autenticado | Registrar entrada o salida de stock |

### Pedidos (RF-05, RF-06)

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| POST | `/api/v1/pedidos` | Autenticado | Crear pedido (LOCAL o DELIVERY) |
| GET | `/api/v1/pedidos/cola` | Autenticado | Cola de pedidos activos (prioridad + fecha) |
| GET | `/api/v1/pedidos/{id}` | Autenticado | Obtener detalle de un pedido |
| PATCH | `/api/v1/pedidos/{id}/estado` | Autenticado | Cambiar estado de un pedido |

### Alertas (RF-04)

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| GET | `/api/v1/alertas/activas` | Autenticado | Listar alertas de stock critico activas |
| PATCH | `/api/v1/alertas/{id}/resolver` | ADMINISTRADOR | Resolver o ignorar una alerta |

### Notificaciones (RF-04)

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| GET | `/api/v1/notificaciones` | Autenticado | Listar notificaciones del usuario |
| GET | `/api/v1/notificaciones/no-leidas` | Autenticado | Contar notificaciones no leidas |
| PATCH | `/api/v1/notificaciones/{id}/leer` | Autenticado | Marcar notificacion como leida |

### Inteligencia (RF-07)

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| GET | `/api/v1/inteligencia/datos-entrenamiento` | Publica | Datos historicos para el modulo IA |
| GET | `/api/v1/inteligencia/predicciones` | Autenticado | Listar predicciones de demanda |

### Dashboard (RF-08)

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| GET | `/api/v1/dashboard` | ADMINISTRADOR, GERENTE | Metric as resumen del sistema |

### Reportes (RF-09)

| Metodo | Ruta | Autenticacion | Descripcion |
|---|---|---|---|
| GET | `/api/v1/reportes` | Autenticado | Historial de reportes generados |
| GET | `/api/v1/reportes/{id}/descargar` | Autenticado | Descargar reporte previamente generado |
| GET | `/api/v1/reportes/inventario` | Autenticado | Generar y descargar reporte de inventario |
| GET | `/api/v1/reportes/pedidos` | Autenticado | Generar y descargar reporte de pedidos |

---

## 11. Roles y Permisos

| Rol | Descripcion | Permisos |
|---|---|---|
| **ADMINISTRADOR** | Gestor total del sistema | Gestion completa: usuarios, productos, proveedores, alertas, dashboard, reportes y configuracion |
| **OPERARIO** | Usuario operativo del almacen | Registro de movimientos de inventario, gestion de pedidos, consulta de productos, proveedores y alertas |
| **GERENTE** | Encargado de supervision y toma de decisiones | Consulta de dashboard, reportes, alertas y predicciones de demanda |

**Justificacion del rol GERENTE:** El documento academico menciona la existencia de un dashboard gerencial, la toma de decisiones comerciales y la validacion por gerencia. Esto requiere un rol de solo lectura con acceso a metricas, reportes y predicciones sin permisos de modificacion sobre datos operativos. Los roles de Administrador y Operario son los minimos definidos en el documento academico; el rol Gerente se agrega como extension justificada.

---

## 12. Reglas de Negocio

### Stock e inventario

- Una salida de stock no puede superar la cantidad disponible en inventario. Se debe validar el stock antes de procesar cada salida.
- Las entradas de stock incrementan el inventario de forma inmediata.
- Se recomienda implementar bloqueo pesimista (bloqueo a nivel de fila en base de datos) al modificar el stock de un producto para prevenir condiciones de carrera cuando multiples usuarios registran movimientos simultaneamente.
- Las transacciones de descuento de stock deben ser atomicas: si falla cualquier paso (validacion, actualizacion, creacion de pedido o detalle), se debe hacer rollback completo.

### Alertas y notificaciones

- Cuando el stock actual de un producto sea menor o igual al punto de pedido, se debe generar una alerta automatica (idealmente via trigger de base de datos con fallback en la capa de aplicacion).
- La alerta debe ser tanto visual (notificacion en la interfaz) como por correo electronico (notificacion al administrador o responsable).
- El envio de correo requiere configuracion SMTP. Si SMTP no esta disponible, las alertas visuales se crean de todas formas y se registra la situacion en logs.

### Pedidos

- El sistema diferenciara entre canal LOCAL y canal DELIVERY.
- Delivery tendra mayor prioridad que Local en la cola de atencion.
- Al crear un pedido, se debe descontar el stock de cada producto de forma automatica y atomica.
- Si el stock es insuficiente para algun producto del pedido, se debe rechazar el pedido completo.

### Cola de pedidos

- Los pedidos se priorizan primero por canal (DELIVERY antes que LOCAL) y luego por hora de ingreso.
- Un pedido puede cambiar de estado: PENDIENTE -> EN_PROCESO -> LISTO -> DESPACHADO o CANCELADO.
- Solo pedidos en estado PENDIENTE, EN_PROCESO o LISTO permanecen en la cola activa.

### Inteligencia Artificial

- El modulo IA utilizara los movimientos de tipo SALIDA como aproximacion operativa a los datos historicos de ventas.
- El reporte de prediccion de demanda debe tener un horizonte minimo de 7 dias de anticipacion.
- Las predicciones se almacenan en la tabla `predicciones_demanda` de PostgreSQL.
- El modulo IA lee datos via API REST (endpoint publico) y escribe predicciones directo a la base de datos.

### Reportes

- Los reportes deben poder descargarse en formato Excel y PDF.
- Los reportes generados deben guardarse en almacenamiento persistente.
- Se debe mantener un historial de reportes generados con informacion del usuario que los solicito, fecha y parametros utilizados.

---

## 13. Despliegue en Infraestructura Cloud

El sistema SGIP esta disenado para desplegarse en infraestructura cloud, con el objetivo de cumplir con la disponibilidad minima requerida (99% mensual) y permitir el acceso desde diferentes dispositivos conectados a internet.

### Componentes de despliegue

| Componente | Despliegue recomendado |
|---|---|
| Frontend React | Aplicacion estatica en CDN o servidor web (AWS S3 + CloudFront, Azure Static Web Apps, Firebase Hosting) |
| Backend Spring Boot | Servidor cloud o contenedor Docker (AWS EC2, Azure App Service, Google Cloud Run) |
| Base de datos PostgreSQL | Instancia administrada (AWS RDS, Azure Database, Google Cloud SQL) |
| Modulo IA Python | Servicio independiente o tarea programada (AWS Lambda, Azure Functions, cron en servidor) |
| Reportes generados | Almacenamiento persistente o cloud storage (AWS S3, Azure Blob, Google Cloud Storage) |
| Notificaciones por correo | Servicio SMTP (Amazon SES, SendGrid, Mailgun) o servidor SMTP propio |

### Almacenamiento de reportes

- En desarrollo: los reportes se guardan en disco local.
- En produccion cloud: los reportes deben almacenarse en un servicio de almacenamiento cloud para garantizar su disponibilidad y permitir la descarga posterior desde el historial.

---

## 14. Variables de Entorno

| Variable | Descripcion |
|---|---|
| `DB_URL` | URL de conexion a PostgreSQL |
| `DB_USER` | Usuario de la base de datos |
| `DB_PASSWORD` | Contrasenia de la base de datos |
| `JWT_SECRET` | Clave secreta para firma de tokens JWT |
| `JWT_EXPIRATION` | Tiempo de expiracion del token JWT |
| `MAIL_HOST` | Servidor SMTP para envio de correos |
| `MAIL_PORT` | Puerto del servidor SMTP |
| `MAIL_USERNAME` | Usuario de autenticacion SMTP |
| `MAIL_PASSWORD` | Contrasenia de autenticacion SMTP |
| `MAIL_FROM` | Correo emisor en notificaciones |
| `CLOUD_STORAGE_BUCKET` | Nombre del bucket de almacenamiento cloud |
| `CLOUD_STORAGE_REGION` | Region del servicio de almacenamiento cloud |

---

## 15. Criterios de Exito

El sistema sera considerado satisfactorio si cumple con los siguientes criterios:

| Criterio | Meta |
|---|---|
| Precision del inventario | Lograr una precision aproximada del **99%** entre el inventario fisico y el inventario digital en pruebas controladas. |
| Reduccion de errores operativos | Reducir en un **30%** los errores operativos relacionados con la gestion de pedidos locales y delivery. |
| Horizonte de prediccion | Generar predicciones de demanda con un **horizonte minimo de 7 dias** de anticipacion. |
| Rendimiento | Las operaciones de consulta o registro no superen los **5 segundos** bajo condiciones normales de uso. |
| Reportes disponibles | Los usuarios pueden generar y descargar reportes en formato **Excel y PDF**. |
| Disponibilidad | El sistema alcanza una disponibilidad minima mensual del **99%** mediante infraestructura cloud. |
| Gestion de roles | Diferenciacion de permisos por rol (Administrador, Operario, Gerente). |

---

## 16. Estado de Implementacion

### Implementado y funcional

- **RF-01 Autenticacion:** JWT + BCrypt + roles (ADMINISTRADOR, OPERARIO, GERENTE). Login, registro solo ADMIN.
- **RF-02 Productos:** CRUD con paginacion. Categorias y proveedores con selectores con busqueda.
- **RF-03 Movimientos:** Entradas/salidas con bloqueo pesimista, validacion de stock.
- **RF-04 Alertas y Notificaciones:** Generacion automatica, alertas visuales y por correo electronico.
- **RF-05/06 Pedidos:** Creacion con descuento atomico de stock, cola priorizada (DELIVERY=prioridad alta, LOCAL=prioridad baja).
- **RF-07 Inteligencia:** Endpoint de datos de entrenamiento, visualizacion de predicciones. Modulo Python con modelo de regresion lineal.
- **RF-08 Dashboard:** Metric as resumen y graficos. Acceso para ADMIN/GERENTE.
- **RF-09 Reportes:** Exportacion Excel y PDF. Historial de reportes con re-descarga.
- **Frontend:** 11 paginas (Login, Dashboard, Productos, Proveedores, Movimientos, Pedidos, Alertas, Notificaciones, Inteligencia, Reportes, Usuarios).

### Pendiente de implementacion o configurable

- **Correo SMTP:** El servicio de envio de correos esta implementado pero requiere configuracion de variables de entorno SMTP para funcionamiento real. Sin SMTP, los correos no se envian pero las alertas visuales se crean de todas formas.
- **Almacenamiento cloud de reportes:** En desarrollo se usa disco local. Para produccion se requiere configurar almacenamiento en la nube.
- **Proteccion del endpoint de IA:** El endpoint de datos de entrenamiento es publico. En produccion se recomienda agregar limitacion de tasa (rate limiting) o autenticacion dedicada.
- **Tests E2E:** No hay tests automatizados de frontend.
- **Tests unitarios:** Faltan tests para services (MovimientoService, PedidoService, etc.).
- **Pipeline CI/CD:** No configurado.
- **Documentacion Swagger/OpenAPI:** No implementada.
- **Configuracion HTTPS/TLS:** Requiere certificado y configuracion en servidor cloud.

---

## 17. Convenciones del Proyecto

- **Estructura del backend:** Organizado por funcionalidad (modulo), no por capas. Cada modulo contiene sus propios controller, service, repository, dto y model.
- **DTOs:** Viven dentro del paquete de la funcionalidad correspondiente, no en carpeta global separada.
- **Excepciones:** RuntimeException capturadas por un GlobalExceptionHandler centralizado.
- **Transacciones:** Anotacion @Transactional en services. Consultas de solo lectura usan readOnly=true.
- **Validacion:** Jakarta Bean Validation en DTOs de request, con @Valid en controllers.
- **Seguridad de contrasenias:** BCryptPasswordEncoder para hashing de contrasenias.
- **Autenticacion:** JWT sin estado (stateless). Token expira segun configuracion de JWT_EXPIRATION.
- **Tipos enumerados en PostgreSQL:** Requieren configuracion especial en entidades JPA (@JdbcTypeCode para SqlTypes.NAMED_ENUM).
- **Autenticacion de endpoints:** Reglas de acceso definidas tanto a nivel de URL (SecurityConfig) como a nivel de metodo (@EnableMethodSecurity con @PreAuthorize).
- **Tipos de columnas JSON en PostgreSQL:** Requieren @JdbcTypeCode(SqlTypes.JSON) en entidades.
- **Mapeo de datos:** Sin MapStruct. Mapeo manual en clases Mapper dentro de cada modulo.
- **Concurrencia de stock:** Bloqueo pesimista (SELECT FOR UPDATE) al modificar inventario.
- **Atomicidad:** @Transactional en crearPedido() y registrarMovimientoReal(). Rollback automatico en caso de error.
- **Limitacion de tasa:** Bucket4j en POST /pedidos y POST /movimientos para prevenir abuso.
- **Trazabilidad:** Cada movimiento y pedido queda asociado al usuario autenticado que lo realizo.
- **Reportes:** Se generan en memoria y se guardan en disco. En produccion se usa almacenamiento cloud.
- **Modulo IA:** Lee via API REST (endpoint publico, sin JWT) y escribe directo a PostgreSQL via psycopg2 con ON CONFLICT para upsert.
- **Fuentes:** Roboto via Google Fonts para toda la interfaz.
- **CSS:** Estilos personalizados con design tokens en archivo global, sin frameworks CSS adicionales.
