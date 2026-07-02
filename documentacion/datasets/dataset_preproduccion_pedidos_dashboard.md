# Dataset preproduccion pedidos dashboard

Este dataset complementa `dataset_preproduccion_tienda_ia.sql` para que el dashboard muestre actividad comercial visible durante la sustentacion.

## Objetivo

Alimentar metricas que no dependen solo de movimientos de inventario:

- venta de hoy,
- ventas de ultimos 7 dias,
- pedidos por estado,
- pedidos por canal,
- cola priorizada de pedidos,
- reportes de pedidos.

## Archivo SQL

```text
Adicionales/dataset_preproduccion_pedidos_dashboard.sql
```

## Requisitos

- Base con esquema aplicado.
- Primer administrador productivo creado.
- Dataset IA/productos cargado previamente.

## Ejecucion

```bash
psql -h localhost -U sgip_user -d metroDB_cliente \
  -v admin_email='admin123@gmail.com' \
  -f Adicionales/dataset_preproduccion_pedidos_dashboard.sql
```

## Contenido

| Elemento | Cantidad aproximada |
|---|---:|
| Pedidos | 96 |
| Detalles de pedido | 144-192 |
| Periodo | Hoy y ultimos 7 dias |
| Canales | LOCAL y DELIVERY |
| Estados | PENDIENTE, EN_PROCESO, LISTO, DESPACHADO, CANCELADO |

Los pedidos usan `observaciones = 'PREPROD_DASHBOARD_PEDIDOS'` para identificarlos.

## Seguridad

- No crea usuarios.
- No modifica contrasenas.
- No modifica stock, porque el dataset IA ya representa movimientos historicos.
- Aborta si detecta pedidos preproduccion previos para evitar duplicados.

## Validacion SQL

```sql
SELECT COUNT(*) FROM pedidos WHERE observaciones = 'PREPROD_DASHBOARD_PEDIDOS';
SELECT estado, COUNT(*) FROM pedidos WHERE observaciones = 'PREPROD_DASHBOARD_PEDIDOS' GROUP BY estado;
SELECT canal, COUNT(*) FROM pedidos WHERE observaciones = 'PREPROD_DASHBOARD_PEDIDOS' GROUP BY canal;
SELECT fecha_ingreso::date, COUNT(*), SUM(total) FROM pedidos WHERE observaciones = 'PREPROD_DASHBOARD_PEDIDOS' GROUP BY fecha_ingreso::date ORDER BY fecha_ingreso::date;
```

## Validacion funcional

1. Iniciar backend con `bash scripts/run-prod.sh`.
2. Entrar al dashboard.
3. Verificar venta de hoy y grafico de ultimos 7 dias.
4. Revisar cola de pedidos.
5. Generar reporte de pedidos.
