#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  echo "No se encontro .env. Copia .env.example a .env y completa los valores reales." >&2
  exit 1
fi

set -a
source .env
set +a

required_vars=(SPRING_PROFILES_ACTIVE DB_URL DB_USER DB_PASSWORD JWT_SECRET REPORTES_DIR)
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Variable requerida no definida en .env: $var" >&2
    exit 1
  fi
done

mkdir -p "$REPORTES_DIR"

exec ./mvnw spring-boot:run
