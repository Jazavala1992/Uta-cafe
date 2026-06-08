import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUiStore } from '@src/store/uiStore';
import Alert from '@src/components/ui/Alert';
import styles from './layout.module.css';

export default function MainLayout() {
  const { toasts, removeToast } = useUiStore();

  return (
    <div className={styles.mainLayout}>
      <Sidebar />
      <div className={styles.contentWrap}>
        <Topbar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      <div className={styles.toastStack}>
        {toasts.map((t) => (
          <div key={t.id} onClick={() => removeToast(t.id)} className={styles.toastItem}>
            <Alert type={t.type === 'error' ? 'error' : t.type === 'warning' ? 'warning' : 'success'} message={t.message} />
          </div>
        ))}
      </div>
    </div>
  );
}
