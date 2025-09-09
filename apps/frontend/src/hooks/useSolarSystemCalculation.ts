import { useState, useCallback } from 'react';
import { SolarSystemService, SolarSystemCalculationParams, SolarSystemCalculationResult, AdvancedModuleCalculationResult } from '@/lib/solarSystemService';
import toast from 'react-hot-toast';

interface UseSolarSystemCalculationReturn {
  isLoading: boolean;
  result: SolarSystemCalculationResult | null;
  advancedResult: AdvancedModuleCalculationResult | null;
  irradiationData: any | null;
  error: string | null;
  calculateSystem: (params: SolarSystemCalculationParams) => Promise<void>;
  calculateFromDimensioning: (dimensioningData: any) => Promise<void>;
  calculateAdvancedFromDimensioning: (dimensioningData: any) => Promise<void>;
  fetchIrradiationData: (params: { lat: number; lon: number; tilt?: number; azimuth?: number }) => Promise<void>;
  clearResult: () => void;
}

export const useSolarSystemCalculation = (): UseSolarSystemCalculationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SolarSystemCalculationResult | null>(null);
  const [advancedResult, setAdvancedResult] = useState<AdvancedModuleCalculationResult | null>(null);
  const [irradiationData, setIrradiationData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateSystem = useCallback(async (params: SolarSystemCalculationParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const calculation = await SolarSystemService.calculateSystem(params);
      setResult(calculation);
      
      if (calculation.message) {
        toast.success(calculation.message);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro no cálculo do sistema solar';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateFromDimensioning = useCallback(async (dimensioningData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const calculation = await SolarSystemService.calculateFromDimensioning(dimensioningData);
      setResult(calculation);
      
      if (calculation.message) {
        toast.success(calculation.message);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro no cálculo do sistema solar';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateAdvancedFromDimensioning = useCallback(async (dimensioningData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const calculation = await SolarSystemService.calculateAdvancedFromDimensioning(dimensioningData);
      setAdvancedResult(calculation);
      
      toast.success('Cálculo avançado realizado com sucesso');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro no cálculo avançado do sistema solar';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchIrradiationData = useCallback(async (params: { lat: number; lon: number; tilt?: number; azimuth?: number }) => {
    try {
      setError(null);
      const data = await SolarSystemService.getEnhancedAnalysisData(params);
      setIrradiationData(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar dados de irradiação';
      setError(errorMessage);
      console.error('Erro ao buscar dados de irradiação:', err);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setAdvancedResult(null);
    setIrradiationData(null);
    setError(null);
  }, []);

  return {
    isLoading,
    result,
    advancedResult,
    irradiationData,
    error,
    calculateSystem,
    calculateFromDimensioning,
    calculateAdvancedFromDimensioning,
    fetchIrradiationData,
    clearResult
  };
};

export default useSolarSystemCalculation;