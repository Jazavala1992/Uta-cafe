
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

export * from '@src/services/auth.service';
