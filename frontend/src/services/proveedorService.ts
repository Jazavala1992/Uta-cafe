import { api } from './api';
import type { Proveedor } from '@src/types';

export const proveedorService = {
  // GET /api/proveedores
  getAll: async (incluirEliminados = false): Promise<Proveedor[]> => {
    const { data } = await api.get<Proveedor[]>('/proveedores', { params: { incluirEliminados } });
    return data;
  },

  // GET /api/proveedores/:id
  getById: async (id: string): Promise<Proveedor | undefined> => {
    const { data } = await api.get<Proveedor>(`/proveedores/${id}`);
    return data;
  },

  // POST /api/proveedores
  create: async (payload: Omit<Proveedor, 'id'>): Promise<Proveedor> => {
    const { data } = await api.post<Proveedor>('/proveedores', payload);
    return data;
  },

  // PUT /api/proveedores/:id
  update: async (id: string, payload: Partial<Proveedor>): Promise<Proveedor> => {
    const { data } = await api.put<Proveedor>(`/proveedores/${id}`, payload);
    return data;
  },

  // DELETE /api/proveedores/:id
  delete: async (id: string): Promise<void> => {
    await api.delete(`/proveedores/${id}`);
  },

  // PUT /api/proveedores/:id/restaurar
  restore: async (id: string): Promise<void> => {
    await api.put(`/proveedores/${id}/restaurar`);
  },
};
