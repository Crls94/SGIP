# SGIP - Entorno cliente sin seed

Esta guia prepara un ambiente de presentacion/producto usando el perfil `prod`. No usa `DataSeeder`, usuarios demo ni datos precargados por la aplicacion.

## 1. Objetivo

Demostrar SGIP como producto instalable para un cliente:

- El backend valida un esquema PostgreSQL existente con `ddl-auto=validate`.
- La base del cliente se inicializa por SQL controlado.
- El primer administrador se crea con hash BCrypt fuera del repositorio.
- Los datos operativos se cargan desde la interfaz o por migraciones autorizadas del cliente.
- La IA usa el backend REST y requiere movimientos historicos de salida para predecir.

## 2. Preparar PostgreSQL

Crear base y usuario segun la politica del cliente. Ejemplo local:

```bash
createdb metroDB_cliente
```

Aplicar esquema limpio:

```bash
psql -d metroDB_cliente -f Adicionales/metro_esquema_clean.sql
```

Si la base viene de una version anterior, aplicar la migracion de alertas predictivas que corresponda:

```bash
psql -d metroDB_cliente -f Adicionales/migracion_v3_alertas_predictivas.sql
```

## 3. Crear primer administrador

Generar un hash BCrypt fuera del repositorio. No usar texto plano en SQL ni commitear el hash real.

Ejecutar la plantilla:

```bash
psql -h localhost -U sgip_user -d metroDB_cliente \
  -v admin_email='admin@cliente.com' \
  -v admin_nombre='Admin' \
  -v admin_apellido='Cliente' \
  -v admin_password_hash='$2a$10$hash_bcrypt_generado_fuera_del_repo' \
  -f Adicionales/crear_primer_admin_prod.sql
```

Luego los demas usuarios se crean desde la pantalla `Usuarios` con una sesion administrativa.

## 4. Variables productivas

Usar `.env.example` como plantilla y configurar valores reales en el servidor, no en el repositorio.

Variables minimas del backend:

```bash
export SPRING_PROFILES_ACTIVE=prod
export DB_URL=jdbc:postgresql://host:5432/metroDB_cliente
export DB_USER=sgip_user
export DB_PASSWORD=password_seguro
export JWT_SECRET=clave_larga_segura_minimo_32_caracteres
export REPORTES_DIR=/opt/sgip/reportes
```

Crear el directorio de reportes fuera de carpetas publicas:

```bash
mkdir -p /opt/sgip/reportes
```

## 5. Ejecutar backend

Verificar antes de levantar:

```bash
./mvnw test
```

Ejecutar en modo producto:

```bash
set -a && source .env && set +a && ./mvnw spring-boot:run
```

Tambien puede usarse el script auxiliar, que carga `.env`, valida variables requeridas y crea `REPORTES_DIR` si no existe:

```bash
bash scripts/run-prod.sh
```

Para servidor real, empaquetar y ejecutar el `.jar` como servicio:

```bash
./mvnw package
SPRING_PROFILES_ACTIVE=prod java -jar target/sgip-backend-0.0.1-SNAPSHOT.jar
```

## 6. Frontend

Verificar y compilar:

```bash
cd frontend
npm audit --omit=dev --audit-level=moderate
npm run build
```

En despliegue real, servir `frontend/dist` con Nginx y proxyear `/api` al backend.

## 7. IA predictiva

En producto, no usar credenciales demo. Configurar token emitido para un usuario `ADMINISTRADOR` o `GERENTE`:

```bash
export IA_ENV=prod
export IA_API_URL=https://dominio-cliente/api/v1/inteligencia/datos-entrenamiento
export IA_PREDICCIONES_URL=https://dominio-cliente/api/v1/inteligencia/predicciones
export IA_API_TOKEN=token_jwt_admin_o_gerente
```

Ejecutar:

```bash
streamlit run ia_prediccion.py
```

La IA mostrara predicciones cuando existan movimientos historicos de tipo `SALIDA` y al menos dos semanas de datos por producto.

## 8. Dataset controlado para sustentacion

Una base `prod` recien instalada no tiene historial suficiente para demostrar IA. Para sustentacion puede cargarse un dataset opcional que simula 12 semanas de operacion de tienda sin usar `DataSeeder`.

Documento tecnico:

```text
documentacion/dataset_preproduccion_tienda_ia.md
```

Ejecucion:

```bash
psql -h localhost -U sgip_user -d metroDB_cliente \
  -v admin_email='admin123@gmail.com' \
  -f Adicionales/dataset_preproduccion_tienda_ia.sql
```

Este dataset carga categorias, proveedores, 41 productos, movimientos historicos y predicciones cerradas para visualizar precision historica. No crea usuarios ni contrasenas.

Para alimentar metricas comerciales del dashboard, cargar tambien el dataset de pedidos:

```bash
psql -h localhost -U sgip_user -d metroDB_cliente \
  -v admin_email='admin123@gmail.com' \
  -f Adicionales/dataset_preproduccion_pedidos_dashboard.sql
```

Documento tecnico:

```text
documentacion/dataset_preproduccion_pedidos_dashboard.md
```

Si ya se ejecuto la IA y existen predicciones futuras sin precision, puede cargarse una validacion historica simulada para sustentacion:

```bash
psql -h localhost -U sgip_user -d metroDB_cliente \
  -f Adicionales/dataset_preproduccion_precision_ia.sql
```

Documento tecnico:

```text
documentacion/dataset_preproduccion_precision_ia.md
```

## 9. Validacion final de presentacion

Comandos:

```bash
./mvnw test
```

```bash
cd frontend && npm audit --omit=dev --audit-level=moderate && npm run build
```

```bash
/tmp/opencode/sgip-ia-venv/bin/python -m unittest test_ia_prediccion.py
```

Flujos manuales minimos:

1. Login con el administrador creado por SQL.
2. Crear usuario operario o gerente.
3. Crear proveedor, categoria/producto si la base esta limpia.
4. Registrar entrada de stock.
5. Registrar pedido o salida.
6. Generar reporte.
7. Consultar dashboard.
8. Ejecutar IA si ya hay historial suficiente.

## 10. Diferencia con demo

- `demo`: carga usuarios y datos historicos de simulacion mediante `DataSeeder`.
- `prod`: no carga seed, no usa credenciales demo y depende de la base/configuracion del cliente.
