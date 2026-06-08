import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '@src/components/ui/Table';
import Button from '@src/components/ui/Button';
import { ordenCompraService } from '@src/services/ordenCompraService';
import type { OrdenCompra } from '@src/types';
import { formatCurrency, formatDate } from '@src/utils/formatters';
import { useAuthStore } from '@src/store/authStore';
import { useUiStore } from '@src/store/uiStore';
import styles from './ComprasPage.module.css';

export default function ComprasPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const addToast = useUiStore((s) => s.addToast);
  const [showDeleted, setShowDeleted] = useState(false);
  const [data, setData] = useState<OrdenCompra[]>([]);

  const load = useCallback(async () => {
    const result = await ordenCompraService.getAll(showDeleted);
    const normalized = result.map((orden: any) => ({
      ...orden,
      proveedorNombre:
        orden.proveedorNombre ||
        orden.proveedor?.razonSocial ||
        orden.proveedor?.nombre ||
        '—',
    }));
    setData(normalized);
  }, [showDeleted]);

  useEffect(() => {
    load();
  }, [load]);

const userId = user?.id;

const handleFinalize = useCallback(
  async (row: OrdenCompra) => {
    try {
      const result = await ordenCompraService.finalize(row.id, userId);
      if (result.alreadyFinalized) {
        addToast('warning', 'La orden ya estaba finalizada');
      } else {
        addToast('success', 'Compra finalizada. Se registro gasto e inventario.');
      }
      await load();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'No se pudo finalizar la compra');
    }
  },
  [load, userId, addToast]
);

  const handleDelete = useCallback(
    async (row: OrdenCompra) => {
      await ordenCompraService.delete(row.id);
      await load();
    },
    [load]
  );

  const handleRestore = useCallback(
    async (row: OrdenCompra) => {
      await ordenCompraService.restore(row.id);
      await load();
    },
    [load]
  );

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Ordenes de compra</h1>
        <Button onClick={() => navigate('/compras/nueva')}>Nueva orden</Button>
      </div>
      <Table<OrdenCompra>
        columns={[
          { key: 'proveedorNombre', header: 'Proveedor' },
          { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha) },
          { key: 'estado', header: 'Estado' },
          { key: 'total', header: 'Total', render: (row) => formatCurrency(row.total) },
        ]}
        data={data}
        searchable
        searchKeys={['proveedorNombre', 'estado']}
        showDeleted={showDeleted}
        onToggleShowDeleted={() => setShowDeleted((v) => !v)}
        isAdmin
        renderExtraActions={(row) =>
          row.estado === 'pendiente' ? (
            <Button variant="secondary" onClick={() => handleFinalize(row)}>
              Finalizar
            </Button>
          ) : null
        }
        onEdit={(row) => navigate(`/compras/${row.id}`)}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />
    </section>
  );
}