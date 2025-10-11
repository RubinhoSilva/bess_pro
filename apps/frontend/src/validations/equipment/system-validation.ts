import { z } from 'zod';
import { ModuleCompatibilityData, moduleCompatibilitySchema } from './module-validation';
import { InverterCompatibilityData, inverterCompatibilitySchema } from './inverter-validation';

/**
 * Configurações padrão para validações de sistema
 * Valores documentados e configuráveis para diferentes cenários
 */
const SYSTEM_VALIDATION_CONFIG = {
  /** 
   * Ratio típico AC→DC para inversores quando maxPVPower não está disponível
   * Baseado em inversores string modernos (typical: 1.1-1.3)
   */
  DC_POWER_RATIO: 1.2,
  
  /** 
   * Tensão nominal estimada para cálculo de corrente máxima
   * Sistemas residenciais: 300-400V, comerciais: 600-800V
   */
  NOMINAL_VOLTAGE: 400,
  
  /** 
   * Máximo ratio potência módulos/inversor antes de gerar warning
   * Locais ensolarados podem aceitar valores maiores (1.3-1.5)
   */
  MAX_POWER_RATIO: 1.2,
  
  /** 
   * Tensão mínima para considerar sistemas comerciais
   * Abaixo disso usa configurações residenciais
   */
  MIN_COMMERCIAL_VOLTAGE: 400,
} as const;

/**
 * Schema de validação para compatibilidade de sistema
 * Validações cruzadas entre módulos e inversores
 */

export const systemCompatibilitySchema = z.object({
  // Configuração do sistema
  modules: z.array(moduleCompatibilitySchema).min(1, 'Pelo menos um módulo é obrigatório'),
  inverters: z.array(inverterCompatibilitySchema).min(1, 'Pelo menos um inversor é obrigatório'),
  
  // Configuração de strings
  stringsPerInverter: z.number().int().min(1, 'Strings por inversor deve ser maior que 0'),
  modulesPerString: z.number().int().min(1, 'Módulos por string deve ser maior que 0'),
  
  // Condições ambientais
  temperatureMin: z.number(),
  temperatureMax: z.number(),
  irradianceMax: z.number().positive(),
  
  // Configuração elétrica
  systemVoltage: z.enum(['220V', '380V', '440V', 'other']),
  hasBattery: z.boolean().default(false),
});

// Schema para validação de dimensionamento
export const systemDimensioningSchema = z.object({
  // Dados de consumo
  monthlyConsumptionKwh: z.number().positive('Consumo mensal deve ser positivo'),
  peakDemandKw: z.number().positive('Demanda de pico deve ser positiva'),
  
  // Localização
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  
  // Restrições de espaço
  availableAreaM2: z.number().positive('Área disponível deve ser positiva'),
  roofType: z.enum(['flat', 'tilted', 'metal', 'tile', 'other']),
  
  // Orientação e inclinação
  orientation: z.enum(['north', 'south', 'east', 'west', 'southeast', 'southwest', 'northeast', 'northwest']),
  tiltAngle: z.number().min(0).max(90),
  
  // Sombreamento
  shadingFactor: z.number().min(0).max(1),
  
  // Financeiro
  electricityRate: z.number().positive('Tarifa de energia deve ser positiva'),
  systemCostPerWp: z.number().positive('Custo por Wp deve ser positivo'),
});

// Tipos exportados
export type SystemCompatibilityData = z.infer<typeof systemCompatibilitySchema>;
export type SystemDimensioningData = z.infer<typeof systemDimensioningSchema>;

// Interface para resultados de validação
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

// Interface para análise de compatibilidade
export interface CompatibilityAnalysis {
  voltageCompatibility: ValidationResult;
  powerCompatibility: ValidationResult;
  currentCompatibility: ValidationResult;
  temperatureCompatibility: ValidationResult;
  overall: ValidationResult;
}

// Validações de compatibilidade
export const validateVoltageCompatibility = (
  modules: ModuleCompatibilityData[],
  inverters: InverterCompatibilityData[],
  modulesPerString: number,
  temperatureMin: number
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  modules.forEach(module => {
    const moduleVocAtTemp = module.voc * (1 + (module.tempCoeffVoc || 0) * (25 - temperatureMin) / 100);
    const stringVoltage = moduleVocAtTemp * modulesPerString;

    inverters.forEach(inverter => {
      if (stringVoltage > inverter.shortCircuitVoltageMax) {
        errors.push(`Tensão da string (${stringVoltage.toFixed(1)}V) excede máxima do inversor (${inverter.shortCircuitVoltageMax}V)`);
      }

      const moduleVmpp = module.vmpp;
      if (moduleVmpp) {
        const stringVmpp = moduleVmpp * modulesPerString;
        
        if (stringVmpp < inverter.shortCircuitVoltageMax * 0.3) {
          warnings.push(`Tensão da string (${stringVmpp.toFixed(1)}V) muito baixa para o inversor`);
          recommendations.push('Considere aumentar módulos por string ou usar inversor com tensão menor');
        }

        if (stringVmpp > inverter.shortCircuitVoltageMax * 0.9) {
          warnings.push(`Tensão da string próxima do limite máximo do inversor`);
          recommendations.push('Verifique temperatura mínima real do local');
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
};

export const validatePowerCompatibility = (
  modules: ModuleCompatibilityData[],
  inverters: InverterCompatibilityData[]
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const totalModulePower = modules.reduce((sum, module) => sum + module.nominalPower, 0);
  const totalInverterPower = inverters.reduce((sum, inverter) => sum + inverter.ratedACPower, 0);
  const totalInverterDcPower = inverters.reduce((sum, inverter) => 
    sum + (inverter.maxPVPower || inverter.ratedACPower * SYSTEM_VALIDATION_CONFIG.DC_POWER_RATIO), 0
  );

  if (totalModulePower > totalInverterDcPower) {
    errors.push(`Potência total dos módulos (${totalModulePower}W) excede capacidade DC dos inversores (${totalInverterDcPower}W)`);
  }

  const powerRatio = totalInverterPower / totalModulePower;
  if (powerRatio < 0.8) {
    warnings.push(`Relação inversor/módulos muito baixa (${(powerRatio * 100).toFixed(1)}%)`);
    recommendations.push('Considere reduzir número de módulos ou aumentar potência dos inversores');
  }

  if (powerRatio > SYSTEM_VALIDATION_CONFIG.MAX_POWER_RATIO) {
    warnings.push(`Relação inversor/módulos muito alta (${(powerRatio * 100).toFixed(1)}%)`);
    recommendations.push('Considere adicionar mais módulos ou reduzir potência dos inversores');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
};

export const validateCurrentCompatibility = (
  modules: ModuleCompatibilityData[],
  inverters: InverterCompatibilityData[],
  stringsPerInverter: number
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  modules.forEach(module => {
    const stringCurrent = module.isc;

    inverters.forEach(inverter => {
      const totalCurrent = stringCurrent * stringsPerInverter;
      
      const maxCurrent = inverter.maxInputCurrent || 
        (inverter.maxPVPower / SYSTEM_VALIDATION_CONFIG.NOMINAL_VOLTAGE);
      if (totalCurrent > maxCurrent) {
        errors.push(`Corrente total (${totalCurrent.toFixed(2)}A) excede máxima do inversor (${maxCurrent.toFixed(2)}A)`);
      }

      if (inverter.maxInputCurrent && totalCurrent > inverter.maxInputCurrent * 0.9) {
        warnings.push(`Corrente total próxima do limite máximo do inversor`);
        recommendations.push('Verifique temperatura de operação e considere margem de segurança');
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
};

export const validateTemperatureCompatibility = (
  modules: ModuleCompatibilityData[],
  temperatureMin: number,
  temperatureMax: number
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (temperatureMin < -40) {
    warnings.push('Temperatura mínima muito baixa - verifique especificações dos módulos');
  }

  if (temperatureMax > 85) {
    warnings.push('Temperatura máxima muito alta - pode afetar desempenho dos módulos');
    recommendations.push('Considere módulos com melhor coeficiente de temperatura');
  }

  modules.forEach(module => {
    if (module.tempCoeffPmax && module.tempCoeffPmax < -0.5) {
      warnings.push(`Módulo com coeficiente de temperatura muito negativo (${module.tempCoeffPmax}%/°C)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
};

// Função principal de análise de compatibilidade
export const analyzeSystemCompatibility = (
  systemData: SystemCompatibilityData
): CompatibilityAnalysis => {
  const { modules, inverters, stringsPerInverter, modulesPerString, temperatureMin, temperatureMax } = systemData;

  const voltageCompatibility = validateVoltageCompatibility(
    modules, inverters, modulesPerString, temperatureMin
  );

  const powerCompatibility = validatePowerCompatibility(modules, inverters);

  const currentCompatibility = validateCurrentCompatibility(
    modules, inverters, stringsPerInverter
  );

  const temperatureCompatibility = validateTemperatureCompatibility(
    modules, temperatureMin, temperatureMax
  );

  const allErrors = [
    ...voltageCompatibility.errors,
    ...powerCompatibility.errors,
    ...currentCompatibility.errors,
    ...temperatureCompatibility.errors
  ];

  const allWarnings = [
    ...voltageCompatibility.warnings,
    ...powerCompatibility.warnings,
    ...currentCompatibility.warnings,
    ...temperatureCompatibility.warnings
  ];

  const allRecommendations = [
    ...voltageCompatibility.recommendations,
    ...powerCompatibility.recommendations,
    ...currentCompatibility.recommendations,
    ...temperatureCompatibility.recommendations
  ];

  const overall: ValidationResult = {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    recommendations: allRecommendations
  };

  return {
    voltageCompatibility,
    powerCompatibility,
    currentCompatibility,
    temperatureCompatibility,
    overall
  };
};

// Funções auxiliares para dimensionamento
export const calculateOptimalSystemSize = (
  monthlyConsumptionKwh: number,
  latitude: number,
  systemEfficiency: number = 0.85
): { recommendedPowerKwp: number; estimatedAnnualGeneration: number } => {
  // Fator de produção baseado na latitude (simplificado)
  const productionFactor = latitude > 0 ? 4.5 : 5.5; // Hemisfério norte vs sul
  
  const recommendedPowerKwp = monthlyConsumptionKwh * 12 / (productionFactor * 365 * systemEfficiency);
  const estimatedAnnualGeneration = recommendedPowerKwp * productionFactor * 365 * systemEfficiency;

  return {
    recommendedPowerKwp: Math.round(recommendedPowerKwp * 100) / 100,
    estimatedAnnualGeneration: Math.round(estimatedAnnualGeneration)
  };
};

export const calculateOptimalStringConfiguration = (
  moduleVoc: number,
  moduleVmpp: number,
  inverterMaxVoltage: number,
  inverterMpptMin: number = 100,
  temperatureMin: number = 10
): { modulesPerString: number; maxStrings: number } => {
  const moduleVocAtTemp = moduleVoc * 1.1; // Estimativa para temperatura baixa
  const maxModulesByVoltage = Math.floor(inverterMaxVoltage / moduleVocAtTemp);
  const minModulesByVoltage = Math.ceil(inverterMpptMin / moduleVmpp);

  const modulesPerString = Math.min(maxModulesByVoltage, Math.max(minModulesByVoltage, 10));
  const maxStrings = Math.floor(inverterMaxVoltage / (moduleVmpp * modulesPerString));

  return {
    modulesPerString,
    maxStrings: Math.max(1, maxStrings)
  };
};