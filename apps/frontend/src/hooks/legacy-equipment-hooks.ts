// Arquivo temporário para manter compatibilidade durante migração
// TODO: Remover após migração completa dos componentes

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import {
  SolarModule,
  Inverter,
  Manufacturer,
  SolarModuleInput,
  InverterInput,
  ManufacturerType,
  PaginatedModules,
  PaginatedInverters,
  PaginatedManufacturers
} from '@/types/legacy-equipment';

// ====== LEGACY MODULES ======
export const useSolarModules = (params?: any) => {
  return useQuery({
    queryKey: ['modules', params],
    queryFn: async () => {
      const response = await api.get('/equipment/modules', { params });
      const data = response.data.data;
      // Se for um objeto com propriedade modules, retorna isso
      if (data.modules) {
        return { ...data.modules, total: data.total } as PaginatedModules;
      }
      // Se for um array direto, retorna como está
      return data as PaginatedModules;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateSolarModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SolarModuleInput) => {
      const response = await api.post('/equipment/modules', data);
      return response.data.data as SolarModule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Módulo criado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao criar módulo';
      toast.error(message);
    },
  });
};

export const useUpdateSolarModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SolarModule & { id: string }) => {
      const { id: moduleId, ...updateData } = data;
      const response = await api.put(`/equipment/modules/${moduleId}`, updateData);
      return response.data.data as SolarModule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Módulo atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao atualizar módulo';
      toast.error(message);
    },
  });
};

export const useDeleteSolarModule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/equipment/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Módulo excluído com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao excluir módulo';
      toast.error(message);
    },
  });
};

// ====== LEGACY INVERTERS ======
export const useInverters = (params?: any) => {
  return useQuery({
    queryKey: ['inverters', params],
    queryFn: async () => {
      const response = await api.get('/equipment/inverters', { params });
      const data = response.data.data;
      // Se for um objeto com propriedade inverters, retorna isso
      if (data.inverters) {
        return { ...data.inverters, total: data.total } as PaginatedInverters;
      }
      // Se for um array direto, retorna como está
      return data as PaginatedInverters;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateInverter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InverterInput) => {
      const response = await api.post('/equipment/inverters', data);
      return response.data.data as Inverter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast.success('Inversor criado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao criar inversor';
      toast.error(message);
    },
  });
};

export const useUpdateInverter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Inverter & { id: string }) => {
      const { id: inverterId, ...updateData } = data;
      const response = await api.put(`/equipment/inverters/${inverterId}`, updateData);
      return response.data.data as Inverter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast.success('Inversor atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao atualizar inversor';
      toast.error(message);
    },
  });
};

export const useDeleteInverter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/equipment/inverters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast.success('Inversor excluído com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao excluir inversor';
      toast.error(message);
    },
  });
};

// ====== LEGACY MANUFACTURERS ======
export const useManufacturers = (params?: { type?: ManufacturerType }) => {
  return useQuery({
    queryKey: ['manufacturers', params],
    queryFn: async () => {
      const response = await api.get('/equipment/manufacturers', { params });
      const data = response.data.data;
      // Se for um objeto com propriedade manufacturers, retorna isso
      if (data.manufacturers) {
        return { ...data.manufacturers, total: data.total } as PaginatedManufacturers;
      }
      // Se for um array direto, retorna como está
      return data as PaginatedManufacturers;
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useManufacturersList = (params?: { type?: ManufacturerType }) => {
  return useManufacturers(params);
};

export const useCreateManufacturer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Manufacturer>) => {
      const response = await api.post('/equipment/manufacturers', data);
      return response.data.data as Manufacturer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Fabricante criado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao criar fabricante';
      toast.error(message);
    },
  });
};

export const useUpdateManufacturer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Manufacturer & { id: string }) => {
      const { id: manufacturerId, ...updateData } = data;
      const response = await api.put(`/equipment/manufacturers/${manufacturerId}`, updateData);
      return response.data.data as Manufacturer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Fabricante atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao atualizar fabricante';
      toast.error(message);
    },
  });
};

export const useDeleteManufacturer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/equipment/manufacturers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Fabricante excluído com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao excluir fabricante';
      toast.error(message);
    },
  });
};

// Tipos adicionais para compatibilidade
export interface ManufacturerInput {
  name: string;
  type: ManufacturerType;
  description?: string;
  website?: string;
  country?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  certifications?: string[];
}

export interface ManufacturerFilters {
  type?: ManufacturerType;
  search?: string;
  isActive?: boolean;
}

// Export types e enums para compatibilidade
export type {
  SolarModule,
  Inverter,
  Manufacturer,
  SolarModuleInput,
  InverterInput
};

export {
  ManufacturerType
};