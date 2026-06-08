import { useEffect, useMemo, useState } from 'react';
import StatCard from '@src/components/ui/StatCard';
import { formatCurrency } from '@src/utils/formatters';
import { ventaService } from '@src/services/ventaService';
import { gastoService } from '@src/services/gastoService';
import { productoService } from '@src/services/productoService';
import type { Gasto, NotaVenta, Producto } from '@src/types';
import BarChartIngresos from '@src/components/charts/BarChartIngresos';
import LineChartTendencia from '@src/components/charts/LineChartTendencia';
import PieChartProductos from '@src/components/charts/PieChartProductos';
import Alert from '@src/components/ui/Alert';
import AssistantPanel from '@src/components/ai/AssistantPanel';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const [ventas, setVentas] = useState<NotaVenta[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    const load = async () => {
      setVentas(await ventaService.getAll());
      setGastos(await gastoService.getAll());
      setProductos(await productoService.getAll());
    };
    void load();
  }, []);

  const now = new Date();
  const today = now.toLocaleDateString('es-BO');

  const ventasDia = ventas.filter((v) => new Date(v.fecha).toLocaleDateString('es-BO') === today).reduce((acc, v) => acc + v.total, 0);
  const gastosDia = gastos.filter((g) => new Date(g.fecha).toLocaleDateString('es-BO') === today).reduce((acc, g) => acc + g.monto, 0);
  const ventasMes = ventas.filter((v) => new Date(v.fecha).getMonth() === now.getMonth()).reduce((acc, v) => acc + v.total, 0);
  const gastosMes = gastos.filter((g) => new Date(g.fecha).getMonth() === now.getMonth()).reduce((acc, g) => acc + g.monto, 0);

  const stockBajo = productos.filter((p) => p.stockActual <= p.stockMinimo);

  const barData = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toLocaleDateString('es-BO');
        return {
          name: d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' }),
          total: ventas
            .filter((v) => new Date(v.fecha).toLocaleDateString('es-BO') === key)
            .reduce((a, v) => a + v.total, 0),
        };
      }),
    [ventas]
  );

  const lineData = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const key = d.toLocaleDateString('es-BO');
        return {
          name: d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' }),
          ingresos: ventas
            .filter((v) => new Date(v.fecha).toLocaleDateString('es-BO') === key)
            .reduce((a, v) => a + v.total, 0),
          egresos: gastos
            .filter((g) => new Date(g.fecha).toLocaleDateString('es-BO') === key)
            .reduce((a, g) => a + g.monto, 0),
        };
      }),
    [ventas, gastos]
  );

  const pieData = [
    { name: 'Bebidas calientes', value: Math.max(ventas.length * 2, 1) },
    { name: 'Reposteria', value: Math.max(ventas.length, 1) },
    { name: 'Bebidas frias', value: Math.max(ventas.length - 1, 1) },
  ];

  return (
    <section className={styles.page}>
      <h1>Dashboard</h1>

      <div className={styles.statsGrid}>
        <StatCard title="Ventas del dia" value={formatCurrency(ventasDia)} />
        <StatCard title="Gastos del dia" value={formatCurrency(gastosDia)} />
        <StatCard title="Utilidad del dia" value={formatCurrency(ventasDia - gastosDia)} />
        <StatCard title="Ventas del mes" value={formatCurrency(ventasMes)} />
        <StatCard title="Gastos del mes" value={formatCurrency(gastosMes)} />
        <StatCard title="Utilidad del mes" value={formatCurrency(ventasMes - gastosMes)} />
      </div>

      {stockBajo.length > 0 ? (
        <div>
          <Alert type="warning" message="Alerta de stock bajo" />
          <ul className={styles.stockList}>
            {stockBajo.map((p) => (
              <li key={p.id}>
                {p.nombre}: {p.stockActual} (minimo {p.stockMinimo})
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.chartsGrid}>
        <BarChartIngresos data={barData} />
        <LineChartTendencia data={lineData} />
        <PieChartProductos data={pieData} />
      </div>

      <AssistantPanel />
    </section>
  );
}
