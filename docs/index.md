# SGIP — Sistema de Gestión de Inventario Predictivo

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF.svg)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg)](https://www.python.org/)
[![Tests](https://img.shields.io/badge/tests-42%2F42%20passed-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

SGIP es un sistema integral de gestión de inventarios con inteligencia artificial predictiva, diseñado para pequeñas y medianas tiendas. Permite administrar productos, movimientos de stock, pedidos, alertas y reportes, complementado con un módulo de IA que pronostica la demanda semanal mediante modelos de machine learning.

---

## Módulos del sistema

| Módulo | Descripción |
|---|---|
| **Inventario y productos** | CRUD de productos, categorías y proveedores con control de stock y puntos de pedido |
| **Movimientos** | Registro de entradas y salidas con trazabilidad completa |
| **Pedidos** | Gestión de pedidos con cola priorizada, canales (local/delivery) y estados |
| **Alertas** | Alertas automáticas por stock crítico y riesgos predictivos |
| **Reportes** | Generación de reportes PDF y Excel para inventario y pedidos |
| **Dashboard** | Métricas gerenciales: ventas del día, últimos 7 días, pedidos en cola, precisión de IA |
| **IA Predictiva** | Predicción de demanda semanal, cálculo de precisión y generación de alertas predictivas |
| **Autenticación y roles** | JWT, BCrypt, roles ADMINISTRADOR, GERENTE y OPERARIO con permisos granulares |
| **Notificaciones** | Notificaciones internas y correo electrónico (SMTP opcional) |

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | Spring Boot | 4.0 |
| Lenguaje | Java | 21 |
| Base de datos | PostgreSQL | 16+ |
| ORM | Hibernate / JPA | 6.6 |
| Seguridad | Spring Security + JWT (JJWT) | 0.12 |
| Frontend | React + Vite | 19 / 6.4 |
| Testing backend | JUnit 5, Mockito, Cucumber, Selenium, JMeter | — |
| IA | Python, Scikit-learn, Pandas, Streamlit | 3.10+ |
| Documentación | MkDocs Material | — |

---

## Documentación

La documentación completa está disponible en el sitio de MkDocs:

**[https://ChriSHM29.github.io/sgipProy/](https://ChriSHM29.github.io/sgipProy/)**

### Secciones

- [Arquitectura](arquitectura.md) — diagrama de componentes y flujo de datos
- [Instalación](instalacion.md) — requisitos y puesta en marcha local
- [Configuración](configuracion.md) — perfiles, variables de entorno y opciones
- [API REST](api/endpoints.md) — endpoints disponibles, roles y respuestas
- [Base de datos](base-de-datos.md) — esquema, tablas y relaciones
- [Despliegue](despliegue.md) — local, Supabase y VPS
- [Testing](testing.md) — pruebas unitarias, integración y rendimiento
- [IA Predictiva](ia-predictiva.md) — funcionamiento del modelo y Streamlit
- [Seguridad](seguridad.md) — autenticación, autorización y rate limiting

### Swagger UI

La API REST está documentada interactivamente en:

```
http://localhost:8080/swagger-ui.html
```

---

## Quickstart

```bash
git clone https://github.com/ChriSHM29/sgipProy.git
cd sgipProy

# Backend (perfil demo con datos de prueba)
SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run

# Frontend
cd frontend && npm install && npm run dev

# IA Predictiva
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
streamlit run ia_prediccion.py
```

---

## Licencia

MIT © 2025 — Proyecto académico-integrativo.
