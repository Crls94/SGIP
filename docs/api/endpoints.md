# API REST

El backend expone sus endpoints bajo el prefijo `/api/v1`. La autenticación se realiza mediante JWT Bearer Token.

La documentación interactiva completa está disponible en **Swagger UI**:

```
http://localhost:8080/swagger-ui.html
```

---

## Resumen de controladores

| Controlador | Ruta base | Endpoints |
|---|---|---|
| Auth | `/api/v1/auth` | `POST /login`, `POST /register` |
| Productos | `/api/v1/productos` | `GET`, `POST`, `PUT`, `DELETE` |
| Categorías | `/api/v1/categorias` | `GET` |
| Proveedores | `/api/v1/proveedores` | `GET`, `POST`, `PUT`, `DELETE` |
| Movimientos | `/api/v1/movimientos` | `GET`, `POST` |
| Pedidos | `/api/v1/pedidos` | `GET`, `POST`, `PUT /{id}/estado`, `GET /cola` |
| Alertas | `/api/v1/alertas` | `GET /activas`, `GET /historial`, `PATCH /{id}/resolver` |
| Dashboard | `/api/v1/dashboard` | `GET`, `GET /ventas-7-dias` |
| Inteligencia | `/api/v1/inteligencia` | `GET /predicciones`, `GET /datos-entrenamiento`, `POST /alertas-predictivas/generar` |
| Reportes | `/api/v1/reportes` | `GET /inventario`, `GET /pedidos`, `GET /historial`, `POST /{id}/descargar` |
| Notificaciones | `/api/v1/notificaciones` | `GET`, `PUT /{id}/leida`, `GET /no-leidas` |
| Usuarios | `/api/v1/usuarios` | `GET`, `PUT /{id}/rol`, `PUT /{id}/desactivar`, `PUT /{id}/activar` |
| Seguridad | `/api/v1/seguridad` | `GET /verificacion` |

---

## Roles y permisos

| Rol | Permisos principales |
|---|---|
| **ADMINISTRADOR** | Acceso total: productos, categorías, proveedores, usuarios, movimientos, pedidos, alertas, reportes, notificaciones, IA, dashboard |
| **GERENTE** | Dashboard, reportes, alertas (lectura), IA, notificaciones, pedidos (lectura de cola), productos (lectura) |
| **OPERARIO** | Movimientos, pedidos, alertas (lectura), notificaciones, productos (lectura) |

---

## Endpoints principales

### Autenticación

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@cliente.com",
  "password": "********"
}
```

Respuesta:

```json
{
  "token": "eyJhbGciOi...",
  "email": "admin@cliente.com",
  "nombre": "Admin",
  "rol": "ADMINISTRADOR"
}
```

Todas las peticiones autenticadas deben incluir el header:

```http
Authorization: Bearer eyJhbGciOi...
```

### Productos

```http
GET /api/v1/productos?page=0&size=20
POST /api/v1/productos
PUT /api/v1/productos/{id}
DELETE /api/v1/productos/{id}
```

### Movimientos

```http
POST /api/v1/movimientos
Content-Type: application/json

{
  "productoId": 1,
  "tipo": "SALIDA",
  "cantidad": 5,
  "motivo": "Venta mostrador"
}
```

### Pedidos

```http
GET /api/v1/pedidos/cola
POST /api/v1/pedidos
PUT /api/v1/pedidos/{id}/estado?estado=DESPACHADO
```

### Dashboard

```http
GET /api/v1/dashboard
GET /api/v1/dashboard/ventas-7-dias
```

Respuesta:

```json
{
  "ventaHoy": 965.60,
  "ventasSemana": [...],
  "pedidosEnCola": 18,
  "productosCriticos": 3,
  "alertasActivas": 5,
  "precisionPronostico": 94.09
}
```

### IA Predictiva

```http
GET /api/v1/inteligencia/predicciones?page=0&size=50
GET /api/v1/inteligencia/datos-entrenamiento
POST /api/v1/inteligencia/alertas-predictivas/generar
```

### Reportes

```http
GET /api/v1/reportes/inventario?formato=pdf
GET /api/v1/reportes/pedidos?formato=xlsx
GET /api/v1/reportes/historial
POST /api/v1/reportes/{id}/descargar
```

### Alertas

```http
GET /api/v1/alertas/activas
GET /api/v1/alertas/historial
PATCH /api/v1/alertas/{id}/resolver
```

---

## Rate Limiting

Para proteger el sistema, se aplican límites por minuto según el endpoint:

| Endpoint | Límite |
|---|---|
| `POST /api/v1/auth/login` | 10 req/min |
| `POST /api/v1/pedidos` | 30 req/min |
| `POST /api/v1/movimientos` | 60 req/min |
| `GET /api/v1/reportes/**` | 20 req/min |
| IA (alertas + datos) | 10–30 req/min |
| General `/api/v1/**` | 100 req/min |

Al superar el límite, el servidor responde `429 Too Many Requests`.

---

## Formato de errores

```json
{
  "error": "Descripción del error"
}
```

| Código | Significado |
|---|---|
| `400` | Datos inválidos o error de validación |
| `401` | Token ausente, inválido o expirado |
| `403` | Rol sin permisos para el endpoint |
| `404` | Recurso no encontrado |
| `409` | Conflicto (integridad de datos, modificación concurrente) |
| `429` | Límite de solicitudes excedido |
| `500` | Error interno del servidor |

---

## OpenAPI / Swagger

El proyecto incluye **SpringDoc OpenAPI** para generación automática de especificación OpenAPI 3.0.

- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/v3/api-docs`

Desde Swagger UI se pueden probar todos los endpoints configurando el token JWT en el botón **Authorize**.
