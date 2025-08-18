import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import toast from 'react-hot-toast';

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  } = useAuthStore();

  const handleLogin = useCallback(async (email: string, password: string, rememberMe = false, redirectTo?: string) => {
    try {
      await login(email, password, rememberMe);
      toast.success('Login realizado com sucesso!');
      navigate(redirectTo || '/dashboard/services');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  }, [login, navigate]);

  const handleRegister = useCallback(async (userData: {
    name: string;
    email: string;
    password: string;
    company?: string;
  }) => {
    try {
      await register(userData);
      toast.success('Conta criada com sucesso!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    }
  }, [register, navigate]);

  const handleLogout = useCallback(() => {
    logout();
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  }, [logout, navigate]);

  const hasRole = useCallback((requiredRole: 'admin' | 'vendedor' | 'viewer') => {
    if (!user) return false;
    
    const roleHierarchy = ['viewer', 'vendedor', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  }, [user]);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    
    // Define permissions based on roles
    const permissions = {
      super_admin: ['read', 'write', 'delete', 'manage', 'admin'],
      team_owner: ['read', 'write', 'delete', 'manage'],
      admin: ['read', 'write', 'delete', 'manage'],
      vendedor: ['read', 'write'],
      viewer: ['read'],
    };
    
    return permissions[user.role]?.includes(permission) || false;
  }, [user]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    checkAuth,
    hasRole,
    hasPermission,
  };
}