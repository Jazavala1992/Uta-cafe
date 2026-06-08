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
  estado: 'sin-stock' | 'bajo' | 'ok' | 'disponible' | 'no-disponible';
  detalle: string;
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
        Los productos preparados se muestran como disponibles o no disponibles; los de stock muestran su cantidad.
      </small>
      <Table<InventarioRow>
        columns={[
          { key: 'productoNombre', header: 'Producto' },
          { key: 'categoriaNombre', header: 'Categoria' },
          {
            key: 'detalle',
            header: 'Estado',
            render: (row) => {
              if (row.estado === 'no-disponible') return <Badge color="danger">No disponible</Badge>;
              if (row.estado === 'disponible') return <Badge color="success">Disponible</Badge>;
              if (row.estado === 'sin-stock') return <Badge color="danger">No disponible</Badge>;
              if (row.estado === 'bajo') return <Badge color="warning">Stock bajo</Badge>;
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

  return {
    id: producto.id,
    productoNombre: producto.nombre,
    categoriaNombre: producto.categoriaNombre || 'Sin categoria',
    estado: !producto.disponible ? 'no-disponible' : !producto.usaStock ? 'disponible' : stockActual <= 0 ? 'sin-stock' : stockActual <= stockMinimo ? 'bajo' : 'ok',
    detalle: !producto.usaStock ? 'Disponible manualmente' : `Stock: ${stockActual} / minimo ${stockMinimo}`,
  };
}
