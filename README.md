# SGIP — Sistema de Gestión de Inventario Predictivo

[![Java](https://img.shields.io/badge/Java-21-orange)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Tests](https://img.shields.io/badge/tests-42%2F42%20passed-success)]()

Sistema integral de gestión de inventarios con inteligencia artificial predictiva para pequeñas y medianas tiendas. Administración de productos, movimientos, pedidos, alertas, reportes y dashboard gerencial, complementado con un módulo de IA que pronostica la demanda semanal.

---

## Documentación

**Sitio completo**: [https://ChriSHM29.github.io/sgipProy/](https://ChriSHM29.github.io/sgipProy/)

**Swagger UI**: `http://localhost:8080/swagger-ui.html` (al iniciar el backend)

---

## Quickstart

```bash
git clone https://github.com/ChriSHM29/sgipProy.git
cd sgipProy

# Backend con datos demo
SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run

# Frontend
cd frontend && npm install && npm run dev

# IA Predictiva
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
streamlit run ia_prediccion.py
```

| Componente | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Streamlit IA | http://localhost:8501 |

---

## Demo credentials

| Email | Password | Role |
|---|---|---|
| `admin@metroica.com` | `admin123` | ADMINISTRADOR |

---

## Stack

**Backend**: Java 21, Spring Boot 4, Spring Security, JWT, Hibernate, PostgreSQL
**Frontend**: React 19, Vite 6
**IA**: Python, scikit-learn, Streamlit
**Docs**: MkDocs Material, SpringDoc OpenAPI

---

## Pruebas

```bash
./mvnw test               # Backend: 42 tests
cd frontend && npm run build  # Frontend
python -m unittest test_ia_prediccion.py  # IA: 5 tests
```

---

## Despliegue

Opciones detalladas en la [documentación de despliegue](https://ChriSHM29.github.io/sgipProy/despliegue/):

- **Local**: `SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run`
- **Producción**: `bash scripts/run-prod.sh` con `.env` configurado
- **Supabase**: PostgreSQL en la nube + backend en VPS o hosting

---

## Licencia

MIT
