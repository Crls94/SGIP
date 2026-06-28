# Configuración

## Perfiles de Spring Boot

El sistema utiliza tres perfiles que controlan el comportamiento en tiempo de ejecución:

| Perfil | `ddl-auto` | `show-sql` | Seed automático | Credenciales demo |
|---|---|---|---|---|
| `dev` | `validate` | `false` | Solo reparación de hashes | Sí |
| `demo` | `validate` | `false` | Datos completos de tienda + IA | Sí |
| `prod` | `validate` | `false` | **No** | **No** |

El perfil se selecciona mediante la variable de entorno `SPRING_PROFILES_ACTIVE`.

---

## Variables de entorno

### Backend

| Variable | Obligatoria | Perfil | Descripción |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Sí | Todos | `dev`, `demo` o `prod` |
| `DB_URL` | Solo `prod` | `prod` | JDBC URL completa (ej. `jdbc:postgresql://host:5432/db`) |
| `DB_USER` | Solo `prod` | `prod` | Usuario de PostgreSQL |
| `DB_PASSWORD` | Solo `prod` | `prod` | Contraseña de PostgreSQL |
| `JWT_SECRET` | Solo `prod` | `prod` | Clave secreta para firmar tokens (mín. 32 caracteres) |
| `JWT_EXPIRATION` | No | `prod` | Duración del token en ms (default: `3600000`) |
| `REPORTES_DIR` | Solo `prod` | `prod` | Directorio donde se almacenan los reportes generados |

### Correo SMTP (opcional)

Si no se configura, las notificaciones internas siguen funcionando; solo falla el envío de correos.

| Variable | Descripción |
|---|---|
| `MAIL_HOST` | Servidor SMTP |
| `MAIL_PORT` | Puerto SMTP (default: `587`) |
| `MAIL_USERNAME` | Usuario SMTP |
| `MAIL_PASSWORD` | Contraseña SMTP |
| `MAIL_FROM` | Dirección remitente (default: `noreply@metroica.pe`) |
| `MAIL_SMTP_AUTH` | Autenticación SMTP (default: `true`) |
| `MAIL_SMTP_STARTTLS` | STARTTLS (default: `true`) |

### IA Predictiva

| Variable | Obligatoria | Descripción |
|---|---|---|
| `IA_ENV` | Sí (para prod) | `local` o `prod` |
| `IA_API_URL` | Solo `prod` | URL del endpoint `datos-entrenamiento` |
| `IA_PREDICCIONES_URL` | Solo `prod` | URL del endpoint `predicciones` |
| `IA_LOGIN_URL` | Solo `prod` | URL del endpoint `login` |
| `IA_API_TOKEN` | Solo `prod` | Token JWT de un usuario `ADMINISTRADOR` o `GERENTE` |
| `IA_API_EMAIL` | Solo `prod` (si no hay token) | Email para login automático |
| `IA_API_PASSWORD` | Solo `prod` (si no hay token) | Contraseña para login automático |

---

## Archivo `.env`

Para desarrollo local y despliegue, se usa un archivo `.env` basado en la plantilla `.env.example`:

```bash
# Backend Spring Boot
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://localhost:5432/metroDB_cliente
DB_USER=sgip_user
DB_PASSWORD=cambiar_password_seguro
JWT_SECRET=cambiar_clave_larga_segura_minimo_32_caracteres
JWT_EXPIRATION=3600000
REPORTES_DIR=/opt/sgip/reportes
```

!!! warning "No commitear `.env`"
    El archivo `.env` contiene secretos reales y está listado en `.gitignore`. Solo `.env.example` se versiona como plantilla sin valores reales.

---

## Propiedades de aplicación

### `application.properties` (base)

Define valores por defecto para desarrollo local:

- PostgreSQL en `localhost:5432/metroDB`
- JWT con secreto de desarrollo
- Reportes en `./reportes`
- SMTP con valores vacíos (deshabilitado)

### `application-prod.properties` (productivo)

Sobrescribe todas las propiedades sensibles para que dependan exclusivamente de variables de entorno. Si alguna variable requerida no está definida, la aplicación **no arranca** — fail-fast por diseño.

- `ddl-auto=validate`: Hibernate no modifica el esquema.
- `show-sql=false`: No se muestran consultas SQL en logs.
- Sin seed automático ni usuarios demo.

---

## Arranque con script

El script `scripts/run-prod.sh` facilita el arranque productivo:

```bash
bash scripts/run-prod.sh
```

El script:

1. Verifica que `.env` existe.
2. Carga las variables con `set -a && source .env`.
3. Valida que las 6 variables requeridas están definidas.
4. Crea el directorio `REPORTES_DIR`.
5. Ejecuta `./mvnw spring-boot:run`.

---

## Conexión a PostgreSQL

### Conexión local

```
jdbc:postgresql://localhost:5432/metroDB
```

### Conexión a Supabase

```
jdbc:postgresql://aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require
```

Se recomienda usar el **Session pooler** de Supabase, no la conexión directa.

### Permisos necesarios

El usuario de PostgreSQL necesita permisos DML (SELECT, INSERT, UPDATE, DELETE) y acceso a secuencias. No necesita ser owner de la base porque `ddl-auto=validate` no modifica el esquema.
