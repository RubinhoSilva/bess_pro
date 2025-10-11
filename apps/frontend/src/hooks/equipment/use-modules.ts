import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { moduleApi } from '../../api/equipment';
import { CreateModuleRequest, UpdateModuleRequest } from '@bess-pro/shared';
import { useModuleStore, useModuleQueryParams } from '../../store/module-store';

// Query keys
export const moduleKeys = {
  all: ['modules'] as const,
  lists: () => [...moduleKeys.all, 'list'] as const,
  list: (params: any) => [...moduleKeys.lists(), params] as const,
  details: () => [...moduleKeys.all, 'detail'] as const,
  detail: (id: string) => [...moduleKeys.details(), id] as const,
};

// Hook for fetching modules with filters
export const useModules = () => {
  const queryParams = useModuleQueryParams();

  return useQuery({
    queryKey: moduleKeys.list(queryParams),
    queryFn: () => moduleApi.getModules(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching a single module
export const useModule = (id: string) => {
  return useQuery({
    queryKey: moduleKeys.detail(id),
    queryFn: () => moduleApi.getModuleById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for creating a module
export const useCreateModule = () => {
  const queryClient = useQueryClient();
  const { selectModule } = useModuleStore();

  return useMutation({
    mutationFn: (data: CreateModuleRequest) => moduleApi.createModule(data),
    onSuccess: (newModule) => {
      // Invalidate the list query to refetch
      queryClient.invalidateQueries({ queryKey: moduleKeys.lists() });
      
      // Set the newly created module as selected
      selectModule(newModule);
      
      toast.success('Módulo criado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao criar módulo';
      toast.error(message);
    },
  });
};

// Hook for updating a module
export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  const { selectedModule, selectModule } = useModuleStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateModuleRequest }) =>
      moduleApi.updateModule(id, data),
    onSuccess: (updatedModule) => {
      // Update the cache for the specific module
      queryClient.setQueryData(
        moduleKeys.detail(updatedModule.id),
        updatedModule
      );
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: moduleKeys.lists() });
      
      // Update selected module if it's the one being updated
      if (selectedModule?.id === updatedModule.id) {
        selectModule(updatedModule);
      }
      
      toast.success('Módulo atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao atualizar módulo';
      toast.error(message);
    },
  });
};

// Hook for deleting a module
export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  const { selectedModule, selectModule } = useModuleStore();

  return useMutation({
    mutationFn: (id: string) => moduleApi.deleteModule(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: moduleKeys.detail(deletedId) });
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: moduleKeys.lists() });
      
      // Clear selected module if it's the one being deleted
      if (selectedModule?.id === deletedId) {
        selectModule(null);
      }
      
      toast.success('Módulo excluído com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao excluir módulo';
      toast.error(message);
    },
  });
};

// Hook for toggling module status
export const useToggleModuleStatus = () => {
  const queryClient = useQueryClient();
  const { selectedModule, selectModule } = useModuleStore();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      moduleApi.toggleModuleStatus(id, isActive),
    onSuccess: (updatedModule) => {
      // Update the cache
      queryClient.setQueryData(
        moduleKeys.detail(updatedModule.id),
        updatedModule
      );
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: moduleKeys.lists() });
      
      // Update selected module if it's the one being updated
      if (selectedModule?.id === updatedModule.id) {
        selectModule(updatedModule);
      }
      
      toast.success(`Módulo ${updatedModule.status === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao alterar status do módulo';
      toast.error(message);
    },
  });
};

// Hook for bulk operations
export const useBulkModuleOperations = () => {
  const queryClient = useQueryClient();
  const { clearSelection } = useModuleStore();

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => moduleApi.bulkDeleteModules(ids),
    onSuccess: (_, deletedIds) => {
      // Remove each deleted module from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: moduleKeys.detail(id) });
      });
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: moduleKeys.lists() });
      
      // Clear selection
      clearSelection();
      
      toast.success(`${deletedIds.length} módulo(s) excluído(s) com sucesso!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao excluir módulos';
      toast.error(message);
    },
  });

  const bulkToggleStatus = useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      moduleApi.bulkToggleStatus(ids, isActive),
    onSuccess: (_, { ids, isActive }) => {
      // Invalidate the list query to refetch updated data
      queryClient.invalidateQueries({ queryKey: moduleKeys.lists() });
      
      // Clear selection
      clearSelection();
      
      toast.success(`${ids.length} módulo(s) ${isActive ? 'ativado(s)' : 'desativado(s)'} com sucesso!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao alterar status dos módulos';
      toast.error(message);
    },
  });

  return {
    bulkDelete,
    bulkToggleStatus,
  };
};