# SGIP - Guia Para Colaboradores

Esta guia es para colaboradores que ya tienen el proyecto copiado en su computadora. Explica como ejecutar el sistema y como subir aportes correctamente sin afectar el trabajo de los demas.

## Componentes Del Proyecto

- Backend: Java + Spring Boot
- Frontend: React + Vite
- Base de datos: PostgreSQL
- Modulo IA: Python + Streamlit + scikit-learn

## Requisitos Previos

Instalar en la computadora:

- Java 21
- Node.js 20 o superior
- Python 3.11 o superior
- PostgreSQL
- Git

El proyecto incluye Maven Wrapper, por lo que no es obligatorio instalar Maven manualmente.

## Abrir El Proyecto

Entrar a la carpeta principal del proyecto:

```bash
cd sgip-backend
```

Verificar la rama actual:

```bash
git branch
```

Si no estas en `develope`, cambiar con:

```bash
git checkout develope
```

Antes de trabajar, actualizar el proyecto:

```bash
git pull origin develope
```

## Base De Datos

Crear una base de datos PostgreSQL, por ejemplo:

```sql
CREATE DATABASE "metroDB";
```

Luego ejecutar los scripts SQL del proyecto. Si estan en `Adicionales/`, usar este orden:

```text
Adicionales/metro_esquema.sql
Adicionales/migracion_v2.sql
```

Primero ejecutar `metro_esquema.sql` y luego `migracion_v2.sql`.

## Variables Locales

No subir contrasenas ni configuraciones personales al repositorio.

No modificar `src/main/resources/application.properties` para poner contrasenas propias. Ese archivo debe mantenerse general para todos los colaboradores.

Cada colaborador debe configurar sus variables de entorno en su propia computadora.

Linux/macOS:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/metroDB
export DB_USER=postgres
export DB_PASSWORD=tu_password
export JWT_SECRET=clave_local
export JWT_EXPIRATION=86400000
```

Windows PowerShell:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/metroDB"
$env:DB_USER="postgres"
$env:DB_PASSWORD="tu_password"
$env:JWT_SECRET="clave_local"
$env:JWT_EXPIRATION="86400000"
```

Variables opcionales para correo:

```text
MAIL_HOST
MAIL_PORT
MAIL_USERNAME
MAIL_PASSWORD
MAIL_FROM
```

Si no se configura SMTP, las alertas visuales funcionan igual, pero no se envian correos reales.

## Ejecutar El Backend

Desde la raiz del proyecto:

```bash
./mvnw spring-boot:run
```

En Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

El backend corre por defecto en:

```text
http://localhost:8080
```

Para correr tests:

```bash
./mvnw test
```

En Windows:

```powershell
.\mvnw.cmd test
```

## Ejecutar El Frontend

Entrar a la carpeta del frontend:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Ejecutar:

```bash
npm run dev
```

El frontend corre por defecto en:

```text
http://localhost:3000
```

Para volver a la raiz:

```bash
cd ..
```

## Ejecutar El Modulo IA

No se debe subir el entorno virtual al repositorio.

Si `ia_prediccion.py` esta en la raiz del proyecto, usar:

Linux/macOS:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
streamlit run ia_prediccion.py
```

Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
streamlit run ia_prediccion.py
```

Si luego el modulo IA se mueve a una carpeta `ia/`, usar:

Linux/macOS:

```bash
cd ia
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run ia_prediccion.py
```

Windows PowerShell:

```powershell
cd ia
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
streamlit run ia_prediccion.py
```

## Archivos Que No Deben Subirse

No subir carpetas generadas o locales:

```text
venv/
.venv/
ia/.venv/
frontend/node_modules/
frontend/dist/
target/
reportes/
__pycache__/
```

Estas carpetas se generan automaticamente al instalar dependencias, compilar o ejecutar el sistema.

## .gitignore Recomendado

El archivo `.gitignore` debe incluir como minimo:

```gitignore
HELP.md
target/
.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/

### STS ###
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache

### IntelliJ IDEA ###
.idea/
*.iws
*.iml
*.ipr

### NetBeans ###
/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/
build/
!**/src/main/**/build/
!**/src/test/**/build/

### VS Code ###
.vscode/

### Python / IA ###
venv/
.venv/
ia/.venv/
__pycache__/
*.py[cod]

### Frontend ###
frontend/node_modules/
frontend/dist/

### Archivos generados por la app ###
reportes/
```

Si se desean subir documentos academicos o imagenes de referencia, no agregarlos al `.gitignore`.

## Flujo Correcto Para Subir Aportes

Antes de empezar:

```bash
git checkout develope
git pull origin develope
```

Revisar el estado:

```bash
git status
```

Hacer los cambios necesarios en el codigo.

Antes de preparar el commit:

```bash
git status --short
git diff
```

Agregar cambios:

```bash
git add .
```

Revisar que no se hayan agregado carpetas generadas:

```bash
git status --short
```

No deberian aparecer archivos dentro de:

```text
venv/
frontend/node_modules/
frontend/dist/
target/
reportes/
```

Crear commit con un mensaje claro:

```bash
git commit -m "descripcion clara del cambio"
```

Ejemplos:

```bash
git commit -m "agrega gestion de proveedores"
git commit -m "corrige validacion de stock en pedidos"
git commit -m "actualiza modulo de prediccion de demanda"
```

Subir cambios:

```bash
git push origin develope
```

## Si Git No Deja Hacer Push

Actualizar primero:

```bash
git pull origin develope
```

Si aparecen conflictos, resolverlos manualmente.

Luego:

```bash
git add .
git commit -m "resuelve conflictos"
git push origin develope
```

Si no hubo conflictos y solo se actualizo correctamente, hacer nuevamente:

```bash
git push origin develope
```

## Reglas Basicas

- Antes de trabajar, ejecutar `git pull origin develope`.
- No subir `venv`, `node_modules`, `dist`, `target` ni reportes generados.
- No subir contrasenas ni configuraciones personales.
- No modificar `application.properties` para poner datos personales.
- Usar mensajes de commit claros.
- Probar los cambios antes de subirlos.
- Si se agregan dependencias, actualizar el archivo correspondiente.
- Backend: `pom.xml`.
- Frontend: `frontend/package.json` y `frontend/package-lock.json`.
- IA: `requirements.txt`.
- Si hay dudas antes de hacer push, revisar con `git status --short`.
