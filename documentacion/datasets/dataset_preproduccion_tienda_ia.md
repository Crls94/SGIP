# Dataset preproduccion tienda IA

Este documento describe la carga controlada para demostrar SGIP en perfil `prod` sin usar `DataSeeder`.

## Objetivo

Validar una tienda con datos suficientes para:

- inventario y productos,
- movimientos historicos,
- dashboard gerencial,
- reportes,
- entrenamiento IA,
- predicciones con precision historica,
- alertas predictivas.

## Archivo SQL

```text
Adicionales/dataset_preproduccion_tienda_ia.sql
```

El script no crea usuarios ni contrasenas. Usa el administrador existente mediante `admin_email`.

## Contenido

| Elemento | Cantidad |
|---|---:|
| Categorias | 8 |
| Proveedores | 5 |
| Productos | 41 |
| Semanas historicas | 12 |
| Movimientos de entrada | 41 |
| Movimientos de salida | 492 |
| Predicciones historicas cerradas | 41 |

Los productos usan SKU `PREPROD-*` y los movimientos usan referencia `PREPROD_IA_TIENDA`.

## Ejecucion

Ejecutar despues de aplicar el esquema y crear el primer administrador:

```bash
psql -h localhost -U sgip_user -d metroDB_cliente \
  -v admin_email='admin@cliente.com' \
  -f Adicionales/dataset_preproduccion_tienda_ia.sql
```

Si no se envia `admin_email`, el script usa `admin@cliente.com` por defecto.

## Seguridad

- No contiene passwords.
- No contiene hashes BCrypt.
- No se ejecuta automaticamente.
- No depende de `SPRING_PROFILES_ACTIVE=demo`.
- Aborta si detecta productos `PREPROD-%` para evitar duplicados.

## Validacion SQL

```sql
SELECT COUNT(*) FROM productos WHERE sku LIKE 'PREPROD-%';
SELECT tipo, COUNT(*) FROM inventario_movimientos WHERE referencia = 'PREPROD_IA_TIENDA' GROUP BY tipo;
SELECT COUNT(*) FROM predicciones_demanda pd JOIN productos p ON p.id = pd.producto_id WHERE p.sku LIKE 'PREPROD-%';
```

## Validacion funcional

1. Iniciar backend con `bash scripts/run-prod.sh`.
2. Iniciar sesion con el administrador productivo.
3. Revisar productos, movimientos y dashboard.
4. Generar reporte de inventario.
5. Configurar `IA_ENV=prod` e `IA_API_TOKEN`.
6. Ejecutar `streamlit run ia_prediccion.py`.
7. Confirmar que IA carga historicos, entrena y guarda predicciones via backend.
8. Generar alertas predictivas desde el sistema.

## Precision historica

El script inserta predicciones cerradas para la semana historica mas reciente del dataset. Esto permite mostrar porcentaje de precision en dashboard sin esperar una semana real.

Si luego se ejecuta la IA y se guardan nuevas predicciones futuras, esas predicciones pueden aparecer como precision pendiente hasta que su semana cierre y existan ventas reales para comparacion.
