# Pruebas de rendimiento JMeter

Cambios 17/07: Carpeta separada para planes de rendimiento del SGIP.

## Plan incluido

- `sgip_rendimiento_basico.jmx`: valida RNF Rendimiento con login JWT, consulta de inventario, consulta de cola de pedidos y generacion de reporte de inventario.

## Flujo del plan

1. Cambios 17/07: Ejecuta login en `/api/v1/auth/login`.
2. Cambios 17/07: Extrae el token JWT desde la respuesta JSON.
3. Cambios 17/07: Envia `Authorization: Bearer ${token}` en las peticiones protegidas.
4. Cambios 17/07: Mide que las respuestas no superen 5 segundos en condiciones normales.

## Ejecucion sugerida

```bash
jmeter -n -t src/test/jmeter/sgip_rendimiento_basico.jmx -l target/jmeter/sgip_resultados.jtl
```

Antes de ejecutar, verificar que `EMAIL` y `PASSWORD` del plan coincidan con un usuario existente del ambiente local.

Para pruebas de estres o resistencia, aumentar usuarios, ramp-up e iteraciones dentro del Thread Group.
