import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { inverterApi } from '../../api/equipment';
import { CreateInverterRequest, UpdateInverterRequest } from '@bess-pro/shared';
import { useInverterStore, useInverterQueryParams } from '../../store/inverter-store';

// Query keys
export const inverterKeys = {
  all: ['inverters'] as const,
  lists: () => [...inverterKeys.all, 'list'] as const,
  list: (params: any) => [...inverterKeys.lists(), params] as const,
  details: () => [...inverterKeys.all, 'detail'] as const,
  detail: (id: string) => [...inverterKeys.details(), id] as const,
};

// Hook for fetching inverters with filters
export const useInverters = () => {
  const queryParams = useInverterQueryParams();

  return useQuery({
    queryKey: inverterKeys.list(queryParams),
    queryFn: () => inverterApi.getInverters(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching a single inverter
export const useInverter = (id: string) => {
  return useQuery({
    queryKey: inverterKeys.detail(id),
    queryFn: () => inverterApi.getInverterById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for creating an inverter
export const useCreateInverter = () => {
  const queryClient = useQueryClient();
  const { selectInverter } = useInverterStore();

  return useMutation({
    mutationFn: (data: CreateInverterRequest) => inverterApi.createInverter(data),
    onSuccess: (newInverter) => {
      // Invalidate the list query to refetch
      queryClient.invalidateQueries({ queryKey: inverterKeys.lists() });
      
      // Set the newly created inverter as selected
      selectInverter(newInverter);
      
      toast.success('Inversor criado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao criar inversor';
      toast.error(message);
    },
  });
};

// Hook for updating an inverter
export const useUpdateInverter = () => {
  const queryClient = useQueryClient();
  const { selectedInverter, selectInverter } = useInverterStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInverterRequest }) =>
      inverterApi.updateInverter(id, data),
    onSuccess: (updatedInverter) => {
      // Update the cache for the specific inverter
      queryClient.setQueryData(
        inverterKeys.detail(updatedInverter.id),
        updatedInverter
      );
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: inverterKeys.lists() });
      
      // Update selected inverter if it's the one being updated
      if (selectedInverter?.id === updatedInverter.id) {
        selectInverter(updatedInverter);
      }
      
      toast.success('Inversor atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao atualizar inversor';
      toast.error(message);
    },
  });
};

// Hook for deleting an inverter
export const useDeleteInverter = () => {
  const queryClient = useQueryClient();
  const { selectedInverter, selectInverter } = useInverterStore();

  return useMutation({
    mutationFn: (id: string) => inverterApi.deleteInverter(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: inverterKeys.detail(deletedId) });
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: inverterKeys.lists() });
      
      // Clear selected inverter if it's the one being deleted
      if (selectedInverter?.id === deletedId) {
        selectInverter(null);
      }
      
      toast.success('Inversor excluído com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao excluir inversor';
      toast.error(message);
    },
  });
};

// Hook for toggling inverter status
export const useToggleInverterStatus = () => {
  const queryClient = useQueryClient();
  const { selectedInverter, selectInverter } = useInverterStore();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      inverterApi.toggleInverterStatus(id, isActive),
    onSuccess: (updatedInverter) => {
      // Update the cache
      queryClient.setQueryData(
        inverterKeys.detail(updatedInverter.id),
        updatedInverter
      );
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: inverterKeys.lists() });
      
      // Update selected inverter if it's the one being updated
      if (selectedInverter?.id === updatedInverter.id) {
        selectInverter(updatedInverter);
      }
      
      toast.success(`Inversor ${updatedInverter.status === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao alterar status do inversor';
      toast.error(message);
    },
  });
};

// Hook for bulk operations
export const useBulkInverterOperations = () => {
  const queryClient = useQueryClient();
  const { clearSelection } = useInverterStore();

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => inverterApi.bulkDeleteInverters(ids),
    onSuccess: (_, deletedIds) => {
      // Remove each deleted inverter from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: inverterKeys.detail(id) });
      });
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: inverterKeys.lists() });
      
      // Clear selection
      clearSelection();
      
      toast.success(`${deletedIds.length} inversor(es) excluído(s) com sucesso!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao excluir inversores';
      toast.error(message);
    },
  });

  const bulkToggleStatus = useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      inverterApi.bulkToggleStatus(ids, isActive),
    onSuccess: (_, { ids, isActive }) => {
      // Invalidate the list query to refetch updated data
      queryClient.invalidateQueries({ queryKey: inverterKeys.lists() });
      
      // Clear selection
      clearSelection();
      
      toast.success(`${ids.length} inversor(es) ${isActive ? 'ativado(s)' : 'desativado(s)'} com sucesso!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao alterar status dos inversores';
      toast.error(message);
    },
  });

  return {
    bulkDelete,
    bulkToggleStatus,
  };
};