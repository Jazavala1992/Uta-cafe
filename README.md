# UTA Cafe 

- `frontend/`: React + TypeScript + Vite
- `backend/`: Node.js + Express + TypeScript

## Estructura

```text
uta-cafe/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Ejecutar frontend

```bash
cd frontend
npm install
npm run dev
```

## Ejecutar backend

```bash
cd backend
npm install
npm run dev
```

## IA local (Ollama)

El backend ahora expone un agente local por HTTP:

- `GET /api/ai/status`
- `POST /api/ai/chat`

Body de ejemplo:

```json
{
	"prompt": "Dame un resumen de ventas del dia",
	"systemPrompt": "Responde en espanol claro",
	"temperature": 0.3,
	"maxTokens": 300
}
```

Variables en `backend/.env`:

- `AI_PROVIDER=ollama`
- `OLLAMA_BASE_URL=http://127.0.0.1:11434`
- `OLLAMA_MODEL=llama3.2:1b`
- `AI_TIMEOUT_MS=60000`

## Setup local automatizado

macOS/Linux:

```bash
chmod +x setup-local.sh run-local.sh
./setup-local.sh
./run-local.sh
```

Windows (PowerShell):

```powershell
.\setup-local.ps1
.\run-local.ps1
```

## PostgreSQL local

El setup levanta PostgreSQL en Docker usando `docker-compose.local.yml`:

- host: `127.0.0.1`
- port: `5432`
- db: `uta_cafe`
- user: `postgres`
- password: `postgres`

Si usas PostgreSQL local instalado en macOS (fuera de Docker), configura `backend/.env` con tu usuario real del sistema/DB, por ejemplo:

```env
DATABASE_URL=postgresql://josezavala:@127.0.0.1:5432/uta_cafe
```

El backend crea tablas automaticamente al iniciar:

- `users`
- `acceso_logs`
- `categorias`
- `productos`
- `proveedores`
- `ordenes_compra`
- `ventas`
- `gastos`
- `movimientos_inventario`

Tambien migra datos legacy desde `entities` cuando existen.

Si no existen usuarios, inserta:

- `admin@utacafe.com / Admin123!`
- `cajero@utacafe.com / Cajero123!`

## Smoke test rapido

Con backend corriendo en `http://localhost:3000`:

```bash
chmod +x smoke-test.sh
./smoke-test.sh
```

El script valida login, `/auth/me` y CRUD basico con soft delete en categorias.


