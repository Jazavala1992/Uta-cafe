$ErrorActionPreference = 'Stop'

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Model = if ($env:OLLAMA_MODEL) { $env:OLLAMA_MODEL } else { 'llama3.2:1b' }

function Require-Command($Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host "Falta comando requerido: $Name"
    exit 1
  }
}

Write-Host "== Verificando prerequisitos =="
Require-Command node
Require-Command npm
Require-Command ollama

if (Get-Command docker -ErrorAction SilentlyContinue) {
  Write-Host "== Levantando PostgreSQL local (Docker) =="
  docker compose -f "$RootDir/docker-compose.local.yml" up -d postgres | Out-Null
} else {
  Write-Host "Docker no encontrado. Asegura PostgreSQL corriendo localmente."
}

Write-Host "== Configurando backend =="
Set-Location "$RootDir/backend"
npm install
if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host "Archivo backend/.env creado desde .env.example"
}

$dbLine = Select-String -Path '.env' -Pattern '^DATABASE_URL=' -SimpleMatch:$false -ErrorAction SilentlyContinue
if (-not $dbLine) {
  Add-Content '.env' 'DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/uta_cafe'
  Write-Host "DATABASE_URL agregada en backend/.env"
}

Write-Host "== Configurando frontend =="
Set-Location "$RootDir/frontend"
npm install
if (-not (Test-Path '.env')) {
  @"
VITE_API_URL=http://localhost:3000/api
"@ | Set-Content '.env'
  Write-Host "Archivo frontend/.env creado"
}

Write-Host "== Verificando Ollama y modelo local =="
try {
  Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:11434/api/tags' | Out-Null
} catch {
  Write-Host "Ollama no responde en 127.0.0.1:11434. Inicia la app de Ollama y vuelve a correr el script."
  exit 1
}

ollama pull $Model

Write-Host "== Setup local completado =="
Write-Host "Siguientes pasos:"
Write-Host "1) cd $RootDir/backend; npm run start:dev"
Write-Host "2) cd $RootDir/frontend; npm run dev"
