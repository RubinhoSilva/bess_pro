import { useState, useCallback } from 'react';
import { getGoogleSolarAPI, type Location, type SolarPotentialResponse } from '@/services/GoogleSolarAPI';
import { getPVGISAPI, type PVGISResponse } from '@/services/PVGISAPI';
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
  fonte: 'google' | 'pvgis' | 'combined';
  dadosOriginais?: {
    google?: SolarPotentialResponse;
    pvgis?: PVGISResponse;
  };
}

interface UseSolarAPIsReturn {
  isLoading: boolean;
  error: string | null;
  analyzeWithGoogle: (location: Location, options?: {
    apiKey: string;
    systemSizeKw?: number;
  }) => Promise<SolarAnalysisResult | null>;
  analyzeWithPVGIS: (location: Location, options?: {
    systemSizeKw?: number;
    tilt?: number;
    azimuth?: number;
  }) => Promise<SolarAnalysisResult | null>;
  analyzeCombined: (location: Location, options?: {
    googleApiKey?: string;
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

  const analyzeWithGoogle = useCallback(async (
    location: Location,
    options: { apiKey: string; systemSizeKw?: number } = { apiKey: '' }
  ): Promise<SolarAnalysisResult | null> => {
    if (!options.apiKey) {
      setError('Google API key é necessária');
      toast({
        variant: "destructive",
        title: "API Key necessária",
        description: "Forneça uma API key do Google Solar válida."
      });
      return null;
    }

    setIsLoading(true);
    clearError();

    try {
      const googleAPI = getGoogleSolarAPI(options.apiKey);
      const systemSizeKw = options.systemSizeKw || 10;

      const [buildingInsights, solarPotential] = await Promise.all([
        googleAPI.getBuildingInsights({ location, requiredQuality: 'HIGH' }),
        googleAPI.getSolarPotential({
          location,
          radiusMeters: 50,
          panelCapacityWatts: 550
        })
      ]);

      const systemFormat = googleAPI.convertToSystemFormat(solarPotential, location);
      const productionEstimates = googleAPI.calculateProductionEstimates(solarPotential, systemSizeKw);

      // Estimar qualidade baseada nas horas de sol
      let qualidade: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
      if (productionEstimates.sunshineHoursPerYear >= 2500) qualidade = 'excellent';
      else if (productionEstimates.sunshineHoursPerYear >= 2000) qualidade = 'good';
      else if (productionEstimates.sunshineHoursPerYear >= 1500) qualidade = 'fair';

      const result: SolarAnalysisResult = {
        location,
        irradiacaoMensal: systemFormat.irradiacaoMensal,
        irradiacaoAnual: systemFormat.irradiacaoMensal.reduce((sum, month) => sum + (month * 30), 0),
        orientacaoOtima: systemFormat.orientacao,
        producaoEstimada: {
          mensal: productionEstimates.monthlyProductionKwh,
          anual: productionEstimates.annualProductionKwh
        },
        perdas: {
          sombreamento: 5, // Estimativa baseada no Google Solar
          total: 15
        },
        qualidade,
        fonte: 'google',
        dadosOriginais: {
          google: solarPotential
        }
      };

      toast({
        title: "Análise Google Solar concluída!",
        description: `Potencial: ${qualidade === 'excellent' ? 'Excelente' : qualidade === 'good' ? 'Bom' : qualidade === 'fair' ? 'Regular' : 'Ruim'}`
      });

      return result;

    } catch (err: any) {
      const errorMessage = `Erro Google Solar: ${err.message}`;
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

  const analyzeCombined = useCallback(async (
    location: Location,
    options: {
      googleApiKey?: string;
      systemSizeKw?: number;
      tilt?: number;
      azimuth?: number;
    } = {}
  ): Promise<SolarAnalysisResult | null> => {
    setIsLoading(true);
    clearError();

    try {
      const systemSizeKw = options.systemSizeKw || 10;
      const tilt = options.tilt || 30;
      const azimuth = options.azimuth || 180;

      // Sempre obter dados PVGIS (gratuito)
      const pvgisResult = await analyzeWithPVGIS(location, {
        systemSizeKw,
        tilt,
        azimuth
      });

      if (!pvgisResult) {
        throw new Error('Não foi possível obter dados PVGIS');
      }

      let combinedResult = pvgisResult;

      // Se houver API key do Google, combinar os dados
      if (options.googleApiKey) {
        try {
          const googleResult = await analyzeWithGoogle(location, {
            apiKey: options.googleApiKey,
            systemSizeKw
          });

          if (googleResult) {
            // Combinar os melhores dados de ambas as fontes
            combinedResult = {
              location,
              irradiacaoMensal: googleResult.irradiacaoMensal, // Google tem dados mais precisos de irradiação
              irradiacaoAnual: googleResult.irradiacaoAnual,
              orientacaoOtima: googleResult.orientacaoOtima.inclinacao > 0 
                ? googleResult.orientacaoOtima 
                : pvgisResult.orientacaoOtima, // Usar Google se disponível
              producaoEstimada: {
                mensal: googleResult.producaoEstimada.mensal,
                anual: googleResult.producaoEstimada.anual
              },
              perdas: {
                ...pvgisResult.perdas, // PVGIS tem dados mais detalhados de perdas
                sombreamento: googleResult.perdas.sombreamento || pvgisResult.perdas.sombreamento
              },
              qualidade: googleResult.qualidade, // Google tem melhor análise de qualidade
              fonte: 'combined',
              dadosOriginais: {
                google: googleResult.dadosOriginais?.google,
                pvgis: pvgisResult.dadosOriginais?.pvgis
              }
            };
          }
        } catch (googleError) {
          console.warn('Google Solar não disponível, usando apenas PVGIS:', googleError);
          toast({
            title: "Usando apenas PVGIS",
            description: "Google Solar não disponível, análise realizada com PVGIS."
          });
        }
      }

      combinedResult.fonte = options.googleApiKey && combinedResult.dadosOriginais?.google 
        ? 'combined' 
        : 'pvgis';

      toast({
        title: "Análise combinada concluída!",
        description: `Fonte: ${combinedResult.fonte === 'combined' ? 'Google + PVGIS' : 'PVGIS'}`
      });

      return combinedResult;

    } catch (err: any) {
      const errorMessage = `Erro na análise combinada: ${err.message}`;
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
  }, [analyzeWithGoogle, analyzeWithPVGIS, toast]);

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
    analyzeWithGoogle,
    analyzeWithPVGIS,
    analyzeCombined,
    getOptimalOrientation
  };
};