import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleApi } from '../../api/equipment';
import { ModuleFilters } from '@bess-pro/shared';

// Query keys
export const moduleQueryKeys = {
  all: ['modules'] as const,
  lists: () => [...moduleQueryKeys.all, 'list'] as const,
  list: (filters?: ModuleFilters) => [...moduleQueryKeys.lists(), filters] as const,
  details: () => [...moduleQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...moduleQueryKeys.details(), id] as const,
};

// Hook for fetching modules list
export const useModulesList = (filters?: ModuleFilters) => {
  return useQuery({
    queryKey: moduleQueryKeys.list(filters),
    queryFn: () => moduleApi.getModules({ 
      filters: { 
        searchTerm: filters?.searchTerm || '',
        manufacturer: filters?.manufacturer,
        model: filters?.model,
        minPower: filters?.minPower,
        maxPower: filters?.maxPower,
        minEfficiency: filters?.minEfficiency,
        cellType: filters?.cellType,
        technology: filters?.technology,
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        manufacturerId: filters?.manufacturerId,
        status: filters?.status
      }, 
      pagination: { page: 1, limit: 100 } 
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook for fetching a single module
export const useModule = (id: string) => {
  return useQuery({
    queryKey: moduleQueryKeys.detail(id),
    queryFn: () => moduleApi.getModuleById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for creating a module
export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moduleApi.createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error creating module:', error);
      throw error;
    },
  });
};

// Hook for updating a module
export const useUpdateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      moduleApi.updateModule(id, data),
    onSuccess: (updatedModule) => {
      queryClient.setQueryData(moduleQueryKeys.detail(updatedModule.id), updatedModule);
      queryClient.invalidateQueries({ queryKey: moduleQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error updating module:', error);
      throw error;
    },
  });
};

// Hook for deleting a module
export const useDeleteModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moduleApi.deleteModule,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: moduleQueryKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: moduleQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error deleting module:', error);
      throw error;
    },
  });
};

// Hook for toggling module status
export const useToggleModuleStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      moduleApi.toggleModuleStatus(id, isActive),
    onSuccess: (updatedModule) => {
      queryClient.setQueryData(moduleQueryKeys.detail(updatedModule.id), updatedModule);
      queryClient.invalidateQueries({ queryKey: moduleQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error toggling module status:', error);
      throw error;
    },
  });
};