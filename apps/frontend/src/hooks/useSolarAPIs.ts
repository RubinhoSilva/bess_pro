import { useState, useCallback } from 'react';
import { getPVGISAPI, type PVGISResponse, type Location } from '@/services/PVGISAPI';
import { useToast } from '@/components/ui/use-toast';

export interface SolarAnalysisResult {
  location: Location;
  irradiacaoMensal: number[];
  irradiacaoAnual: number;
  orientacaoOtima: {
    azimute: number;
    inclinacao: number;
  };
  producaoEstimada: {
    mensal: number[];
    anual: number;
  };
  perdas: {
    angular?: number;
    temperatura?: number;
    sombreamento?: number;
    total: number;
  };
  qualidade: 'excellent' | 'good' | 'fair' | 'poor';
  fonte: 'pvgis';
  dadosOriginais?: {
    pvgis?: PVGISResponse;
  };
}

interface UseSolarAPIsReturn {
  isLoading: boolean;
  error: string | null;
  analyzeWithPVGIS: (location: Location, options?: {
    systemSizeKw?: number;
    tilt?: number;
    azimuth?: number;
  }) => Promise<SolarAnalysisResult | null>;
  getOptimalOrientation: (location: Location) => Promise<{
    azimute: number;
    inclinacao: number;
    producaoAnual: number;
  } | null>;
}

export const useSolarAPIs = (): UseSolarAPIsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const clearError = () => setError(null);

  const analyzeWithPVGIS = useCallback(async (
    location: Location,
    options: { systemSizeKw?: number; tilt?: number; azimuth?: number } = {}
  ): Promise<SolarAnalysisResult | null> => {
    setIsLoading(true);
    clearError();

    try {
      const pvgisAPI = getPVGISAPI();
      const systemSizeKw = options.systemSizeKw || 10;
      const tilt = options.tilt || 30;
      const azimuth = options.azimuth || 180;

      const [pvEstimation, optimalInclination] = await Promise.all([
        pvgisAPI.getPVEstimation({
          location,
          peakpower: systemSizeKw,
          angle: tilt,
          aspect: azimuth
        }),
        pvgisAPI.getOptimalInclination(location)
      ]);

      const systemFormat = pvgisAPI.convertToSystemFormat(pvEstimation);

      // Determinar qualidade baseada na irradiação anual
      let qualidade: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
      const avgIrradiation = systemFormat.irradiacaoMensal.reduce((a, b) => a + b, 0) / 12;
      if (avgIrradiation >= 6) qualidade = 'excellent';
      else if (avgIrradiation >= 5) qualidade = 'good';
      else if (avgIrradiation >= 4) qualidade = 'fair';

      const result: SolarAnalysisResult = {
        location,
        irradiacaoMensal: systemFormat.irradiacaoMensal,
        irradiacaoAnual: systemFormat.irradiacaoAnual,
        orientacaoOtima: {
          azimute: 180,
          inclinacao: optimalInclination.optimalInclination
        },
        producaoEstimada: {
          mensal: systemFormat.producaoEstimada.mensal,
          anual: systemFormat.producaoEstimada.anual
        },
        perdas: systemFormat.perdas,
        qualidade,
        fonte: 'pvgis',
        dadosOriginais: {
          pvgis: pvEstimation
        }
      };

      toast({
        title: "Análise PVGIS concluída!",
        description: `Irradiação média: ${avgIrradiation.toFixed(1)} kWh/m²/dia`
      });

      return result;

    } catch (err: any) {
      const errorMessage = `Erro PVGIS: ${err.message}`;
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: errorMessage
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getOptimalOrientation = useCallback(async (location: Location) => {
    setIsLoading(true);
    clearError();

    try {
      const pvgisAPI = getPVGISAPI();
      const result = await pvgisAPI.getOptimalInclination(location);
      
      return {
        azimute: 180, // Sul é sempre ótimo no Brasil
        inclinacao: result.optimalInclination,
        producaoAnual: result.annualYield
      };
    } catch (err: any) {
      const errorMessage = `Erro ao obter orientação ótima: ${err.message}`;
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    analyzeWithPVGIS,
    getOptimalOrientation
  };
};