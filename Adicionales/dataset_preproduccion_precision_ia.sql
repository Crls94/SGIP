-- SGIP - backfill de precision IA para predicciones preproduccion pendientes.
-- Usar cuando la IA ya genero predicciones futuras y se quiere mostrar precision controlada en dashboard.
-- No crea productos, usuarios ni movimientos.

\set ON_ERROR_STOP on

WITH objetivo AS (
    SELECT
        pd.id,
        pd.cantidad_predicha,
        row_number() OVER (ORDER BY p.sku) AS rn
    FROM public.predicciones_demanda pd
    JOIN public.productos p ON p.id = pd.producto_id
    WHERE p.sku LIKE 'PREPROD-%'
      AND pd.cantidad_real IS NULL
), calculo AS (
    SELECT
        id,
        cantidad_predicha,
        greatest(1, round(cantidad_predicha * (0.88 + ((rn % 7) * 0.02))))::int AS cantidad_real
    FROM objetivo
)
UPDATE public.predicciones_demanda pd
SET cantidad_real = c.cantidad_real,
    error_porcentaje = round(abs(c.cantidad_real - c.cantidad_predicha) * 100.0 / greatest(1, c.cantidad_predicha), 2)
FROM calculo c
WHERE pd.id = c.id;

SELECT
    COUNT(*) AS predicciones_preprod_con_real,
    round(AVG(100 - error_porcentaje), 2) AS precision_promedio_preprod
FROM public.predicciones_demanda pd
JOIN public.productos p ON p.id = pd.producto_id
WHERE p.sku LIKE 'PREPROD-%'
  AND pd.cantidad_real IS NOT NULL;
