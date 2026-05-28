import { useEffect, useMemo, useState } from 'react';
import Button from '@src/components/ui/Button';
import { generarReporteIngresosEgresos } from '@src/utils/pdfGenerator';
import { ventaService } from '@src/services/ventaService';
import { gastoService } from '@src/services/gastoService';
import { useAuthStore } from '@src/store/authStore';
import type { NotaVenta, Gasto } from '@src/types';
import { formatCurrency } from '@src/utils/formatters';
import styles from './ReportesPage.module.css';

export default function ReportesPage() {
  const user = useAuthStore((s) => s.user);
  const [ventas, setVentas] = useState<NotaVenta[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [ventasData, gastosData] = await Promise.all([ventaService.getAll(), gastoService.getAll()]);
      if (!mounted) return;
      setVentas(ventasData);
      setGastos(gastosData);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalVentas = useMemo(() => ventas.reduce((acc, x) => acc + x.total, 0), [ventas]);
  const totalGastos = useMemo(() => gastos.reduce((acc, x) => acc + x.monto, 0), [gastos]);

  return (
    <section className={styles.page}>
      <h1>Reportes</h1>
      <p>Ingresos acumulados: {formatCurrency(totalVentas)}</p>
      <p>Egresos acumulados: {formatCurrency(totalGastos)}</p>
      <p>Utilidad neta: {formatCurrency(totalVentas - totalGastos)}</p>
      <Button
        onClick={() =>
          generarReporteIngresosEgresos({
            periodo: 'Historico',
            ventas: ventas.map((v) => ({ numeroNota: v.numeroNota, fecha: v.fecha, total: v.total })),
            gastos: gastos.map((g) => ({ descripcion: g.descripcion, categoria: g.categoria, monto: g.monto })),
            generadoPor: user ? `${user.nombre} ${user.apellido}` : 'Sistema',
          })
        }
      >
        Generar PDF
      </Button>
    </section>
  );
}
