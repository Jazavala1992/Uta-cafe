import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';

type Entity = Record<string, unknown> & { id: string; activo?: boolean; deletedAt?: string };
type EntityKey = 'productos' | 'categorias' | 'proveedores' | 'ordenesCompra' | 'ventas' | 'gastos' | 'movimientos';

interface TableConfig {
  table: string;
  hasSoftDelete: boolean;
  listColumns: string;
  mapRow: (row: Record<string, unknown>) => Entity;
  buildCreate: (id: string, payload: Record<string, unknown>) => { sql: string; params: unknown[] };
  buildUpdate: (id: string, payload: Record<string, unknown>) => { sql: string; params: unknown[] } | null;
}

interface ProveedorProductoItem {
  id: string;
  nombre: string;
}

interface OrdenCompraRow {
  id: string;
  proveedor_id: string | null;
  proveedor_nombre: string;
  usuario_id: string;
  estado: string;
  total: string;
  fecha: string;
  notas: string;
  detalle: unknown;
  activo: boolean;
  deleted_at: string | null;
}

interface OrdenDetalleItem {
  productoId: string;
  productoNombre?: string;
  cantidad: number;
}

interface ProductoStockRow {
  id: string;
  nombre: string;
  stock_actual: string;
}

interface VentaEstadoRow {
  estado: string;
}

@Injectable()
export class DataService {
  constructor(private readonly db: DatabaseService) {}

  private normalizeProveedorProductos(raw: unknown): ProveedorProductoItem[] {
    if (!Array.isArray(raw)) return [];
    const normalized: ProveedorProductoItem[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const nombre = String(record.nombre ?? '').trim();
      if (!nombre) continue;
      const id = String(record.id ?? this.createId()).trim() || this.createId();

      normalized.push({
        id,
        nombre,
      });
    }

    return normalized;
  }

  private readonly tableConfig: Record<EntityKey, TableConfig> = {
    categorias: {
      table: 'categorias',
      hasSoftDelete: true,
      listColumns: 'id, nombre, descripcion, activo, deleted_at',
      mapRow: (row) => ({
        id: String(row.id),
        nombre: String(row.nombre ?? ''),
        descripcion: String(row.descripcion ?? ''),
        activo: Boolean(row.activo),
        deletedAt: row.deleted_at ? String(row.deleted_at) : undefined,
      }),
      buildCreate: (id, payload) => ({
        sql: `
          INSERT INTO categorias (id, nombre, descripcion, activo, deleted_at, created_at, updated_at)
          VALUES ($1, $2, $3, TRUE, NULL, NOW(), NOW())
        `,
        params: [id, String(payload.nombre ?? ''), String(payload.descripcion ?? '')],
      }),
      buildUpdate: (id, payload) => {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (payload.nombre !== undefined) {
          fields.push(`nombre = $${fields.length + 1}`);
          values.push(String(payload.nombre));
        }
        if (payload.descripcion !== undefined) {
          fields.push(`descripcion = $${fields.length + 1}`);
          values.push(String(payload.descripcion));
        }
        if (payload.activo !== undefined) {
          fields.push(`activo = $${fields.length + 1}`);
          values.push(Boolean(payload.activo));
        }
        if (payload.deletedAt !== undefined) {
          fields.push(`deleted_at = $${fields.length + 1}`);
          values.push(payload.deletedAt ? String(payload.deletedAt) : null);
        }

        if (!fields.length) return null;

        values.push(id);
        return {
          sql: `UPDATE categorias SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`,
          params: values,
        };
      },
    },
    proveedores: {
      table: 'proveedores',
      hasSoftDelete: true,
      listColumns:
        'id, razon_social, contacto, telefono, email, direccion, productos_ids, productos_catalogo, activo, deleted_at',
      mapRow: (row) => {
        const catalogo = this.normalizeProveedorProductos(row.productos_catalogo);
        return {
          // Fallback keeps compatibility with older proveedores that only stored productoIds.
          // They can be edited later to set explicit product names in the provider catalog.
          productos: catalogo.length
            ? catalogo
            : Array.isArray(row.productos_ids)
              ? (row.productos_ids as unknown[]).map((id) => ({ id: String(id), nombre: String(id) }))
              : [],
          id: String(row.id),
          razonSocial: String(row.razon_social ?? ''),
          contacto: String(row.contacto ?? ''),
          telefono: String(row.telefono ?? ''),
          email: String(row.email ?? ''),
          direccion: String(row.direccion ?? ''),
          activo: Boolean(row.activo),
          deletedAt: row.deleted_at ? String(row.deleted_at) : undefined,
        };
      },
      buildCreate: (id, payload) => ({
        sql: `
          INSERT INTO proveedores (
            id, razon_social, contacto, telefono, email, direccion,
            productos_ids, productos_catalogo, activo, deleted_at, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, TRUE, NULL, NOW(), NOW())
        `,
        params: [
          id,
          String(payload.razonSocial ?? ''),
          String(payload.contacto ?? ''),
          String(payload.telefono ?? ''),
          String(payload.email ?? ''),
          String(payload.direccion ?? ''),
          JSON.stringify(
            this.normalizeProveedorProductos(payload.productos).map((producto) => producto.id),
          ),
          JSON.stringify(this.normalizeProveedorProductos(payload.productos)),
        ],
      }),
      buildUpdate: (id, payload) => {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (payload.razonSocial !== undefined) {
          fields.push(`razon_social = $${fields.length + 1}`);
          values.push(String(payload.razonSocial));
        }
        if (payload.contacto !== undefined) {
          fields.push(`contacto = $${fields.length + 1}`);
          values.push(String(payload.contacto));
        }
        if (payload.telefono !== undefined) {
          fields.push(`telefono = $${fields.length + 1}`);
          values.push(String(payload.telefono));
        }
        if (payload.email !== undefined) {
          fields.push(`email = $${fields.length + 1}`);
          values.push(String(payload.email));
        }
        if (payload.direccion !== undefined) {
          fields.push(`direccion = $${fields.length + 1}`);
          values.push(String(payload.direccion));
        }
        if (payload.productos !== undefined) {
          const productos = this.normalizeProveedorProductos(payload.productos);
          fields.push(`productos_ids = $${fields.length + 1}::jsonb`);
          values.push(JSON.stringify(productos.map((producto) => producto.id)));
          fields.push(`productos_catalogo = $${fields.length + 1}::jsonb`);
          values.push(JSON.stringify(productos));
        }
        if (payload.activo !== undefined) {
          fields.push(`activo = $${fields.length + 1}`);
          values.push(Boolean(payload.activo));
        }
        if (payload.deletedAt !== undefined) {
          fields.push(`deleted_at = $${fields.length + 1}`);
          values.push(payload.deletedAt ? String(payload.deletedAt) : null);
        }

        if (!fields.length) return null;

        values.push(id);
        return {
          sql: `UPDATE proveedores SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`,
          params: values,
        };
      },
    },
    productos: {
      table: 'productos',
      hasSoftDelete: true,
      listColumns:
        'id, categoria_id, categoria_nombre, nombre, descripcion, foto_url, origen, proveedor_id, producto_proveedor_id, producto_proveedor_nombre, precio_unitario, unidad_medida, stock_actual, stock_minimo, activo, deleted_at',
      mapRow: (row) => ({
        id: String(row.id),
        categoriaId: row.categoria_id ? String(row.categoria_id) : '',
        categoriaNombre: String(row.categoria_nombre ?? ''),
        nombre: String(row.nombre ?? ''),
        descripcion: String(row.descripcion ?? ''),
        fotoUrl: String(row.foto_url ?? ''),
        origen: String(row.origen ?? 'interno') as 'interno' | 'proveedor',
        proveedorId: row.proveedor_id ? String(row.proveedor_id) : '',
        productoProveedorId: row.producto_proveedor_id ? String(row.producto_proveedor_id) : '',
        productoProveedorNombre: String(row.producto_proveedor_nombre ?? ''),
        precioUnitario: Number(row.precio_unitario ?? 0),
        unidadMedida: String(row.unidad_medida ?? 'unidad'),
        stockActual: Number(row.stock_actual ?? 0),
        stockMinimo: Number(row.stock_minimo ?? 0),
        activo: Boolean(row.activo),
        deletedAt: row.deleted_at ? String(row.deleted_at) : undefined,
      }),
      buildCreate: (id, payload) => ({
        sql: `
          INSERT INTO productos (
            id, categoria_id, categoria_nombre, nombre, descripcion, foto_url, origen,
            proveedor_id, producto_proveedor_id, producto_proveedor_nombre,
            precio_unitario, unidad_medida, stock_actual, stock_minimo,
            activo, deleted_at, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, TRUE, NULL, NOW(), NOW())
        `,
        params: [
          id,
          payload.categoriaId ? String(payload.categoriaId) : null,
          String(payload.categoriaNombre ?? ''),
          String(payload.nombre ?? ''),
          String(payload.descripcion ?? ''),
          String(payload.fotoUrl ?? ''),
          String(payload.origen ?? 'interno'),
          payload.proveedorId ? String(payload.proveedorId) : null,
          payload.productoProveedorId ? String(payload.productoProveedorId) : null,
          String(payload.productoProveedorNombre ?? ''),
          Number(payload.precioUnitario ?? 0),
          String(payload.unidadMedida ?? 'unidad'),
          Number(payload.stockActual ?? 0),
          Number(payload.stockMinimo ?? 0),
        ],
      }),
      buildUpdate: (id, payload) => {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (payload.categoriaId !== undefined) {
          fields.push(`categoria_id = $${fields.length + 1}`);
          values.push(payload.categoriaId ? String(payload.categoriaId) : null);
        }
        if (payload.categoriaNombre !== undefined) {
          fields.push(`categoria_nombre = $${fields.length + 1}`);
          values.push(String(payload.categoriaNombre));
        }
        if (payload.nombre !== undefined) {
          fields.push(`nombre = $${fields.length + 1}`);
          values.push(String(payload.nombre));
        }
        if (payload.descripcion !== undefined) {
          fields.push(`descripcion = $${fields.length + 1}`);
          values.push(String(payload.descripcion));
        }
        if (payload.fotoUrl !== undefined) {
          fields.push(`foto_url = $${fields.length + 1}`);
          values.push(String(payload.fotoUrl));
        }
        if (payload.origen !== undefined) {
          fields.push(`origen = $${fields.length + 1}`);
          values.push(String(payload.origen));
        }
        if (payload.proveedorId !== undefined) {
          fields.push(`proveedor_id = $${fields.length + 1}`);
          values.push(payload.proveedorId ? String(payload.proveedorId) : null);
        }
        if (payload.productoProveedorId !== undefined) {
          fields.push(`producto_proveedor_id = $${fields.length + 1}`);
          values.push(payload.productoProveedorId ? String(payload.productoProveedorId) : null);
        }
        if (payload.productoProveedorNombre !== undefined) {
          fields.push(`producto_proveedor_nombre = $${fields.length + 1}`);
          values.push(String(payload.productoProveedorNombre));
        }
        if (payload.precioUnitario !== undefined) {
          fields.push(`precio_unitario = $${fields.length + 1}`);
          values.push(Number(payload.precioUnitario));
        }
        if (payload.unidadMedida !== undefined) {
          fields.push(`unidad_medida = $${fields.length + 1}`);
          values.push(String(payload.unidadMedida));
        }
        if (payload.stockActual !== undefined) {
          fields.push(`stock_actual = $${fields.length + 1}`);
          values.push(Number(payload.stockActual));
        }
        if (payload.stockMinimo !== undefined) {
          fields.push(`stock_minimo = $${fields.length + 1}`);
          values.push(Number(payload.stockMinimo));
        }
        if (payload.activo !== undefined) {
          fields.push(`activo = $${fields.length + 1}`);
          values.push(Boolean(payload.activo));
        }
        if (payload.deletedAt !== undefined) {
          fields.push(`deleted_at = $${fields.length + 1}`);
          values.push(payload.deletedAt ? String(payload.deletedAt) : null);
        }

        if (!fields.length) return null;

        values.push(id);
        return {
          sql: `UPDATE productos SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`,
          params: values,
        };
      },
    },
    ordenesCompra: {
      table: 'ordenes_compra',
      hasSoftDelete: true,
      listColumns:
        'id, proveedor_id, proveedor_nombre, usuario_id, estado, total, fecha, notas, detalle, activo, deleted_at',
      mapRow: (row) => ({
        id: String(row.id),
        proveedorId: row.proveedor_id ? String(row.proveedor_id) : '',
        proveedorNombre: String(row.proveedor_nombre ?? ''),
        usuarioId: String(row.usuario_id ?? ''),
        estado: String(row.estado ?? 'pendiente'),
        total: Number(row.total ?? 0),
        fecha: row.fecha ? String(row.fecha) : new Date().toISOString(),
        notas: String(row.notas ?? ''),
        detalle: Array.isArray(row.detalle) ? (row.detalle as unknown[]) : [],
        activo: Boolean(row.activo),
        deletedAt: row.deleted_at ? String(row.deleted_at) : undefined,
      }),
      buildCreate: (id, payload) => ({
        sql: `
          INSERT INTO ordenes_compra (
            id, proveedor_id, proveedor_nombre, usuario_id, estado, total,
            fecha, notas, detalle, activo, deleted_at, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, TRUE, NULL, NOW(), NOW())
        `,
        params: [
          id,
          payload.proveedorId ? String(payload.proveedorId) : null,
          String(payload.proveedorNombre ?? ''),
          String(payload.usuarioId ?? ''),
          String(payload.estado ?? 'pendiente'),
          Number(payload.total ?? 0),
          payload.fecha ? String(payload.fecha) : new Date().toISOString(),
          String(payload.notas ?? ''),
          JSON.stringify(Array.isArray(payload.detalle) ? payload.detalle : []),
        ],
      }),
      buildUpdate: (id, payload) => {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (payload.proveedorId !== undefined) {
          fields.push(`proveedor_id = $${fields.length + 1}`);
          values.push(payload.proveedorId ? String(payload.proveedorId) : null);
        }
        if (payload.proveedorNombre !== undefined) {
          fields.push(`proveedor_nombre = $${fields.length + 1}`);
          values.push(String(payload.proveedorNombre));
        }
        if (payload.usuarioId !== undefined) {
          fields.push(`usuario_id = $${fields.length + 1}`);
          values.push(String(payload.usuarioId));
        }
        if (payload.estado !== undefined) {
          fields.push(`estado = $${fields.length + 1}`);
          values.push(String(payload.estado));
        }
        if (payload.total !== undefined) {
          fields.push(`total = $${fields.length + 1}`);
          values.push(Number(payload.total));
        }
        if (payload.fecha !== undefined) {
          fields.push(`fecha = $${fields.length + 1}`);
          values.push(String(payload.fecha));
        }
        if (payload.notas !== undefined) {
          fields.push(`notas = $${fields.length + 1}`);
          values.push(String(payload.notas));
        }
        if (payload.detalle !== undefined) {
          fields.push(`detalle = $${fields.length + 1}::jsonb`);
          values.push(JSON.stringify(Array.isArray(payload.detalle) ? payload.detalle : []));
        }
        if (payload.activo !== undefined) {
          fields.push(`activo = $${fields.length + 1}`);
          values.push(Boolean(payload.activo));
        }
        if (payload.deletedAt !== undefined) {
          fields.push(`deleted_at = $${fields.length + 1}`);
          values.push(payload.deletedAt ? String(payload.deletedAt) : null);
        }

        if (!fields.length) return null;

        values.push(id);
        return {
          sql: `UPDATE ordenes_compra SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`,
          params: values,
        };
      },
    },
    ventas: {
      table: 'ventas',
      hasSoftDelete: true,
      listColumns:
        'id, usuario_id, mesa_id, mesa_numero, numero_nota, estado, subtotal, descuento, total, fecha, detalle, activo, deleted_at',
      mapRow: (row) => ({
        id: String(row.id),
        usuarioId: String(row.usuario_id ?? ''),
        mesaId: String(row.mesa_id ?? ''),
        mesaNumero: row.mesa_numero === null || row.mesa_numero === undefined ? undefined : Number(row.mesa_numero),
        numeroNota: String(row.numero_nota ?? ''),
        estado: String(row.estado ?? 'abierta'),
        subtotal: Number(row.subtotal ?? 0),
        descuento: Number(row.descuento ?? 0),
        total: Number(row.total ?? 0),
        fecha: row.fecha ? String(row.fecha) : new Date().toISOString(),
        detalle: Array.isArray(row.detalle) ? (row.detalle as unknown[]) : [],
        activo: Boolean(row.activo),
        deletedAt: row.deleted_at ? String(row.deleted_at) : undefined,
      }),
      buildCreate: (id, payload) => ({
        sql: `
          INSERT INTO ventas (
            id, usuario_id, mesa_id, mesa_numero, numero_nota, estado,
            subtotal, descuento, total, fecha, detalle,
            activo, deleted_at, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, TRUE, NULL, NOW(), NOW())
        `,
        params: [
          id,
          String(payload.usuarioId ?? ''),
          String(payload.mesaId ?? ''),
          payload.mesaNumero === undefined || payload.mesaNumero === null ? null : Number(payload.mesaNumero),
          String(payload.numeroNota ?? ''),
          String(payload.estado ?? 'abierta'),
          Number(payload.subtotal ?? 0),
          Number(payload.descuento ?? 0),
          Number(payload.total ?? 0),
          payload.fecha ? String(payload.fecha) : new Date().toISOString(),
          JSON.stringify(Array.isArray(payload.detalle) ? payload.detalle : []),
        ],
      }),
      buildUpdate: (id, payload) => {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (payload.usuarioId !== undefined) {
          fields.push(`usuario_id = $${fields.length + 1}`);
          values.push(String(payload.usuarioId));
        }
        if (payload.mesaId !== undefined) {
          fields.push(`mesa_id = $${fields.length + 1}`);
          values.push(String(payload.mesaId));
        }
        if (payload.mesaNumero !== undefined) {
          fields.push(`mesa_numero = $${fields.length + 1}`);
          values.push(payload.mesaNumero === null ? null : Number(payload.mesaNumero));
        }
        if (payload.numeroNota !== undefined) {
          fields.push(`numero_nota = $${fields.length + 1}`);
          values.push(String(payload.numeroNota));
        }
        if (payload.estado !== undefined) {
          fields.push(`estado = $${fields.length + 1}`);
          values.push(String(payload.estado));
        }
        if (payload.subtotal !== undefined) {
          fields.push(`subtotal = $${fields.length + 1}`);
          values.push(Number(payload.subtotal));
        }
        if (payload.descuento !== undefined) {
          fields.push(`descuento = $${fields.length + 1}`);
          values.push(Number(payload.descuento));
        }
        if (payload.total !== undefined) {
          fields.push(`total = $${fields.length + 1}`);
          values.push(Number(payload.total));
        }
        if (payload.fecha !== undefined) {
          fields.push(`fecha = $${fields.length + 1}`);
          values.push(String(payload.fecha));
        }
        if (payload.detalle !== undefined) {
          fields.push(`detalle = $${fields.length + 1}::jsonb`);
          values.push(JSON.stringify(Array.isArray(payload.detalle) ? payload.detalle : []));
        }
        if (payload.activo !== undefined) {
          fields.push(`activo = $${fields.length + 1}`);
          values.push(Boolean(payload.activo));
        }
        if (payload.deletedAt !== undefined) {
          fields.push(`deleted_at = $${fields.length + 1}`);
          values.push(payload.deletedAt ? String(payload.deletedAt) : null);
        }

        if (!fields.length) return null;

        values.push(id);
        return {
          sql: `UPDATE ventas SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`,
          params: values,
        };
      },
    },
    gastos: {
      table: 'gastos',
      hasSoftDelete: true,
      listColumns: 'id, usuario_id, descripcion, categoria, monto, fecha, activo, deleted_at',
      mapRow: (row) => ({
        id: String(row.id),
        usuarioId: String(row.usuario_id ?? ''),
        descripcion: String(row.descripcion ?? ''),
        categoria: String(row.categoria ?? ''),
        monto: Number(row.monto ?? 0),
        fecha: row.fecha ? String(row.fecha) : new Date().toISOString(),
        activo: Boolean(row.activo),
        deletedAt: row.deleted_at ? String(row.deleted_at) : undefined,
      }),
      buildCreate: (id, payload) => ({
        sql: `
          INSERT INTO gastos (id, usuario_id, descripcion, categoria, monto, fecha, activo, deleted_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, TRUE, NULL, NOW(), NOW())
        `,
        params: [
          id,
          String(payload.usuarioId ?? ''),
          String(payload.descripcion ?? ''),
          String(payload.categoria ?? ''),
          Number(payload.monto ?? 0),
          payload.fecha ? String(payload.fecha) : new Date().toISOString(),
        ],
      }),
      buildUpdate: (id, payload) => {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (payload.usuarioId !== undefined) {
          fields.push(`usuario_id = $${fields.length + 1}`);
          values.push(String(payload.usuarioId));
        }
        if (payload.descripcion !== undefined) {
          fields.push(`descripcion = $${fields.length + 1}`);
          values.push(String(payload.descripcion));
        }
        if (payload.categoria !== undefined) {
          fields.push(`categoria = $${fields.length + 1}`);
          values.push(String(payload.categoria));
        }
        if (payload.monto !== undefined) {
          fields.push(`monto = $${fields.length + 1}`);
          values.push(Number(payload.monto));
        }
        if (payload.fecha !== undefined) {
          fields.push(`fecha = $${fields.length + 1}`);
          values.push(String(payload.fecha));
        }
        if (payload.activo !== undefined) {
          fields.push(`activo = $${fields.length + 1}`);
          values.push(Boolean(payload.activo));
        }
        if (payload.deletedAt !== undefined) {
          fields.push(`deleted_at = $${fields.length + 1}`);
          values.push(payload.deletedAt ? String(payload.deletedAt) : null);
        }

        if (!fields.length) return null;

        values.push(id);
        return {
          sql: `UPDATE gastos SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`,
          params: values,
        };
      },
    },
    movimientos: {
      table: 'movimientos_inventario',
      hasSoftDelete: false,
      listColumns:
        'id, producto_id, producto_nombre, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia, fecha, activo, deleted_at',
      mapRow: (row) => ({
        id: String(row.id),
        productoId: row.producto_id ? String(row.producto_id) : '',
        productoNombre: String(row.producto_nombre ?? ''),
        usuarioId: String(row.usuario_id ?? ''),
        tipo: String(row.tipo ?? 'ajuste'),
        cantidad: Number(row.cantidad ?? 0),
        stockAnterior: Number(row.stock_anterior ?? 0),
        stockNuevo: Number(row.stock_nuevo ?? 0),
        referencia: String(row.referencia ?? ''),
        fecha: row.fecha ? String(row.fecha) : new Date().toISOString(),
      }),
      buildCreate: (id, payload) => ({
        sql: `
          INSERT INTO movimientos_inventario (
            id, producto_id, producto_nombre, usuario_id, tipo,
            cantidad, stock_anterior, stock_nuevo, referencia, fecha,
            activo, deleted_at, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NULL, NOW(), NOW())
        `,
        params: [
          id,
          payload.productoId ? String(payload.productoId) : null,
          String(payload.productoNombre ?? ''),
          String(payload.usuarioId ?? ''),
          String(payload.tipo ?? 'ajuste'),
          Number(payload.cantidad ?? 0),
          Number(payload.stockAnterior ?? 0),
          Number(payload.stockNuevo ?? 0),
          String(payload.referencia ?? ''),
          payload.fecha ? String(payload.fecha) : new Date().toISOString(),
        ],
      }),
      buildUpdate: () => null,
    },
  };

  private createId() {
    return Math.random().toString(36).slice(2, 11);
  }

  private normalizeDetalleItems(raw: unknown): OrdenDetalleItem[] {
    if (!Array.isArray(raw)) return [];
    const items: OrdenDetalleItem[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const productoId = String(record.productoId ?? '');
      const cantidad = Number(record.cantidad ?? 0);
      if (!productoId || cantidad <= 0) continue;

      items.push({
        productoId,
        productoNombre: record.productoNombre ? String(record.productoNombre) : undefined,
        cantidad,
      });
    }

    return items;
  }

  private async findProductoForInventory(productoRefId: string) {
    const { rows } = await this.db.query<ProductoStockRow>(
      `
      SELECT id, nombre, stock_actual::text
      FROM productos
      WHERE deleted_at IS NULL
        AND (id = $1 OR producto_proveedor_id = $1)
      ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END
      LIMIT 1
      `,
      [productoRefId],
    );
    return rows[0] ?? null;
  }

  private async applyInventoryMovement(args: {
    productoRefId: string;
    productoNombre?: string;
    usuarioId: string;
    tipo: 'entrada' | 'salida' | 'ajuste';
    cantidad: number;
    referencia: string;
    fechaIso?: string;
    targetStock?: number;
  }) {
    const producto = await this.findProductoForInventory(args.productoRefId);
    if (!producto) return null;

    const stockAnterior = Number(producto.stock_actual ?? 0);
    let stockNuevo = stockAnterior;

    if (args.tipo === 'entrada') {
      stockNuevo = stockAnterior + Number(args.cantidad || 0);
    } else if (args.tipo === 'salida') {
      stockNuevo = stockAnterior - Number(args.cantidad || 0);
      if (stockNuevo < 0) {
        throw new BadRequestException(`Stock insuficiente para ${producto.nombre}`);
      }
    } else if (args.targetStock !== undefined && args.targetStock !== null) {
      stockNuevo = Number(args.targetStock);
    } else {
      stockNuevo = stockAnterior + Number(args.cantidad || 0);
    }

    const nowIso = args.fechaIso || new Date().toISOString();
    await this.db.query(
      `
      UPDATE productos
      SET stock_actual = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [stockNuevo, producto.id],
    );

    const movimientoId = this.createId();
    await this.db.query(
      `
      INSERT INTO movimientos_inventario (
        id, producto_id, producto_nombre, usuario_id, tipo,
        cantidad, stock_anterior, stock_nuevo, referencia, fecha,
        activo, deleted_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NULL, NOW(), NOW())
      `,
      [
        movimientoId,
        producto.id,
        args.productoNombre || producto.nombre,
        args.usuarioId,
        args.tipo,
        Number(args.cantidad || 0),
        stockAnterior,
        stockNuevo,
        args.referencia,
        nowIso,
      ],
    );

    return this.getById('movimientos', movimientoId);
  }

  private async applyVentaStockMovement(ventaId: string, payload: Record<string, unknown>) {
    const estado = String(payload.estado ?? 'abierta');
    if (estado !== 'cerrada') return;

    const detalle = this.normalizeDetalleItems(payload.detalle);
    const usuarioId = String(payload.usuarioId ?? '1');
    const numeroNota = String(payload.numeroNota ?? ventaId);
    const fechaIso = payload.fecha ? String(payload.fecha) : new Date().toISOString();

    for (const item of detalle) {
      await this.applyInventoryMovement({
        productoRefId: item.productoId,
        productoNombre: item.productoNombre,
        usuarioId,
        tipo: 'salida',
        cantidad: Number(item.cantidad || 0),
        referencia: `NV ${numeroNota}`,
        fechaIso,
      });
    }
  }

  async finalizarOrdenCompra(id: string, usuarioId?: string) {
    const { rows } = await this.db.query<OrdenCompraRow>(
      `
      SELECT id, proveedor_id, proveedor_nombre, usuario_id, estado, total, fecha, notas, detalle, activo, deleted_at
      FROM ordenes_compra
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1
      `,
      [id],
    );

    const orden = rows[0];
    if (!orden) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    if (orden.estado === 'recibida') {
      return {
        ok: true,
        alreadyFinalized: true,
        orden: await this.getById('ordenesCompra', id),
      };
    }

    const detalle = Array.isArray(orden.detalle) ? (orden.detalle as OrdenDetalleItem[]) : [];
    const actorId = usuarioId || orden.usuario_id || '1';
    const nowIso = new Date().toISOString();

    await this.db.query(
      `
      UPDATE ordenes_compra
      SET estado = 'recibida', updated_at = NOW()
      WHERE id = $1
      `,
      [id],
    );

    await this.db.query(
      `
      INSERT INTO gastos (id, usuario_id, descripcion, categoria, monto, fecha, activo, deleted_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, NULL, NOW(), NOW())
      `,
      [
        this.createId(),
        actorId,
        `Compra a proveedor ${orden.proveedor_nombre || 'sin nombre'} (OC ${id})`,
        'compras',
        Number(orden.total || 0),
        nowIso,
      ],
    );

    for (const item of detalle) {
      if (!item.productoId) continue;
      await this.applyInventoryMovement({
        productoRefId: item.productoId,
        productoNombre: item.productoNombre,
        usuarioId: actorId,
        tipo: 'entrada',
        cantidad: Number(item.cantidad || 0),
        referencia: `OC ${id}`,
        fechaIso: nowIso,
      });
    }

    return {
      ok: true,
      alreadyFinalized: false,
      orden: await this.getById('ordenesCompra', id),
    };
  }

  async list(key: EntityKey, incluirEliminados = false) {
    const config = this.tableConfig[key];
    const sql = config.hasSoftDelete
      ? incluirEliminados
        ? `SELECT ${config.listColumns} FROM ${config.table} ORDER BY created_at DESC`
        : `SELECT ${config.listColumns} FROM ${config.table} WHERE deleted_at IS NULL ORDER BY created_at DESC`
      : `SELECT ${config.listColumns} FROM ${config.table} ORDER BY created_at DESC`;

    const { rows } = await this.db.query<Record<string, unknown>>(sql);
    return rows.map((row) => config.mapRow(row));
  }

  async getById(key: EntityKey, id: string) {
    const config = this.tableConfig[key];
    const { rows } = await this.db.query<Record<string, unknown>>(
      `SELECT ${config.listColumns} FROM ${config.table} WHERE id = $1 LIMIT 1`,
      [id],
    );

    return rows[0] ? config.mapRow(rows[0]) : null;
  }

  async create(key: EntityKey, payload: Record<string, unknown>) {
    if (key === 'movimientos') {
      const result = await this.applyInventoryMovement({
        productoRefId: String(payload.productoId ?? ''),
        productoNombre: payload.productoNombre ? String(payload.productoNombre) : undefined,
        usuarioId: String(payload.usuarioId ?? '1'),
        tipo: String(payload.tipo ?? 'ajuste') as 'entrada' | 'salida' | 'ajuste',
        cantidad: Number(payload.cantidad ?? 0),
        referencia: String(payload.referencia ?? 'Ajuste manual'),
        fechaIso: payload.fecha ? String(payload.fecha) : undefined,
        targetStock:
          payload.stockNuevo === undefined || payload.stockNuevo === null
            ? undefined
            : Number(payload.stockNuevo),
      });

      if (!result) {
        throw new NotFoundException('Producto no encontrado para registrar movimiento');
      }

      return result;
    }

    const id = this.createId();
    const config = this.tableConfig[key];
    const statement = config.buildCreate(id, payload);
    await this.db.query(statement.sql, statement.params);

    if (key === 'ventas') {
      await this.applyVentaStockMovement(id, payload);
    }

    return this.getById(key, id);
  }

  async update(key: EntityKey, id: string, payload: Record<string, unknown>) {
    let estadoAnteriorVenta: string | null = null;
    if (key === 'ventas') {
      const { rows } = await this.db.query<VentaEstadoRow>(
        `SELECT estado FROM ventas WHERE id = $1 LIMIT 1`,
        [id],
      );
      estadoAnteriorVenta = rows[0]?.estado ?? null;
    }

    const config = this.tableConfig[key];
    const statement = config.buildUpdate(id, payload);
    if (!statement) return this.getById(key, id);
    await this.db.query(statement.sql, statement.params);

    if (
      key === 'ventas' &&
      estadoAnteriorVenta !== 'cerrada' &&
      String(payload.estado ?? '') === 'cerrada'
    ) {
      const ventaActual = await this.getById('ventas', id);
      if (ventaActual) {
        await this.applyVentaStockMovement(id, ventaActual);
      }
    }

    return this.getById(key, id);
  }

  async softDelete(key: EntityKey, id: string) {
    const config = this.tableConfig[key];
    if (!config.hasSoftDelete) return { ok: false };
    await this.db.query(
      `
      UPDATE ${config.table}
      SET activo = FALSE, deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
      `,
      [id],
    );
    return { ok: true };
  }

  async restore(key: EntityKey, id: string) {
    const config = this.tableConfig[key];
    if (!config.hasSoftDelete) return { ok: false };
    await this.db.query(
      `
      UPDATE ${config.table}
      SET activo = TRUE, deleted_at = NULL, updated_at = NOW()
      WHERE id = $1
      `,
      [id],
    );
    return { ok: true };
  }

  async resumenIngresosEgresos() {
    const ingresosResult = await this.db.query<{ total: string }>(
      `SELECT COALESCE(SUM(total), 0)::text AS total FROM ventas WHERE deleted_at IS NULL`,
    );
    const egresosResult = await this.db.query<{ total: string }>(
      `SELECT COALESCE(SUM(monto), 0)::text AS total FROM gastos WHERE deleted_at IS NULL`,
    );

    const totalIngresos = Number(ingresosResult.rows[0]?.total ?? 0);
    const totalEgresos = Number(egresosResult.rows[0]?.total ?? 0);

    return {
      totalIngresos,
      totalEgresos,
      utilidadNeta: totalIngresos - totalEgresos,
    };
  }
}
