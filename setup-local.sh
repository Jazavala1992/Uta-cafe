#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL="${OLLAMA_MODEL:-llama3.2:1b}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Falta comando requerido: $1"
    exit 1
  fi
}

echo "== Verificando prerequisitos =="
require_cmd node
require_cmd npm
require_cmd ollama

if command -v docker >/dev/null 2>&1; then
  echo "== Levantando PostgreSQL local (Docker) =="
  docker compose -f "$ROOT_DIR/docker-compose.local.yml" up -d postgres
else
  echo "Docker no encontrado. Asegura PostgreSQL corriendo localmente."
fi

echo "== Configurando backend =="
cd "$ROOT_DIR/backend"
npm install
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Archivo backend/.env creado desde .env.example"
fi

if ! grep -q '^DATABASE_URL=' .env; then
  echo 'DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/uta_cafe' >> .env
  echo "DATABASE_URL agregada en backend/.env"
fi

echo "== Configurando frontend =="
cd "$ROOT_DIR/frontend"
npm install

if [[ ! -f .env ]]; then
  cat > .env <<'EOF'
VITE_API_URL=http://localhost:3000/api
EOF
  echo "Archivo frontend/.env creado"
fi

echo "== Verificando Ollama y modelo local =="
if ! curl -sf "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
  echo "Ollama no responde en 127.0.0.1:11434. Inicia la app de Ollama y vuelve a correr el script."
  exit 1
fi

ollama pull "$MODEL"

echo "== Setup local completado =="
echo "Siguientes pasos:"
echo "1) cd $ROOT_DIR/backend && npm run start:dev"
echo "2) cd $ROOT_DIR/frontend && npm run dev"
