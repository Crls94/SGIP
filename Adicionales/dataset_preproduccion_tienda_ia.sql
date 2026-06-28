-- SGIP - dataset controlado de pre-produccion para tienda e IA predictiva.
-- Ejecutar manualmente sobre una base con esquema aplicado y primer administrador creado.
-- No es DataSeeder: no corre automaticamente y no crea credenciales demo.
--
-- Ejemplo:
-- psql -h localhost -U sgip_user -d metroDB_cliente \
--   -v admin_email='admin123@gmail.com' \
--   -f Adicionales/dataset_preproduccion_tienda_ia.sql

\set ON_ERROR_STOP on

\if :{?admin_email}
\else
\set admin_email 'admin123@gmail.com'
\endif

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.productos WHERE sku LIKE 'PREPROD-%') THEN
        RAISE EXCEPTION 'Dataset preproduccion ya cargado: existen productos PREPROD-%%';
    END IF;
END $$;

CREATE TEMP TABLE _admin_preprod AS
SELECT id
FROM public.usuarios
WHERE email = :'admin_email'
  AND rol = 'ADMINISTRADOR'
  AND activo = true
LIMIT 1;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM _admin_preprod) THEN
        RAISE EXCEPTION 'No existe administrador activo con el email indicado. Use -v admin_email=correo@cliente.com';
    END IF;
END $$;

INSERT INTO public.categorias (nombre, descripcion, activa)
VALUES
    ('Abarrotes', 'Productos basicos de despensa', true),
    ('Bebidas', 'Bebidas familiares de alta rotacion', true),
    ('Lacteos', 'Leches, yogures y derivados', true),
    ('Limpieza', 'Productos de limpieza del hogar', true),
    ('Cuidado Personal', 'Higiene y cuidado personal', true),
    ('Snacks', 'Galletas, chocolates y piqueos', true),
    ('Congelados', 'Productos congelados de consumo familiar', true),
    ('Panaderia', 'Productos de panaderia y desayuno', true)
ON CONFLICT (nombre) DO UPDATE
SET descripcion = EXCLUDED.descripcion,
    activa = true;

INSERT INTO public.proveedores (nombre, ruc, contacto, telefono, email, direccion, lead_time_dias, activo)
VALUES
    ('Distribuidora Ica Norte', '20555500001', 'Rosa Palomino', '956111222', 'ventas@icanorte.pe', 'Av. Industrial 120, Ica', 3, true),
    ('Mayorista Lima Sur', '20555500002', 'Carlos Mendoza', '956222333', 'pedidos@limasur.pe', 'Carretera Panamericana Sur km 21', 4, true),
    ('Lacteos Andinos SAC', '20555500003', 'Mariela Torres', '956333444', 'contacto@lacteosandinos.pe', 'Parque Industrial Lurin', 2, true),
    ('Limpieza Total SAC', '20555500004', 'Jorge Leon', '956444555', 'comercial@limpiezatotal.pe', 'Av. Argentina 650, Lima', 5, true),
    ('Congelados del Sur', '20555500005', 'Ana Salas', '956555666', 'ventas@congeladossur.pe', 'Zona Industrial Paracas', 4, true)
ON CONFLICT (ruc) DO UPDATE
SET nombre = EXCLUDED.nombre,
    contacto = EXCLUDED.contacto,
    telefono = EXCLUDED.telefono,
    email = EXCLUDED.email,
    direccion = EXCLUDED.direccion,
    lead_time_dias = EXCLUDED.lead_time_dias,
    activo = true;

CREATE TEMP TABLE _producto_plan (
    plan_id int GENERATED ALWAYS AS IDENTITY,
    sku text NOT NULL,
    nombre text NOT NULL,
    marca text NOT NULL,
    categoria text NOT NULL,
    proveedor_ruc text NOT NULL,
    unidad text NOT NULL,
    costo numeric(10,2) NOT NULL,
    venta numeric(10,2) NOT NULL,
    punto_pedido int NOT NULL,
    stock_minimo int NOT NULL,
    stock_maximo int NOT NULL,
    stock_final int NOT NULL,
    demanda_base int NOT NULL,
    tendencia numeric(5,2) NOT NULL,
    estacionalidad int NOT NULL,
    pred_factor numeric(5,2) NOT NULL,
    confianza numeric(5,2) NOT NULL
);

INSERT INTO _producto_plan
    (sku, nombre, marca, categoria, proveedor_ruc, unidad, costo, venta, punto_pedido, stock_minimo, stock_maximo, stock_final, demanda_base, tendencia, estacionalidad, pred_factor, confianza)
VALUES
    ('PREPROD-AB-001', 'Arroz Extra 5kg', 'Costeno', 'Abarrotes', '20555500001', 'BOLSA', 15.40, 21.90, 28, 12, 260, 46, 22, 0.50, 3, 0.94, 0.91),
    ('PREPROD-AB-002', 'Azucar Rubia 1kg', 'DulceSol', 'Abarrotes', '20555500001', 'BOLSA', 2.80, 4.50, 36, 15, 340, 72, 30, 0.20, 3, 1.06, 0.88),
    ('PREPROD-AB-003', 'Aceite Vegetal 1L', 'Primor', 'Abarrotes', '20555500002', 'BOTELLA', 6.60, 9.80, 34, 14, 320, 18, 26, 1.00, 4, 0.90, 0.89),
    ('PREPROD-AB-004', 'Fideos Spaghetti 500g', 'Don Vittorio', 'Abarrotes', '20555500002', 'PAQUETE', 2.10, 3.80, 30, 12, 300, 96, 24, 0.10, 2, 1.08, 0.86),
    ('PREPROD-AB-005', 'Conserva de Atun 170g', 'Florida', 'Abarrotes', '20555500001', 'LATA', 3.90, 6.20, 24, 10, 220, 82, 18, 0.20, 2, 0.97, 0.83),
    ('PREPROD-AB-006', 'Cafe Instantaneo 200g', 'Altomayo', 'Abarrotes', '20555500002', 'FRASCO', 10.80, 16.50, 18, 8, 160, 42, 12, 0.10, 1, 1.12, 0.84),
    ('PREPROD-AB-007', 'Harina Preparada 1kg', 'BlancaFlor', 'Abarrotes', '20555500001', 'BOLSA', 3.10, 5.40, 20, 8, 180, 58, 14, 0.30, 2, 0.95, 0.82),
    ('PREPROD-AB-008', 'Conserva de Durazno 820g', 'Aconcagua', 'Abarrotes', '20555500002', 'LATA', 6.20, 9.90, 16, 6, 140, 35, 9, 0.10, 1, 1.05, 0.80),
    ('PREPROD-BE-001', 'Agua Mineral 2.5L', 'Cielo', 'Bebidas', '20555500002', 'BOTELLA', 2.30, 4.20, 44, 20, 420, 30, 28, 1.80, 5, 0.92, 0.93),
    ('PREPROD-BE-002', 'Gaseosa Cola 3L', 'Inca Kola', 'Bebidas', '20555500002', 'BOTELLA', 5.40, 8.90, 38, 18, 360, 26, 24, 1.40, 4, 0.89, 0.90),
    ('PREPROD-BE-003', 'Jugo Nectar 1L', 'Frugos', 'Bebidas', '20555500002', 'CAJA', 3.20, 5.50, 26, 12, 240, 66, 18, 0.50, 3, 1.10, 0.86),
    ('PREPROD-BE-004', 'Bebida Rehidratante 500ml', 'Sporade', 'Bebidas', '20555500002', 'BOTELLA', 2.40, 4.50, 22, 10, 220, 24, 15, 1.00, 3, 0.93, 0.88),
    ('PREPROD-BE-005', 'Te Helado 500ml', 'FreeTea', 'Bebidas', '20555500002', 'BOTELLA', 2.00, 3.90, 18, 8, 160, 48, 11, 0.20, 2, 1.07, 0.81),
    ('PREPROD-LA-001', 'Leche Evaporada Six Pack', 'Gloria', 'Lacteos', '20555500003', 'PACK', 17.00, 24.90, 32, 14, 300, 20, 21, 1.20, 3, 0.91, 0.90),
    ('PREPROD-LA-002', 'Yogurt Familiar 1L', 'Laive', 'Lacteos', '20555500003', 'BOTELLA', 5.20, 8.20, 22, 10, 200, 18, 14, 0.80, 3, 0.90, 0.87),
    ('PREPROD-LA-003', 'Mantequilla 200g', 'Gloria', 'Lacteos', '20555500003', 'UNIDAD', 4.90, 7.80, 14, 6, 130, 38, 8, 0.10, 1, 1.08, 0.79),
    ('PREPROD-LA-004', 'Queso Fresco 500g', 'Andino', 'Lacteos', '20555500003', 'UNIDAD', 8.80, 13.50, 12, 6, 120, 22, 7, 0.20, 1, 0.96, 0.78),
    ('PREPROD-LI-001', 'Detergente Bolsa 4kg', 'Bolivar', 'Limpieza', '20555500004', 'BOLSA', 22.00, 31.90, 16, 8, 150, 54, 8, -0.10, 1, 1.05, 0.80),
    ('PREPROD-LI-002', 'Lavavajilla Liquido 750ml', 'Sapolio', 'Limpieza', '20555500004', 'BOTELLA', 4.70, 7.90, 18, 8, 170, 20, 10, 0.30, 2, 0.92, 0.85),
    ('PREPROD-LI-003', 'Lejia 1L', 'Clorox', 'Limpieza', '20555500004', 'BOTELLA', 2.40, 4.20, 20, 8, 190, 74, 12, -0.20, 2, 1.10, 0.82),
    ('PREPROD-LI-004', 'Limpiador Multiusos 900ml', 'Poett', 'Limpieza', '20555500004', 'BOTELLA', 4.20, 6.90, 16, 6, 150, 44, 9, 0.00, 1, 1.00, 0.80),
    ('PREPROD-CP-001', 'Papel Higienico 24 rollos', 'Elite', 'Cuidado Personal', '20555500004', 'PACK', 18.50, 27.90, 22, 10, 210, 24, 13, 0.60, 2, 0.93, 0.86),
    ('PREPROD-CP-002', 'Shampoo Familiar 750ml', 'Sedal', 'Cuidado Personal', '20555500004', 'BOTELLA', 10.20, 16.90, 12, 6, 120, 36, 7, -0.10, 1, 1.06, 0.78),
    ('PREPROD-CP-003', 'Jabon Tocador Pack x3', 'Dove', 'Cuidado Personal', '20555500004', 'PACK', 7.50, 11.90, 18, 8, 170, 52, 10, 0.10, 1, 1.04, 0.81),
    ('PREPROD-CP-004', 'Pasta Dental 180g', 'Colgate', 'Cuidado Personal', '20555500004', 'UNIDAD', 5.10, 8.50, 16, 6, 150, 33, 8, 0.20, 1, 0.98, 0.80),
    ('PREPROD-SN-001', 'Papas Fritas Familiar', 'Lays', 'Snacks', '20555500001', 'BOLSA', 5.90, 9.90, 26, 12, 250, 16, 16, 1.20, 3, 0.90, 0.89),
    ('PREPROD-SN-002', 'Chocolate Bitter Barra', 'Sublime', 'Snacks', '20555500001', 'UNIDAD', 2.80, 4.80, 22, 10, 210, 32, 13, 0.70, 2, 0.94, 0.86),
    ('PREPROD-SN-003', 'Galletas Vainilla Familiar', 'Field', 'Snacks', '20555500001', 'PAQUETE', 3.60, 6.20, 24, 10, 230, 68, 15, 0.20, 2, 1.07, 0.84),
    ('PREPROD-SN-004', 'Cereal Chocolate 400g', 'Angel', 'Snacks', '20555500001', 'CAJA', 7.40, 11.90, 14, 6, 130, 29, 8, 0.30, 1, 0.97, 0.79),
    ('PREPROD-CG-001', 'Hamburguesas Congeladas x8', 'San Fernando', 'Congelados', '20555500005', 'CAJA', 13.00, 20.50, 12, 6, 120, 17, 7, 0.40, 1, 0.91, 0.77),
    ('PREPROD-CG-002', 'Nuggets de Pollo 500g', 'San Fernando', 'Congelados', '20555500005', 'BOLSA', 10.50, 16.90, 14, 6, 140, 21, 8, 0.50, 1, 0.93, 0.79),
    ('PREPROD-CG-003', 'Helado Familiar 1L', 'Donofrio', 'Congelados', '20555500005', 'POTE', 8.80, 14.90, 16, 8, 150, 14, 9, 0.80, 2, 0.89, 0.82),
    ('PREPROD-CG-004', 'Verduras Congeladas 1kg', 'GreenFood', 'Congelados', '20555500005', 'BOLSA', 6.90, 10.90, 12, 5, 120, 31, 7, 0.00, 1, 1.03, 0.76),
    ('PREPROD-PA-001', 'Pan Molde Familiar', 'Bimbo', 'Panaderia', '20555500003', 'BOLSA', 5.40, 8.90, 28, 12, 260, 24, 17, 0.90, 3, 0.92, 0.88),
    ('PREPROD-PA-002', 'Tostadas Integrales', 'Union', 'Panaderia', '20555500003', 'PAQUETE', 4.20, 7.20, 16, 6, 150, 41, 9, 0.20, 1, 1.05, 0.80),
    ('PREPROD-PA-003', 'Queque Marmoleado', 'DulceHogar', 'Panaderia', '20555500003', 'UNIDAD', 6.80, 11.50, 14, 6, 130, 18, 8, 0.50, 1, 0.94, 0.78),
    ('PREPROD-PA-004', 'Paneton Caja 900g', 'Metro', 'Panaderia', '20555500003', 'CAJA', 12.50, 21.90, 20, 8, 180, 12, 6, 1.40, 3, 0.88, 0.83),
    ('PREPROD-AB-009', 'Lenteja Bolsa 500g', 'Costeno', 'Abarrotes', '20555500001', 'BOLSA', 3.30, 5.90, 18, 8, 160, 57, 11, 0.00, 1, 1.01, 0.79),
    ('PREPROD-AB-010', 'Avena Tradicional 1kg', 'Quaker', 'Abarrotes', '20555500001', 'BOLSA', 5.60, 9.30, 18, 8, 170, 34, 10, 0.40, 2, 0.95, 0.82),
    ('PREPROD-BE-006', 'Energizante 355ml', 'Volt', 'Bebidas', '20555500002', 'LATA', 3.20, 5.90, 20, 8, 180, 19, 12, 1.10, 3, 0.90, 0.85),
    ('PREPROD-CP-005', 'Desodorante Aerosol 150ml', 'Rexona', 'Cuidado Personal', '20555500004', 'UNIDAD', 7.10, 11.90, 12, 5, 120, 27, 7, 0.20, 1, 0.98, 0.77);

WITH productos_insertados AS (
    INSERT INTO public.productos (
        sku, codigo_barras, nombre, descripcion, marca, unidad_medida,
        categoria_id, proveedor_id, precio_costo, precio_venta,
        stock_actual, stock_minimo, stock_maximo, punto_pedido, estado
    )
    SELECT
        p.sku,
        '779' || lpad(p.plan_id::text, 10, '0'),
        p.nombre,
        'Producto preproduccion para validacion de tienda e IA predictiva',
        p.marca,
        p.unidad,
        c.id,
        pr.id,
        p.costo,
        p.venta,
        p.stock_final,
        p.stock_minimo,
        p.stock_maximo,
        p.punto_pedido,
        'ACTIVO'
    FROM _producto_plan p
    JOIN public.categorias c ON c.nombre = p.categoria
    JOIN public.proveedores pr ON pr.ruc = p.proveedor_ruc
    RETURNING id, sku
)
SELECT COUNT(*) AS productos_cargados FROM productos_insertados;

CREATE TEMP TABLE _demanda_preprod AS
WITH params AS (
    SELECT (date_trunc('week', current_date)::date - interval '12 weeks')::date AS semana_base
), demanda AS (
    SELECT
        p.plan_id,
        p.sku,
        p.stock_final,
        p.costo,
        p.demanda_base,
        p.pred_factor,
        p.confianza,
        gs.semana,
        (params.semana_base + ((gs.semana - 1) * interval '7 days'))::timestamp AS fecha_semana,
        greatest(
            1,
            round(p.demanda_base + (p.tendencia * (gs.semana - 1)) + ((((gs.semana + p.plan_id) % 3) - 1) * p.estacionalidad))::int
        ) AS cantidad
    FROM _producto_plan p
    CROSS JOIN params
    CROSS JOIN generate_series(1, 12) AS gs(semana)
)
SELECT
    d.*,
    sum(d.cantidad) OVER (PARTITION BY d.sku) AS total_salidas,
    sum(d.cantidad) OVER (PARTITION BY d.sku ORDER BY d.semana ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS salidas_previas,
    sum(d.cantidad) OVER (PARTITION BY d.sku ORDER BY d.semana ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS salidas_acumuladas
FROM demanda d;

INSERT INTO public.inventario_movimientos (
    producto_id, usuario_id, tipo, cantidad, stock_antes, stock_despues,
    costo_unitario, motivo, referencia, fecha
)
SELECT
    prod.id,
    admin.id,
    'ENTRADA',
    (d.stock_final + d.total_salidas)::int,
    0,
    (d.stock_final + d.total_salidas)::int,
    d.costo,
    'Carga inicial controlada preproduccion tienda',
    'PREPROD_IA_TIENDA',
    (min(d.fecha_semana) - interval '2 days')
FROM _demanda_preprod d
JOIN public.productos prod ON prod.sku = d.sku
CROSS JOIN _admin_preprod admin
GROUP BY prod.id, admin.id, d.stock_final, d.total_salidas, d.costo;

INSERT INTO public.inventario_movimientos (
    producto_id, usuario_id, tipo, cantidad, stock_antes, stock_despues,
    costo_unitario, motivo, referencia, fecha
)
SELECT
    prod.id,
    admin.id,
    'SALIDA',
    d.cantidad,
    (d.stock_final + d.total_salidas - coalesce(d.salidas_previas, 0))::int,
    (d.stock_final + d.total_salidas - d.salidas_acumuladas)::int,
    d.costo,
    'Venta historica simulada para entrenamiento IA',
    'PREPROD_IA_TIENDA',
    d.fecha_semana + interval '15 hours'
FROM _demanda_preprod d
JOIN public.productos prod ON prod.sku = d.sku
CROSS JOIN _admin_preprod admin
ORDER BY prod.sku, d.semana;

INSERT INTO public.predicciones_demanda (
    producto_id, semana_inicio, semana_fin, cantidad_predicha,
    cantidad_real, error_porcentaje, confianza, modelo_version
)
SELECT
    prod.id,
    d.fecha_semana::date,
    (d.fecha_semana::date + 6),
    greatest(1, round(d.cantidad * d.pred_factor))::int AS cantidad_predicha,
    d.cantidad AS cantidad_real,
    round(
        abs(d.cantidad - greatest(1, round(d.cantidad * d.pred_factor))::int) * 100.0
        / greatest(1, round(d.cantidad * d.pred_factor))::int,
        2
    ) AS error_porcentaje,
    d.confianza,
    'v1.0-preprod-historico'
FROM _demanda_preprod d
JOIN public.productos prod ON prod.sku = d.sku
WHERE d.semana = 12
ON CONFLICT (producto_id, semana_inicio) DO NOTHING;

SELECT
    (SELECT COUNT(*) FROM public.productos WHERE sku LIKE 'PREPROD-%') AS productos_preprod,
    (SELECT COUNT(*) FROM public.inventario_movimientos WHERE referencia = 'PREPROD_IA_TIENDA') AS movimientos_preprod,
    (SELECT COUNT(*) FROM public.inventario_movimientos WHERE referencia = 'PREPROD_IA_TIENDA' AND tipo = 'SALIDA') AS salidas_preprod,
    (SELECT COUNT(*) FROM public.predicciones_demanda pd JOIN public.productos p ON p.id = pd.producto_id WHERE p.sku LIKE 'PREPROD-%') AS predicciones_preprod;
