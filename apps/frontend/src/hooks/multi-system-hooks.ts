import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Types
export enum SystemType {
  SOLAR_ONLY = 'solar_only',
  BESS_ONLY = 'bess_only',
  DIESEL_ONLY = 'diesel_only',
  SOLAR_BESS = 'solar_bess',
  SOLAR_DIESEL = 'solar_diesel',
  BESS_DIESEL = 'bess_diesel',
  SOLAR_BESS_DIESEL = 'solar_bess_diesel'
}

export interface LoadProfile {
  hourly_consumption: number[]; // 24 horas em kWh
  daily_consumption: number; // kWh/dia
  peak_power: number; // kW
  essential_loads: number; // kW - cargas essenciais
  backup_duration: number; // horas
}

export interface SolarSystemSpecs {
  capacity: number; // kWp
  panel_efficiency: number; // %
  inverter_efficiency: number; // %
  system_losses: number; // %
  tilt_angle: number; // graus
  azimuth: number; // graus
  cost_per_kwp: number; // R$/kWp
  irradiance_data: number[]; // kWh/m²/dia por mês
}

export interface MultiSystemCalculationRequest {
  loadProfile: LoadProfile;
  allowedSystems?: SystemType[];
  solarData?: SolarSystemSpecs;
  priorityFactors?: {
    cost: number;
    reliability: number;
    environment: number;
    maintenance: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
  };
  economicParameters?: {
    electricity_tariff: number; // R$/kWh
    demand_tariff: number; // R$/kW
    discount_rate: number; // %
    analysis_period: number; // anos
    inflation_rate: number; // %
  };
}

export interface MultiSystemConfiguration {
  system_type: SystemType;
  solar_specs?: SolarSystemSpecs;
  bess_config?: any;
  diesel_specs?: any;
  control_strategy: any;
  total_cost: number;
  annual_energy_production: number;
  annual_fuel_cost: number;
  annual_maintenance_cost: number;
  carbon_footprint: number;
  reliability_index: number;
}

export interface MultiSystemAnalysisResult {
  recommended_configuration: MultiSystemConfiguration;
  alternative_configurations: MultiSystemConfiguration[];
  comparative_analysis: {
    lcoe: number;
    reliability: number;
    autonomy_hours: number;
    payback_period: number;
    environmental_impact: number;
  };
  operational_scenarios: {
    normal_operation: any;
    grid_outage: any;
    peak_demand: any;
    maintenance_mode: any;
  };
}

export interface ConfigurationTemplate {
  id: string;
  name: string;
  category: string;
  system_type: string;
  load_range: string;
  description: string;
  typical_configuration: {
    solar_capacity?: string;
    battery_capacity?: string;
    diesel_power?: string;
    backup_hours: string;
    estimated_cost: string;
  };
  advantages: string[];
  applications: string[];
}

// API Response types
interface MultiSystemResponse {
  success: boolean;
  data: {
    analysis_result: MultiSystemAnalysisResult;
    detailed_comparison: any;
    recommendations: any;
  };
}

interface TemplatesResponse {
  success: boolean;
  data: {
    templates: ConfigurationTemplate[];
    total: number;
    categories: string[];
  };
}

interface SimulationResponse {
  success: boolean;
  data: {
    simulation_id: string;
    configuration: MultiSystemConfiguration;
    simulation_period: number;
    daily_results: any[];
    summary: {
      total_energy_generated: number;
      total_fuel_consumed: number;
      total_operational_cost: number;
      average_efficiency: number;
      grid_independence_achieved: number;
    };
  };
}

interface OptimizationResponse {
  success: boolean;
  data: {
    original_configuration: MultiSystemConfiguration;
    optimized_configuration: MultiSystemConfiguration;
    optimization_summary: {
      total_improvements: number;
      estimated_additional_savings: number;
      implementation_complexity: string;
      recommended_timeline: string;
    };
  };
}

// Hooks
export const useCalculateMultiSystem = () => {
  return useMutation({
    mutationFn: async (request: MultiSystemCalculationRequest): Promise<MultiSystemResponse['data']> => {
      const response = await api.post<MultiSystemResponse>('/multi-system/calculate', request);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erro ao calcular sistema multi-energético');
    },
  });
};

export const useSimulateMultiSystem = () => {
  return useMutation({
    mutationFn: async (params: {
      configuration: MultiSystemConfiguration;
      loadProfile: LoadProfile;
      simulationDays?: number;
    }): Promise<SimulationResponse['data']> => {
      const response = await api.post<SimulationResponse>('/multi-system/simulate', params);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erro ao simular operação do sistema');
    },
  });
};

export const useOptimizeConfiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      configuration: MultiSystemConfiguration;
      optimization_goals?: string[];
      constraints?: any;
    }): Promise<OptimizationResponse['data']> => {
      const response = await api.post<OptimizationResponse>('/multi-system/optimize', params);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erro ao otimizar configuração');
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['multi-system'] });
    },
  });
};

export const useConfigurationTemplates = (systemType?: string, loadRange?: string) => {
  return useQuery({
    queryKey: ['configuration-templates', systemType, loadRange],
    queryFn: async (): Promise<TemplatesResponse['data']> => {
      const params = new URLSearchParams();
      if (systemType) params.append('system_type', systemType);
      if (loadRange) params.append('load_range', loadRange);
      
      const response = await api.get<TemplatesResponse>(`/multi-system/templates?${params.toString()}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erro ao carregar templates de configuração');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Utility functions
export const getSystemTypeName = (systemType: SystemType): string => {
  const nameMap = {
    [SystemType.SOLAR_ONLY]: 'Sistema Solar Fotovoltaico',
    [SystemType.BESS_ONLY]: 'Sistema de Armazenamento (BESS)',
    [SystemType.DIESEL_ONLY]: 'Gerador Diesel',
    [SystemType.SOLAR_BESS]: 'Sistema Solar + Armazenamento',
    [SystemType.SOLAR_DIESEL]: 'Sistema Solar + Diesel',
    [SystemType.BESS_DIESEL]: 'Armazenamento + Diesel',
    [SystemType.SOLAR_BESS_DIESEL]: 'Sistema Híbrido Completo'
  };
  
  return nameMap[systemType] || 'Sistema Desconhecido';
};

export const getSystemTypeColor = (systemType: SystemType): string => {
  const colorMap = {
    [SystemType.SOLAR_ONLY]: 'bg-yellow-500',
    [SystemType.BESS_ONLY]: 'bg-blue-500',
    [SystemType.DIESEL_ONLY]: 'bg-gray-600',
    [SystemType.SOLAR_BESS]: 'bg-green-500',
    [SystemType.SOLAR_DIESEL]: 'bg-orange-500',
    [SystemType.BESS_DIESEL]: 'bg-purple-500',
    [SystemType.SOLAR_BESS_DIESEL]: 'bg-gradient-to-r from-yellow-500 to-blue-500'
  };
  
  return colorMap[systemType] || 'bg-gray-400';
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatEnergy = (value: number, unit: string = 'kWh'): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} M${unit}`;
  }
  return `${value.toFixed(1)} ${unit}`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Default configurations
export const getDefaultLoadProfile = (): LoadProfile => ({
  hourly_consumption: new Array(24).fill(0).map((_, hour) => {
    // Simular perfil residencial típico
    if (hour >= 6 && hour <= 8) return 8; // Manhã
    if (hour >= 11 && hour <= 14) return 12; // Almoço
    if (hour >= 18 && hour <= 22) return 15; // Noite
    return 5; // Base
  }),
  daily_consumption: 250, // kWh/dia
  peak_power: 20, // kW
  essential_loads: 8, // kW
  backup_duration: 12 // horas
});

export const getDefaultSolarSpecs = (): SolarSystemSpecs => ({
  capacity: 50, // kWp
  panel_efficiency: 22,
  inverter_efficiency: 97,
  system_losses: 15,
  tilt_angle: 23,
  azimuth: 0,
  cost_per_kwp: 3500,
  irradiance_data: [5.2, 5.4, 5.1, 4.8, 4.2, 3.8, 4.1, 4.6, 5.0, 5.3, 5.5, 5.4]
});

export const getDefaultPriorityFactors = () => ({
  cost: 0.4,
  reliability: 0.3,
  environment: 0.2,
  maintenance: 0.1
});

export const getDefaultEconomicParameters = () => ({
  electricity_tariff: 0.75, // R$/kWh
  demand_tariff: 25, // R$/kW
  discount_rate: 10, // %
  analysis_period: 20, // anos
  inflation_rate: 4 // %
});