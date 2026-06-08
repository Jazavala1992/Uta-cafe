import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '@src/components/layout/MainLayout';
import AuthLayout from '@src/components/layout/AuthLayout';
import { useAuthStore } from '@src/store/authStore';
import LoginPage from '@src/pages/auth/LoginPage';
import RegisterPage from '@src/pages/auth/RegisterPage';
import DashboardPage from '@src/pages/dashboard/DashboardPage';
import ProductosPage from '@src/pages/productos/ProductosPage';
import CategoriasPage from '@src/pages/categorias/CategoriasPage';
import ProveedoresPage from '@src/pages/proveedores/ProveedoresPage';
import ComprasPage from '@src/pages/compras/ComprasPage';
import CompraForm from '@src/pages/compras/CompraForm';
import InventarioPage from '@src/pages/inventario/InventarioPage';
import VentasPage from '@src/pages/ventas/VentasPage';
import VentaForm from '@src/pages/ventas/VentaForm';
import GastosPage from '@src/pages/gastos/GastosPage';
import ReportesPage from '@src/pages/reportes/ReportesPage';
import UsuariosPage from '@src/pages/admin/UsuariosPage';
import AccesoLogPage from '@src/pages/admin/AccesoLogPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.rol !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/categorias" element={<CategoriasPage />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/compras/nueva" element={<CompraForm />} />
          <Route path="/compras/:id" element={<CompraForm />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/mesas" element={<VentasPage />} />
          <Route path="/ventas/nueva" element={<VentaForm />} />
          <Route path="/ventas/:id" element={<VentaForm />} />
          <Route path="/gastos" element={<GastosPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route
            path="/admin/usuarios"
            element={
              <AdminRoute>
                <UsuariosPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/registro"
            element={
              <AdminRoute>
                <RegisterPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/acceso-log"
            element={
              <AdminRoute>
                <AccesoLogPage />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
