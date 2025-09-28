import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Types
export interface SolarModule {
  id: string;
  manufacturerId: string;
  fabricante: string;
  modelo: string;
  potenciaNominal: number;
  larguraMm?: number;
  alturaMm?: number;
  espessuraMm?: number;
  vmpp?: number;
  impp?: number;
  voc?: number;
  isc?: number;
  tipoCelula?: string;
  eficiencia?: number;
  numeroCelulas?: number;
  tempCoefPmax?: number;
  tempCoefVoc?: number;
  tempCoefIsc?: number;
  pesoKg?: number;
  datasheetUrl?: string;
  certificacoes?: string[];
  garantiaAnos?: number;
  tolerancia?: string;
  areaM2?: number;
  densidadePotencia?: number;
  // Parâmetros para modelo espectral
  material?: string;     // Material da célula (c-Si, a-Si, CdTe, etc.)
  technology?: string;   // Tecnologia (mono-Si, mc-Si, a-Si, CdTe, etc.)
  
  // Parâmetros do modelo de diodo único (5 parâmetros fundamentais)
  aRef?: number;         // Fator de idealidade modificado [V]
  iLRef?: number;        // Fotocorrente STC [A]
  iORef?: number;        // Corrente saturação reversa STC [A]
  rS?: number;           // Resistência série [Ω]
  rShRef?: number;       // Resistência paralelo STC [Ω]
  
  // Coeficientes de temperatura críticos
  alphaSc?: number;      // Coef. temperatura corrente [A/°C]
  betaOc?: number;       // Coef. temperatura tensão [V/°C]
  gammaR?: number;       // Coef. temperatura potência [1/°C]
  
  // Parâmetros SAPM térmicos
  a0?: number; a1?: number; a2?: number; a3?: number; a4?: number;
  b0?: number; b1?: number; b2?: number; b3?: number; b4?: number; b5?: number;
  dtc?: number;          // Delta T para SAPM [°C]
  
  createdAt: string;
  updatedAt: string;
}

export enum ManufacturerType {
  SOLAR_MODULE = 'SOLAR_MODULE',
  INVERTER = 'INVERTER',
  BOTH = 'BOTH'
}

export interface Manufacturer {
  id: string;
  name: string;
  type: ManufacturerType;
  teamId?: string;
  isDefault: boolean;
  description?: string;
  website?: string;
  country?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  certifications?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Inverter {
  id: string;
  manufacturerId: string;
  fabricante: string;
  modelo: string;
  potenciaSaidaCA: number;
  tipoRede: string;
  potenciaFvMax?: number;
  tensaoCcMax?: number;
  numeroMppt?: number;
  stringsPorMppt?: number;
  faixaMppt?: string;
  correnteEntradaMax?: number;
  potenciaAparenteMax?: number;
  correnteSaidaMax?: number;
  tensaoSaidaNominal?: string;
  frequenciaNominal?: number;
  eficienciaMax?: number;
  eficienciaEuropeia?: number;
  eficienciaMppt?: number;
  protecoes?: string[];
  certificacoes?: string[];
  grauProtecao?: string;
  dimensoes?: {
    larguraMm: number;
    alturaMm: number;
    profundidadeMm: number;
  };
  pesoKg?: number;
  temperaturaOperacao?: string;
  garantiaAnos?: number;
  datasheetUrl?: string;
  precoReferencia?: number;
  maxModulosSuportados?: number;
  maxStringsTotal?: number;
  tipoFase?: 'monofásico' | 'bifásico' | 'trifásico' | 'unknown';
  // Parâmetros Sandia para simulação precisa
  vdco?: number;  // Tensão DC nominal de operação
  pso?: number;   // Potência de standby (W)
  c0?: number;    // Coeficiente curva eficiência
  c1?: number;    // Coeficiente curva eficiência  
  c2?: number;    // Coeficiente curva eficiência
  c3?: number;    // Coeficiente curva eficiência
  pnt?: number;   // Potência threshold normalizada
  createdAt: string;
  updatedAt: string;
}

export interface ManufacturerFilters {
  type?: ManufacturerType;
}

export interface SolarModuleFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  manufacturerId?: string;
  fabricante?: string;
  tipoCelula?: string;
  potenciaMin?: number;
  potenciaMax?: number;
}

export interface InverterFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  manufacturerId?: string;
  fabricante?: string;
  tipoRede?: string;
  potenciaMin?: number;
  potenciaMax?: number;
  moduleReferencePower?: number;
}

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

export interface SolarModuleInput {
  manufacturerId: string;
  fabricante: string;
  modelo: string;
  potenciaNominal: number;
  larguraMm?: number;
  alturaMm?: number;
  espessuraMm?: number;
  vmpp?: number;
  impp?: number;
  voc?: number;
  isc?: number;
  tipoCelula?: string;
  eficiencia?: number;
  numeroCelulas?: number;
  tempCoefPmax?: number;
  tempCoefVoc?: number;
  tempCoefIsc?: number;
  pesoKg?: number;
  datasheetUrl?: string;
  certificacoes?: string[];
  garantiaAnos?: number;
  tolerancia?: string;
}

export interface InverterInput {
  manufacturerId: string;
  fabricante: string;
  modelo: string;
  potenciaSaidaCA: number;
  tipoRede: string;
  potenciaFvMax?: number;
  tensaoCcMax?: number;
  numeroMppt?: number;
  stringsPorMppt?: number;
  faixaMppt?: string;
  correnteEntradaMax?: number;
  potenciaAparenteMax?: number;
  correnteSaidaMax?: number;
  tensaoSaidaNominal?: string;
  frequenciaNominal?: number;
  eficienciaMax?: number;
  eficienciaEuropeia?: number;
  eficienciaMppt?: number;
  protecoes?: string[];
  certificacoes?: string[];
  grauProtecao?: string;
  dimensoes?: {
    larguraMm: number;
    alturaMm: number;
    profundidadeMm: number;
  };
  pesoKg?: number;
  temperaturaOperacao?: string;
  garantiaAnos?: number;
  datasheetUrl?: string;
  precoReferencia?: number;
}

// API Functions
const manufacturerApi = {
  async getManufacturers(filters: ManufacturerFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/manufacturers?${params.toString()}`);
    return response.data.data; // API returns { success: true, data: [...] }
  },

  async getManufacturer(id: string) {
    const response = await api.get(`/manufacturers/${id}`);
    return response.data.data;
  },

  async createManufacturer(data: ManufacturerInput) {
    const response = await api.post('/manufacturers', data);
    return response.data.data;
  },

  async updateManufacturer(id: string, data: Partial<ManufacturerInput>) {
    const response = await api.put(`/manufacturers/${id}`, data);
    return response.data.data;
  },

  async deleteManufacturer(id: string) {
    await api.delete(`/manufacturers/${id}`);
  }
};

const solarModuleApi = {
  async getModules(filters: SolarModuleFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/solar-modules?${params.toString()}`);
    return response.data.data; // API returns { success: true, data: { modules: [...], total, page, etc } }
  },

  async createModule(data: SolarModuleInput) {
    const response = await api.post('/solar-modules', data);
    return response.data.data; // API returns { success: true, data: {...} }
  },

  async updateModule(id: string, data: Partial<SolarModuleInput>) {
    const response = await api.put(`/solar-modules/${id}`, data);
    return response.data.data; // API returns { success: true, data: {...} }
  },

  async deleteModule(id: string) {
    await api.delete(`/solar-modules/${id}`);
  }
};

const inverterApi = {
  async getInverters(filters: InverterFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/inverters?${params.toString()}`);
    return response.data.data; // API returns { success: true, data: { inverters: [...], total, page, etc } }
  },

  async createInverter(data: InverterInput) {
    const response = await api.post('/inverters', data);
    return response.data.data; // API returns { success: true, data: {...} }
  },

  async updateInverter(id: string, data: Partial<InverterInput>) {
    const response = await api.put(`/inverters/${id}`, data);
    return response.data.data; // API returns { success: true, data: {...} }
  },

  async deleteInverter(id: string) {
    await api.delete(`/inverters/${id}`);
  }
};

// Solar Module Hooks
export function useSolarModules(filters: SolarModuleFilters = {}) {
  return useQuery({
    queryKey: ['solar-modules', filters],
    queryFn: () => solarModuleApi.getModules(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSolarModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SolarModuleInput) => solarModuleApi.createModule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solar-modules'] });
      toast.success('Módulo solar criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar módulo: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useUpdateSolarModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<SolarModuleInput>) => 
      solarModuleApi.updateModule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solar-modules'] });
      toast.success('Módulo solar atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar módulo: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useDeleteSolarModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => solarModuleApi.deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solar-modules'] });
      toast.success('Módulo solar excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir módulo: ${error.response?.data?.message || error.message}`);
    }
  });
}

// Inverter Hooks
export function useInverters(filters: InverterFilters = {}) {
  return useQuery({
    queryKey: ['inverters', filters],
    queryFn: () => inverterApi.getInverters(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateInverter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InverterInput) => inverterApi.createInverter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast.success('Inversor criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar inversor: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useUpdateInverter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<InverterInput>) => 
      inverterApi.updateInverter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast.success('Inversor atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar inversor: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useDeleteInverter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inverterApi.deleteInverter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast.success('Inversor excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir inversor: ${error.response?.data?.message || error.message}`);
    }
  });
}

// Manufacturer Hooks
export function useManufacturers(filters: ManufacturerFilters = {}) {
  return useQuery({
    queryKey: ['manufacturers', filters],
    queryFn: () => manufacturerApi.getManufacturers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useManufacturer(id: string) {
  return useQuery({
    queryKey: ['manufacturers', id],
    queryFn: () => manufacturerApi.getManufacturer(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateManufacturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ManufacturerInput) => manufacturerApi.createManufacturer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Fabricante criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar fabricante: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useUpdateManufacturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<ManufacturerInput>) => 
      manufacturerApi.updateManufacturer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Fabricante atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar fabricante: ${error.response?.data?.message || error.message}`);
    }
  });
}

export function useDeleteManufacturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => manufacturerApi.deleteManufacturer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Fabricante excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir fabricante: ${error.response?.data?.message || error.message}`);
    }
  });
}