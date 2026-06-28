# Instalación

## Requisitos previos

| Herramienta | Versión mínima | Verificación |
|---|---|---|
| Java JDK | 21 | `java --version` |
| Maven | 3.9+ (incluido con `./mvnw`) | `./mvnw --version` |
| Node.js | 20+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 16+ | `psql --version` |
| Python | 3.10+ | `python --version` |
| pip | 23+ | `pip --version` |

## Clonar el repositorio

```bash
git clone https://github.com/ChriSHM29/sgipProy.git
cd sgipProy
git checkout version4.0
```

## Backend — Spring Boot

### Perfil demo (con datos de prueba precargados)

El perfil `demo` carga automáticamente categorías, productos, usuarios demo y datos históricos para IA. **Solo para desarrollo local**.

=== "Linux/macOS"
    ```bash
    SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run
    ```

=== "Windows (CMD)"
    ```cmd
    set SPRING_PROFILES_ACTIVE=demo && mvnw.cmd spring-boot:run
    ```

Usuarios demo disponibles:

| Email | Contraseña | Rol |
|---|---|---|
| `admin@metroica.com` | `admin123` | ADMINISTRADOR |
| `gerente@metroica.com` | `gerente123` | GERENTE |
| `operario@metroica.com` | `operario123` | OPERARIO |

El backend estará disponible en `http://localhost:8080`.

### Perfil dev (esquema existente, sin seed automático)

=== "Linux/macOS"
    ```bash
    SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
    ```

=== "Windows (CMD)"
    ```cmd
    set SPRING_PROFILES_ACTIVE=dev && mvnw.cmd spring-boot:run
    ```

### Perfil prod (requiere variables de entorno)

Ver la [guía de configuración](configuracion.md) y la [guía de despliegue](despliegue.md).

## Frontend — React + Vite

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:3000`.

El servidor de desarrollo de Vite proxya automáticamente `/api` hacia `http://localhost:8080`.

### Build de producción

```bash
cd frontend
npm run build
```

Los archivos compilados quedan en `frontend/dist/`.

## IA Predictiva — Python + Streamlit

=== "Linux/macOS"
    ```bash
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt

    # Modo local (sin autenticación)
    streamlit run ia_prediccion.py

    # Modo producción (requiere token JWT)
    IA_ENV=prod IA_API_TOKEN=<token_jwt> streamlit run ia_prediccion.py
    ```

=== "Windows (CMD)"
    ```cmd
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt

    rem Modo local (sin autenticación)
    streamlit run ia_prediccion.py

    rem Modo producción (requiere token JWT)
    set IA_ENV=prod && set IA_API_TOKEN=<token_jwt> && streamlit run ia_prediccion.py
    ```

La UI de Streamlit estará disponible en `http://localhost:8501`.

## Base de datos — PostgreSQL

### Crear base local

```bash
createdb metroDB
```

### Aplicar esquema

```bash
psql -d metroDB -f Adicionales/metro_esquema_clean.sql
```

### Dataset de preproducción (opcional, para productivo)

=== "Linux/macOS"
    ```bash
    psql -d metroDB_cliente -f Adicionales/metro_esquema_clean.sql
    psql -d metroDB_cliente \
      -v admin_email='admin@cliente.com' \
      -f Adicionales/dataset_preproduccion_tienda_ia.sql
    psql -d metroDB_cliente \
      -v admin_email='admin@cliente.com' \
      -f Adicionales/dataset_preproduccion_pedidos_dashboard.sql
    ```

=== "Windows (CMD)"
    ```cmd
    psql -d metroDB_cliente -f Adicionales/metro_esquema_clean.sql
    psql -d metroDB_cliente ^
      -v admin_email='admin@cliente.com' ^
      -f Adicionales/dataset_preproduccion_tienda_ia.sql
    psql -d metroDB_cliente ^
      -v admin_email='admin@cliente.com' ^
      -f Adicionales/dataset_preproduccion_pedidos_dashboard.sql
    ```

## Verificar instalación

=== "Linux/macOS"
    ```bash
    # Backend
    ./mvnw test

    # Frontend
    cd frontend && npm audit --omit=dev --audit-level=moderate && npm run build

    # IA
    source venv/bin/activate
    python -m unittest test_ia_prediccion.py
    ```

=== "Windows (CMD)"
    ```cmd
    rem Backend
    mvnw.cmd test

    rem Frontend
    cd frontend && npm audit --omit=dev --audit-level=moderate && npm run build

    rem IA
    venv\Scripts\activate
    python -m unittest test_ia_prediccion.py
    ```
