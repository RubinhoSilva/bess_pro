/**
 * Equipment Prefetch Hook
 * 
 * This hook provides prefetching capabilities for equipment data
 * to improve user experience by loading data before it's needed.
 */

import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useEquipmentPrefetch() {
  const queryClient = useQueryClient();

  const prefetchModules = (params?: any) => {
    queryClient.prefetchQuery({
      queryKey: ['modules', params],
      queryFn: async () => {
        const response = await api.get('/equipment/modules', { params });
        const data = response.data.data;
        if (data.modules) {
          return { ...data.modules, total: data.total };
        }
        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const prefetchInverters = (params?: any) => {
    queryClient.prefetchQuery({
      queryKey: ['inverters', params],
      queryFn: async () => {
        const response = await api.get('/equipment/inverters', { params });
        const data = response.data.data;
        if (data.inverters) {
          return { ...data.inverters, total: data.total };
        }
        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const prefetchManufacturers = (params?: any) => {
    queryClient.prefetchQuery({
      queryKey: ['manufacturers', params],
      queryFn: async () => {
        const response = await api.get('/equipment/manufacturers', { params });
        const data = response.data.data;
        if (data.manufacturers) {
          return { ...data.manufacturers, total: data.total };
        }
        return data;
      },
      staleTime: 10 * 60 * 1000, // 10 minutes (manufacturers change less frequently)
    });
  };

  const prefetchAllEquipment = (params?: { modules?: any; inverters?: any; manufacturers?: any }) => {
    prefetchModules(params?.modules);
    prefetchInverters(params?.inverters);
    prefetchManufacturers(params?.manufacturers);
  };

  const prefetchModuleById = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['module', id],
      queryFn: async () => {
        const response = await api.get(`/equipment/modules/${id}`);
        return response.data.data;
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  const prefetchInverterById = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['inverter', id],
      queryFn: async () => {
        const response = await api.get(`/equipment/inverters/${id}`);
        return response.data.data;
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  const prefetchManufacturerById = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['manufacturer', id],
      queryFn: async () => {
        const response = await api.get(`/equipment/manufacturers/${id}`);
        return response.data.data;
      },
      staleTime: 15 * 60 * 1000, // 15 minutes for individual manufacturer
    });
  };

  // Prefetch on hover for better UX
  const prefetchOnHover = (type: 'modules' | 'inverters' | 'manufacturers', params?: any) => {
    switch (type) {
      case 'modules':
        prefetchModules(params);
        break;
      case 'inverters':
        prefetchInverters(params);
        break;
      case 'manufacturers':
        prefetchManufacturers(params);
        break;
    }
  };

  // Invalidate and refetch
  const invalidateEquipment = (type?: 'modules' | 'inverters' | 'manufacturers' | 'all') => {
    switch (type) {
      case 'modules':
        queryClient.invalidateQueries({ queryKey: ['modules'] });
        break;
      case 'inverters':
        queryClient.invalidateQueries({ queryKey: ['inverters'] });
        break;
      case 'manufacturers':
        queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
        break;
      case 'all':
      default:
        queryClient.invalidateQueries({ queryKey: ['modules'] });
        queryClient.invalidateQueries({ queryKey: ['inverters'] });
        queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
        break;
    }
  };

  // Cancel ongoing queries
  const cancelQueries = (type?: 'modules' | 'inverters' | 'manufacturers' | 'all') => {
    switch (type) {
      case 'modules':
        queryClient.cancelQueries({ queryKey: ['modules'] });
        break;
      case 'inverters':
        queryClient.cancelQueries({ queryKey: ['inverters'] });
        break;
      case 'manufacturers':
        queryClient.cancelQueries({ queryKey: ['manufacturers'] });
        break;
      case 'all':
      default:
        queryClient.cancelQueries({ queryKey: ['modules'] });
        queryClient.cancelQueries({ queryKey: ['inverters'] });
        queryClient.cancelQueries({ queryKey: ['manufacturers'] });
        break;
    }
  };

  return {
    // Prefetch methods
    prefetchModules,
    prefetchInverters,
    prefetchManufacturers,
    prefetchAllEquipment,
    prefetchModuleById,
    prefetchInverterById,
    prefetchManufacturerById,
    prefetchOnHover,

    // Cache management
    invalidateEquipment,
    cancelQueries,

    // Query client access for advanced usage
    queryClient,
  };
};

export default useEquipmentPrefetch;