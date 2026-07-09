# Despliegue

SGIP usa como flujo principal la **Opción A: despliegue tradicional/manual**. La aplicación se despliega con backend Spring Boot, frontend React/Vite, base de datos PostgreSQL o Supabase y módulo IA en Streamlit conectado por API.

Docker no es obligatorio para esta versión. En el modelo de referencia corresponde a la **Opción B: despliegue contenedorizado**, por lo que queda documentado como alternativa futura opcional.

---

## Arquitectura del sistema y entornos

### Arquitectura de despliegue

```mermaid
flowchart LR
    U[Usuario final] --> F[Frontend React/Vite]
    F --> N[Nginx / Hosting web]
    N --> B[Backend Spring Boot API REST]
    B --> DB[(PostgreSQL / Supabase)]
    IA[IA predictiva Streamlit] --> B
    B --> R[Directorio de reportes]
    B --> M[SMTP opcional]
```

| Componente | Responsabilidad | Ubicación de despliegue |
|---|---|---|
| Frontend React/Vite | Interfaz web de administradores, gerentes y operarios | Hosting web, Nginx o `frontend/dist` |
| Backend Spring Boot | API REST, seguridad JWT, reglas de negocio y reportes | Servidor/VPS o plataforma Java |
| PostgreSQL / Supabase | Persistencia de inventario, pedidos, usuarios, alertas y predicciones | Supabase o PostgreSQL administrado/local |
| IA Streamlit | Entrenamiento y envío de predicciones mediante API backend | Ejecución manual/controlada con variables `IA_*` |
| Nginx | Servir frontend y proxyear `/api` al backend | VPS Linux, si se usa despliegue tradicional |

### Entornos disponibles

| Entorno | Perfil | Propósito | Base de datos | Observaciones |
|---|---|---|---|---|
| Desarrollo local | `dev` o `demo` | Trabajo individual y pruebas rápidas | PostgreSQL local | El perfil `demo` carga datos automáticamente. No usar en producción. |
| Preproducción / staging | `prod` | Validación final con configuración similar a producción | Supabase o PostgreSQL externo | Puede cargar datasets de preproducción para demo, dashboard e IA. |
| Producción | `prod` | Entorno accesible por usuarios finales | Supabase o PostgreSQL administrado | No usa `DataSeeder`; requiere variables reales y primer admin creado por SQL controlado. |

---

## Requisitos previos

| Componente | Versión / recomendación |
|---|---|
| Java | JDK 21 |
| Maven | Wrapper incluido: `./mvnw` o `mvnw.cmd` |
| Node.js | 20+ |
| PostgreSQL | 16+ o Supabase PostgreSQL |
| Python | 3.10+ para IA predictiva |
| Nginx | Última versión estable si se usa VPS |
| Git | Requerido para clonar el repositorio |
| psql / pg_dump / pg_restore | Requeridos para cargar esquema, datasets o migrar datos |

---

## Variables de entorno

Las variables productivas se toman de `.env.example`. Copiar ese archivo como `.env` o configurar los mismos nombres en el gestor de variables del proveedor.

!!! warning "Seguridad"
    El archivo `.env` real no debe subirse al repositorio. Solo debe versionarse `.env.example` sin credenciales reales.

| Variable | Descripción | Ejemplo / valor esperado |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Perfil activo del backend | `prod` |
| `DB_URL` | URL JDBC de PostgreSQL o Supabase | `jdbc:postgresql://host:5432/postgres?sslmode=require` |
| `DB_USER` | Usuario de base de datos | `postgres.xxxxx` o `sgip_user` |
| `DB_PASSWORD` | Contraseña de base de datos | `********` |
| `JWT_SECRET` | Clave privada para firma JWT | Cadena segura de mínimo 32 caracteres |
| `JWT_EXPIRATION` | Duración del token en milisegundos | `3600000` |
| `REPORTES_DIR` | Ruta donde se generan/leen reportes | `/opt/sgip/reportes` |
| `MAIL_HOST` | Servidor SMTP opcional | `smtp.dominio.com` |
| `MAIL_PORT` | Puerto SMTP | `587` |
| `MAIL_USERNAME` | Usuario SMTP | `notificaciones@dominio.com` |
| `MAIL_PASSWORD` | Contraseña SMTP | `********` |
| `MAIL_FROM` | Remitente de correos | `noreply@metroica.pe` |
| `MAIL_SMTP_AUTH` | Habilita autenticación SMTP | `true` |
| `MAIL_SMTP_STARTTLS` | Habilita STARTTLS SMTP | `true` |
| `IA_ENV` | Modo de ejecución de IA | `prod` |
| `IA_API_URL` | Endpoint de datos de entrenamiento | `https://dominio/api/v1/inteligencia/datos-entrenamiento` |
| `IA_PREDICCIONES_URL` | Endpoint de predicciones | `https://dominio/api/v1/inteligencia/predicciones` |
| `IA_LOGIN_URL` | Endpoint de login para obtener token | `https://dominio/api/v1/auth/login` |
| `IA_API_TOKEN` | JWT de usuario `ADMINISTRADOR` o `GERENTE` | `eyJhbGciOi...` |

---

## Despliegue local (desarrollo / demo)

### Con perfil `demo`

=== "Linux/macOS"
    ```bash
    SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run
    cd frontend && npm install && npm run dev
    ```

=== "Windows (CMD)"
    ```cmd
    set SPRING_PROFILES_ACTIVE=demo && mvnw.cmd spring-boot:run
    cd frontend && npm install && npm run dev
    ```

El perfil `demo` carga datos automáticamente. Ideal para desarrollo rápido.

### Con perfil `prod` y `.env`

=== "Linux/macOS"
    ```bash
    cp .env.example .env
    # Editar .env con valores reales
    nano .env
    bash scripts/run-prod.sh
    ```

=== "Windows (CMD)"
    ```cmd
    copy .env.example .env
    rem Editar .env con valores reales
    notepad .env
    rem Ejecutar backend manualmente
    mvnw.cmd spring-boot:run
    ```

El script `scripts/run-prod.sh` carga `.env`, valida las variables y arranca. **Solo disponible en Linux/macOS.**

---

## Paso a paso del despliegue (Deployment Pipeline)

### Opción A: despliegue tradicional / manual

Esta es la opción usada por SGIP en la versión actual.

| Paso | Acción | Evidencia / comando principal |
|---|---|---|
| 1 | Clonar repositorio y seleccionar rama | `git clone`, `git checkout version5.0` |
| 2 | Instalar dependencias backend/frontend/IA | Maven wrapper, `npm install`, `pip install -r requirements.txt` |
| 3 | Configurar entorno | Copiar `.env.example` a `.env` y completar variables reales |
| 4 | Compilar aplicación | `./mvnw package` y `npm run build` |
| 5 | Preparar base de datos | Ejecutar esquema SQL y crear primer administrador |
| 6 | Iniciar servicio | `bash scripts/run-prod.sh` o servicio `systemd` |
| 7 | Verificar despliegue | Smoke tests con `curl`, login, dashboard e IA |

El detalle operativo de estos pasos se desarrolla en las secciones siguientes para Supabase y VPS.

### Opción B: despliegue contenedorizado (Docker)

No aplica en la versión actual de SGIP. El repositorio no incluye `Dockerfile` ni `docker-compose.yml`, por lo que Docker queda como alternativa futura opcional y no como requisito de entrega.

Si se implementa en una versión posterior, esta sección deberá documentar:

1. Construcción de imagen backend.
2. Construcción/servicio del frontend.
3. Servicio PostgreSQL o conexión externa a Supabase.
4. Variables de entorno seguras.
5. Comando `docker compose up -d`.

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

=== "Linux/macOS"
    ```bash
    psql "postgresql://USUARIO:CONTRASEÑA@HOST:5432/postgres?sslmode=require" \
      -f Adicionales/metro_esquema_clean.sql
    ```

=== "Windows (CMD)"
    ```cmd
    psql "postgresql://USUARIO:CONTRASEÑA@HOST:5432/postgres?sslmode=require" ^
      -f Adicionales/metro_esquema_clean.sql
    ```

### 4. Crear el primer administrador

=== "Linux/macOS"
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

=== "Windows (CMD)"
    ```cmd
    rem Generar hash BCrypt fuera del repositorio
    rem Ejemplo con Python:
    python -c "import bcrypt; print(bcrypt.hashpw(b'mi_password'.encode(), bcrypt.gensalt()).decode())"

    rem Insertar con psql
    psql "postgresql://USUARIO:CONTRASEÑA@HOST:5432/postgres?sslmode=require" ^
      -v admin_email='admin@cliente.com' ^
      -v admin_nombre='Admin' ^
      -v admin_apellido='Cliente' ^
      -v admin_password_hash='$2a$10$...' ^
      -f Adicionales/crear_primer_admin_prod.sql
    ```

### 5. Cargar datasets de preproducción (opcional)

=== "Linux/macOS"
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

=== "Windows (CMD)"
    ```cmd
    rem Dataset de tienda e IA
    psql "postgresql://..." ^
      -v admin_email='admin@cliente.com' ^
      -f Adicionales/dataset_preproduccion_tienda_ia.sql

    rem Dataset de pedidos y dashboard
    psql "postgresql://..." ^
      -v admin_email='admin@cliente.com' ^
      -f Adicionales/dataset_preproduccion_pedidos_dashboard.sql

    rem Backfill de precisión IA
    psql "postgresql://..." ^
      -f Adicionales/dataset_preproduccion_precision_ia.sql
    ```

### 6. Migrar datos desde PostgreSQL local

=== "Linux/macOS"
    ```bash
    # Exportar base local
    pg_dump -h localhost -U postgres -d metroDB_cliente \
      -n public --no-owner --no-acl -Fc -f sgip_local.dump

    # Restaurar en Supabase
    pg_restore --no-owner --no-acl \
      -h aws-0-region.pooler.supabase.com -p 5432 \
      -U postgres.xxxxxxxxx -d postgres sgip_local.dump
    ```

=== "Windows (CMD)"
    ```cmd
    rem Exportar base local
    pg_dump -h localhost -U postgres -d metroDB_cliente ^
      -n public --no-owner --no-acl -Fc -f sgip_local.dump

    rem Restaurar en Supabase
    pg_restore --no-owner --no-acl ^
      -h aws-0-region.pooler.supabase.com -p 5432 ^
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

### Requisitos del servidor VPS

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

!!! note "Específico de Linux"
    Esta sección usa `apt` y es exclusiva de distribuciones Linux (Ubuntu/Debian). Para Windows se recomienda usar **Docker** o **WSL2**.

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

=== "Linux/macOS"
    ```bash
    git clone https://github.com/ChriSHM29/sgipProy.git
    cd sgipProy
    git checkout version5.0

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

=== "Windows (CMD)"
    ```cmd
    git clone https://github.com/ChriSHM29/sgipProy.git
    cd sgipProy
    git checkout version5.0

    rem Crear .env
    copy .env.example .env
    notepad .env

    rem Construir backend
    mvnw.cmd package

    rem Construir frontend
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

## Integración continua y despliegue continuo (CI/CD)

El proyecto incluye `Jenkinsfile` como base de integración continua. En la versión actual el pipeline automatiza validación y pruebas; el despliegue productivo se realiza manualmente con la Opción A.

| Elemento | Definición actual |
|---|---|
| Herramienta | Jenkins |
| Archivo pipeline | `Jenkinsfile` |
| Disparador | Según configuración del servidor Jenkins: push, merge o ejecución manual |
| Rama objetivo recomendada | `version5.0` o rama protegida de entrega |
| Despliegue automático | No implementado en esta versión |

### Etapas del pipeline actual

| Etapa | Acción | Comando / evidencia |
|---|---|---|
| Checkout | Descarga el código fuente | `checkout scm` |
| Pruebas unitarias, integración, regresión y smoke | Ejecuta suite backend Maven/JUnit/Cucumber | `./mvnw test` |
| Selenium opcional | Ejecuta prueba UI si existe navegador/frontend | `RUN_SELENIUM_TESTS=true ./mvnw -Dtest=LoginSeleniumTest test` |
| Publicación de reportes | Publica resultados JUnit | `target/surefire-reports/*.xml` |

### Flujo recomendado antes de desplegar

1. Ejecutar pipeline Jenkins o validar localmente con `./mvnw test`.
2. Ejecutar auditoría frontend con `npm audit --omit=dev --audit-level=moderate`.
3. Construir frontend con `npm run build`.
4. Construir backend con `./mvnw package`.
5. Aplicar scripts de base de datos en el ambiente destino.
6. Arrancar backend con perfil `prod`.
7. Ejecutar verificación post-despliegue.

---

## Monitoreo, verificación y rollback

### Pruebas de humo post-despliegue

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

Si el backend está detrás de Nginx o un dominio, reemplazar `localhost:8080` por la URL pública, por ejemplo `https://dominio-cliente`.

### Verificación de base de datos

El perfil `prod` usa `spring.jpa.hibernate.ddl-auto=validate`; por tanto, el backend valida el esquema pero no lo crea ni lo modifica automáticamente.

```bash
# Validar conexión y tablas principales
psql "postgresql://USUARIO:CONTRASEÑA@HOST:5432/postgres?sslmode=require" \
  -c "select count(*) from usuarios;"
```

### Logs de producción

Si se usa `systemd` en VPS:

```bash
# Estado del servicio
sudo systemctl status sgip-backend

# Logs en tiempo real
sudo journalctl -u sgip-backend -f

# Últimas líneas de logs
sudo journalctl -u sgip-backend -n 100 --no-pager
```

Si se usa Nginx:

```bash
# Accesos HTTP
sudo tail -f /var/log/nginx/access.log

# Errores HTTP/proxy
sudo tail -f /var/log/nginx/error.log
```

### Rollback

Antes de publicar una nueva versión, conservar el artefacto anterior y un respaldo de base de datos validado.

Procedimiento recomendado:

1. Detener el servicio: `sudo systemctl stop sgip-backend`.
2. Restaurar el `.jar` anterior en `/opt/sgip/sgip-backend.jar`.
3. Restaurar `frontend/dist` anterior si el fallo está en UI.
4. Revisar que `.env` siga apuntando a la configuración correcta.
5. Reiniciar servicio: `sudo systemctl start sgip-backend`.
6. Ejecutar pruebas de humo.
7. Si el fallo involucra datos, restaurar backup PostgreSQL/Supabase aprobado antes del despliegue.

Ejemplo de respaldo previo:

```bash
pg_dump "postgresql://USUARIO:CONTRASEÑA@HOST:5432/postgres?sslmode=require" \
  --no-owner --no-acl -Fc -f backup_pre_despliegue.dump
```

Ejemplo de restauración controlada:

```bash
pg_restore --clean --if-exists --no-owner --no-acl \
  -d "postgresql://USUARIO:CONTRASEÑA@HOST:5432/postgres?sslmode=require" \
  backup_pre_despliegue.dump
```

---

## IA Predictiva en producción

=== "Linux/macOS"
    ```bash
    IA_ENV=prod \
    IA_API_URL=https://dominio-cliente/api/v1/inteligencia/datos-entrenamiento \
    IA_PREDICCIONES_URL=https://dominio-cliente/api/v1/inteligencia/predicciones \
    IA_LOGIN_URL=https://dominio-cliente/api/v1/auth/login \
    IA_API_TOKEN=eyJhbGciOi... \
    streamlit run ia_prediccion.py
    ```

=== "Windows (CMD)"
    ```cmd
    set IA_ENV=prod && ^
    set IA_API_URL=https://dominio-cliente/api/v1/inteligencia/datos-entrenamiento && ^
    set IA_PREDICCIONES_URL=https://dominio-cliente/api/v1/inteligencia/predicciones && ^
    set IA_LOGIN_URL=https://dominio-cliente/api/v1/auth/login && ^
    set IA_API_TOKEN=eyJhbGciOi... && ^
    streamlit run ia_prediccion.py
    ```

En local para pruebas:

=== "Linux/macOS"
    ```bash
    IA_ENV=prod \
    IA_API_URL=http://localhost:8080/api/v1/inteligencia/datos-entrenamiento \
    IA_PREDICCIONES_URL=http://localhost:8080/api/v1/inteligencia/predicciones \
    IA_LOGIN_URL=http://localhost:8080/api/v1/auth/login \
    IA_API_TOKEN=eyJhbGciOi... \
    streamlit run ia_prediccion.py
    ```

=== "Windows (CMD)"
    ```cmd
    set IA_ENV=prod && ^
    set IA_API_URL=http://localhost:8080/api/v1/inteligencia/datos-entrenamiento && ^
    set IA_PREDICCIONES_URL=http://localhost:8080/api/v1/inteligencia/predicciones && ^
    set IA_LOGIN_URL=http://localhost:8080/api/v1/auth/login && ^
    set IA_API_TOKEN=eyJhbGciOi... && ^
    streamlit run ia_prediccion.py
    ```
