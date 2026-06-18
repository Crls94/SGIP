# Guia de demo local SGIP

Esta guia deja claro como ejecutar SGIP sin servicios en la nube. La demo usa PostgreSQL local, backend Spring Boot, frontend React y el modulo IA en Python.

## 1. Base local

Base esperada:

```bash
metroDB
```

Si la base ya existe, aplicar la migracion de alertas predictivas:

```bash
PGPASSWORD=9629 psql -h localhost -U postgres -d metroDB -f "Adicionales/migracion_v3_alertas_predictivas.sql"
```

Si se crea una base desde cero, usar primero el esquema limpio:

```bash
PGPASSWORD=9629 psql -h localhost -U postgres -d metroDB -f "Adicionales/metro_esquema_clean.sql"
```

## 2. Backend demo

Ejecutar con perfil `demo` para cargar usuarios, productos demo IA y movimientos historicos:

```bash
SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run
```

Usuarios demo:

```text
admin@metroica.com / admin123
gerente@metroica.com / gerente123
operario@metroica.com / operario123
```

Para produccion futura se usara `prod`, sin productos demo ni movimientos demo.

## 3. Frontend local

Desde `frontend`:

```bash
npm run dev
```

## 4. IA predictiva local

Con backend activo:

```bash
streamlit run ia_prediccion.py
```

El modulo IA se autentica contra el backend, toma los movimientos de salida y guarda predicciones en PostgreSQL local.

Credenciales usadas por defecto para demo:

```bash
IA_API_URL=http://localhost:8080/api/v1/inteligencia/datos-entrenamiento
IA_API_EMAIL=admin@metroica.com
IA_API_PASSWORD=admin123
```

Tambien puede usarse un token directo:

```bash
IA_API_TOKEN=<token_jwt>
```

Si la pantalla de IA no muestra predicciones, ejecutar nuevamente este paso y luego presionar `Aplicar filtros` en la pantalla.

La precision real del pronostico se muestra cuando la semana pronosticada ya cerro. Antes de esa fecha aparece como pendiente.

## 5. Flujo de demostracion recomendado

1. Iniciar sesion como administrador o gerente.
2. Abrir Dashboard y mostrar inventario, pedidos y predicciones.
3. Abrir Inteligencia y revisar demanda estimada, riesgo, faltante y recomendaciones.
4. Presionar `Enviar alertas predictivas`.
5. Abrir Alertas y mostrar alertas `IA predictiva` junto con stock, demanda estimada y faltante estimado.
6. Resolver o ignorar una alerta como administrador.
7. Abrir Notificaciones para mostrar avisos generados.
8. Abrir Reportes y generar/exportar reportes.

Nota: las alertas predictivas no se duplican. Si ya existe una alerta activa para el mismo producto y semana, el sistema indicara que no hay nuevas alertas por generar.

## 6. Flujo de valor de IA

```text
Movimientos historicos de salida
-> Prediccion semanal de demanda
-> Riesgo de quiebre
-> Recomendacion de reposicion
-> Alerta predictiva
-> Accion operativa del usuario
```

## 7. Verificacion tecnica

Backend:

```bash
./mvnw test
```

Frontend:

```bash
cd frontend
npm run build
```
