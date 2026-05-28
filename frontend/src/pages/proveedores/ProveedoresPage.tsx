import { useEffect, useState } from 'react';
import Table from '@src/components/ui/Table';
import { proveedorService } from '@src/services/proveedorService';
import type { Proveedor } from '@src/types';
import Button from '@src/components/ui/Button';
import Modal from '@src/components/ui/Modal';
import ProveedorForm from './ProveedorForm';
import styles from './ProveedoresPage.module.css';

export default function ProveedoresPage() {
  const [showDeleted, setShowDeleted] = useState(false);
  const [data, setData] = useState<Proveedor[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const load = async () => setData(await proveedorService.getAll(showDeleted));

  useEffect(() => {
    void load();
  }, [showDeleted]);

  const handleCreate = async (values: Omit<Proveedor, 'id'>) => {
    await proveedorService.create(values);
    setOpenCreate(false);
    await load();
  };

  const handleUpdate = async (values: Omit<Proveedor, 'id'>) => {
    if (!editing) return;
    await proveedorService.update(editing.id, values);
    setEditing(null);
    await load();
  };

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Proveedores</h1>
        <Button onClick={() => setOpenCreate(true)}>Nuevo proveedor</Button>
      </div>
      <Table<Proveedor>
        columns={[
          { key: 'razonSocial', header: 'Razon social' },
          { key: 'contacto', header: 'Contacto' },
          { key: 'telefono', header: 'Telefono' },
          { key: 'email', header: 'Email' },
        ]}
        data={data}
        searchable
        searchKeys={['razonSocial', 'contacto', 'email']}
        showDeleted={showDeleted}
        onToggleShowDeleted={() => setShowDeleted((v) => !v)}
        isAdmin
        onEdit={(row) => setEditing(row)}
        onDelete={async (row) => {
          await proveedorService.delete(row.id);
          await load();
        }}
        onRestore={async (row) => {
          await proveedorService.restore(row.id);
          await load();
        }}
      />

      <Modal open={openCreate} title="Nuevo proveedor" onClose={() => setOpenCreate(false)}>
        <ProveedorForm onSubmit={handleCreate} onCancel={() => setOpenCreate(false)} />
      </Modal>

      <Modal open={Boolean(editing)} title="Editar proveedor" onClose={() => setEditing(null)}>
        <ProveedorForm
          initialValues={editing ?? undefined}
          submitLabel="Guardar cambios"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      </Modal>
    </section>
  );
}
