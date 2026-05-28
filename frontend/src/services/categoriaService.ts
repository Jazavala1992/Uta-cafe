import { api } from './api';
import type { Categoria } from '@src/types';

export const categoriaService = {
  // GET /api/categorias
  getAll: async (incluirEliminados = false): Promise<Categoria[]> => {
    const { data } = await api.get<Categoria[]>('/categorias', { params: { incluirEliminados } });
    return data;
  },

  // GET /api/categorias/:id
  getById: async (id: string): Promise<Categoria | undefined> => {
    const { data } = await api.get<Categoria>(`/categorias/${id}`);
    return data;
  },

  // POST /api/categorias
  create: async (payload: Omit<Categoria, 'id'>): Promise<Categoria> => {
    const { data } = await api.post<Categoria>('/categorias', payload);
    return data;
  },

  // PUT /api/categorias/:id
  update: async (id: string, payload: Partial<Categoria>): Promise<Categoria> => {
    const { data } = await api.put<Categoria>(`/categorias/${id}`, payload);
    return data;
  },

  // DELETE /api/categorias/:id
  delete: async (id: string): Promise<void> => {
    await api.delete(`/categorias/${id}`);
  },

  // PUT /api/categorias/:id/restaurar
  restore: async (id: string): Promise<void> => {
    await api.put(`/categorias/${id}/restaurar`);
  },
};
