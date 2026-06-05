import { useEffect, useMemo, useState } from 'react';
import StatCard from '@src/components/ui/StatCard';
import { formatCurrency } from '@src/utils/formatters';
import { ventaService } from '@src/services/ventaService';
import { gastoService } from '@src/services/gastoService';
import { productoService } from '@src/services/productoService';
import { categoriaService } from '@src/services/categoriaService';
import type { Categoria, Gasto, NotaVenta, Producto } from '@src/types';
import BarChartIngresos from '@src/components/charts/BarChartIngresos';
import LineChartTendencia from '@src/components/charts/LineChartTendencia';
import PieChartProductos from '@src/components/charts/PieChartProductos';
import Alert from '@src/components/ui/Alert';
import AssistantPanel from '@src/components/ai/AssistantPanel';
import styles from './DashboardPage.module.css';

const shortDateFormatter = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: '2-digit',
});

function getDayKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function addDays(baseDate: Date, offset: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + offset);
  return nextDate;
}

export default function DashboardPage() {
  const [ventas, setVentas] = useState<NotaVenta[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [ventasData, gastosData, productosData, categoriasData] = await Promise.all([
        ventaService.getAll(),
        gastoService.getAll(),
        productoService.getAll(),
        categoriaService.getAll(),
      ]);
      if (!mounted) return;
      setVentas(ventasData);
      setGastos(gastosData);
      setProductos(productosData);
      setCategorias(categoriasData);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const now = useMemo(() => new Date(), []);
  const today = now.toLocaleDateString('es-BO');

  const ventasDia = ventas.filter((v) => new Date(v.fecha).toLocaleDateString('es-BO') === today).reduce((acc, v) => acc + v.total, 0);
  const gastosDia = gastos.filter((g) => new Date(g.fecha).toLocaleDateString('es-BO') === today).reduce((acc, g) => acc + g.monto, 0);
  const ventasMes = ventas.filter((v) => new Date(v.fecha).getMonth() === now.getMonth()).reduce((acc, v) => acc + v.total, 0);
  const gastosMes = gastos.filter((g) => new Date(g.fecha).getMonth() === now.getMonth()).reduce((acc, g) => acc + g.monto, 0);

  const stockBajo = productos.filter((p) => p.usaStock && p.disponible && p.stockActual <= p.stockMinimo);
  const categoriaNombrePorId = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria.nombre.trim()])),
    [categorias]
  );

  const ventasPorDia = useMemo(() => {
    const totals = new Map<string, number>();
    for (const venta of ventas) {
      const key = getDayKey(venta.fecha);
      totals.set(key, (totals.get(key) ?? 0) + venta.total);
    }
    return totals;
  }, [ventas]);

  const gastosPorDia = useMemo(() => {
    const totals = new Map<string, number>();
    for (const gasto of gastos) {
      const key = getDayKey(gasto.fecha);
      totals.set(key, (totals.get(key) ?? 0) + gasto.monto);
    }
    return totals;
  }, [gastos]);

  const barData = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(now, i - 6);
        const key = getDayKey(d);
        return {
          name: shortDateFormatter.format(d),
          total: ventasPorDia.get(key) ?? 0,
        };
      }),
    [now, ventasPorDia]
  );

  const lineData = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => {
        const d = addDays(now, i - 29);
        const key = getDayKey(d);
        return {
          name: shortDateFormatter.format(d),
          ingresos: ventasPorDia.get(key) ?? 0,
          egresos: gastosPorDia.get(key) ?? 0,
        };
      }),
    [now, ventasPorDia, gastosPorDia]
  );

  const pieData = useMemo(() => {
    const totals = new Map<string, number>();

    for (const categoria of categorias) {
      totals.set(categoria.nombre.trim() || 'Sin nombre', 0);
    }

    for (const producto of productos) {
      const categoria = categoriaNombrePorId.get(producto.categoriaId) || producto.categoriaNombre?.trim() || 'Sin categoría';
      totals.set(categoria, (totals.get(categoria) ?? 0) + 1);
    }

    const ordered = Array.from(totals.entries()).sort((left, right) => right[1] - left[1]);
    return ordered.map(([name, value]) => ({ name, value }));
  }, [categorias, categoriaNombrePorId, productos]);

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
