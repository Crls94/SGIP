# JMeter metricas segun escenarios especificos

Cambios 17/07: Documento de evidencia para registrar los resultados observados durante pruebas de rendimiento y estres realizadas con Apache JMeter sobre el backend SGIP.

## Objetivo

Medir el comportamiento del backend SGIP ante diferentes niveles de concurrencia usando JMeter como herramienta externa de rendimiento.

El criterio principal usado fue el RNF de rendimiento: las operaciones evaluadas deben responder en menos de 5 segundos en condiciones normales.

## Entorno de prueba

- Backend: `http://localhost:8080`
- Perfil backend: `demo`
- Frontend: `http://localhost:3000` solo para demostracion visual del sistema
- Base de datos: PostgreSQL `metroDB`
- Usuario de prueba: `admin@metroica.com / admin123`
- Herramienta: Apache JMeter 5.6.3

## Flujo evaluado

El plan de prueba creado manualmente desde la aplicacion JMeter considera el siguiente flujo:

1. Login en `/api/v1/auth/login`.
2. Extraccion del token JWT desde la respuesta JSON.
3. Envio de `Authorization: Bearer ${token}` para peticiones protegidas.
4. Consulta de inventario.
5. Consulta de cola de pedidos.
6. Generacion o consulta de reporte de inventario.
7. Validacion de duracion menor a 5000 ms.

## Escenarios ejecutados

| Escenario | Usuarios | Ramp-up | Loop Count | Resultado observado | Interpretacion |
|---|---:|---:|---:|---|---|
| Carga base | 200 | 200 s | 5 | 0.00% errores | Sistema estable con ingreso gradual de usuarios. |
| Carga rapida | 200 | 20 s | 5 | Sin errores observados | Sistema estable con ingreso mas rapido de usuarios. |
| Estres progresivo | 1000 | 100 s | 5 | Error % empezo a subir aprox. de 0.15% a 0.40% | Se identifica degradacion inicial bajo alta concurrencia. |
| Estres agresivo | 1000 | 20 s | 5 | Aparecen errores | El entorno local supera su limite practico de carga. |

## Resultado detallado del escenario 200 usuarios / 200 segundos

| Metrica | Valor observado |
|---|---:|
| Total de muestras | 2746 |
| Error % | 0.00% |
| Promedio total | 30 ms |
| Mediana total | 8 ms |
| Percentil 90 | 77 ms |
| Percentil 95 | 78 ms |
| Percentil 99 | 83 ms |
| Tiempo maximo | 103 ms |
| Throughput total | 20.0 req/s |

Interpretacion: el sistema respondio correctamente el 100% de las solicitudes. El peor tiempo observado fue 103 ms, muy por debajo del limite de 5000 ms definido para el RNF de rendimiento.

## Lectura de listeners usados

### View Results Tree

Permite revisar cada solicitud individual, incluyendo request, response, codigo HTTP, tiempo de respuesta y errores. Es util para depurar, pero no se recomienda para cargas muy altas porque consume memoria en la interfaz grafica.

### Summary Report

Resume cantidad de muestras, promedio, minimo, maximo, desviacion, porcentaje de error, throughput y volumen de datos. Sirve para presentar una vision general del rendimiento.

### Aggregate Report

Agrega percentiles como 90%, 95% y 99%. Es el listener mas util para analizar rendimiento porque muestra como responde la mayoria de solicitudes, no solo el promedio.

## Conclusiones

- Con 200 usuarios virtuales el sistema se mantuvo estable y sin errores.
- Los tiempos registrados fueron muy inferiores al limite de 5 segundos.
- Con 1000 usuarios y ramp-up de 100 segundos aparecio degradacion progresiva, con errores aproximados entre 0.15% y 0.40%.
- Con 1000 usuarios y ramp-up de 20 segundos la carga fue agresiva y aparecieron errores, lo que indica que el limite practico del entorno local fue superado.
- La degradacion observada puede depender del backend, PostgreSQL, pool de conexiones, CPU/RAM local o la propia ejecucion de JMeter en modo grafico.

## Escenario de seguridad: rate limit

Para el proceso de despliegue se diferencia la prueba de rendimiento normal de la prueba de abuso. En rendimiento normal se espera `200 OK` y tiempos menores a 5 segundos. En abuso controlado sobre endpoints criticos se espera bloqueo con `429 Too Many Requests`.

Limites productivos configurados:

| Endpoint | Limite esperado | Resultado ante exceso |
|---|---:|---|
| `POST /api/v1/auth/login` | 10/min por IP | `429 Too Many Requests` |
| `/api/v1/**` general | 100/min por usuario/token o IP | `429 Too Many Requests` |
| `POST /api/v1/pedidos` | 30/min por usuario/token | `429 Too Many Requests` |
| `POST /api/v1/movimientos` | 60/min por usuario/token | `429 Too Many Requests` |
| `GET /api/v1/reportes/**` | 20/min por usuario/token | `429 Too Many Requests` |

Interpretacion: si JMeter realiza muchos logins repetidos por minuto desde la misma IP, el bloqueo `429` confirma que el control de fuerza bruta esta activo. Ese resultado no debe mezclarse con el escenario de rendimiento normal del RNF.

## Texto sugerido para exposicion

Se realizaron pruebas de rendimiento y estres con Apache JMeter sobre el backend SGIP. En la prueba de carga con 200 usuarios virtuales, el sistema proceso 2746 solicitudes autenticadas sin errores, con un promedio global de 30 ms, percentil 95 de 78 ms y maximo de 103 ms. Esto cumple ampliamente el requisito no funcional de rendimiento menor a 5 segundos.

Al incrementar la carga a 1000 usuarios virtuales se observo degradacion progresiva. Con ramp-up de 100 segundos el porcentaje de error empezo a subir aproximadamente entre 0.15% y 0.40%, y con ramp-up de 20 segundos aparecieron errores mas evidentes. Esto permitio identificar el punto de estres del entorno local.
