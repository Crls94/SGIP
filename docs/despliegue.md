# Despliegue

SGIP soporta tres modos de despliegue: local, Supabase + hosting, y VPS tradicional.

---

## Despliegue local (desarrollo / demo)

### Con perfil `demo`

```bash
SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run
cd frontend && npm install && npm run dev
```

El perfil `demo` carga datos automáticamente. Ideal para desarrollo rápido.

### Con perfil `prod` y `.env`

```bash
cp .env.example .env
# Editar .env con valores reales
nano .env
bash scripts/run-prod.sh
```

El script `scripts/run-prod.sh` carga `.env`, valida las variables y arranca.

---

## Despliegue con Supabase (base de datos en la nube)

Supabase proporciona PostgreSQL administrado sin necesidad de instalar ni mantener la base en un VPS.

### 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) y crear cuenta.
2. Crear un nuevo proyecto.
3. En **Project Settings → Database → Connection Pooling**, seleccionar **Session pooler**.
4. Copiar la connection string en formato URI.

### 2. Configurar `.env`

```bash
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require
DB_USER=postgres.xxxxxxxxxxxxx
DB_PASSWORD=password_de_supabase
JWT_SECRET=clave_larga_segura_minimo_32_caracteres
JWT_EXPIRATION=3600000
REPORTES_DIR=./reportes
```

!!! warning "Connection pooler"
    Usar **Session pooler**, no **Direct connection**. La conexión directa usa IPv6 y puede fallar desde redes IPv4.

### 3. Cargar el esquema

```bash
psql "postgresql://USUARIO:CONTRASEÑA@HOST:5432/postgres?sslmode=require" \
  -f Adicionales/metro_esquema_clean.sql
```

### 4. Crear el primer administrador

```bash
# Generar hash BCrypt fuera del repositorio
# Ejemplo con Python:
python -c "import bcrypt; print(bcrypt.hashpw(b'mi_password'.encode(), bcrypt.gensalt()).decode())"

# Insertar con psql
psql "postgresql://USUARIO:CONTRASEÑA@HOST:5432/postgres?sslmode=require" \
  -v admin_email='admin@cliente.com' \
  -v admin_nombre='Admin' \
  -v admin_apellido='Cliente' \
  -v admin_password_hash='$2a$10$...' \
  -f Adicionales/crear_primer_admin_prod.sql
```

### 5. Cargar datasets de preproducción (opcional)

```bash
# Dataset de tienda e IA
psql "postgresql://..." \
  -v admin_email='admin@cliente.com' \
  -f Adicionales/dataset_preproduccion_tienda_ia.sql

# Dataset de pedidos y dashboard
psql "postgresql://..." \
  -v admin_email='admin@cliente.com' \
  -f Adicionales/dataset_preproduccion_pedidos_dashboard.sql

# Backfill de precisión IA
psql "postgresql://..." \
  -f Adicionales/dataset_preproduccion_precision_ia.sql
```

### 6. Migrar datos desde PostgreSQL local

```bash
# Exportar base local
pg_dump -h localhost -U postgres -d metroDB_cliente \
  -n public --no-owner --no-acl -Fc -f sgip_local.dump

# Restaurar en Supabase
pg_restore --no-owner --no-acl \
  -h aws-0-region.pooler.supabase.com -p 5432 \
  -U postgres.xxxxxxxxx -d postgres sgip_local.dump
```

### 7. Arrancar backend

Con el backend apuntando a Supabase:

```bash
bash scripts/run-prod.sh
```

Verificar que el backend arranca sin errores de esquema.

---

## Despliegue en VPS

### Requisitos del servidor

| Componente | Recomendación |
|---|---|
| Sistema operativo | Ubuntu 22.04+ / Debian 12+ |
| RAM | 2 GB mínimo |
| Disco | 20 GB mínimo |
| Java | JDK 21 |
| PostgreSQL | 16+ (o usar Supabase) |
| Nginx | Última versión estable |
| Node.js | 20+ (solo para build del frontend) |

### 1. Preparar el servidor

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar Java
sudo apt install openjdk-21-jdk -y

# Instalar PostgreSQL (opcional si usas Supabase)
sudo apt install postgresql -y

# Instalar Nginx
sudo apt install nginx -y
```

### 2. Clonar y construir

```bash
git clone https://github.com/ChriSHM29/sgipProy.git
cd sgipProy
git checkout version4.0

# Crear .env
cp .env.example .env
nano .env

# Construir backend
./mvnw package

# Construir frontend
cd frontend
npm install
npm run build
```

### 3. Ejecutar backend como servicio `systemd`

Crear `/etc/systemd/system/sgip-backend.service`:

```ini
[Unit]
Description=SGIP Backend
After=network.target

[Service]
Type=simple
User=sgip
WorkingDirectory=/opt/sgip
EnvironmentFile=/opt/sgip/.env
ExecStart=/usr/bin/java -jar /opt/sgip/sgip-backend.jar
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Activar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sgip-backend
```

### 4. Configurar Nginx

```nginx
server {
    listen 80;
    server_name _;

    # Frontend
    root /opt/sgip/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. Habilitar SSL (opcional)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tudominio.com
```

---

## Verificación post-despliegue

```bash
# Backend responde
curl http://localhost:8080/

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cliente.com","password":"..."}'

# Dashboard
curl http://localhost:8080/api/v1/dashboard \
  -H "Authorization: Bearer <TOKEN>"

# Predicciones IA
curl http://localhost:8080/api/v1/inteligencia/predicciones \
  -H "Authorization: Bearer <TOKEN>"
```

---

## IA Predictiva en producción

```bash
IA_ENV=prod \
IA_API_URL=https://dominio-cliente/api/v1/inteligencia/datos-entrenamiento \
IA_PREDICCIONES_URL=https://dominio-cliente/api/v1/inteligencia/predicciones \
IA_LOGIN_URL=https://dominio-cliente/api/v1/auth/login \
IA_API_TOKEN=eyJhbGciOi... \
streamlit run ia_prediccion.py
```

En local para pruebas:

```bash
IA_ENV=prod \
IA_API_URL=http://localhost:8080/api/v1/inteligencia/datos-entrenamiento \
IA_PREDICCIONES_URL=http://localhost:8080/api/v1/inteligencia/predicciones \
IA_LOGIN_URL=http://localhost:8080/api/v1/auth/login \
IA_API_TOKEN=eyJhbGciOi... \
streamlit run ia_prediccion.py
```
