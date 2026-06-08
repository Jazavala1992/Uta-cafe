import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database.service';

interface LogRow {
  id: string;
  usuario_id: string;
  nombre_usuario: string;
  ip: string;
  browser: string;
  evento: 'ingreso' | 'salida';
  fecha_hora: string;
}

@Injectable()
export class AccesoLogService {
  constructor(private readonly db: DatabaseService) {}

  async getAll() {
    const { rows } = await this.db.query<LogRow>(
      `
      SELECT id, usuario_id, nombre_usuario, ip, browser, evento, fecha_hora
      FROM acceso_logs
      ORDER BY fecha_hora DESC
      `,
    );

    return rows.map((r) => ({
      id: r.id,
      usuarioId: r.usuario_id,
      nombreUsuario: r.nombre_usuario,
      ip: r.ip,
      browser: r.browser,
      evento: r.evento,
      fechaHora: r.fecha_hora,
    }));
  }
}
