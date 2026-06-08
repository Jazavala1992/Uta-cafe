import { Injectable } from '@nestjs/common';

export interface BackendUser {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'usuario';
  password: string;
  activo: boolean;
  createdAt: string;
  deletedAt?: string;
}

export interface AccesoLogItem {
  id: string;
  usuarioId: string;
  nombreUsuario: string;
  ip: string;
  browser: string;
  evento: 'ingreso' | 'salida';
  fechaHora: string;
}

@Injectable()
export class InMemoryDataService {
  private users: BackendUser[] = [
    {
      id: '1',
      nombre: 'Admin',
      apellido: 'UTA',
      email: 'admin@utacafe.com',
      rol: 'admin',
      password: 'Admin123!',
      activo: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      nombre: 'Cajero',
      apellido: 'Prueba',
      email: 'cajero@utacafe.com',
      rol: 'usuario',
      password: 'Cajero123!',
      activo: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ];

  private logs: AccesoLogItem[] = [];

  getUsers() {
    return this.users;
  }

  setUsers(next: BackendUser[]) {
    this.users = next;
  }

  getLogs() {
    return this.logs;
  }

  pushLog(log: AccesoLogItem) {
    this.logs.push(log);
  }
}
