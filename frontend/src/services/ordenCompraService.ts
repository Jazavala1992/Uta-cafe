import { api } from './api';
import type { OrdenCompra } from '@src/types';

export const ordenCompraService = {
  // GET /api/ordenes-compra
  getAll: async (incluirEliminados = false): Promise<OrdenCompra[]> => {
    const { data } = await api.get<OrdenCompra[]>('/ordenes-compra', { params: { incluirEliminados } });
    return data;
  },

  // GET /api/ordenes-compra/:id
  getById: async (id: string): Promise<OrdenCompra | undefined> => {
    const { data } = await api.get<OrdenCompra>(`/ordenes-compra/${id}`);
    return data;
  },

  // POST /api/ordenes-compra
  create: async (payload: Omit<OrdenCompra, 'id'>): Promise<OrdenCompra> => {
    const { data } = await api.post<OrdenCompra>('/ordenes-compra', payload);
    return data;
  },

  // PUT /api/ordenes-compra/:id
  update: async (id: string, payload: Partial<OrdenCompra>): Promise<OrdenCompra> => {
    const { data } = await api.put<OrdenCompra>(`/ordenes-compra/${id}`, payload);
    return data;
  },

  // PUT /api/ordenes-compra/:id/finalizar
  finalize: async (id: string, usuarioId?: string): Promise<{ ok: boolean; alreadyFinalized: boolean; orden: OrdenCompra }> => {
    const { data } = await api.put<{ ok: boolean; alreadyFinalized: boolean; orden: OrdenCompra }>(
      `/ordenes-compra/${id}/finalizar`,
      { usuarioId },
    );
    return data;
  },

  // DELETE /api/ordenes-compra/:id
  delete: async (id: string): Promise<void> => {
    await api.delete(`/ordenes-compra/${id}`);
  },

  // PUT /api/ordenes-compra/:id/restaurar
  restore: async (id: string): Promise<void> => {
    await api.put(`/ordenes-compra/${id}/restaurar`);
  },
};
