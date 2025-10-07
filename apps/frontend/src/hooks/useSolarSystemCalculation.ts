import { useState, useCallback } from 'react';
import { SolarSystemService, SolarSystemCalculationParams, SolarSystemCalculationResult, AdvancedModuleCalculationResult, CompleteSystemCalculationParams, CompleteSystemCalculationResult } from '@/lib/solarSystemService';
import toast from 'react-hot-toast';

interface UseSolarSystemCalculationReturn {
  isLoading: boolean;
  result: SolarSystemCalculationResult | null;
  advancedResult: AdvancedModuleCalculationResult | null;
  completeSystemResult: CompleteSystemCalculationResult | null;
  irradiationData: any | null;
  error: string | null;
  calculateSystem: (params: SolarSystemCalculationParams) => Promise<void>;
  calculateFromDimensioning: (dimensioningData: any) => Promise<void>;
  calculateAdvancedFromDimensioning: (dimensioningData: any) => Promise<void>;
  calculateCompleteSystem: (params: CompleteSystemCalculationParams) => Promise<void>;
  calculateCompleteSystemFromDimensioning: (dimensioningData: any) => Promise<void>;
  fetchIrradiationData: (params: { lat: number; lon: number; tilt?: number; azimuth?: number }) => Promise<void>;
  clearResult: () => void;
}

export const useSolarSystemCalculation = (): UseSolarSystemCalculationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SolarSystemCalculationResult | null>(null);
  const [advancedResult, setAdvancedResult] = useState<AdvancedModuleCalculationResult | null>(null);
  const [completeSystemResult, setCompleteSystemResult] = useState<CompleteSystemCalculationResult | null>(null);
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

  const calculateCompleteSystem = useCallback(async (params: CompleteSystemCalculationParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const calculation = await SolarSystemService.calculateCompleteSystem(params);
      setCompleteSystemResult(calculation);

      if (calculation.message) {
        toast.success(calculation.message);
      } else {
        toast.success('Cálculo completo do sistema realizado com sucesso');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro no cálculo completo do sistema';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateCompleteSystemFromDimensioning = useCallback(async (dimensioningData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = SolarSystemService.buildCompleteSystemParams(dimensioningData);
      const calculation = await SolarSystemService.calculateCompleteSystem(params);
      setCompleteSystemResult(calculation);

      if (calculation.message) {
        toast.success(calculation.message);
      } else {
        toast.success('Cálculo completo do sistema realizado com sucesso');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro no cálculo completo do sistema';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setAdvancedResult(null);
    setCompleteSystemResult(null);
    setIrradiationData(null);
    setError(null);
  }, []);

  return {
    isLoading,
    result,
    advancedResult,
    completeSystemResult,
    irradiationData,
    error,
    calculateSystem,
    calculateFromDimensioning,
    calculateAdvancedFromDimensioning,
    calculateCompleteSystem,
    calculateCompleteSystemFromDimensioning,
    fetchIrradiationData,
    clearResult
  };
};

export default useSolarSystemCalculation;