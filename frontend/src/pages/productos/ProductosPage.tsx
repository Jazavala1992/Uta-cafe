import { useCallback, useEffect, useMemo, useState } from 'react';
import Badge from '@src/components/ui/Badge';
import Button from '@src/components/ui/Button';
import Modal from '@src/components/ui/Modal';
import Table from '@src/components/ui/Table';
import { categoriaService } from '@src/services/categoriaService';
import { productoService } from '@src/services/productoService';
import { proveedorService } from '@src/services/proveedorService';
import type { Categoria, Producto, Proveedor } from '@src/types';
import { formatCurrency } from '@src/utils/formatters';
import ProductoForm from './ProductoForm';
import styles from './ProductosPage.module.css';

export default function ProductosPage() {
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [productos, categoriasData, proveedoresData] = await Promise.all([
        productoService.getAll(showDeleted),
        categoriaService.getAll(false),
        proveedorService.getAll(false),
      ]);
      setData(productos);
      setCategorias(categoriasData);
      setProveedores(proveedoresData);
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    void load();
  }, [load]);

  const proveedorMap = useMemo(
    () => new Map(proveedores.map((proveedor) => [proveedor.id, proveedor])),
    [proveedores],
  );

  const handleCreate = async (values: Omit<Producto, 'id'>) => {
    await productoService.create(values);
    setOpenCreate(false);
    await load();
  };

  const handleUpdate = async (values: Omit<Producto, 'id'>) => {
    if (!editing) return;
    const payload: Partial<Producto> = { ...values };
    delete payload.stockActual;
    await productoService.update(editing.id, payload);
    setEditing(null);
    await load();
  };

  const handleQuickCategoryCreate = async (values: { nombre: string; descripcion: string }) => {
    const categoria = await categoriaService.create({
      nombre: values.nombre,
      descripcion: values.descripcion,
      activo: true,
    });
    const categoriasData = await categoriaService.getAll(false);
    setCategorias(categoriasData);
    return categoria;
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Productos</h1>
          <p>Gestiona los productos internos y los enlazados al catalogo de proveedores.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>Nuevo producto</Button>
      </div>

      <Table<Producto>
        columns={[
          { key: 'nombre', header: 'Nombre' },
          { key: 'categoriaNombre', header: 'Categoria' },
          {
            key: 'origen',
            header: 'Origen',
            render: (row) => (row.origen === 'proveedor' ? 'Proveedor' : 'Interno'),
          },
          {
            key: 'fuente',
            header: 'Fuente',
            render: (row) => {
              if (row.origen !== 'proveedor') return 'Elaborado en el cafe';
              const proveedor = row.proveedorId ? proveedorMap.get(row.proveedorId) : undefined;
              const nombreProveedor = proveedor?.razonSocial ?? row.proveedorId ?? 'Proveedor';
              const nombreCatalogo = row.productoProveedorNombre || 'Producto del proveedor';
              return `${nombreProveedor} · ${nombreCatalogo}`;
            },
          },
          {
            key: 'precioUnitario',
            header: 'Precio de venta',
            render: (row) => formatCurrency(row.precioUnitario),
          },
          {
            key: 'stockActual',
            header: 'Stock',
            render: (row) => {
              const stockActual = Number(row.stockActual ?? 0);
              const stockMinimo = Number(row.stockMinimo ?? 0);

              if (stockActual <= 0) {
                return (
                  <>
                    0 <Badge color="danger">Sin stock</Badge>
                  </>
                );
              }

              if (stockActual <= stockMinimo) {
                return (
                  <>
                    {stockActual} <Badge color="warning">Stock bajo</Badge>
                  </>
                );
              }

              return (
                <>
                  {stockActual} <Badge color="success">OK</Badge>
                </>
              );
            },
          },
        ]}
        data={data}
        loading={loading}
        searchable
        searchKeys={['nombre', 'categoriaNombre', 'descripcion', 'productoProveedorNombre']}
        showDeleted={showDeleted}
        onToggleShowDeleted={() => setShowDeleted((v) => !v)}
        isAdmin
        onEdit={(row) => setEditing(row)}
        onDelete={async (row) => {
          await productoService.delete(row.id);
          await load();
        }}
        onRestore={async (row) => {
          await productoService.restore(row.id);
          await load();
        }}
      />

      <Modal open={openCreate} title="Nuevo producto" onClose={() => setOpenCreate(false)}>
        <ProductoForm
          categorias={categorias}
          proveedores={proveedores}
          onCreateCategoria={handleQuickCategoryCreate}
          onSubmit={handleCreate}
          onCancel={() => setOpenCreate(false)}
        />
      </Modal>

      <Modal open={Boolean(editing)} title="Editar producto" onClose={() => setEditing(null)}>
        <ProductoForm
          categorias={categorias}
          proveedores={proveedores}
          onCreateCategoria={handleQuickCategoryCreate}
          initialValues={editing ?? undefined}
          submitLabel="Guardar cambios"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      </Modal>
    </section>
  );
}
