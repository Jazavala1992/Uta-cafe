import { Menu } from 'lucide-react';
import Button from '@src/components/ui/Button';
import { useAuth } from '@src/hooks/useAuth';
import { useUiStore } from '@src/store/uiStore';
import styles from './layout.module.css';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useUiStore();

  return (
    <header className={styles.topbar}>
      <Button variant="ghost" onClick={toggleSidebar} className={styles.topbarMenuButton}>
        <Menu size={18} />
      </Button>
      <div className={styles.topbarUser}>
        <div className={styles.topbarUserText}>
          <strong>{user?.nombre} {user?.apellido}</strong>
          <p className={styles.topbarRole}>{user?.rol}</p>
        </div>
        <Button variant="danger" onClick={logout}>
          Cerrar sesion
        </Button>
      </div>
    </header>
  );
}
