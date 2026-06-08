import {
  BarChart3,
  Boxes,
  ClipboardList,
  Coffee,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Users,
  Warehouse,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@src/store/authStore';
import { useUiStore } from '@src/store/uiStore';
import logoUtaCafe from '@src/assets/UTA.png';
import styles from './layout.module.css';

interface NavItem {
  label: string;
  path: string;
  adminOnly?: boolean;
  icon: ReactNode;
}

const items: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Mesas', path: '/mesas', icon: <Coffee size={16} /> },
  { label: 'Productos', path: '/productos', icon: <Package size={16} /> },
  { label: 'Categorias', path: '/categorias', icon: <Boxes size={16} /> },
  { label: 'Inventario', path: '/inventario', icon: <Warehouse size={16} /> },
  { label: 'Ordenes de Compra', path: '/compras', icon: <ShoppingCart size={16} /> },
  { label: 'Proveedores', path: '/proveedores', icon: <ClipboardList size={16} /> },
  { label: 'Gastos', path: '/gastos', icon: <Receipt size={16} /> },
  { label: 'Reportes', path: '/reportes', icon: <BarChart3 size={16} /> },
  { label: 'Usuarios', path: '/admin/usuarios', adminOnly: true, icon: <Users size={16} /> },
  { label: 'Registro de acceso', path: '/admin/acceso-log', adminOnly: true, icon: <Users size={16} /> },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const { user } = useAuthStore();

  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.brandWrap}>
          <div className={styles.brandLogoBox}>
            <img src={logoUtaCafe} alt="Logo UTA Cafe" className={styles.brandLogo} />
          </div>
          <strong>UTA Cafe</strong>
        </div>
        <button onClick={() => setSidebarOpen(false)} className={styles.sidebarCloseButton}>
          x
        </button>
      </div>
      <nav className={styles.sidebarNav}>
        {items
          .filter((item) => !item.adminOnly || user?.rol === 'admin')
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
