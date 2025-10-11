import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { manufacturerApi } from '../../api/equipment';
import { CreateManufacturerRequest, UpdateManufacturerRequest } from '@bess-pro/shared';
import { useManufacturerStore, useManufacturerQueryParams } from '../../store/manufacturer-store';

// Query keys
export const manufacturerKeys = {
  all: ['manufacturers'] as const,
  lists: () => [...manufacturerKeys.all, 'list'] as const,
  list: (params: any) => [...manufacturerKeys.lists(), params] as const,
  details: () => [...manufacturerKeys.all, 'detail'] as const,
  detail: (id: string) => [...manufacturerKeys.details(), id] as const,
};

// Hook for fetching manufacturers with filters
export const useManufacturers = () => {
  const queryParams = useManufacturerQueryParams();

  return useQuery({
    queryKey: manufacturerKeys.list(queryParams),
    queryFn: () => manufacturerApi.getManufacturers(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching a single manufacturer
export const useManufacturer = (id: string) => {
  return useQuery({
    queryKey: manufacturerKeys.detail(id),
    queryFn: () => manufacturerApi.getManufacturerById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for creating a manufacturer
export const useCreateManufacturer = () => {
  const queryClient = useQueryClient();
  const { selectManufacturer } = useManufacturerStore();

  return useMutation({
    mutationFn: (data: CreateManufacturerRequest) => manufacturerApi.createManufacturer(data),
    onSuccess: (newManufacturer) => {
      // Invalidate the list query to refetch
      queryClient.invalidateQueries({ queryKey: manufacturerKeys.lists() });
      
      // Set the newly created manufacturer as selected
      selectManufacturer(newManufacturer);
      
      toast.success('Fabricante criado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao criar fabricante';
      toast.error(message);
    },
  });
};

// Hook for updating a manufacturer
export const useUpdateManufacturer = () => {
  const queryClient = useQueryClient();
  const { selectedManufacturer, selectManufacturer } = useManufacturerStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateManufacturerRequest }) =>
      manufacturerApi.updateManufacturer(id, data),
    onSuccess: (updatedManufacturer) => {
      // Update the cache for the specific manufacturer
      queryClient.setQueryData(
        manufacturerKeys.detail(updatedManufacturer.id),
        updatedManufacturer
      );
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: manufacturerKeys.lists() });
      
      // Update selected manufacturer if it's the one being updated
      if (selectedManufacturer?.id === updatedManufacturer.id) {
        selectManufacturer(updatedManufacturer);
      }
      
      toast.success('Fabricante atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao atualizar fabricante';
      toast.error(message);
    },
  });
};

// Hook for deleting a manufacturer
export const useDeleteManufacturer = () => {
  const queryClient = useQueryClient();
  const { selectedManufacturer, selectManufacturer } = useManufacturerStore();

  return useMutation({
    mutationFn: (id: string) => manufacturerApi.deleteManufacturer(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: manufacturerKeys.detail(deletedId) });
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: manufacturerKeys.lists() });
      
      // Clear selected manufacturer if it's the one being deleted
      if (selectedManufacturer?.id === deletedId) {
        selectManufacturer(null);
      }
      
      toast.success('Fabricante excluído com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao excluir fabricante';
      toast.error(message);
    },
  });
};

// Hook for toggling manufacturer status
export const useToggleManufacturerStatus = () => {
  const queryClient = useQueryClient();
  const { selectedManufacturer, selectManufacturer } = useManufacturerStore();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      manufacturerApi.toggleManufacturerStatus(id, isActive),
    onSuccess: (updatedManufacturer) => {
      // Update the cache
      queryClient.setQueryData(
        manufacturerKeys.detail(updatedManufacturer.id),
        updatedManufacturer
      );
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: manufacturerKeys.lists() });
      
      // Update selected manufacturer if it's the one being updated
      if (selectedManufacturer?.id === updatedManufacturer.id) {
        selectManufacturer(updatedManufacturer);
      }
      
      toast.success(`Fabricante ${updatedManufacturer.status === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao alterar status do fabricante';
      toast.error(message);
    },
  });
};

// Hook for bulk operations
export const useBulkManufacturerOperations = () => {
  const queryClient = useQueryClient();
  const { clearSelection } = useManufacturerStore();

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => manufacturerApi.bulkDeleteManufacturers(ids),
    onSuccess: (_, deletedIds) => {
      // Remove each deleted manufacturer from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: manufacturerKeys.detail(id) });
      });
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: manufacturerKeys.lists() });
      
      // Clear selection
      clearSelection();
      
      toast.success(`${deletedIds.length} fabricante(s) excluído(s) com sucesso!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao excluir fabricantes';
      toast.error(message);
    },
  });

  const bulkToggleStatus = useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      manufacturerApi.bulkToggleStatus(ids, isActive),
    onSuccess: (_, { ids, isActive }) => {
      // Invalidate the list query to refetch updated data
      queryClient.invalidateQueries({ queryKey: manufacturerKeys.lists() });
      
      // Clear selection
      clearSelection();
      
      toast.success(`${ids.length} fabricante(s) ${isActive ? 'ativado(s)' : 'desativado(s)'} com sucesso!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Erro ao alterar status dos fabricantes';
      toast.error(message);
    },
  });

  return {
    bulkDelete,
    bulkToggleStatus,
  };
};