import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';
import { UpdateUserDto } from '@src/dto/update-user.dto';

interface UserRow {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'usuario';
  password: string;
  activo: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface PublicUser {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'usuario';
  activo: boolean;
  createdAt: string;
  deletedAt?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  private mapUser(row: UserRow): PublicUser {
    return {
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      email: row.email,
      rol: row.rol,
      activo: row.activo,
      createdAt: row.created_at,
      deletedAt: row.deleted_at || undefined,
    };
  }

  async getAll(incluirEliminados = false) {
    const sql = incluirEliminados
      ? `
        SELECT id, nombre, apellido, email, rol, password, activo, created_at, deleted_at
        FROM users
        ORDER BY created_at DESC
      `
      : `
        SELECT id, nombre, apellido, email, rol, password, activo, created_at, deleted_at
        FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
      `;

    const { rows } = await this.db.query<UserRow>(sql);
    return rows.map((row) => this.mapUser(row));
  }

  async update(id: string, payload: UpdateUserDto) {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (payload.nombre !== undefined) {
      fields.push(`nombre = $${fields.length + 1}`);
      values.push(payload.nombre);
    }
    if (payload.apellido !== undefined) {
      fields.push(`apellido = $${fields.length + 1}`);
      values.push(payload.apellido);
    }
    if (payload.rol !== undefined) {
      fields.push(`rol = $${fields.length + 1}`);
      values.push(payload.rol);
    }
    if (payload.activo !== undefined) {
      fields.push(`activo = $${fields.length + 1}`);
      values.push(payload.activo);
    }

    if (!fields.length) {
      const { rows } = await this.db.query<UserRow>(
        `
        SELECT id, nombre, apellido, email, rol, password, activo, created_at, deleted_at
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [id],
      );
      return rows[0] ? this.mapUser(rows[0]) : null;
    }

    values.push(id);
    const { rows } = await this.db.query<UserRow>(
      `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, nombre, apellido, email, rol, password, activo, created_at, deleted_at
      `,
      values,
    );

    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  async softDelete(id: string) {
    await this.db.query(
      `
      UPDATE users
      SET activo = FALSE, deleted_at = NOW()
      WHERE id = $1
      `,
      [id],
    );
    return { ok: true };
  }

  async restore(id: string) {
    await this.db.query(
      `
      UPDATE users
      SET activo = TRUE, deleted_at = NULL
      WHERE id = $1
      `,
      [id],
    );
    return { ok: true };
  }
}
