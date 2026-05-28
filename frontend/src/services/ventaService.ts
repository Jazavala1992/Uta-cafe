import { api } from './api';
import type { NotaVenta } from '@src/types';

export const ventaService = {
  // GET /api/ventas
  getAll: async (incluirEliminados = false): Promise<NotaVenta[]> => {
    const { data } = await api.get<NotaVenta[]>('/ventas', { params: { incluirEliminados } });
    return data;
  },

  // GET /api/ventas/:id
  getById: async (id: string): Promise<NotaVenta | undefined> => {
    const { data } = await api.get<NotaVenta>(`/ventas/${id}`);
    return data;
  },

  // POST /api/ventas
  create: async (payload: Omit<NotaVenta, 'id'>): Promise<NotaVenta> => {
    const { data } = await api.post<NotaVenta>('/ventas', payload);
    return data;
  },

  // PUT /api/ventas/:id
  update: async (id: string, payload: Partial<NotaVenta>): Promise<NotaVenta> => {
    const { data } = await api.put<NotaVenta>(`/ventas/${id}`, payload);
    return data;
  },

  // DELETE /api/ventas/:id
  delete: async (id: string): Promise<void> => {
    await api.delete(`/ventas/${id}`);
  },

  // PUT /api/ventas/:id/restaurar
  restore: async (id: string): Promise<void> => {
    await api.put(`/ventas/${id}/restaurar`);
  },
};
