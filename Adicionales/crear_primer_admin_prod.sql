-- SGIP - plantilla para crear el primer administrador productivo sin DataSeeder.
-- Ejecutar con psql despues de aplicar Adicionales/metro_esquema_clean.sql.
-- No guardar el hash real en el repositorio.
--
-- Ejemplo:
-- psql -h localhost -U sgip_user -d metroDB_cliente \
--   -v admin_email='admin@cliente.com' \
--   -v admin_nombre='Admin' \
--   -v admin_apellido='Cliente' \
--   -v admin_password_hash='$2a$10$hash_bcrypt_generado_fuera_del_repo' \
--   -f Adicionales/crear_primer_admin_prod.sql

\set ON_ERROR_STOP on

SELECT CASE
    WHEN :'admin_password_hash' IN ('', 'PENDING_HASH') THEN 1 / 0
    ELSE 1
END AS validacion_hash_bcrypt;

INSERT INTO public.usuarios (nombre, apellido, email, password_hash, rol, activo)
VALUES (:'admin_nombre', :'admin_apellido', :'admin_email', :'admin_password_hash', 'ADMINISTRADOR', true)
ON CONFLICT (email) DO UPDATE
SET nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    password_hash = EXCLUDED.password_hash,
    rol = 'ADMINISTRADOR',
    activo = true;

SELECT id, email, rol, activo, created_at
FROM public.usuarios
WHERE email = :'admin_email';
