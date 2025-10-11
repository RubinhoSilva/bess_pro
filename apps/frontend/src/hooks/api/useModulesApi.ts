import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleService } from '../../services';
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
    queryFn: () => moduleService.getModules(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes - longer cache without service cache
    gcTime: 30 * 60 * 1000, // 30 minutes - longer garbage collection
  });
};

// Hook for fetching a single module
export const useModule = (id: string) => {
  return useQuery({
    queryKey: moduleQueryKeys.detail(id),
    queryFn: () => moduleService.getModuleById(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes - longer cache for individual items
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook for creating a module
export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moduleService.createModule,
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
      moduleService.updateModule(id, data),
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
    mutationFn: moduleService.deleteModule,
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
      moduleService.toggleModuleStatus(id, isActive),
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