--
-- PostgreSQL database dump
--

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: canal_pedido; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.canal_pedido AS ENUM (
    'LOCAL',
    'DELIVERY'
);


--
-- Name: estado_alerta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_alerta AS ENUM (
    'ACTIVA',
    'RESUELTA',
    'IGNORADA'
);


--
-- Name: estado_pedido; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_pedido AS ENUM (
    'PENDIENTE',
    'EN_PROCESO',
    'LISTO',
    'DESPACHADO',
    'CANCELADO'
);


--
-- Name: estado_producto; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_producto AS ENUM (
    'ACTIVO',
    'INACTIVO',
    'DESCONTINUADO'
);


--
-- Name: rol_usuario; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rol_usuario AS ENUM (
    'ADMINISTRADOR',
    'OPERARIO',
    'GERENTE'
);


--
-- Name: tipo_movimiento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_movimiento AS ENUM (
    'ENTRADA',
    'SALIDA',
    'AJUSTE',
    'MERMA',
    'DEVOLUCION'
);


--
-- Name: fn_actualizar_total_pedido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_actualizar_total_pedido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE pedidos
    SET total = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM pedido_detalle
        WHERE pedido_id = COALESCE(NEW.pedido_id, OLD.pedido_id)
    )
    WHERE id = COALESCE(NEW.pedido_id, OLD.pedido_id);
    RETURN NEW;
END;
$$;


--
-- Name: fn_alerta_stock(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_alerta_stock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.stock_actual <= NEW.punto_pedido AND
       NOT EXISTS (
           SELECT 1 FROM alertas_stock
           WHERE producto_id = NEW.id AND estado = 'ACTIVA'
       )
    THEN
        INSERT INTO alertas_stock (producto_id, stock_al_generar, punto_pedido_ref)
        VALUES (NEW.id, NEW.stock_actual, NEW.punto_pedido);
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alertas_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alertas_stock (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    producto_id uuid NOT NULL,
    stock_al_generar integer NOT NULL,
    punto_pedido_ref integer NOT NULL,
    origen character varying(30) DEFAULT 'STOCK_REAL'::character varying NOT NULL,
    prediccion_id uuid,
    cantidad_predicha integer,
    faltante_estimado integer,
    semana_inicio date,
    semana_fin date,
    mensaje character varying(500),
    estado public.estado_alerta DEFAULT 'ACTIVA'::public.estado_alerta NOT NULL,
    resuelta_por uuid,
    fecha_generada timestamp without time zone DEFAULT now() NOT NULL,
    fecha_resuelta timestamp without time zone
);


--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditoria (
    id bigint NOT NULL,
    usuario_id uuid,
    accion character varying(100) NOT NULL,
    tabla character varying(100),
    registro_id character varying(100),
    detalle jsonb,
    ip character varying(45),
    fecha timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre character varying(120) NOT NULL,
    descripcion text,
    padre_id integer,
    activa boolean DEFAULT true NOT NULL
);


--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- Name: configuracion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion (
    clave character varying(100) NOT NULL,
    valor text NOT NULL,
    descripcion text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: inventario_movimientos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventario_movimientos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    producto_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    tipo public.tipo_movimiento NOT NULL,
    cantidad integer NOT NULL,
    stock_antes integer NOT NULL,
    stock_despues integer NOT NULL,
    costo_unitario numeric(10,2),
    motivo character varying(300),
    referencia character varying(100),
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT inventario_movimientos_cantidad_check CHECK ((cantidad > 0))
);


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    titulo character varying(200) NOT NULL,
    mensaje text NOT NULL,
    leida boolean DEFAULT false NOT NULL,
    tipo character varying(50) DEFAULT 'INFO'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: pedido_detalle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedido_detalle (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pedido_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(12,2) GENERATED ALWAYS AS (((cantidad)::numeric * precio_unitario)) STORED,
    CONSTRAINT pedido_detalle_cantidad_check CHECK ((cantidad > 0))
);


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer NOT NULL,
    usuario_id uuid NOT NULL,
    canal public.canal_pedido NOT NULL,
    estado public.estado_pedido DEFAULT 'PENDIENTE'::public.estado_pedido NOT NULL,
    prioridad smallint DEFAULT 5 NOT NULL,
    cliente_nombre character varying(200),
    cliente_telefono character varying(20),
    cliente_dir text,
    observaciones text,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    fecha_ingreso timestamp without time zone DEFAULT now() NOT NULL,
    fecha_despacho timestamp without time zone,
    CONSTRAINT pedidos_prioridad_check CHECK (((prioridad >= 1) AND (prioridad <= 10)))
);


--
-- Name: pedidos_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pedidos_numero_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pedidos_numero_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pedidos_numero_seq OWNED BY public.pedidos.numero;


--
-- Name: predicciones_demanda; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.predicciones_demanda (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    producto_id uuid NOT NULL,
    semana_inicio date NOT NULL,
    semana_fin date NOT NULL,
    cantidad_predicha integer NOT NULL,
    cantidad_real integer,
    error_porcentaje numeric(6,2),
    confianza numeric(5,2),
    modelo_version character varying(50) DEFAULT 'v1.0-linreg'::character varying NOT NULL,
    generado_en timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.productos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sku character varying(50),
    codigo_barras character varying(50),
    nombre character varying(250) NOT NULL,
    descripcion text,
    marca character varying(100),
    unidad_medida character varying(30) DEFAULT 'UNIDAD'::character varying NOT NULL,
    categoria_id integer NOT NULL,
    proveedor_id integer NOT NULL,
    precio_costo numeric(10,2) NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    stock_actual integer DEFAULT 0 NOT NULL,
    stock_minimo integer DEFAULT 10 NOT NULL,
    stock_maximo integer DEFAULT 500 NOT NULL,
    punto_pedido integer DEFAULT 30 NOT NULL,
    estado public.estado_producto DEFAULT 'ACTIVO'::public.estado_producto NOT NULL,
    imagen_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT productos_precio_costo_check CHECK ((precio_costo >= (0)::numeric)),
    CONSTRAINT productos_precio_venta_check CHECK ((precio_venta >= (0)::numeric)),
    CONSTRAINT productos_stock_actual_check CHECK ((stock_actual >= 0))
);


--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedores (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    ruc character varying(11),
    contacto character varying(150),
    telefono character varying(20),
    email character varying(150),
    direccion text,
    lead_time_dias integer DEFAULT 3 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- Name: reportes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reportes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    tipo character varying(80) NOT NULL,
    formato character varying(10) NOT NULL,
    parametros jsonb,
    ruta_archivo text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sesiones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sesiones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expira_en timestamp without time zone NOT NULL,
    revocado boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(150) NOT NULL,
    apellido character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) DEFAULT 'PENDING_HASH'::character varying NOT NULL,
    rol public.rol_usuario DEFAULT 'OPERARIO'::public.rol_usuario NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    ultimo_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- Name: pedidos numero; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN numero SET DEFAULT nextval('public.pedidos_numero_seq'::regclass);


--
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- Name: alertas_stock alertas_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_stock
    ADD CONSTRAINT alertas_stock_pkey PRIMARY KEY (id);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: configuracion configuracion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_pkey PRIMARY KEY (clave);


--
-- Name: inventario_movimientos inventario_movimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_movimientos
    ADD CONSTRAINT inventario_movimientos_pkey PRIMARY KEY (id);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- Name: pedido_detalle pedido_detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_detalle
    ADD CONSTRAINT pedido_detalle_pkey PRIMARY KEY (id);


--
-- Name: pedidos pedidos_numero_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_numero_key UNIQUE (numero);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- Name: predicciones_demanda predicciones_demanda_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predicciones_demanda
    ADD CONSTRAINT predicciones_demanda_pkey PRIMARY KEY (id);


--
-- Name: predicciones_demanda predicciones_demanda_producto_id_semana_inicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predicciones_demanda
    ADD CONSTRAINT predicciones_demanda_producto_id_semana_inicio_key UNIQUE (producto_id, semana_inicio);


--
-- Name: productos productos_codigo_barras_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_codigo_barras_key UNIQUE (codigo_barras);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: productos productos_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_sku_key UNIQUE (sku);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: proveedores proveedores_ruc_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_ruc_key UNIQUE (ruc);


--
-- Name: reportes reportes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_pkey PRIMARY KEY (id);


--
-- Name: sesiones sesiones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_pkey PRIMARY KEY (id);


--
-- Name: sesiones sesiones_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_token_hash_key UNIQUE (token_hash);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_alertas_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alertas_estado ON public.alertas_stock USING btree (estado);


--
-- Name: idx_alertas_origen_semana; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alertas_origen_semana ON public.alertas_stock USING btree (origen, semana_inicio);


--
-- Name: idx_alertas_producto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alertas_producto ON public.alertas_stock USING btree (producto_id);


--
-- Name: idx_auditoria_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_fecha ON public.auditoria USING btree (fecha DESC);


--
-- Name: idx_auditoria_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_usuario ON public.auditoria USING btree (usuario_id);


--
-- Name: idx_mov_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_fecha ON public.inventario_movimientos USING btree (fecha DESC);


--
-- Name: idx_mov_producto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_producto ON public.inventario_movimientos USING btree (producto_id);


--
-- Name: idx_mov_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_tipo ON public.inventario_movimientos USING btree (tipo);


--
-- Name: idx_notif_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_usuario ON public.notificaciones USING btree (usuario_id, leida);


--
-- Name: idx_pedidos_canal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_canal ON public.pedidos USING btree (canal);


--
-- Name: idx_pedidos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_estado ON public.pedidos USING btree (estado);


--
-- Name: idx_pedidos_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_fecha ON public.pedidos USING btree (fecha_ingreso DESC);


--
-- Name: idx_pedidos_prioridad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_prioridad ON public.pedidos USING btree (prioridad);


--
-- Name: idx_pred_producto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pred_producto ON public.predicciones_demanda USING btree (producto_id);


--
-- Name: idx_pred_semana; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pred_semana ON public.predicciones_demanda USING btree (semana_inicio DESC);


--
-- Name: idx_productos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_productos_categoria ON public.productos USING btree (categoria_id);


--
-- Name: idx_productos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_productos_estado ON public.productos USING btree (estado);


--
-- Name: idx_productos_proveedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_productos_proveedor ON public.productos USING btree (proveedor_id);


--
-- Name: idx_productos_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_productos_sku ON public.productos USING btree (sku);


--
-- Name: idx_sesiones_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sesiones_usuario ON public.sesiones USING btree (usuario_id);


--
-- Name: productos trg_alerta_stock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_alerta_stock AFTER UPDATE OF stock_actual ON public.productos FOR EACH ROW EXECUTE FUNCTION public.fn_alerta_stock();


--
-- Name: configuracion trg_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_config_updated_at BEFORE UPDATE ON public.configuracion FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: productos trg_productos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: pedido_detalle trg_total_pedido; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_total_pedido AFTER INSERT OR DELETE OR UPDATE ON public.pedido_detalle FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_total_pedido();


--
-- Name: alertas_stock alertas_stock_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_stock
    ADD CONSTRAINT alertas_stock_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: alertas_stock alertas_stock_prediccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_stock
    ADD CONSTRAINT alertas_stock_prediccion_id_fkey FOREIGN KEY (prediccion_id) REFERENCES public.predicciones_demanda(id);


--
-- Name: alertas_stock alertas_stock_resuelta_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alertas_stock
    ADD CONSTRAINT alertas_stock_resuelta_por_fkey FOREIGN KEY (resuelta_por) REFERENCES public.usuarios(id);


--
-- Name: auditoria auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: categorias categorias_padre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_padre_id_fkey FOREIGN KEY (padre_id) REFERENCES public.categorias(id);


--
-- Name: inventario_movimientos inventario_movimientos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_movimientos
    ADD CONSTRAINT inventario_movimientos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: inventario_movimientos inventario_movimientos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_movimientos
    ADD CONSTRAINT inventario_movimientos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: notificaciones notificaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: pedido_detalle pedido_detalle_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_detalle
    ADD CONSTRAINT pedido_detalle_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- Name: pedido_detalle pedido_detalle_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_detalle
    ADD CONSTRAINT pedido_detalle_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: pedidos pedidos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: predicciones_demanda predicciones_demanda_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.predicciones_demanda
    ADD CONSTRAINT predicciones_demanda_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: productos productos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id);


--
-- Name: productos productos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: reportes reportes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: sesiones sesiones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones
    ADD CONSTRAINT sesiones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
