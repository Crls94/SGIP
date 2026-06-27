# SGIP - Guia de despliegue productivo

Esta guia aplica cuando SGIP se ejecuta fuera del entorno demo/local. El alcance funcional se mantiene: inventario, pedidos, movimientos, alertas, reportes, dashboard, autenticacion e IA predictiva.

## Perfil productivo

Ejecutar el backend con:

```bash
SPRING_PROFILES_ACTIVE=prod ./mvnw spring-boot:run
```

En produccion no usar perfiles `dev` ni `demo`, porque esos perfiles crean usuarios y datos de demostracion.

## Variables obligatorias

Configurar antes de iniciar el backend:

```bash
export DB_URL=jdbc:postgresql://host:5432/metroDB
export DB_USER=usuario_prod
export DB_PASSWORD=password_seguro
export JWT_SECRET=clave_larga_segura_minimo_32_caracteres
export REPORTES_DIR=/ruta/segura/reportes
```

Opcional:

```bash
export JWT_EXPIRATION=3600000
export MAIL_HOST=smtp.example.com
export MAIL_PORT=587
export MAIL_USERNAME=usuario_smtp
export MAIL_PASSWORD=password_smtp
export MAIL_FROM=noreply@metroica.pe
```

Para el modulo IA externo:

```bash
export IA_API_URL=https://dominio/api/v1/inteligencia/datos-entrenamiento
export IA_PREDICCIONES_URL=https://dominio/api/v1/inteligencia/predicciones
export IA_ENV=prod
export IA_API_TOKEN=token_emitido_para_usuario_admin_o_gerente
```

## Primer administrador

En produccion no se debe habilitar el perfil `demo` ni abrir el registro publico. Si la base productiva inicia vacia, crear el primer administrador mediante una migracion o script SQL controlado por el responsable de despliegue.

El valor de `password_hash` debe ser un hash BCrypt generado fuera del repositorio. Despues de crear el primer administrador, los demas usuarios se gestionan desde la pantalla de Usuarios con una sesion administrativa.

## Validaciones previas

Backend:

```bash
./mvnw test
```

Frontend:

```bash
cd frontend
npm audit --omit=dev --audit-level=moderate
npm run build
```

## Seguridad operativa

- No publicar credenciales demo en produccion.
- No usar `admin@metroica.com / admin123` fuera de demo.
- Mantener `spring.jpa.show-sql=false`.
- Servir el frontend y backend por HTTPS.
- Configurar el proxy/reverse proxy para preservar IP real si se usa rate limit por IP.
- Mantener `REPORTES_DIR` fuera de carpetas publicas del servidor web.
- El modulo IA debe guardar predicciones mediante el backend, no con credenciales directas de PostgreSQL.
- En produccion, el modulo IA debe usar `IA_ENV=prod` e `IA_API_TOKEN`; no usar credenciales demo.

## JMeter

La prueba de rendimiento normal debe reutilizar el JWT obtenido por usuario virtual. Si se ejecutan muchos logins desde la misma IP, el resultado esperado es `429 Too Many Requests` por proteccion contra abuso.
