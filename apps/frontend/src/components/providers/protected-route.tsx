'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'vendedor' | 'viewer' | 'super_admin' | 'team_owner';
  fallbackUrl?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallbackUrl = '/login' 
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    // Only check auth if not already authenticated and not loading
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [checkAuth, isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(fallbackUrl);
    }
  }, [isAuthenticated, isLoading, navigate, fallbackUrl]);

  useEffect(() => {
    if (user && requiredRole) {
      const roleHierarchy = ['viewer', 'vendedor', 'admin', 'team_owner', 'super_admin'];
      const userRoleIndex = roleHierarchy.indexOf(user.role);
      const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
      
      // Special cases for admin access
      if (requiredRole === 'admin' && (user.role === 'super_admin' || user.role === 'team_owner')) {
        return; // Allow access
      }
      
      if (userRoleIndex < requiredRoleIndex) {
        navigate('/dashboard'); // Redirect to dashboard if insufficient permissions
      }
    }
  }, [user, requiredRole, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRole) {
    const roleHierarchy = ['viewer', 'vendedor', 'admin', 'team_owner', 'super_admin'];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    // Special cases for admin access
    const hasAccess = (requiredRole === 'admin' && (user.role === 'super_admin' || user.role === 'team_owner')) || 
                      userRoleIndex >= requiredRoleIndex;
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}