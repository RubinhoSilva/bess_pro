import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inverterService } from '../../services';
import { InverterFilters } from '@bess-pro/shared';

// Query keys
export const inverterQueryKeys = {
  all: ['inverters'] as const,
  lists: () => [...inverterQueryKeys.all, 'list'] as const,
  list: (filters?: InverterFilters) => [...inverterQueryKeys.lists(), filters] as const,
  details: () => [...inverterQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inverterQueryKeys.details(), id] as const,
};

// Hook for fetching inverters list
export const useInvertersList = (filters?: InverterFilters) => {
  return useQuery({
    queryKey: inverterQueryKeys.list(filters),
    queryFn: () => inverterService.getInverters(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes - longer cache without service cache
    gcTime: 30 * 60 * 1000, // 30 minutes - longer garbage collection
  });
};

// Hook for fetching a single inverter
export const useInverter = (id: string) => {
  return useQuery({
    queryKey: inverterQueryKeys.detail(id),
    queryFn: () => inverterService.getInverterById(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes - longer cache for individual items
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook for creating an inverter
export const useCreateInverter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inverterService.createInverter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inverterQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error creating inverter:', error);
      throw error;
    },
  });
};

// Hook for updating an inverter
export const useUpdateInverter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      inverterService.updateInverter(id, data),
    onSuccess: (updatedInverter) => {
      queryClient.setQueryData(inverterQueryKeys.detail(updatedInverter.id), updatedInverter);
      queryClient.invalidateQueries({ queryKey: inverterQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error updating inverter:', error);
      throw error;
    },
  });
};

// Hook for deleting an inverter
export const useDeleteInverter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inverterService.deleteInverter,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: inverterQueryKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: inverterQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error deleting inverter:', error);
      throw error;
    },
  });
};

// Hook for toggling inverter status
export const useToggleInverterStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      inverterService.toggleInverterStatus(id, isActive),
    onSuccess: (updatedInverter) => {
      queryClient.setQueryData(inverterQueryKeys.detail(updatedInverter.id), updatedInverter);
      queryClient.invalidateQueries({ queryKey: inverterQueryKeys.lists() });
    },
    onError: (error: any) => {
      console.error('Error toggling inverter status:', error);
      throw error;
    },
  });
};