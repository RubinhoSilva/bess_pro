import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { manufacturerService } from '../../services';
import { ManufacturerFilters } from '@bess-pro/shared';

// Query keys
export const manufacturerQueryKeys = {
  all: ['manufacturers'] as const,
  lists: () => [...manufacturerQueryKeys.all, 'list'] as const,
  list: (filters?: ManufacturerFilters) => [...manufacturerQueryKeys.lists(), filters] as const,
  details: () => [...manufacturerQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...manufacturerQueryKeys.details(), id] as const,
};

// Hook for fetching manufacturers list
export const useManufacturersList = (filters?: ManufacturerFilters) => {
  return useQuery({
    queryKey: manufacturerQueryKeys.list(filters),
    queryFn: () => manufacturerService.getManufacturers(filters),
    staleTime: 15 * 60 * 1000, // 15 minutes - longer cache without service cache
    gcTime: 45 * 60 * 1000, // 45 minutes - longer garbage collection (manufacturers change less)
  });
};

// Hook for fetching a single manufacturer
export const useManufacturer = (id: string) => {
  return useQuery({
    queryKey: manufacturerQueryKeys.detail(id),
    queryFn: () => manufacturerService.getManufacturerById(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes - much longer cache for individual manufacturers
    gcTime: 60 * 60 * 1000, // 60 minutes
  });
};

// Hook for creating a manufacturer
export const useCreateManufacturer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: manufacturerService.createManufacturer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manufacturerQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error creating manufacturer:', error);
      throw error;
    },
  });
};

// Hook for updating a manufacturer
export const useUpdateManufacturer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      manufacturerService.updateManufacturer(id, data),
    onSuccess: (updatedManufacturer) => {
      queryClient.setQueryData(manufacturerQueryKeys.detail(updatedManufacturer.id), updatedManufacturer);
      queryClient.invalidateQueries({ queryKey: manufacturerQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error updating manufacturer:', error);
      throw error;
    },
  });
};

// Hook for deleting a manufacturer
export const useDeleteManufacturer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: manufacturerService.deleteManufacturer,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: manufacturerQueryKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: manufacturerQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error deleting manufacturer:', error);
      throw error;
    },
  });
};

// Hook for toggling manufacturer status
export const useToggleManufacturerStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      manufacturerService.toggleManufacturerStatus(id, isActive),
    onSuccess: (updatedManufacturer) => {
      queryClient.setQueryData(manufacturerQueryKeys.detail(updatedManufacturer.id), updatedManufacturer);
      queryClient.invalidateQueries({ queryKey: manufacturerQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error toggling manufacturer status:', error);
      throw error;
    },
  });
};