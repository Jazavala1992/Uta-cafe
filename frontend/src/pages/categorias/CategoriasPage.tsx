import { useEffect, useState } from 'react';
import Button from '@src/components/ui/Button';
import Modal from '@src/components/ui/Modal';
import Table from '@src/components/ui/Table';
import { categoriaService } from '@src/services/categoriaService';
import type { Categoria } from '@src/types';
import CategoriaForm from './CategoriaForm';
import styles from './CategoriasPage.module.css';

export default function CategoriasPage() {
  const [showDeleted, setShowDeleted] = useState(false);
  const [data, setData] = useState<Categoria[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const load = async () => setData(await categoriaService.getAll(showDeleted));

  useEffect(() => {
    void load();
  }, [showDeleted]);

  const handleCreate = async (values: Omit<Categoria, 'id'>) => {
    await categoriaService.create(values);
    setOpenCreate(false);
    await load();
  };

  const handleUpdate = async (values: Omit<Categoria, 'id'>) => {
    if (!editing) return;
    await categoriaService.update(editing.id, values);
    setEditing(null);
    await load();
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Categorias</h1>
        <Button onClick={() => setOpenCreate(true)}>Nueva categoria</Button>
      </div>

      <Table<Categoria>
        columns={[
          { key: 'nombre', header: 'Nombre' },
          { key: 'descripcion', header: 'Descripcion' },
          { key: 'activo', header: 'Estado', render: (row) => (row.activo ? 'Activa' : 'Inactiva') },
        ]}
        data={data}
        searchable
        searchKeys={['nombre', 'descripcion']}
        showDeleted={showDeleted}
        onToggleShowDeleted={() => setShowDeleted((v) => !v)}
        isAdmin
        onEdit={(row) => setEditing(row)}
        onDelete={async (row) => {
          await categoriaService.delete(row.id);
          await load();
        }}
        onRestore={async (row) => {
          await categoriaService.restore(row.id);
          await load();
        }}
      />

      <Modal open={openCreate} title="Nueva categoria" onClose={() => setOpenCreate(false)}>
        <CategoriaForm onSubmit={handleCreate} onCancel={() => setOpenCreate(false)} />
      </Modal>

      <Modal open={Boolean(editing)} title="Editar categoria" onClose={() => setEditing(null)}>
        <CategoriaForm
          initialValues={editing ?? undefined}
          submitLabel="Guardar cambios"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      </Modal>
    </section>
  );
}
