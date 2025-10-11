import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { manufacturerApi } from '../../api/equipment';
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
    queryFn: () => manufacturerApi.getManufacturers({ 
      filters: { 
        searchTerm: filters?.search || '',
        search: filters?.search,
        country: filters?.country,
        specialties: filters?.specialties,
        markets: filters?.markets,
        certifications: filters?.certifications,
        foundedYearRange: filters?.foundedYearRange,
        hasWebsite: filters?.hasWebsite,
        hasSupport: filters?.hasSupport,
        status: filters?.status
      }, 
      pagination: { page: 1, limit: 100 } 
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook for fetching a single manufacturer
export const useManufacturer = (id: string) => {
  return useQuery({
    queryKey: manufacturerQueryKeys.detail(id),
    queryFn: () => manufacturerApi.getManufacturerById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for creating a manufacturer
export const useCreateManufacturer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: manufacturerApi.createManufacturer,
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
      manufacturerApi.updateManufacturer(id, data),
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
    mutationFn: manufacturerApi.deleteManufacturer,
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
      manufacturerApi.toggleManufacturerStatus(id, isActive),
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