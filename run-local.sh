#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Iniciando backend y frontend en terminales separadas..."

if [[ "$OSTYPE" == "darwin"* ]]; then
  osascript <<EOF
 tell application "Terminal"
   do script "cd '$ROOT_DIR/backend' && npm run start:dev"
   do script "cd '$ROOT_DIR/frontend' && npm run dev"
 end tell
EOF
else
  echo "Ejecuta manualmente:"
  echo "cd '$ROOT_DIR/backend' && npm run start:dev"
  echo "cd '$ROOT_DIR/frontend' && npm run dev"
fi
