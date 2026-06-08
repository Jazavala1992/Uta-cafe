import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@src/store/authStore';
import styles from './layout.module.css';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <main className={styles.authLayout}>
      <Outlet />
    </main>
  );
}
