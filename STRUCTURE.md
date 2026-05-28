# Estructura del backend

Resumen rápido para encontrar código:

- `src/` — Código fuente principal (NestJS)
  - `app.module.ts`, `main.ts`, `app.controller.ts` — punto de entrada
  - `auth/` — autenticación (servicios, guards, controller)
  - `data/` — controladores y servicios para `productos`, `ventas`, `ordenes_compra`, etc.
  - `ai/` — lógica del asistente IA (`ai.controller.ts`, `ai.service.ts`)
  - `common/` — utilidades compartidas (`database.service.ts`, DTOs)
  - `config/` — variables de entorno y configuración

- `dist/` — build JS generado (no editar)
- `package.json`, `tsconfig.json` — configuraciones del proyecto

Sugerencias para buscar código:
- Controladores: buscar `@Controller` en `src/`
- Servicios: buscar `@Injectable()` o `export class .*Service`
- DTOs: están en carpetas `dto/` dentro de cada módulo

Limpieza aplicada:
- Eliminados archivos vacíos o basura: `cat`, `cemacat`, `cocat > cat > cat > cat > matics,` (ubicados en la raíz de `backend/`).

Si quieres, puedo:
- Mover `STRUCTURE.md` a la raíz del repo o combinarlo con `backend/README.md`.
- Borrar otros archivos temporales detectados.
