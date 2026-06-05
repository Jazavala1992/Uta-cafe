import { useEffect, useState } from 'react';
import Badge from '@src/components/ui/Badge';
import Table from '@src/components/ui/Table';
import { productoService } from '@src/services/productoService';
import type { Producto } from '@src/types';
import styles from './InventarioPage.module.css';

interface InventarioRow {
  id: string;
  productoNombre: string;
  categoriaNombre: string;
  gestion: 'stock' | 'manual';
  disponible: boolean;
  stockActual: number;
  stockMinimo: number;
  estadoStock: 'sin-stock' | 'bajo' | 'ok' | 'manual';
}

export default function InventarioPage() {
  const [data, setData] = useState<InventarioRow[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const productos = await productoService.getAll(false);
      if (!mounted) return;
      setData(
        productos
          .filter((producto) => producto.activo)
          .map((producto) => toInventarioRow(producto))
          .sort((a, b) => a.productoNombre.localeCompare(b.productoNombre)),
      );
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className={styles.page}>
      <h1>Inventario actual</h1>
      <small className={styles.helpText}>
        Los productos con stock real se controlan por cantidad; los manuales solo por disponibilidad.
      </small>
      <Table<InventarioRow>
        columns={[
          { key: 'productoNombre', header: 'Producto' },
          { key: 'categoriaNombre', header: 'Categoria' },
          {
            key: 'gestion',
            header: 'Gestion',
            render: (row) => (row.gestion === 'stock' ? <Badge color="success">Stock</Badge> : <Badge color="muted">Manual</Badge>),
          },
          {
            key: 'disponible',
            header: 'Disponibilidad',
            render: (row) =>
              row.disponible ? <Badge color="success">Disponible</Badge> : <Badge color="danger">No disponible</Badge>,
          },
          {
            key: 'stockActual',
            header: 'Stock actual',
            render: (row) => (row.gestion === 'stock' ? row.stockActual : 'No aplica'),
          },
          {
            key: 'stockMinimo',
            header: 'Stock minimo',
            render: (row) => (row.gestion === 'stock' ? row.stockMinimo : 'No aplica'),
          },
          {
            key: 'estadoStock',
            header: 'Estado',
            render: (row) => {
              if (row.estadoStock === 'manual') return <Badge color="muted">Manual</Badge>;
              if (row.estadoStock === 'sin-stock') return <Badge color="danger">Sin stock</Badge>;
              if (row.estadoStock === 'bajo') return <Badge color="warning">Stock bajo</Badge>;
              return <Badge color="success">OK</Badge>;
            },
          },
        ]}
        data={data}
        searchable
        searchKeys={['productoNombre', 'categoriaNombre']}
      />
    </section>
  );
}

function toInventarioRow(producto: Producto): InventarioRow {
  const stockActual = Number(producto.stockActual ?? 0);
  const stockMinimo = Number(producto.stockMinimo ?? 0);
  const gestion = producto.usaStock ? 'stock' : 'manual';

  return {
    id: producto.id,
    productoNombre: producto.nombre,
    categoriaNombre: producto.categoriaNombre || 'Sin categoria',
    gestion,
    disponible: Boolean(producto.disponible),
    stockActual,
    stockMinimo,
    estadoStock: gestion === 'manual' ? 'manual' : stockActual <= 0 ? 'sin-stock' : stockActual <= stockMinimo ? 'bajo' : 'ok',
  };
}
