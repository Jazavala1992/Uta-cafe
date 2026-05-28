import { api } from './api';
import type { AccesoLog, LoginResponse, Usuario } from '@src/types';

export interface UsuarioConPassword extends Usuario {
  password?: string;
}

export const authService = {
  // POST /api/auth/login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },

  // POST /api/auth/logout
  logout: (userId: string, nombreUsuario: string) => {
    void api.post('/auth/logout', { userId, nombreUsuario }).catch(() => undefined);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  // GET /api/acceso-log
  getLogs: async (): Promise<AccesoLog[]> => {
    const { data } = await api.get<AccesoLog[]>('/acceso-log');
    return data;
  },

  // GET /api/usuarios
  getUsuarios: async (incluirEliminados = false): Promise<UsuarioConPassword[]> => {
    const { data } = await api.get<UsuarioConPassword[]>('/usuarios', {
      params: { incluirEliminados },
    });
    return data;
  },

  // POST /api/auth/register
  register: async (payload: Omit<UsuarioConPassword, 'id' | 'createdAt' | 'activo'>): Promise<UsuarioConPassword> => {
    const { data } = await api.post<UsuarioConPassword>('/auth/register', payload);
    return data;
  },

  // PUT /api/usuarios/:id
  updateUsuario: async (id: string, payload: Partial<UsuarioConPassword>): Promise<UsuarioConPassword> => {
    const { data } = await api.put<UsuarioConPassword>(`/usuarios/${id}`, payload);
    return data;
  },

  // DELETE /api/usuarios/:id
  deleteUsuario: async (id: string): Promise<void> => {
    await api.delete(`/usuarios/${id}`);
  },

  // PUT /api/usuarios/:id/restaurar
  restoreUsuario: async (id: string): Promise<void> => {
    await api.put(`/usuarios/${id}/restaurar`);
  },
};
