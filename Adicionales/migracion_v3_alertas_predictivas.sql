-- ============================================================
-- MIGRACION V3 - Alertas predictivas IA
-- Agrega soporte para distinguir alertas por stock real y por riesgo predictivo.
-- Ejecutar una vez sobre bases existentes antes de levantar el backend actualizado.
-- ============================================================

ALTER TABLE public.alertas_stock
    ADD COLUMN IF NOT EXISTS origen character varying(30) NOT NULL DEFAULT 'STOCK_REAL',
    ADD COLUMN IF NOT EXISTS prediccion_id uuid,
    ADD COLUMN IF NOT EXISTS cantidad_predicha integer,
    ADD COLUMN IF NOT EXISTS faltante_estimado integer,
    ADD COLUMN IF NOT EXISTS semana_inicio date,
    ADD COLUMN IF NOT EXISTS semana_fin date,
    ADD COLUMN IF NOT EXISTS mensaje character varying(500);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'alertas_stock_prediccion_id_fkey'
    ) THEN
        ALTER TABLE public.alertas_stock
            ADD CONSTRAINT alertas_stock_prediccion_id_fkey
            FOREIGN KEY (prediccion_id) REFERENCES public.predicciones_demanda(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_alertas_origen_semana
    ON public.alertas_stock USING btree (origen, semana_inicio);
