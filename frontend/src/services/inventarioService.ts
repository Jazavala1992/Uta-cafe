import { api } from './api';
import type { MovimientoInventario } from '@src/types';

export const inventarioService = {
  // GET /api/inventario/movimientos
  getAll: async (): Promise<MovimientoInventario[]> => {
    const { data } = await api.get<MovimientoInventario[]>('/inventario/movimientos');
    return data;
  },

  // POST /api/inventario/movimientos
  registrarMovimiento: async (
    payload: Omit<MovimientoInventario, 'id' | 'stockAnterior' | 'stockNuevo' | 'fecha'>
  ): Promise<MovimientoInventario> => {
    const { data } = await api.post<MovimientoInventario>('/inventario/movimientos', payload);
    return data;
  },
};
