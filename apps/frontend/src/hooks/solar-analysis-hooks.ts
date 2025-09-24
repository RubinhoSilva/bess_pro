import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Types
export interface SolarAnalysisRequest {
  latitude: number;
  longitude: number;
  monthlyEnergyBill?: number;
  panelWattage?: number;
  systemEfficiency?: number;
  includeImageryData?: boolean;
}

export interface SolarPotentialData {
  location: {
    latitude: number;
    longitude: number;
    postalCode: string;
    administrativeArea: string;
  };
  solarPotential: {
    maxPanelsCount: number;
    maxAreaMeters2: number;
    maxSunshineHours: number;
    viabilityScore: number;
    roofComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedGeneration: number;
  };
  imageQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  dataDate: {
    year: number;
    month: number;
    day: number;
  };
}

export interface SolarAnalysisResult {
  buildingInsights: any;
  analysis: {
    viabilityScore: number;
    roofComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
    optimalTilt: number;
    optimalAzimuth: number;
    annualGeneration: number;
    savings: {
      annual: number;
      monthly: number;
      paybackYears: number;
    };
    recommendations: string[];
  };
  imageryUrls?: {
    rgb: string;
    dsm: string;
    mask: string;
    annualFlux: string;
  };
  metadata: {
    analysisDate: string;
    dataSource: string;
    imageQuality: 'HIGH' | 'MEDIUM' | 'LOW';
    cacheHit: boolean;
  };
}

export interface SolarRecommendations {
  viabilityScore: number;
  recommendations: string[];
  optimalConfiguration: {
    tilt: number;
    azimuth: number;
    panelCount: number;
  };
  financialProjection: {
    annualSavings: number;
    paybackPeriod: number;
    estimatedGeneration: number;
  };
  roofAnalysis: {
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    availableArea: number;
    sunshineHours: number;
  };
}

export interface BulkAnalysisLocation {
  id: string;
  latitude: number;
  longitude: number;
  monthlyBill?: number;
}

export interface BulkAnalysisResult {
  results: Array<{
    id: string;
    success: boolean;
    data?: {
      viabilityScore: number;
      roofComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
      estimatedGeneration: number;
      annualSavings: number;
      paybackYears: number;
    };
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Hook para análise completa de potencial solar
export const useSolarAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation<SolarAnalysisResult, Error, SolarAnalysisRequest>({
    mutationFn: async (request) => {
      const response = await api.post('/solar-analysis/analyze', request);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Cache the result for quick access
      const cacheKey = ['solar-potential', variables.latitude, variables.longitude];
      queryClient.setQueryData(cacheKey, {
        location: {
          latitude: variables.latitude,
          longitude: variables.longitude,
        },
        solarPotential: {
          maxPanelsCount: data.buildingInsights.solarPotential?.maxArrayPanelsCount || 0,
          maxAreaMeters2: data.buildingInsights.solarPotential?.maxArrayAreaMeters2 || 0,
          maxSunshineHours: data.buildingInsights.solarPotential?.maxSunshineHoursPerYear || 0,
          viabilityScore: data.analysis.viabilityScore,
          roofComplexity: data.analysis.roofComplexity,
          estimatedGeneration: data.analysis.annualGeneration,
        },
        imageQuality: data.metadata.imageQuality,
      });
    },
  });
};

// Hook para consulta rápida de potencial solar
export const useSolarPotential = (latitude?: number, longitude?: number) => {
  return useQuery<SolarPotentialData, Error>({
    queryKey: ['solar-potential', latitude, longitude],
    queryFn: async () => {
      if (!latitude || !longitude) {
        throw new Error('Latitude e longitude são obrigatórias');
      }
      
      const response = await api.get('/solar-analysis/potential', {
        params: { latitude, longitude }
      });
      return response.data.data;
    },
    enabled: Boolean(latitude && longitude),
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
};

// Hook para recomendações solares
export const useSolarRecommendations = (latitude?: number, longitude?: number) => {
  return useQuery<SolarRecommendations, Error>({
    queryKey: ['solar-recommendations', latitude, longitude],
    queryFn: async () => {
      if (!latitude || !longitude) {
        throw new Error('Latitude e longitude são obrigatórias');
      }
      
      const response = await api.get(`/solar-analysis/recommendations/${latitude}/${longitude}`);
      return response.data.data;
    },
    enabled: Boolean(latitude && longitude),
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
  });
};

// Hook para análise em lote
export const useBulkSolarAnalysis = () => {
  return useMutation<BulkAnalysisResult, Error, { locations: BulkAnalysisLocation[] }>({
    mutationFn: async ({ locations }) => {
      const response = await api.post('/solar-analysis/bulk-analyze', { locations });
      return response.data.data;
    },
  });
};

// Hook para obter potencial solar de uma localização com cache
export const useLocationSolarData = (latitude?: number, longitude?: number) => {
  const solarPotentialQuery = useSolarPotential(latitude, longitude);
  const solarRecommendationsQuery = useSolarRecommendations(latitude, longitude);

  return {
    // Data
    potential: solarPotentialQuery.data,
    recommendations: solarRecommendationsQuery.data,
    
    // Status
    isLoading: solarPotentialQuery.isLoading || solarRecommendationsQuery.isLoading,
    isError: solarPotentialQuery.isError || solarRecommendationsQuery.isError,
    error: solarPotentialQuery.error || solarRecommendationsQuery.error,
    
    // Individual query status
    potentialStatus: {
      isLoading: solarPotentialQuery.isLoading,
      isError: solarPotentialQuery.isError,
      error: solarPotentialQuery.error,
    },
    recommendationsStatus: {
      isLoading: solarRecommendationsQuery.isLoading,
      isError: solarRecommendationsQuery.isError,
      error: solarRecommendationsQuery.error,
    },
    
    // Refetch functions
    refetchPotential: solarPotentialQuery.refetch,
    refetchRecommendations: solarRecommendationsQuery.refetch,
  };
};

// Utility hook para detectar coordenadas de projeto e buscar dados solares
export const useProjectSolarData = (project?: { latitude?: number; longitude?: number }) => {
  const latitude = project?.latitude;
  const longitude = project?.longitude;
  
  return useLocationSolarData(latitude, longitude);
};

// Hook para validar coordenadas antes de fazer consultas
export const useValidatedSolarData = (latitude?: number, longitude?: number) => {
  const isValidCoordinate = (lat?: number, lng?: number): boolean => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    );
  };

  const isValid = isValidCoordinate(latitude, longitude);
  
  const locationData = useLocationSolarData(
    isValid ? latitude : undefined, 
    isValid ? longitude : undefined
  );

  return {
    ...locationData,
    isValidLocation: isValid,
    validationError: !isValid && (latitude !== undefined || longitude !== undefined) 
      ? 'Coordenadas inválidas fornecidas' 
      : null,
  };
};

// Hook para análises comparativas entre múltiplas localizações
export const useComparativeSolarAnalysis = () => {
  const bulkAnalysis = useBulkSolarAnalysis();
  const queryClient = useQueryClient();

  const compareLocations = async (locations: BulkAnalysisLocation[]) => {
    const result = await bulkAnalysis.mutateAsync({ locations });
    
    // Cache individual results
    result.results.forEach((locationResult, index) => {
      if (locationResult.success && locationResult.data) {
        const location = locations[index];
        const cacheKey = ['solar-potential', location.latitude, location.longitude];
        
        queryClient.setQueryData(cacheKey, {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          solarPotential: {
            viabilityScore: locationResult.data.viabilityScore,
            roofComplexity: locationResult.data.roofComplexity,
            estimatedGeneration: locationResult.data.estimatedGeneration,
          },
        });
      }
    });
    
    return result;
  };

  return {
    compareLocations,
    isLoading: bulkAnalysis.isPending,
    isError: bulkAnalysis.isError,
    error: bulkAnalysis.error,
  };
};