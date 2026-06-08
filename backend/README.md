## Estructura
- `src/config`: configuracion de entorno y base de datos.
- `src/routes`: definicion de rutas HTTP.
- `src/controllers`: manejo de request/response.
- `src/services`: logica de negocio.
- `src/models`: entidades y acceso a datos.
- `src/middlewares`: auth, validacion y errores.
- `src/utils`: helpers comunes.
- `src/types`: tipos compartidos del backend.

## IA local

Endpoints:

- `GET /api/ai/status`
- `POST /api/ai/chat`

`POST /api/ai/chat` recibe:

```json
{
	"prompt": "texto del usuario",
	"systemPrompt": "instruccion opcional",
	"temperature": 0.3,
	"maxTokens": 300
}
```

Requiere Ollama corriendo localmente con el modelo configurado en `.env`.

## PostgreSQL

El backend usa `DATABASE_URL` y crea automaticamente el esquema al iniciar:

- `users`
- `acceso_logs`
- `categorias`
- `productos`
- `proveedores`
- `ordenes_compra`
- `ventas`
- `gastos`
- `movimientos_inventario`

Ademas, intenta migrar datos legacy desde `entities` cuando existen registros historicos.

Autenticacion:

- Passwords nuevas se guardan con hash `scrypt`.
- Passwords legacy (texto plano/base64) se actualizan automaticamente a `scrypt` en login exitoso.
- Tokens bearer firmados con HMAC (`/api/auth/login`) y perfil protegido en `GET /api/auth/me`.

`DATABASE_URL` sugerida para entorno local:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/uta_cafe
```

Si tu Postgres local no usa el rol `postgres`, cambia el usuario en `DATABASE_URL`.


