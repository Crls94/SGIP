# Cierre de scope Avance 3

Este documento resume los ajustes finales aplicados para alinear SGIP con el alcance formal de `Avance3/avance3_VFinal.pdf`.

## Alcance confirmado

SGIP cubre una operacion interna de Metro Ica:

- Inventario en tiempo real.
- Movimientos de stock.
- Pedidos local y delivery.
- Cola priorizada.
- Alertas de stock critico.
- Prediccion semanal de demanda.
- Dashboard gerencial.
- Reportes Excel/PDF.
- Autenticacion y roles.

Queda fuera de alcance formal:

- E-commerce externo.
- Pasarelas de pago.
- Facturacion SUNAT/OSE.
- Aplicacion movil nativa.
- Recursos humanos o nomina.

## Cambios finales aplicados

### Precision real de IA

El backend calcula `cantidadReal`, `errorPorcentaje` y `precisionPorcentaje` para predicciones cuya semana ya termino.

La precision se calcula comparando:

```text
cantidad_predicha vs salidas reales de inventario en la semana pronosticada
```

Esto permite diferenciar:

- `confianza`: metrica interna del modelo.
- `precision real`: resultado comparado contra ventas/salidas reales.

### Dashboard e Inteligencia

El Dashboard muestra `Precision IA` cuando existen pronosticos cerrados.

La pantalla de Inteligencia muestra:

- confianza promedio del modelo.
- precision real cuando esta disponible.
- cantidad real observada.
- estado pendiente cuando la semana aun no termina.

### Movimientos completos

La interfaz de movimientos permite registrar los tipos soportados por el backend:

- `ENTRADA`
- `SALIDA`
- `MERMA`
- `DEVOLUCION`
- `AJUSTE`

Para `SALIDA` y `MERMA`, el sistema valida que la cantidad no exceda el stock disponible.

### Endpoint de entrenamiento IA protegido

El endpoint `/api/v1/inteligencia/datos-entrenamiento` ya no es publico. Requiere rol:

- `ADMINISTRADOR`
- `GERENTE`

El script `ia_prediccion.py` ahora puede autenticarse con:

```bash
IA_API_URL=http://localhost:8080/api/v1/inteligencia/datos-entrenamiento
IA_PREDICCIONES_URL=http://localhost:8080/api/v1/inteligencia/predicciones
IA_API_EMAIL=admin@metroica.com
IA_API_PASSWORD=admin123
```

o con:

```bash
IA_API_TOKEN=<token_jwt>
```

## Flujo demo recomendado

```text
1. Iniciar backend con perfil demo.
2. Iniciar frontend.
3. Iniciar sesion como administrador o gerente.
4. Registrar movimientos y pedidos local/delivery.
5. Ejecutar ia_prediccion.py con Streamlit.
6. Revisar Inteligencia.
7. Enviar alertas predictivas.
8. Revisar Alertas.
9. Generar reportes.
```

## Nota tecnica

La integracion e-commerce no se implementa porque el documento formal la excluye expresamente. La arquitectura REST permitiria agregarla como evolucion futura sin cambiar el nucleo del sistema.
