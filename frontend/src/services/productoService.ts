import { api } from './api';
import type { Producto } from '@src/types';

export const productoService = {
  // GET /api/productos
  getAll: async (incluirEliminados = false): Promise<Producto[]> => {
    const { data } = await api.get<Producto[]>('/productos', { params: { incluirEliminados } });
    return data;
  },

  // GET /api/productos/:id
  getById: async (id: string): Promise<Producto | undefined> => {
    const { data } = await api.get<Producto>(`/productos/${id}`);
    return data;
  },

  // POST /api/productos
  create: async (payload: Omit<Producto, 'id'>): Promise<Producto> => {
    const { data } = await api.post<Producto>('/productos', payload);
    return data;
  },

  // PUT /api/productos/:id
  update: async (id: string, payload: Partial<Producto>): Promise<Producto> => {
    const { data } = await api.put<Producto>(`/productos/${id}`, payload);
    return data;
  },

  // DELETE /api/productos/:id
  delete: async (id: string): Promise<void> => {
    await api.delete(`/productos/${id}`);
  },

  // PUT /api/productos/:id/restaurar
  restore: async (id: string): Promise<void> => {
    await api.put(`/productos/${id}/restaurar`);
  },
};
