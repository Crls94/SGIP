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

El modulo IA toma los movimientos de salida desde el backend y guarda predicciones en PostgreSQL local.

## 5. Flujo de demostracion recomendado

1. Iniciar sesion como administrador o gerente.
2. Abrir Dashboard y mostrar inventario, pedidos y predicciones.
3. Abrir Inteligencia y revisar demanda estimada, riesgo, faltante y recomendaciones.
4. Presionar `Generar alertas IA`.
5. Abrir Alertas y mostrar alertas `IA predictiva` junto con stock, demanda estimada y faltante estimado.
6. Resolver o ignorar una alerta como administrador.
7. Abrir Notificaciones para mostrar avisos generados.
8. Abrir Reportes y generar/exportar reportes.

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
