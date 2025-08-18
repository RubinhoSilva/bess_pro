import React from 'react';
import { Button } from './button';
import { ConfirmationDialog } from './confirmation-dialog';
import { useConfirmationDialog } from '@/hooks/use-confirmation-dialog';

/**
 * Exemplo de como usar o ConfirmationDialog com o hook personalizado
 * Este componente pode ser usado como referência em outras partes do sistema
 */
export function ConfirmationDialogExample() {
  const confirmation = useConfirmationDialog();

  const handleDeleteUser = async () => {
    // Simular operação async
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Usuário deletado');
  };

  const handleResetData = async () => {
    // Simular operação async
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Dados resetados');
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-medium">Exemplos de Confirmação</h3>
      
      {/* Exemplo 1: Deleção destrutiva */}
      <Button
        variant="destructive"
        onClick={() => confirmation.confirm(
          {
            title: 'Excluir Usuário',
            description: 'Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema.',
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            variant: 'destructive'
          },
          handleDeleteUser
        )}
      >
        Excluir Usuário
      </Button>

      {/* Exemplo 2: Aviso */}
      <Button
        variant="outline"
        onClick={() => confirmation.confirm(
          {
            title: 'Resetar Dados',
            description: 'Todos os dados não salvos serão perdidos. Deseja continuar?',
            confirmText: 'Resetar',
            cancelText: 'Cancelar',
            variant: 'warning'
          },
          handleResetData
        )}
      >
        Resetar Dados
      </Button>

      {/* Exemplo 3: Informativo */}
      <Button
        onClick={() => confirmation.confirm(
          {
            title: 'Salvar Alterações',
            description: 'Deseja salvar as alterações feitas no documento?',
            confirmText: 'Salvar',
            cancelText: 'Descartar',
            variant: 'info'
          },
          () => console.log('Dados salvos')
        )}
      >
        Salvar com Confirmação
      </Button>

      {/* Modal de confirmação */}
      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setIsOpen}
        title={confirmation.options.title}
        description={confirmation.options.description}
        confirmText={confirmation.options.confirmText}
        cancelText={confirmation.options.cancelText}
        variant={confirmation.options.variant}
        onConfirm={confirmation.onConfirm}
        onCancel={confirmation.cancel}
      />
    </div>
  );
}