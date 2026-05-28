import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@src/components/ui/Button';
import Table from '@src/components/ui/Table';
import { authService } from '@src/services/authService';
import { useAuthStore } from '@src/store/authStore';
import styles from './UsuariosPage.module.css';

interface UsuarioRow {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'usuario';
  activo: boolean;
  deletedAt?: string;
}

export default function UsuariosPage() {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const [showDeleted, setShowDeleted] = useState(false);
  const [data, setData] = useState<UsuarioRow[]>([]);

  const load = async () => setData(await authService.getUsuarios(showDeleted));
  useEffect(() => {
    void load();
  }, [showDeleted]);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Usuarios</h1>
        <Button onClick={() => navigate('/admin/registro')}>Nuevo usuario</Button>
      </div>

      <Table<UsuarioRow>
        columns={[
          { key: 'nombre', header: 'Nombre' },
          { key: 'apellido', header: 'Apellido' },
          { key: 'email', header: 'Email' },
          { key: 'rol', header: 'Rol' },
          { key: 'activo', header: 'Estado', render: (row) => (row.activo ? 'Activo' : 'Inactivo') },
        ]}
        data={data}
        searchable
        searchKeys={['nombre', 'apellido', 'email']}
        showDeleted={showDeleted}
        onToggleShowDeleted={() => setShowDeleted((v) => !v)}
        isAdmin
        onEdit={async (row) => {
          const nextRol = row.rol === 'admin' ? 'usuario' : 'admin';
          await authService.updateUsuario(row.id, { rol: nextRol });
          await load();
        }}
        onDelete={async (row) => {
          if (row.id === authUser?.id) return;
          await authService.deleteUsuario(row.id);
          await load();
        }}
        onRestore={async (row) => {
          await authService.restoreUsuario(row.id);
          await load();
        }}
      />
      <small className={styles.note}>
        Nota: Editar cambia entre rol admin y usuario. No se permite eliminar el usuario autenticado.
      </small>
    </section>
  );
}
