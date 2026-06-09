import { Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import * as bcrypt from 'bcrypt';
import { EnvService } from '../config/env.service';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;
  private connected = false;
  private reconnecting: Promise<void> | null = null;

  constructor(private readonly env: EnvService) {
    this.pool = new Pool({
      connectionString: this.env.databaseUrl,
      ssl: this.env.nodeEnv === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });
  }

  async onModuleInit() {
    try {
      await this.ping();
      await this.initSchema();
      await this.seedDefaultUsers();
      this.connected = true;
      this.logger.log('Conexion a PostgreSQL establecida');
    } catch (error) {
      this.connected = false;
      this.logger.warn(
        'No se pudo conectar a PostgreSQL. El backend iniciara sin base de datos; endpoints de datos/auth pueden fallar hasta corregir DATABASE_URL.',
      );
      if (error instanceof Error) {
        this.logger.warn(error.message);
      }
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T extends QueryResultRow>(sql: string, params: unknown[] = []) {
    if (!this.connected) {
      await this.ensureConnected();
    }

    if (!this.connected) {
      throw new ServiceUnavailableException(
        'Base de datos no disponible. Inicia PostgreSQL y verifica DATABASE_URL.',
      );
    }
    return this.pool.query<T>(sql, params);
  }

  isConnected() {
    return this.connected;
  }

  private async ping() {
    await this.pool.query('SELECT 1');
  }

  private async ensureConnected() {
    if (this.connected) return;
    if (!this.reconnecting) {
      this.reconnecting = (async () => {
        try {
          await this.ping();
          await this.initSchema();
          await this.seedDefaultUsers();
          this.connected = true;
          this.logger.log('Conexion a PostgreSQL restablecida');
        } catch (error) {
          this.connected = false;
          if (error instanceof Error) {
            this.logger.warn(`Reconexion a PostgreSQL fallida: ${error.message}`);
          }
        } finally {
          this.reconnecting = null;
        }
      })();
    }

    await this.reconnecting;
  }

  private async initSchema() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        rol TEXT NOT NULL,
        password TEXT NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS acceso_logs (
        id TEXT PRIMARY KEY,
        usuario_id TEXT NOT NULL,
        nombre_usuario TEXT NOT NULL,
        ip TEXT NOT NULL,
        browser TEXT NOT NULL,
        evento TEXT NOT NULL,
        fecha_hora TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS entities (
        entity_type TEXT NOT NULL,
        id TEXT NOT NULL,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (entity_type, id)
      );

      CREATE INDEX IF NOT EXISTS idx_entities_type_active ON entities(entity_type, activo);
      CREATE INDEX IF NOT EXISTS idx_entities_type_deleted ON entities(entity_type, deleted_at);

      CREATE TABLE IF NOT EXISTS categorias (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT NOT NULL DEFAULT '',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS proveedores (
        id TEXT PRIMARY KEY,
        razon_social TEXT NOT NULL,
        contacto TEXT NOT NULL DEFAULT '',
        telefono TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        direccion TEXT NOT NULL DEFAULT '',
        productos_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        productos_catalogo JSONB NOT NULL DEFAULT '[]'::jsonb,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      ALTER TABLE proveedores
      ADD COLUMN IF NOT EXISTS productos_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

      ALTER TABLE proveedores
      ADD COLUMN IF NOT EXISTS productos_catalogo JSONB NOT NULL DEFAULT '[]'::jsonb;

      UPDATE proveedores p
      SET productos_catalogo = COALESCE(
            (
              SELECT jsonb_agg(elem - 'precioReferencia')
              FROM jsonb_array_elements(COALESCE(p.productos_catalogo, '[]'::jsonb)) elem
            ),
            '[]'::jsonb
          ),
          updated_at = NOW()
      WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(p.productos_catalogo, '[]'::jsonb)) elem
        WHERE elem ? 'precioReferencia'
      );

      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        categoria_id TEXT,
        categoria_nombre TEXT NOT NULL DEFAULT '',
        nombre TEXT NOT NULL,
        descripcion TEXT NOT NULL DEFAULT '',
        foto_url TEXT NOT NULL DEFAULT '',
        origen TEXT NOT NULL DEFAULT 'interno',
        proveedor_id TEXT,
        producto_proveedor_id TEXT,
        producto_proveedor_nombre TEXT NOT NULL DEFAULT '',
        precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
        unidad_medida TEXT NOT NULL DEFAULT 'unidad',
        stock_actual NUMERIC(12,2) NOT NULL DEFAULT 0,
        stock_minimo NUMERIC(12,2) NOT NULL DEFAULT 0,
        usa_stock BOOLEAN NOT NULL DEFAULT TRUE,
        disponible BOOLEAN NOT NULL DEFAULT TRUE,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      ALTER TABLE productos
      ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'interno';

      ALTER TABLE productos
      ADD COLUMN IF NOT EXISTS foto_url TEXT NOT NULL DEFAULT '';

      ALTER TABLE productos
      ADD COLUMN IF NOT EXISTS proveedor_id TEXT;

      ALTER TABLE productos
      ADD COLUMN IF NOT EXISTS producto_proveedor_id TEXT;

      ALTER TABLE productos
      ADD COLUMN IF NOT EXISTS producto_proveedor_nombre TEXT NOT NULL DEFAULT '';

      ALTER TABLE productos
      ADD COLUMN IF NOT EXISTS usa_stock BOOLEAN NOT NULL DEFAULT TRUE;

      ALTER TABLE productos
      ADD COLUMN IF NOT EXISTS disponible BOOLEAN NOT NULL DEFAULT TRUE;

      CREATE TABLE IF NOT EXISTS ordenes_compra (
        id TEXT PRIMARY KEY,
        proveedor_id TEXT,
        proveedor_nombre TEXT NOT NULL DEFAULT '',
        usuario_id TEXT NOT NULL,
        estado TEXT NOT NULL,
        total NUMERIC(12,2) NOT NULL DEFAULT 0,
        fecha TIMESTAMPTZ NOT NULL,
        notas TEXT NOT NULL DEFAULT '',
        detalle JSONB NOT NULL DEFAULT '[]'::jsonb,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS ventas (
        id TEXT PRIMARY KEY,
        usuario_id TEXT NOT NULL,
        mesa_id TEXT NOT NULL,
        mesa_numero INTEGER,
        numero_nota TEXT NOT NULL,
        estado TEXT NOT NULL,
        subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
        descuento NUMERIC(12,2) NOT NULL DEFAULT 0,
        total NUMERIC(12,2) NOT NULL DEFAULT 0,
        fecha TIMESTAMPTZ NOT NULL,
        detalle JSONB NOT NULL DEFAULT '[]'::jsonb,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS gastos (
        id TEXT PRIMARY KEY,
        usuario_id TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        categoria TEXT NOT NULL,
        monto NUMERIC(12,2) NOT NULL DEFAULT 0,
        fecha TIMESTAMPTZ NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id TEXT PRIMARY KEY,
        producto_id TEXT,
        producto_nombre TEXT NOT NULL DEFAULT '',
        usuario_id TEXT NOT NULL,
        tipo TEXT NOT NULL,
        cantidad NUMERIC(12,2) NOT NULL DEFAULT 0,
        stock_anterior NUMERIC(12,2) NOT NULL DEFAULT 0,
        stock_nuevo NUMERIC(12,2) NOT NULL DEFAULT 0,
        referencia TEXT NOT NULL DEFAULT '',
        fecha TIMESTAMPTZ NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS idx_categorias_deleted ON categorias(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_proveedores_deleted ON proveedores(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_productos_deleted ON productos(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_ordenes_compra_deleted ON ordenes_compra(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_ventas_deleted ON ventas(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_gastos_deleted ON gastos(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_deleted ON movimientos_inventario(deleted_at);
    `);

    await this.migrateLegacyEntities();
  }

  private async migrateLegacyEntities() {
    await this.pool.query(`
      INSERT INTO categorias (id, nombre, descripcion, activo, deleted_at, created_at, updated_at)
      SELECT id,
             COALESCE(data->>'nombre', ''),
             COALESCE(data->>'descripcion', ''),
             activo,
             deleted_at,
             created_at,
             updated_at
      FROM entities
      WHERE entity_type = 'categorias'
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO proveedores (id, razon_social, contacto, telefono, email, direccion, productos_ids, productos_catalogo, activo, deleted_at, created_at, updated_at)
      SELECT id,
             COALESCE(data->>'razonSocial', ''),
             COALESCE(data->>'contacto', ''),
             COALESCE(data->>'telefono', ''),
             COALESCE(data->>'email', ''),
             COALESCE(data->>'direccion', ''),
             COALESCE(data->'productoIds', '[]'::jsonb),
             COALESCE(data->'productos', '[]'::jsonb),
             activo,
             deleted_at,
             created_at,
             updated_at
      FROM entities
      WHERE entity_type = 'proveedores'
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO productos (id, categoria_id, categoria_nombre, nombre, descripcion, foto_url, origen, proveedor_id, producto_proveedor_id, producto_proveedor_nombre, precio_unitario, unidad_medida, stock_actual, stock_minimo, usa_stock, disponible, activo, deleted_at, created_at, updated_at)
      SELECT id,
             NULLIF(data->>'categoriaId', ''),
             COALESCE(data->>'categoriaNombre', ''),
             COALESCE(data->>'nombre', ''),
             COALESCE(data->>'descripcion', ''),
             COALESCE(data->>'fotoUrl', ''),
             COALESCE(NULLIF(data->>'origen', ''), 'interno'),
             NULLIF(data->>'proveedorId', ''),
             NULLIF(data->>'productoProveedorId', ''),
             COALESCE(data->>'productoProveedorNombre', ''),
             COALESCE((data->>'precioUnitario')::numeric, 0),
             COALESCE(data->>'unidadMedida', 'unidad'),
             COALESCE((data->>'stockActual')::numeric, 0),
             COALESCE((data->>'stockMinimo')::numeric, 0),
             COALESCE((data->>'usaStock')::boolean, TRUE),
             COALESCE((data->>'disponible')::boolean, TRUE),
             activo,
             deleted_at,
             created_at,
             updated_at
      FROM entities
      WHERE entity_type = 'productos'
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO ordenes_compra (id, proveedor_id, proveedor_nombre, usuario_id, estado, total, fecha, notas, detalle, activo, deleted_at, created_at, updated_at)
      SELECT id,
             NULLIF(data->>'proveedorId', ''),
             COALESCE(data->>'proveedorNombre', ''),
             COALESCE(data->>'usuarioId', ''),
             COALESCE(data->>'estado', 'pendiente'),
             COALESCE((data->>'total')::numeric, 0),
             COALESCE((data->>'fecha')::timestamptz, NOW()),
             COALESCE(data->>'notas', ''),
             COALESCE(data->'detalle', '[]'::jsonb),
             activo,
             deleted_at,
             created_at,
             updated_at
      FROM entities
      WHERE entity_type = 'ordenesCompra'
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO ventas (id, usuario_id, mesa_id, mesa_numero, numero_nota, estado, subtotal, descuento, total, fecha, detalle, activo, deleted_at, created_at, updated_at)
      SELECT id,
             COALESCE(data->>'usuarioId', ''),
             COALESCE(data->>'mesaId', ''),
             CASE WHEN NULLIF(data->>'mesaNumero', '') IS NULL THEN NULL ELSE (data->>'mesaNumero')::int END,
             COALESCE(data->>'numeroNota', ''),
             COALESCE(data->>'estado', 'abierta'),
             COALESCE((data->>'subtotal')::numeric, 0),
             COALESCE((data->>'descuento')::numeric, 0),
             COALESCE((data->>'total')::numeric, 0),
             COALESCE((data->>'fecha')::timestamptz, NOW()),
             COALESCE(data->'detalle', '[]'::jsonb),
             activo,
             deleted_at,
             created_at,
             updated_at
      FROM entities
      WHERE entity_type = 'ventas'
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO gastos (id, usuario_id, descripcion, categoria, monto, fecha, activo, deleted_at, created_at, updated_at)
      SELECT id,
             COALESCE(data->>'usuarioId', ''),
             COALESCE(data->>'descripcion', ''),
             COALESCE(data->>'categoria', ''),
             COALESCE((data->>'monto')::numeric, 0),
             COALESCE((data->>'fecha')::timestamptz, NOW()),
             activo,
             deleted_at,
             created_at,
             updated_at
      FROM entities
      WHERE entity_type = 'gastos'
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO movimientos_inventario (id, producto_id, producto_nombre, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia, fecha, activo, deleted_at, created_at, updated_at)
      SELECT id,
             NULLIF(data->>'productoId', ''),
             COALESCE(data->>'productoNombre', ''),
             COALESCE(data->>'usuarioId', ''),
             COALESCE(data->>'tipo', 'ajuste'),
             COALESCE((data->>'cantidad')::numeric, 0),
             COALESCE((data->>'stockAnterior')::numeric, 0),
             COALESCE((data->>'stockNuevo')::numeric, 0),
             COALESCE(data->>'referencia', ''),
             COALESCE((data->>'fecha')::timestamptz, NOW()),
             activo,
             deleted_at,
             created_at,
             updated_at
      FROM entities
      WHERE entity_type = 'movimientos'
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  private async seedDefaultUsers() {
    const { rows } = await this.pool.query<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM users'
    );
    if (Number(rows[0]?.count || 0) > 0) return;

    const adminPassword = await bcrypt.hash(this.env.adminPassword, 10);
    const cajeroPassword = await bcrypt.hash(this.env.cajeroPassword, 10);

    await this.pool.query(
      `
      INSERT INTO users (id, nombre, apellido, email, rol, password, activo, created_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, TRUE, NOW()),
        ($7, $8, $9, $10, $11, $12, TRUE, NOW())
      `,
      [
        '1', 'Admin', 'UTA', 'admin@utacafe.com', 'admin', adminPassword,
        '2', 'Cajero', 'Prueba', 'cajero@utacafe.com', 'usuario', cajeroPassword,
      ],
    );
  }
}