# Dataset preproduccion precision IA

Este script complementa la sustentacion cuando la IA ya genero predicciones futuras y el dashboard necesita mostrar precision historica controlada.

## Archivo SQL

```text
Adicionales/dataset_preproduccion_precision_ia.sql
```

## Uso

```bash
psql -h localhost -U sgip_user -d metroDB_cliente \
  -f Adicionales/dataset_preproduccion_precision_ia.sql
```

## Que hace

- Busca predicciones de productos `PREPROD-%` con `cantidad_real` pendiente.
- Asigna una cantidad real simulada cercana a la prediccion.
- Calcula `error_porcentaje`.
- Permite que el dashboard muestre precision promedio sin esperar al cierre real de la semana.

## Que no hace

- No crea usuarios.
- No modifica contrasenas.
- No crea productos ni movimientos.
- No reemplaza datos reales de cliente.

## Uso en discurso academico

La precision mostrada corresponde a una simulacion de validacion historica para el entorno de sustentacion. En produccion real, el valor se calcula con ventas reales una vez cerrada la semana pronosticada.
