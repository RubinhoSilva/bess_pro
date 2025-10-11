import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../lib/api';

// Types for configuration
export interface ConfigurationValidationRequest {
  modules: Array<{
    id: string;
    quantity: number;
    arrangement: {
      series: number;
      parallel: number;
    };
  }>;
  inverters: Array<{
    id: string;
    quantity: number;
    mpptConfiguration?: Array<{
      mpptNumber: number;
      stringsConnected: number;
    }>;
  }>;
  systemType: 'on-grid' | 'off-grid' | 'hybrid';
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface ConfigurationValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  performance: {
    expectedPower: number;
    efficiency: number;
    compatibility: number;
  };
}

export interface OptimalConfigurationRequest {
  loadProfile: {
    dailyConsumption: number; // kWh/dia
    peakPower: number; // kW
    essentialLoads: number; // kW
    backupDuration: number; // horas
  };
  location: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  constraints: {
    maxPower: number; // kWp
    maxBudget: number; // R$
    availableArea: number; // m²
    roofType?: 'flat' | 'tilted' | 'metal';
    tiltAngle?: number; // graus
    azimuth?: number; // graus
  };
  preferences: {
    priority: 'cost' | 'efficiency' | 'reliability' | 'environmental';
    systemType?: 'on-grid' | 'off-grid' | 'hybrid';
    brands?: string[];
    includeBattery?: boolean;
  };
}

export interface OptimalConfigurationResponse {
  recommendedConfiguration: {
    modules: Array<{
      id: string;
      model: string;
      manufacturer: string;
      quantity: number;
      totalPower: number;
      arrangement: {
        series: number;
        parallel: number;
      };
    }>;
    inverters: Array<{
      id: string;
      model: string;
      manufacturer: string;
      quantity: number;
      totalPower: number;
      mpptConfiguration: Array<{
        mpptNumber: number;
        stringsConnected: number;
        modulesPerString: number;
      }>;
    }>;
    battery?: {
      capacity: number; // kWh
      type: string;
      quantity: number;
    };
    performance: {
      annualGeneration: number; // kWh/ano
      monthlyGeneration: number[]; // kWh/mês
      efficiency: number; // %
      co2Savings: number; // ton/ano
    };
    financial: {
      totalCost: number; // R$
      costPerWp: number; // R$/Wp
      paybackTime: number; // anos
      annualSavings: number; // R$/ano
      roi: number; // %
    };
  };
  alternatives: Array<{
    configuration: any;
    pros: string[];
    cons: string[];
    costDifference: number;
  }>;
  analysis: {
    technicalFeasibility: 'high' | 'medium' | 'low';
    economicViability: 'high' | 'medium' | 'low';
    environmentalImpact: number; // 0-100
    reliability: number; // 0-100
  };
}

// Query keys
export const configurationQueryKeys = {
  all: ['configuration'] as const,
  validation: () => [...configurationQueryKeys.all, 'validation'] as const,
  optimization: () => [...configurationQueryKeys.all, 'optimization'] as const,
};

// Hook for validating configuration
export const useValidateConfiguration = () => {
  return useMutation({
    mutationFn: async (request: ConfigurationValidationRequest): Promise<ConfigurationValidationResponse> => {
      const response = await api.post('/configuration/validate', request);
      return response.data.data;
    },
    onError: (error: any) => {
      console.error('Error validating configuration:', error);
      throw error;
    },
  });
};

// Hook for calculating optimal configuration
export const useCalculateOptimalConfiguration = () => {
  return useMutation({
    mutationFn: async (request: OptimalConfigurationRequest): Promise<OptimalConfigurationResponse> => {
      const response = await api.post('/configuration/optimize', request);
      return response.data.data;
    },
    onError: (error: any) => {
      console.error('Error calculating optimal configuration:', error);
      throw error;
    },
  });
};

// Hook for getting system performance simulation
export const useSimulateSystemPerformance = () => {
  return useMutation({
    mutationFn: async (configuration: any): Promise<any> => {
      const response = await api.post('/configuration/simulate', configuration);
      return response.data.data;
    },
    onError: (error: any) => {
      console.error('Error simulating system performance:', error);
      throw error;
    },
  });
};

// Hook for getting financial analysis
export const useFinancialAnalysis = () => {
  return useMutation({
    mutationFn: async (params: {
      systemCost: number;
      systemSize: number;
      location: string;
      financingType?: 'cash' | 'financed' | 'lease';
      financingPeriod?: number; // anos
    }): Promise<any> => {
      const response = await api.post('/configuration/financial-analysis', params);
      return response.data.data;
    },
    onError: (error: any) => {
      console.error('Error calculating financial analysis:', error);
      throw error;
    },
  });
};