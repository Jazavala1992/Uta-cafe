import { useNavigate } from 'react-router-dom';
import { authService } from '@src/services/authService';
import { useAuthStore } from '@src/store/authStore';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, clearAuth, setAuth } = useAuthStore();

  const logout = () => {
    if (user) {
      authService.logout(user.id, `${user.nombre} ${user.apellido}`);
    }
    clearAuth();
    navigate('/login');
  };

  return { user, token, isAuthenticated, logout, setAuth };
};
