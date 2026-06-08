import { api } from './api';

interface ResumenIngresosEgresos {
  totalIngresos: number;
  totalEgresos: number;
  utilidadNeta: number;
}

export const reporteService = {
  // GET /api/reportes/ingresos-egresos
  getIngresosEgresos: async (): Promise<ResumenIngresosEgresos> => {
    const { data } = await api.get<ResumenIngresosEgresos>('/reportes/ingresos-egresos');
    return data;
  },
};
