import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseService } from '../common/database.service';
import type { RegisterUserDto } from '@src/dto/register-user.dto';
import { AuthTokenService } from './auth-token.service';

interface DbUser {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'usuario';
  password: string;
  activo: boolean;
  deleted_at: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly tokenService: AuthTokenService,
  ) {}

  private encodeLegacy(password: string) {
    return Buffer.from(password, 'utf8').toString('base64');
  }

  private isScryptHash(value: string) {
    return value.startsWith('scrypt$');
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
  }

  private verifyScryptHash(stored: string, incoming: string) {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    const incomingHash = scryptSync(incoming, salt, 64).toString('hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    const incomingBuffer = Buffer.from(incomingHash, 'hex');
    if (hashBuffer.length !== incomingBuffer.length) return false;
    return timingSafeEqual(hashBuffer, incomingBuffer);
  }

  private async matchesPassword(stored: string, incoming: string, userId: string) {
    if (this.isScryptHash(stored)) {
      return this.verifyScryptHash(stored, incoming);
    }

    const legacyMatch = stored === incoming || stored === this.encodeLegacy(incoming);
    if (!legacyMatch) return false;

    await this.db.query(`UPDATE users SET password = $1 WHERE id = $2`, [this.hashPassword(incoming), userId]);
    return true;
  }

  private createId() {
    return Math.random().toString(36).slice(2, 11);
  }

  async login(email: string, password: string, userAgent = 'unknown') {
    const { rows } = await this.db.query<DbUser>(
      `
      SELECT id, nombre, apellido, email, rol, password, activo, deleted_at
      FROM users
      WHERE email = $1 AND activo = TRUE AND deleted_at IS NULL
      `,
      [email],
    );

    let found: DbUser | undefined;
    for (const row of rows) {
      if (await this.matchesPassword(row.password, password, row.id)) {
        found = row;
        break;
      }
    }
    if (!found) return null;

    const token = this.tokenService.createToken({ id: found.id, rol: found.rol });

    await this.db.query(
      `
      INSERT INTO acceso_logs (id, usuario_id, nombre_usuario, ip, browser, evento, fecha_hora)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
      [this.createId(), found.id, `${found.nombre} ${found.apellido}`, '127.0.0.1', userAgent, 'ingreso'],
    );

    return {
      token,
      user: {
        id: found.id,
        nombre: found.nombre,
        apellido: found.apellido,
        email: found.email,
        rol: found.rol,
      },
    };
  }

  async logout(userId: string, nombreUsuario: string, userAgent = 'unknown') {
    await this.db.query(
      `
      INSERT INTO acceso_logs (id, usuario_id, nombre_usuario, ip, browser, evento, fecha_hora)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
      [this.createId(), userId, nombreUsuario, '127.0.0.1', userAgent, 'salida'],
    );
    return { ok: true };
  }

  async register(payload: RegisterUserDto) {
    const { rows } = await this.db.query<{ id: string }>(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL LIMIT 1',
      [payload.email],
    );
    const exists = rows.length > 0;
    if (exists) {
      throw new Error('El email ya existe');
    }

    const id = this.createId();
    await this.db.query(
      `
      INSERT INTO users (id, nombre, apellido, email, rol, password, activo, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
      `,
      [id, payload.nombre, payload.apellido, payload.email, payload.rol, this.hashPassword(payload.password)],
    );

    const created = {
      id,
      nombre: payload.nombre,
      apellido: payload.apellido,
      email: payload.email,
      rol: payload.rol,
      activo: true,
      createdAt: new Date().toISOString(),
    };

    return created;
  }

  async me(userId: string) {
    const { rows } = await this.db.query<DbUser>(
      `
      SELECT id, nombre, apellido, email, rol, password, activo, deleted_at
      FROM users
      WHERE id = $1 AND activo = TRUE AND deleted_at IS NULL
      LIMIT 1
      `,
      [userId],
    );

    const found = rows[0];
    if (!found) return null;

    return {
      id: found.id,
      nombre: found.nombre,
      apellido: found.apellido,
      email: found.email,
      rol: found.rol,
    };
  }
}
