# Base de Datos

SGIP utiliza **PostgreSQL 16+** con un esquema relacional gestionado por Hibernate (`ddl-auto=validate`).

---

## Esquema entidad-relación

```mermaid
erDiagram
    USUARIOS {
        uuid id PK
        varchar nombre
        varchar apellido
        varchar email UK
        varchar password_hash
        enum_rol_usuario rol
        boolean activo
        timestamp ultimo_login
        timestamp created_at
    }

    CATEGORIAS {
        serial id PK
        varchar nombre UK
        text descripcion
        boolean activa
    }

    PROVEEDORES {
        serial id PK
        varchar nombre
        varchar ruc UK
        varchar contacto
        varchar telefono
        varchar email
        varchar direccion
        int lead_time_dias
        boolean activo
    }

    PRODUCTOS {
        serial id PK
        varchar sku UK
        varchar nombre
        varchar descripcion
        varchar marca
        varchar codigo_barras
        varchar unidad_medida
        numeric precio_costo
        numeric precio_venta
        int stock_actual
        int stock_minimo
        int stock_maximo
        int punto_pedido
        enum_estado_producto estado
        int categoria_id FK
        int proveedor_id FK
        timestamp created_at
        timestamp updated_at
    }

    INVENTARIO_MOVIMIENTOS {
        serial id PK
        int producto_id FK
        uuid usuario_id FK
        enum_tipo_movimiento tipo
        int cantidad
        int stock_antes
        int stock_despues
        varchar motivo
        varchar referencia
        timestamp fecha
    }

    PEDIDOS {
        serial id PK
        uuid usuario_id FK
        enum_canal_pedido canal
        enum_estado_pedido estado
        smallint prioridad
        varchar cliente_nombre
        varchar cliente_telefono
        varchar cliente_direccion
        varchar observaciones
        numeric total
        timestamp fecha_ingreso
        timestamp fecha_actualizacion
    }

    PEDIDO_ITEMS {
        serial id PK
        int pedido_id FK
        int producto_id FK
        int cantidad
        numeric precio_unitario
        numeric subtotal
    }

    ALERTAS_STOCK {
        uuid id PK
        int producto_id FK
        uuid resuelta_por FK
        int stock_al_generar
        int punto_pedido_referencia
        varchar origen
        int cantidad_predicha
        int faltante_estimado
        date semana_inicio
        date semana_fin
        text mensaje
        enum_estado_alerta estado
        timestamp fecha_generada
        timestamp fecha_resuelta
    }

    PREDICCIONES_DEMANDA {
        uuid id PK
        int producto_id FK
        int cantidad_predicha
        int cantidad_real
        numeric error_porcentaje
        date semana_inicio
        date semana_fin
        varchar modelo_version
        timestamp created_at
    }

    NOTIFICACIONES {
        uuid id PK
        uuid usuario_id FK
        varchar titulo
        text mensaje
        boolean leida
        varchar tipo
        timestamp created_at
    }

    REPORTES {
        uuid id PK
        uuid usuario_id FK
        varchar tipo
        varchar formato
        varchar parametros
        varchar ruta_archivo
        timestamp created_at
    }

    PRODUCTOS }o--|| CATEGORIAS : pertenece
    PRODUCTOS }o--|| PROVEEDORES : provee
    INVENTARIO_MOVIMIENTOS }o--|| PRODUCTOS : referencia
    INVENTARIO_MOVIMIENTOS }o--|| USUARIOS : registra
    PEDIDOS }o--|| USUARIOS : realiza
    PEDIDO_ITEMS }o--|| PEDIDOS : contiene
    PEDIDO_ITEMS }o--|| PRODUCTOS : incluye
    ALERTAS_STOCK }o--|| PRODUCTOS : alerta_de
    PREDICCIONES_DEMANDA }o--|| PRODUCTOS : predice
    NOTIFICACIONES }o--|| USUARIOS : notifica_a
    REPORTES }o--|| USUARIOS : generado_por
```

---

## Enums

### `rol_usuario`

| Valor |
|---|
| `ADMINISTRADOR` |
| `GERENTE` |
| `OPERARIO` |

### `estado_producto`

| Valor |
|---|
| `ACTIVO` |
| `INACTIVO` |
| `AGOTADO` |

### `tipo_movimiento`

| Valor |
|---|
| `ENTRADA` |
| `SALIDA` |

### `canal_pedido`

| Valor |
|---|
| `LOCAL` |
| `DELIVERY` |

### `estado_pedido`

| Valor |
|---|
| `PENDIENTE` |
| `EN_PROCESO` |
| `LISTO` |
| `DESPACHADO` |
| `CANCELADO` |

### `estado_alerta`

| Valor |
|---|
| `ACTIVA` |
| `RESUELTA` |

---

## Índices principales

| Tabla | Columna(s) | Tipo |
|---|---|---|
| `productos` | `sku` | Único |
| `productos` | `categoria_id` | FK |
| `productos` | `proveedor_id` | FK |
| `inventario_movimientos` | `producto_id` | FK |
| `inventario_movimientos` | `fecha` | B-tree (consultas por rango) |
| `pedidos` | `fecha_ingreso` | B-tree |
| `pedidos` | `estado` | B-tree |
| `alertas_stock` | `producto_id`, `estado` | Compuesto |
| `predicciones_demanda` | `producto_id`, `semana_inicio` | Compuesto |
| `notificaciones` | `usuario_id`, `leida` | Compuesto |

---

## Carga inicial del esquema

El esquema se crea ejecutando el script SQL:

```bash
psql -d metroDB -f Adicionales/metro_esquema_clean.sql
```

Este script define tipos enum, tablas, claves primarias, claves foráneas, índices y restricciones.

---

## DDL auto

En todos los perfiles se usa `spring.jpa.hibernate.ddl-auto=validate`:

- Hibernate **no crea ni modifica** el esquema.
- Verifica que las entidades JPA coincidan con las tablas existentes.
- Si hay discrepancia, la aplicación **no arranca** y muestra el error.
- Esto garantiza que el esquema de producción no se altera accidentalmente.

---

## Migraciones

Las migraciones entre versiones se aplican manualmente con scripts SQL en `Adicionales/`:

| Versión | Script |
|---|---|
| v2 → v3 | `migracion_v2.sql` |
| v3 → v4 | `migracion_v3_alertas_predictivas.sql` |
