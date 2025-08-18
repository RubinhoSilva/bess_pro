import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { AlertTriangle, Trash2, Info, HelpCircle } from 'lucide-react';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'destructive' | 'warning' | 'info' | 'default';
  loading?: boolean;
}

const variantConfig = {
  destructive: {
    icon: <Trash2 className="w-5 h-5 text-red-500" />,
    confirmButtonVariant: 'destructive' as const,
    iconBgColor: 'bg-red-100',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    confirmButtonVariant: 'default' as const,
    iconBgColor: 'bg-yellow-100',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-500" />,
    confirmButtonVariant: 'default' as const,
    iconBgColor: 'bg-blue-100',
  },
  default: {
    icon: <HelpCircle className="w-5 h-5 text-gray-500" />,
    confirmButtonVariant: 'default' as const,
    iconBgColor: 'bg-gray-100',
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title = 'Confirmar ação',
  description = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant];

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${config.iconBgColor}`}>
              {config.icon}
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left pl-11">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmButtonVariant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processando...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}