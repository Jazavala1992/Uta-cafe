import { api } from './api';
import type { Gasto } from '@src/types';

export const gastoService = {
  // GET /api/gastos
  getAll: async (incluirEliminados = false): Promise<Gasto[]> => {
    const { data } = await api.get<Gasto[]>('/gastos', { params: { incluirEliminados } });
    return data;
  },

  // GET /api/gastos/:id
  getById: async (id: string): Promise<Gasto | undefined> => {
    const { data } = await api.get<Gasto>(`/gastos/${id}`);
    return data;
  },

  // POST /api/gastos
  create: async (payload: Omit<Gasto, 'id'>): Promise<Gasto> => {
    const { data } = await api.post<Gasto>('/gastos', payload);
    return data;
  },

  // PUT /api/gastos/:id
  update: async (id: string, payload: Partial<Gasto>): Promise<Gasto> => {
    const { data } = await api.put<Gasto>(`/gastos/${id}`, payload);
    return data;
  },

  // DELETE /api/gastos/:id
  delete: async (id: string): Promise<void> => {
    await api.delete(`/gastos/${id}`);
  },

  // PUT /api/gastos/:id/restaurar
  restore: async (id: string): Promise<void> => {
    await api.put(`/gastos/${id}/restaurar`);
  },
};
