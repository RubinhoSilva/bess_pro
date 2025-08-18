import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './auth-hooks';
import toast from 'react-hot-toast';

interface UseAutoLogoutOptions {
  timeoutInMinutes?: number;
  warningInMinutes?: number;
  onWarning?: () => void;
  onLogout?: () => void;
  disabled?: boolean;
}

export function useAutoLogout(options: UseAutoLogoutOptions = {}) {
  const {
    timeoutInMinutes = 30,
    warningInMinutes = 5,
    onWarning,
    onLogout,
    disabled = false
  } = options;

  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Função para resetar os timers
  const resetTimers = useCallback(() => {
    if (disabled || !isAuthenticated) return;

    // Limpar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Atualizar última atividade
    lastActivityRef.current = Date.now();

    // Definir tempo de aviso (timeout - warning)
    const warningTime = (timeoutInMinutes - warningInMinutes) * 60 * 1000;
    const logoutTime = timeoutInMinutes * 60 * 1000;

    // Timer para mostrar aviso
    if (warningTime > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        if (onWarning) {
          onWarning();
        } else {
          const toastId = toast.error(`Sua sessão expirará em ${warningInMinutes} minutos. Clique aqui para manter-se conectado.`, {
            duration: warningInMinutes * 60 * 1000 // Duração igual ao tempo restante
          });
          
          // Implementar onclick via event listener do toast se necessário
          // toast.dismiss() quando necessário
        }
      }, warningTime);
    }

    // Timer para logout automático
    timeoutRef.current = setTimeout(() => {
      if (onLogout) {
        onLogout();
      } else {
        logout();
        toast.error('Sua sessão expirou por inatividade.');
      }
    }, logoutTime);
  }, [disabled, isAuthenticated, timeoutInMinutes, warningInMinutes, onWarning, onLogout, logout]);

  // Função para detectar atividade do usuário
  const handleActivity = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    if (disabled || !isAuthenticated) {
      // Limpar timers se desabilitado ou não autenticado
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      return;
    }

    // Inicializar timers
    resetTimers();

    // Lista de eventos que indicam atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Adicionar listeners para eventos de atividade
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [disabled, isAuthenticated, handleActivity, resetTimers]);

  // Funções utilitárias
  const getRemainingTime = useCallback(() => {
    if (!isAuthenticated || disabled) return 0;
    
    const now = Date.now();
    const elapsed = now - lastActivityRef.current;
    const remaining = (timeoutInMinutes * 60 * 1000) - elapsed;
    
    return Math.max(0, Math.floor(remaining / 1000 / 60)); // Retorna em minutos
  }, [isAuthenticated, disabled, timeoutInMinutes]);

  const extendSession = useCallback(() => {
    resetTimers();
    toast.success('Sessão estendida com sucesso!');
  }, [resetTimers]);

  return {
    getRemainingTime,
    extendSession,
    resetTimers
  };
}

// Hook específico para componentes de aviso de sessão
export function useSessionWarning() {
  const { logout } = useAuth();

  const showWarningDialog = useCallback((minutesLeft: number) => {
    return new Promise<boolean>((resolve) => {
      const confirmed = window.confirm(
        `Sua sessão expirará em ${minutesLeft} minutos. Deseja continuar conectado?`
      );
      resolve(confirmed);
    });
  }, []);

  const handleSessionExpired = useCallback(() => {
    toast.error('Sua sessão expirou. Você será redirecionado para o login.');
    setTimeout(() => {
      logout();
    }, 2000);
  }, [logout]);

  return {
    showWarningDialog,
    handleSessionExpired
  };
}

// Hook para monitorar múltiplas abas/janelas
export function useMultiTabSync() {
  const { logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleStorageChange = (e: StorageEvent) => {
      // Se o token foi removido em outra aba, fazer logout
      if (e.key === 'auth-token' && !e.newValue && e.oldValue) {
        logout();
        toast.error('Você foi desconectado em outra aba.');
      }
    };

    const handleVisibilityChange = () => {
      // Quando a aba se torna visível, verificar se ainda está autenticado
      if (!document.hidden && isAuthenticated) {
        const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
        if (!token) {
          logout();
          toast.error('Sua sessão expirou.');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, logout]);
}