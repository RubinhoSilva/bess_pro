import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  PlusCircle, Edit, Trash2, Package, Unplug, Search, Lock
} from 'lucide-react';
import { AddSolarModuleModal, AddInverterModal } from './modals';
import { EquipmentList } from './EquipmentList';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useConfirmationDialog } from '@/hooks/use-confirmation-dialog';
import {
  useModuleStore
} from '@/store/module-store';
import {
  useInverterStore
} from '@/store/inverter-store';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useQuery } from '@tanstack/react-query';
import { moduleService } from '@/services/ModuleService';
import { inverterService } from '@/services/InverterService';
import { manufacturerService } from '@/services/ManufacturerService';
import { SolarModule, Inverter } from '@bess-pro/shared';

interface EquipmentManagerProps {
  onUpdate?: () => void;
}

//TODO: REFACTOR Verificar se esse componente é usado em alguma outra parte do sistema. Verificar qual é melhor, esse refatorado ou o outro
export const EquipmentManagerRefactored: React.FC<EquipmentManagerProps> = ({ onUpdate }) => {
  const { toast } = useToast();
  const { executeWithErrorHandling } = useErrorHandler();
  
  // Load data from API using React Query
  const { data: modulesData, isLoading: loadingModules, refetch: refetchModules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => moduleService.getModules(),
    staleTime: 10 * 60 * 1000,
  });
  
  const { data: invertersData, isLoading: loadingInverters, refetch: refetchInverters } = useQuery({
    queryKey: ['inverters'],
    queryFn: () => inverterService.getInverters(),
    staleTime: 10 * 60 * 1000,
  });
  
  const { data: manufacturersData, isLoading: loadingManufacturers, refetch: refetchManufacturers } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturerService.getManufacturers(),
    staleTime: 15 * 60 * 1000,
  });
  
  // Extract data from API responses
  const modules = modulesData?.modules || [];
  const inverters = invertersData?.inverters || [];
  const manufacturers = manufacturersData?.manufacturers || [];
  
  // Store operations (for CRUD)
  const { removeModule } = useModuleStore();
  const { removeInverter } = useInverterStore();
  
  // State
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isInverterDialogOpen, setIsInverterDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<SolarModule | null>(null);
  const [editingInverter, setEditingInverter] = useState<Inverter | null>(null);
  const [isEditModuleDialogOpen, setIsEditModuleDialogOpen] = useState(false);
  const [isEditInverterDialogOpen, setIsEditInverterDialogOpen] = useState(false);
  
  // Modal de confirmação
  const confirmation = useConfirmationDialog();



  // Handlers
  const handleEditModule = (module: SolarModule) => {
    // Verificar se é um equipamento padrão
    if ((module as any).isPublic === true) {
      toast({
        variant: 'destructive',
        title: 'Equipamento padrão não pode ser editado',
        description: 'Este é um equipamento padrão do sistema e não pode ser modificado. Você pode criar uma cópia com suas próprias especificações.'
      });
      return;
    }


    // Abrir modal de edição com os dados do módulo
    setEditingModule(module);
    setIsEditModuleDialogOpen(true);
  };

  const handleEditInverter = (inverter: Inverter) => {
    // Verificar se é um equipamento padrão
    if ((inverter as any).isPublic === true) {
      toast({
        variant: 'destructive',
        title: 'Equipamento padrão não pode ser editado',
        description: 'Este é um equipamento padrão do sistema e não pode ser modificado. Você pode criar uma cópia com suas próprias especificações.'
      });
      return;
    }


    // Abrir modal de edição com os dados do inversor
    setEditingInverter(inverter);
    setIsEditInverterDialogOpen(true);
  };

  const handleNewModule = () => {
    setIsModuleDialogOpen(true);
  };

  const handleNewInverter = () => {
    setIsInverterDialogOpen(true);
  };

  const handleDeleteModule = async (module: SolarModule) => {
    // Verificar se é um equipamento padrão
    if ((module as any).isPublic === true) {
      toast({
        variant: 'destructive',
        title: 'Equipamento padrão não pode ser excluído',
        description: 'Este é um equipamento padrão do sistema e não pode ser removido.'
      });
      return;
    }

    // Abrir modal de confirmação
    confirmation.confirm(
      {
        title: 'Excluir Módulo Solar',
        description: `Tem certeza que deseja excluir o módulo "${module.model}" do fabricante ${module.manufacturer.name}? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        variant: 'destructive'
      },
      async () => {
        await executeWithErrorHandling(async () => {
          // Call API to delete module
          await moduleService.deleteModule(module.id);
          // Remove from local store
          removeModule(module.id);
          // Refetch data from API
          refetchModules();
          toast({ title: 'Módulo excluído com sucesso.' });
          onUpdate?.();
        }, {
          operation: 'delete-module',
          context: {
            modelName: module.model,
            manufacturer: module.manufacturer.name
          }
        });
      }
    );
  };

  const handleDeleteInverter = async (inverter: Inverter) => {
    // Verificar se é um equipamento padrão
    if ((inverter as any).isPublic === true) {
      toast({
        variant: 'destructive',
        title: 'Equipamento padrão não pode ser excluído',
        description: 'Este é um equipamento padrão do sistema e não pode ser removido.'
      });
      return;
    }

    // Abrir modal de confirmação
    confirmation.confirm(
      {
        title: 'Excluir Inversor',
        description: `Tem certeza que deseja excluir o inversor "${inverter.model}" do fabricante ${inverter.manufacturer.name}? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        variant: 'destructive'
      },
      async () => {
        await executeWithErrorHandling(async () => {
          // Call API to delete inverter
          await inverterService.deleteInverter(inverter.id);
          // Remove from local store
          removeInverter(inverter.id);
          // Refetch data from API
          refetchInverters();
          toast({ title: 'Inversor excluído com sucesso.' });
          onUpdate?.();
        }, {
          operation: 'delete-inverter',
          context: {
            modelName: inverter.model,
            manufacturer: inverter.manufacturer.name
          }
        });
      }
    );
  };

  // Handlers para os modais
  const handleModuleAdded = () => {
    refetchModules();
    onUpdate?.();
    setIsModuleDialogOpen(false);
  };

  const handleInverterAdded = () => {
    refetchInverters();
    onUpdate?.();
    setIsInverterDialogOpen(false);
  };

  const handleModuleUpdated = () => {
    refetchModules();
    onUpdate?.();
    setIsEditModuleDialogOpen(false);
    setEditingModule(null);
  };

  const handleInverterUpdated = () => {
    refetchInverters();
    onUpdate?.();
    setIsEditInverterDialogOpen(false);
    setEditingInverter(null);
  };

  const manufacturersList = manufacturers.map((m: any) => ({
    id: m.id,
    name: m.name
  }));

  // Show loading state while fetching data
  if (loadingModules || loadingInverters || loadingManufacturers) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando equipamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EquipmentList
        modules={modules}
        inverters={inverters}
        onEditModule={handleEditModule}
        onEditInverter={handleEditInverter}
        onDeleteModule={handleDeleteModule}
        onDeleteInverter={handleDeleteInverter}
        onAddModule={handleNewModule}
        onAddInverter={handleNewInverter}
      />

      {/* Module Modal */}
      <AddSolarModuleModal
        open={isModuleDialogOpen}
        onOpenChange={setIsModuleDialogOpen}
        onModuleAdded={handleModuleAdded}
      />

      {/* Edit Module Modal */}
      {editingModule && (
        <AddSolarModuleModal
          open={isEditModuleDialogOpen}
          onOpenChange={setIsEditModuleDialogOpen}
          onModuleAdded={handleModuleUpdated}
          initialData={editingModule}
        />
      )}

      {/* Inverter Modal */}
      <AddInverterModal
        open={isInverterDialogOpen}
        onOpenChange={setIsInverterDialogOpen}
        onInverterAdded={handleInverterAdded}
      />

      {/* Edit Inverter Modal */}
      {editingInverter && (
        <AddInverterModal
          open={isEditInverterDialogOpen}
          onOpenChange={setIsEditInverterDialogOpen}
          onInverterAdded={handleInverterUpdated}
          initialData={editingInverter}
        />
      )}

      {/* Modal de Confirmação */}
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
};

export default EquipmentManagerRefactored;