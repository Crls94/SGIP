-- Migracion de Esquema para SGIP Backend
-- Fecha: 2026-05-08
-- Descripcion: Columnas y tablas adicionales necesarias para las nuevas features
--
-- NOTA: Si la columna `version` ya existe, esta linea se ignora con IF NOT EXISTS.
-- En PostgreSQL 18+, IF NOT EXISTS funciona con ALTER TABLE ADD COLUMN.

-- 1. Columna de version para bloqueo optimista (opcional, el sistema usa bloqueo pesimista)
--    Descomentar si se desea activar bloqueo optimista adicional en Producto:
-- ALTER TABLE productos ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0 NOT NULL;

-- 2. Indice adicional para busquedas de alertas por producto y estado
CREATE INDEX IF NOT EXISTS idx_alertas_producto_estado ON alertas_stock (producto_id, estado);

-- 3. Verificar que las tablas requeridas existen (reportes, sesiones, auditoria)
--    Estas tablas ya deberian existir desde la creacion inicial de la DB.
--    Si no existen, ejecutar las sentencias del dump original (metro_esquema.sql).

-- 4. Secuencia para auditoria.id (si no existe)
-- CREATE SEQUENCE IF NOT EXISTS auditoria_id_seq START WITH 1;
