import { useState, useCallback } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { 
  SystemCompatibilityData,
  SystemDimensioningData,
  CompatibilityAnalysis,
  ValidationResult,
  analyzeSystemCompatibility,
  calculateOptimalSystemSize,
  calculateOptimalStringConfiguration,
  validateVoltageCompatibility,
  validatePowerCompatibility,
  validateCurrentCompatibility,
  validateTemperatureCompatibility
} from '@/validations/equipment/system-validation';

export interface UseSystemValidationOptions {
  onError?: (error: Error) => void;
}

export interface UseSystemValidationReturn {
  // Validation state
  isValidating: boolean;
  lastAnalysis: CompatibilityAnalysis | null;
  
  // Compatibility validation
  validateSystemCompatibility: (systemData: SystemCompatibilityData) => Promise<CompatibilityAnalysis>;
  
  // Individual validations
  validateVoltage: (modules: any[], inverters: any[], modulesPerString: number, temperatureMin: number) => ValidationResult;
  validatePower: (modules: any[], inverters: any[]) => ValidationResult;
  validateCurrent: (modules: any[], inverters: any[], stringsPerInverter: number) => ValidationResult;
  validateTemperature: (modules: any[], temperatureMin: number, temperatureMax: number) => ValidationResult;
  
  // Dimensioning helpers
  calculateOptimalSize: (monthlyConsumptionKwh: number, latitude: number, systemEfficiency?: number) => {
    recommendedPowerKwp: number;
    estimatedAnnualGeneration: number;
  };
  
  calculateStringConfig: (moduleVoc: number, moduleVmpp: number, inverterMaxVoltage: number, inverterMpptMin?: number, temperatureMin?: number) => {
    modulesPerString: number;
    maxStrings: number;
  };
  
  // Utilities
  clearResults: () => void;
  hasErrors: (analysis?: CompatibilityAnalysis) => boolean;
  hasWarnings: (analysis?: CompatibilityAnalysis) => boolean;
}

/**
 * Hook para validações de sistema e compatibilidade entre equipamentos
 * Reutilizável em formulários de dimensionamento e seleção de equipamentos
 */
export const useSystemValidation = (options: UseSystemValidationOptions = {}): UseSystemValidationReturn => {
  const { onError } = options;
  const { handleError } = useErrorHandler();
  const [isValidating, setIsValidating] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<CompatibilityAnalysis | null>(null);
  
  // Validação completa de compatibilidade
  const validateSystemCompatibility = useCallback(async (
    systemData: SystemCompatibilityData
  ): Promise<CompatibilityAnalysis> => {
    try {
      setIsValidating(true);
      
      const analysis = analyzeSystemCompatibility(systemData);
      setLastAnalysis(analysis);
      
      return analysis;
    } catch (error) {
      const handledError = handleError(error, {
        context: 'system-validation',
        action: 'compatibility-analysis',
        data: { systemData }
      });
      
      onError?.(handledError);
      throw handledError;
    } finally {
      setIsValidating(false);
    }
  }, [handleError, onError]);
  
  // Validações individuais
  const validateVoltage = useCallback((
    modules: any[],
    inverters: any[],
    modulesPerString: number,
    temperatureMin: number
  ): ValidationResult => {
    return validateVoltageCompatibility(modules, inverters, modulesPerString, temperatureMin);
  }, []);
  
  const validatePower = useCallback((
    modules: any[],
    inverters: any[]
  ): ValidationResult => {
    return validatePowerCompatibility(modules, inverters);
  }, []);
  
  const validateCurrent = useCallback((
    modules: any[],
    inverters: any[],
    stringsPerInverter: number
  ): ValidationResult => {
    return validateCurrentCompatibility(modules, inverters, stringsPerInverter);
  }, []);
  
  const validateTemperature = useCallback((
    modules: any[],
    temperatureMin: number,
    temperatureMax: number
  ): ValidationResult => {
    return validateTemperatureCompatibility(modules, temperatureMin, temperatureMax);
  }, []);
  
  // Helpers para dimensionamento
  const calculateOptimalSize = useCallback((
    monthlyConsumptionKwh: number,
    latitude: number,
    systemEfficiency: number = 0.85
  ) => {
    return calculateOptimalSystemSize(monthlyConsumptionKwh, latitude, systemEfficiency);
  }, []);
  
  const calculateStringConfig = useCallback((
    moduleVoc: number,
    moduleVmpp: number,
    inverterMaxVoltage: number,
    inverterMpptMin: number = 100,
    temperatureMin: number = 10
  ) => {
    return calculateOptimalStringConfiguration(
      moduleVoc, 
      moduleVmpp, 
      inverterMaxVoltage, 
      inverterMpptMin, 
      temperatureMin
    );
  }, []);
  
  // Utilitários
  const clearResults = useCallback(() => {
    setLastAnalysis(null);
  }, []);
  
  const hasErrors = useCallback((analysis?: CompatibilityAnalysis): boolean => {
    const currentAnalysis = analysis || lastAnalysis;
    return currentAnalysis ? !currentAnalysis.overall.isValid : false;
  }, [lastAnalysis]);
  
  const hasWarnings = useCallback((analysis?: CompatibilityAnalysis): boolean => {
    const currentAnalysis = analysis || lastAnalysis;
    if (!currentAnalysis) return false;
    
    return [
      currentAnalysis.voltageCompatibility.warnings.length > 0,
      currentAnalysis.powerCompatibility.warnings.length > 0,
      currentAnalysis.currentCompatibility.warnings.length > 0,
      currentAnalysis.temperatureCompatibility.warnings.length > 0
    ].some(Boolean);
  }, [lastAnalysis]);
  
  return {
    isValidating,
    lastAnalysis,
    validateSystemCompatibility,
    validateVoltage,
    validatePower,
    validateCurrent,
    validateTemperature,
    calculateOptimalSize,
    calculateStringConfig,
    clearResults,
    hasErrors,
    hasWarnings
  };
};

export default useSystemValidation;