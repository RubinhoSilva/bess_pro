import React, { useState, useEffect } from 'react';
import { useAutoLogout, useSessionWarning, useMultiTabSync } from '@/hooks/auto-logout-hooks';
import { useAuth } from '@/hooks/auth-hooks';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface SessionManagerProps {
  timeoutInMinutes?: number;
  warningInMinutes?: number;
  disabled?: boolean;
}

export function SessionManager({ 
  timeoutInMinutes = 30, 
  warningInMinutes = 5,
  disabled = false 
}: SessionManagerProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  
  const { isAuthenticated, logout } = useAuth();
  const { showWarningDialog, handleSessionExpired } = useSessionWarning();
  
  // Sincronização entre múltiplas abas
  useMultiTabSync();

  const handleWarning = () => {
    setShowWarning(true);
    setCountdown(warningInMinutes * 60); // Converter para segundos
    setIsCountdownActive(true);
  };

  const handleLogout = () => {
    setShowWarning(false);
    setIsCountdownActive(false);
    handleSessionExpired();
  };

  const { getRemainingTime, extendSession } = useAutoLogout({
    timeoutInMinutes,
    warningInMinutes,
    onWarning: handleWarning,
    onLogout: handleLogout,
    disabled: disabled || !isAuthenticated
  });

  // Countdown para o diálogo de aviso
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCountdownActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsCountdownActive(false);
            setShowWarning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCountdownActive, countdown]);

  const handleExtendSession = () => {
    extendSession();
    setShowWarning(false);
    setIsCountdownActive(false);
    setCountdown(0);
  };

  const handleForceLogout = () => {
    setShowWarning(false);
    setIsCountdownActive(false);
    logout();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressValue = ((warningInMinutes * 60 - countdown) / (warningInMinutes * 60)) * 100;

  // Não renderizar se não estiver autenticado ou estiver desabilitado
  if (!isAuthenticated || disabled) {
    return null;
  }

  return (
    <>
      {/* Indicador de sessão na interface (opcional) */}
      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Sessão: {getRemainingTime()}min</span>
      </div>

      {/* Diálogo de aviso de expiração */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Sessão Expirando
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Sua sessão expirará em breve por inatividade. 
                Deseja continuar conectado?
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tempo restante:</span>
                  <span className="font-mono font-bold text-red-600">
                    {formatTime(countdown)}
                  </span>
                </div>
                <Progress 
                  value={progressValue} 
                  className="h-2"
                  indicatorClassName="bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                Se não houver resposta, você será desconectado automaticamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={handleForceLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair Agora
            </AlertDialogCancel>
            
            <AlertDialogAction 
              onClick={handleExtendSession}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Continuar Conectado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Componente para exibir informações de sessão
export function SessionInfo() {
  const { getRemainingTime } = useAutoLogout();
  const { isAuthenticated } = useAuth();
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const updateTime = () => {
      setRemainingTime(getRemainingTime());
    };

    // Atualizar imediatamente
    updateTime();

    // Atualizar a cada minuto
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, getRemainingTime]);

  if (!isAuthenticated) return null;

  const getStatusColor = () => {
    if (remainingTime > 10) return 'text-green-600';
    if (remainingTime > 5) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className={`h-4 w-4 ${getStatusColor()}`} />
      <span className={getStatusColor()}>
        {remainingTime > 0 ? `${remainingTime}min restantes` : 'Sessão expirada'}
      </span>
    </div>
  );
}