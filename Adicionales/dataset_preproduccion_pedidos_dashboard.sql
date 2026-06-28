-- SGIP - dataset controlado de pedidos/ventas para dashboard pre-produccion.
-- Ejecutar despues de dataset_preproduccion_tienda_ia.sql.
-- No crea usuarios ni credenciales. Usa el administrador existente por email.
--
-- Ejemplo:
-- psql -h localhost -U sgip_user -d metroDB_cliente \
--   -v admin_email='admin123@gmail.com' \
--   -f Adicionales/dataset_preproduccion_pedidos_dashboard.sql

\set ON_ERROR_STOP on

\if :{?admin_email}
\else
\set admin_email 'admin123@gmail.com'
\endif

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.pedidos WHERE observaciones = 'PREPROD_DASHBOARD_PEDIDOS') THEN
        RAISE EXCEPTION 'Dataset dashboard ya cargado: existen pedidos PREPROD_DASHBOARD_PEDIDOS';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.productos WHERE sku LIKE 'PREPROD-%') THEN
        RAISE EXCEPTION 'Primero cargar Adicionales/dataset_preproduccion_tienda_ia.sql';
    END IF;
END $$;

CREATE TEMP TABLE _admin_dashboard AS
SELECT id
FROM public.usuarios
WHERE email = :'admin_email'
  AND rol = 'ADMINISTRADOR'
  AND activo = true
LIMIT 1;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM _admin_dashboard) THEN
        RAISE EXCEPTION 'No existe administrador activo con el email indicado. Use -v admin_email=correo@cliente.com';
    END IF;
END $$;

CREATE TEMP TABLE _productos_dashboard AS
SELECT
    row_number() OVER (ORDER BY precio_venta DESC, nombre) AS rn,
    id,
    precio_venta
FROM public.productos
WHERE sku LIKE 'PREPROD-%'
ORDER BY precio_venta DESC, nombre
LIMIT 24;

CREATE TEMP TABLE _pedido_plan AS
SELECT
    gs AS idx,
    CASE
        WHEN gs % 5 IN (0, 1) THEN 'DELIVERY'::public.canal_pedido
        ELSE 'LOCAL'::public.canal_pedido
    END AS canal,
    CASE
        WHEN gs <= 10 THEN CASE WHEN gs % 3 = 0 THEN 'LISTO'::public.estado_pedido WHEN gs % 3 = 1 THEN 'EN_PROCESO'::public.estado_pedido ELSE 'PENDIENTE'::public.estado_pedido END
        WHEN gs % 17 = 0 THEN 'CANCELADO'::public.estado_pedido
        WHEN gs % 11 = 0 THEN 'LISTO'::public.estado_pedido
        ELSE 'DESPACHADO'::public.estado_pedido
    END AS estado,
    CASE
        WHEN gs % 5 IN (0, 1) THEN 3
        WHEN gs <= 10 THEN 4
        ELSE 5
    END::smallint AS prioridad,
    CASE
        WHEN gs <= 16 THEN current_date
        ELSE current_date - ((gs - 17) % 6 + 1)
    END AS fecha_base,
    make_interval(hours => 8 + (gs % 12), mins => (gs * 7) % 60) AS hora,
    'Cliente Preprod ' || lpad(gs::text, 3, '0') AS cliente_nombre,
    '9' || lpad((60000000 + gs)::text, 8, '0') AS cliente_telefono,
    CASE
        WHEN gs % 5 IN (0, 1) THEN 'Direccion simulada ' || gs || ', Ica'
        ELSE NULL
    END AS cliente_dir
FROM generate_series(1, 96) AS gs;

CREATE TEMP TABLE _pedidos_insertados AS
WITH inserted AS (
    INSERT INTO public.pedidos (
        usuario_id, canal, estado, prioridad, cliente_nombre, cliente_telefono,
        cliente_dir, observaciones, fecha_ingreso, fecha_despacho
    )
    SELECT
        admin.id,
        p.canal,
        p.estado,
        p.prioridad,
        p.cliente_nombre,
        p.cliente_telefono,
        p.cliente_dir,
        'PREPROD_DASHBOARD_PEDIDOS',
        (p.fecha_base::timestamp + p.hora),
        CASE
            WHEN p.estado = 'DESPACHADO' THEN (p.fecha_base::timestamp + p.hora + interval '45 minutes')
            ELSE NULL
        END
    FROM _pedido_plan p
    CROSS JOIN _admin_dashboard admin
    RETURNING id, fecha_ingreso
)
SELECT id, fecha_ingreso FROM inserted;

CREATE TEMP TABLE _pedidos_ordenados AS
SELECT row_number() OVER (ORDER BY fecha_ingreso, id) AS idx, id
FROM _pedidos_insertados;

INSERT INTO public.pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario)
SELECT
    po.id,
    pr.id,
    1 + ((po.idx + item.item_idx) % 4) AS cantidad,
    pr.precio_venta
FROM _pedidos_ordenados po
CROSS JOIN generate_series(1, 3) AS item(item_idx)
JOIN _productos_dashboard pr
  ON pr.rn = (((po.idx * 3 + item.item_idx * 5) % (SELECT COUNT(*) FROM _productos_dashboard)) + 1)
WHERE item.item_idx <= CASE WHEN po.idx % 4 = 0 THEN 3 WHEN po.idx % 2 = 0 THEN 2 ELSE 1 END;

SELECT
    (SELECT COUNT(*) FROM public.pedidos WHERE observaciones = 'PREPROD_DASHBOARD_PEDIDOS') AS pedidos_preprod,
    (SELECT COUNT(*) FROM public.pedido_detalle pd JOIN public.pedidos p ON p.id = pd.pedido_id WHERE p.observaciones = 'PREPROD_DASHBOARD_PEDIDOS') AS detalles_preprod,
    (SELECT COALESCE(SUM(total), 0) FROM public.pedidos WHERE observaciones = 'PREPROD_DASHBOARD_PEDIDOS' AND fecha_ingreso::date = current_date AND estado <> 'CANCELADO') AS venta_hoy_preprod,
    (SELECT COUNT(*) FROM public.pedidos WHERE observaciones = 'PREPROD_DASHBOARD_PEDIDOS' AND estado NOT IN ('DESPACHADO', 'CANCELADO')) AS cola_preprod;
