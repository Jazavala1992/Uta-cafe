#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000/api}"
LOGIN_EMAIL="${LOGIN_EMAIL:-admin@utacafe.com}"
LOGIN_PASSWORD="${LOGIN_PASSWORD:-Admin123!}"

echo "[1/5] Login: $LOGIN_EMAIL"
LOGIN_JSON=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"$LOGIN_PASSWORD\"}")

TOKEN=$(echo "$LOGIN_JSON" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [[ -z "$TOKEN" ]]; then
  echo "Login failed: $LOGIN_JSON"
  exit 1
fi

echo "[2/5] /auth/me with bearer token"
ME_JSON=$(curl -s "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN")
if ! echo "$ME_JSON" | grep -q '"email"'; then
  echo "auth/me failed: $ME_JSON"
  exit 1
fi

echo "[3/5] Create categoria"
TS=$(date +%s)
CREATE_JSON=$(curl -s -X POST "$BASE_URL/categorias" \
  -H 'Content-Type: application/json' \
  -d "{\"nombre\":\"Smoke-$TS\",\"descripcion\":\"smoke test\"}")
CAT_ID=$(echo "$CREATE_JSON" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
if [[ -z "$CAT_ID" ]]; then
  echo "Categoria create failed: $CREATE_JSON"
  exit 1
fi

echo "[4/5] Soft delete categoria"
DEL_JSON=$(curl -s -X DELETE "$BASE_URL/categorias/$CAT_ID")
if ! echo "$DEL_JSON" | grep -q '"ok":true'; then
  echo "Categoria delete failed: $DEL_JSON"
  exit 1
fi

echo "[5/5] Verify deleted appears with incluirEliminados=true"
LIST_JSON=$(curl -s "$BASE_URL/categorias?incluirEliminados=true")
if ! echo "$LIST_JSON" | grep -q "$CAT_ID"; then
  echo "Categoria not found in deleted list: $LIST_JSON"
  exit 1
fi

echo "Smoke test OK"
