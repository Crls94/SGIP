# Arquitectura del sistema

## Diagrama de componentes

```mermaid
graph TB
    subgraph Cliente["Cliente"]
        Browser["Navegador Web"]
        AppIA["Streamlit IA (opcional)"]
    end

    subgraph Frontend["Frontend — React + Vite"]
        ReactApp["SPA React"]
    end

    subgraph Backend["Backend — Spring Boot 4"]
        direction TB
        Security["Spring Security + JWT"]
        Controllers["14 Controladores REST"]
        Services["Servicios de negocio"]
        Repositories["Repositorios JPA"]
        IA["InteligenciaService"]
    end

    subgraph Database["Base de Datos"]
        PostgreSQL["PostgreSQL 16+"]
    end

    subgraph IA["IA Predictiva — Python"]
        Streamlit["Streamlit UI"]
        Modelo["Scikit-learn ML"]
    end

    Browser -->|HTTP :3000| ReactApp
    ReactApp -->|/api/v1/*| Security
    Security --> Controllers
    Controllers --> Services
    Services --> Repositories
    Repositories --> PostgreSQL
    IA --> Repositories
    Controllers --> IA
    AppIA -->|REST| Controllers
    Streamlit --> Modelo
    Streamlit -->|REST /api/v1/inteligencia/*| Controllers

    style Backend fill:#6DB33F,color:#fff
    style Frontend fill:#61DAFB,color:#000
    style Database fill:#336791,color:#fff
    style IA fill:#3776AB,color:#fff
```

## Flujo de datos

```mermaid
sequenceDiagram
    actor Usuario
    participant Frontend as React SPA
    participant Backend as Spring Boot
    participant DB as PostgreSQL
    participant IA as IA Python

    Usuario->>Frontend: Inicia sesión
    Frontend->>Backend: POST /api/v1/auth/login
    Backend->>DB: Verificar credenciales
    DB-->>Backend: Usuario válido
    Backend-->>Frontend: JWT Token
    Frontend->>Frontend: Almacenar token

    Usuario->>Frontend: Ver dashboard
    Frontend->>Backend: GET /api/v1/dashboard
    Backend->>DB: Consultar ventas, pedidos, alertas
    DB-->>Backend: Datos agregados
    Backend-->>Frontend: Métricas dashboard

    IA->>Backend: GET /api/v1/inteligencia/datos-entrenamiento
    Backend->>DB: Movimientos SALIDA
    DB-->>Backend: Historial de salidas
    Backend-->>IA: Datos de entrenamiento
    IA->>IA: Entrenar modelo
    IA->>Backend: POST /api/v1/inteligencia/predicciones

    Backend->>DB: Guardar predicciones
    Backend-->>IA: Confirmación
```

## Estructura del proyecto

```
sgip-backend/
├── src/main/java/com/metroica/sgip_backend/
│   ├── alertas/          # Alertas de stock y predictivas
│   ├── config/           # Seguridad, JWT, rate limiting, WebConfig
│   ├── dashboard/        # Métricas del dashboard
│   ├── inteligencia/     # Servicio IA, predicciones, datos entrenamiento
│   ├── movimientos/      # Movimientos de inventario (entrada/salida)
│   ├── notificaciones/   # Notificaciones internas y email
│   ├── pedidos/          # Gestión de pedidos, cola, estados
│   ├── productos/        # Productos, categorías, proveedores
│   ├── reportes/         # PDF y Excel de inventario y pedidos
│   ├── seguridad/        # Auth, JWT, usuarios, roles
│   └── shared/           # Enums, excepciones, utils
├── src/main/resources/
│   ├── application.properties       # Configuración base
│   └── application-prod.properties  # Perfil productivo
├── src/test/             # Pruebas unitarias, integración, BDD, Selenium, JMeter
├── frontend/             # React 19 + Vite SPA
├── ia_prediccion.py      # Streamlit + modelo IA
├── Adicionales/          # Scripts SQL para despliegue
├── documentacion/        # Evidencia académica y casos de prueba
├── scripts/              # Scripts de arranque y despliegue
└── docs/                 # Documentación MkDocs (este sitio)
```

## Patrones de diseño utilizados

| Patrón | Aplicación |
|---|---|
| **MVC** | Controladores REST (`@RestController`) → Servicios (`@Service`) → Repositorios (`@Repository`) |
| **DAO / Repository** | Spring Data JPA con interfaces `JpaRepository` |
| **DTO** | Objetos de transferencia entre capas (request/response) |
| **Singleton** | Beans de Spring por defecto |
| **Factory Method** | `@Bean` en configuraciones, `ProductoMapper` |
| **Proxy** | Hibernate lazy loading, Spring AOP para transacciones |
| **Observer** | Sistema de notificaciones y alertas |
| **Strategy** | Rate limiting por tipo de endpoint, generación de reportes PDF/Excel |
| **Chain of Responsibility** | Filtros de seguridad (JWT → autenticación → autorización) |
