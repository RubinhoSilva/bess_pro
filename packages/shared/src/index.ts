export * from './types/user.types';
export * from './types/lead.types';

// Import explícito do financial.ts para renomear FinancialIndicators
import {
  FinancialInput,
  CashFlowDetails,
  FinancialIndicators as LegacyFinancialIndicators,
  SensitivityPoint,
  SensitivityAnalysis,
  ScenarioIndicators,
  ScenarioAnalysis,
  AdvancedFinancialResults,
  FINANCIAL_DEFAULTS,
  FinancialValidationRule,
  FINANCIAL_VALIDATION_RULES,
  FinancialCalculationMetadata,
  FinancialCalculationResponse,
  camelToSnake,
  snakeToCamel,
  objectCamelToSnake,
  objectSnakeToCamel
} from './types/financial';

// Import explícito do financial-results.ts para renomear FinancialIndicators
import {
  FinancialIndicators as GrupoFinancialIndicators,
  InitialSums,
  ResultadosCodigoB,
  InitialSumsGrupoA,
  ConsumoAno1GrupoA,
  ResultadosCodigoA,
  isResultadosCodigoB,
  isResultadosCodigoA,
  GrupoFinancialResults,
  isGrupoFinancialResults,
  getGrupoTarifario,
  formatarMoeda,
  formatarEnergia
} from './types/financial-results';

// Re-exportar tipos do financial.ts
export type {
  FinancialInput,
  CashFlowDetails,
  LegacyFinancialIndicators as FinancialIndicators,
  SensitivityPoint,
  SensitivityAnalysis,
  ScenarioIndicators,
  ScenarioAnalysis,
  AdvancedFinancialResults,
  FinancialValidationRule,
  FinancialCalculationMetadata,
  FinancialCalculationResponse
};

// Re-exportar valores do financial.ts
export {
  FINANCIAL_DEFAULTS,
  FINANCIAL_VALIDATION_RULES,
  camelToSnake,
  snakeToCamel,
  objectCamelToSnake,
  objectSnakeToCamel
};

// Re-exportar tipos do financial-results.ts
export type {
  GrupoFinancialIndicators,
  InitialSums,
  ResultadosCodigoB,
  InitialSumsGrupoA,
  ConsumoAno1GrupoA,
  ResultadosCodigoA,
  GrupoFinancialResults
};

// Re-exportar valores do financial-results.ts
export {
  isResultadosCodigoB,
  isResultadosCodigoA,
  isGrupoFinancialResults,
  getGrupoTarifario,
  formatarMoeda,
  formatarEnergia
};

export * from './types/common';
export * from './types/common-types';
export * from './types/grupo-configs';
export * from './types/energy-bill-types';

// Exportar tipo união explicitamente
export type { FinancialConfiguration } from './types/grupo-configs';
export type { PaginatedModules, PaginatedInverters, PaginatedManufacturers } from './types/common/pagination';
export * from './types/module';
export * from './types/module/module.requests';
export * from './types/inverter';
export * from './types/manufacturer';
export type { 
  SystemCalculations as SystemSystemCalculations,
  FinancialCalculation as SystemFinancialCalculation,
  SystemConfiguration as SystemSystemConfiguration
} from './types/system';
export * from './types/validation';
export * from './config/financial';
// Calculation Results
export type {
  SolarCalculationResult,
  BessCalculationResult,
  FinancialAnalysisResult,
  EnvironmentalImpactResult,
  EnergyProductionResult,
  SystemConfigurationResult,
  InvestmentAnalysisResult,
  FinancialMetricsResult,
  CashFlowAnalysisResult,
  SensitivityAnalysisResult,
  FinancialRiskResult,
  FinancialBenchmarksResult,
  EconomicSummaryResult
} from './types/calculation/calculation.results';
// Solar Analysis Types (explicit exports to avoid conflicts)
export type { 
  SolarAnalysisRequest,
  SolarAnalysisResponse,
  Coordinates,
  DataSource,
  DecompositionModel,
  TranspositionModel,
  MountType,
  ModuleWithSandiaParams,
  TemperatureCoefficients as SolarTemperatureCoefficients,
  SandiaParameters as SolarSandiaParameters,
  DiodeParameters as SolarDiodeParameters,
  RoofWaterArea,
  RoofWaterAreaRequest,
  InverterConfiguration as SolarInverterConfiguration,
  InverterPower as SolarInverterPower,
  MPPTConfiguration as SolarMPPTConfiguration,
  LossesBreakdown,
  DetailedLosses,
  SystemLosses,
  PythonPvlibRequest,
  PythonPvlibResponse,
  PythonIrradiationRequest,
  PythonIrradiationResponse,
  PythonFinancialRequest,
  PythonFinancialResponse,
  PythonMPPTRequest,
  PythonMPPTResponse,
  SolarAnalysisResult,
  SolarAnalysisValidation,
  SystemCompatibility,
  CalculationMetadata
} from './types/solar-analysis';
// Solar Analysis Adapters
export * from './adapters/solar-analysis';
// Energy Bill Adapters
export * from './adapters/energy-bill-adapter';
// Export outros tipos conforme criados
