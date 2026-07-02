# Pruebas de rendimiento JMeter

Cambios 17/07: Carpeta separada para planes de rendimiento del SGIP.

## Plan JMeter

Cambios 17/07: El plan `.jmx` no se deja preconstruido para que pueda generarse manualmente desde la aplicacion Apache JMeter durante la practica.

Nombre sugerido al guardar el plan creado desde JMeter:

- `sgip_Rendimiento_basico.jmx`: valida RNF Rendimiento con login JWT, consulta de inventario, consulta de cola de pedidos y generacion de reporte de inventario.

## Flujo del plan

1. Cambios 17/07: Ejecuta login en `/api/v1/auth/login`.
2. Cambios 17/07: Extrae el token JWT desde la respuesta JSON.
3. Cambios 17/07: Envia `Authorization: Bearer ${token}` en las peticiones protegidas.
4. Cambios 17/07: Mide que las respuestas no superen 5 segundos en condiciones normales.

## Ejecucion sugerida despues de crear el plan

```bash
jmeter -n -t src/test/jmeter/sgip_Rendimiento_basico.jmx -l target/jmeter/sgip_resultados.jtl
```

Antes de ejecutar, verificar que `EMAIL` y `PASSWORD` del plan coincidan con un usuario existente del ambiente local. Por defecto se usa `admin@metroica.com / admin123`, que es el usuario demo creado por el seeder.

No se requiere un perfil especifico para JMeter si la base ya tiene usuarios validos. El perfil `demo` solo es necesario si se quiere cargar datos historicos para prediccion IA.

Para pruebas de estres o resistencia, aumentar usuarios, ramp-up e iteraciones dentro del Thread Group.

## Rate limit en produccion

Cambios 17/07: El backend aplica limites de solicitudes para proteger endpoints criticos antes de despliegue. En pruebas de rendimiento normal se debe reutilizar el JWT obtenido por cada usuario virtual y no repetir login de forma agresiva en cada request.

Limites esperados:

- `POST /api/v1/auth/login`: 10 solicitudes por minuto por IP.
- `/api/v1/**`: 100 solicitudes por minuto por usuario/token o IP.
- `POST /api/v1/pedidos`: 30 solicitudes por minuto por usuario/token.
- `POST /api/v1/movimientos`: 60 solicitudes por minuto por usuario/token.
- `GET /api/v1/reportes/**`: 20 solicitudes por minuto por usuario/token.
- Endpoints IA sensibles: entre 10 y 30 solicitudes por minuto por usuario/token.

Si se crea un plan de abuso o fuerza bruta sobre login, la respuesta `429 Too Many Requests` es el resultado correcto y debe registrarse como evidencia de seguridad, no como fallo de rendimiento.

Las metricas observadas por escenario se documentan en:

- `documentacion/casos-prueba/jmeter_metricas_segun_escenarios_especificos.md`
