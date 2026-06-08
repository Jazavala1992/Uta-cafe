
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

export * from '@src/services/users.service';
