import { useState, useCallback } from 'react';

export interface ConfirmationOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'info' | 'default';
}

export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({});
  const [onConfirmCallback, setOnConfirmCallback] = useState<() => void>();

  const confirm = useCallback((
    confirmOptions: ConfirmationOptions = {},
    onConfirm: () => void | Promise<void>
  ) => {
    setOptions({
      title: 'Confirmar ação',
      description: 'Tem certeza que deseja continuar?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      variant: 'default',
      ...confirmOptions,
    });
    
    setOnConfirmCallback(() => async () => {
      await onConfirm();
      setIsOpen(false);
    });
    
    setIsOpen(true);
  }, []);

  const cancel = useCallback(() => {
    setIsOpen(false);
    setOnConfirmCallback(undefined);
  }, []);

  return {
    isOpen,
    options,
    confirm,
    cancel,
    onConfirm: onConfirmCallback || (() => {}),
    setIsOpen,
  };
}