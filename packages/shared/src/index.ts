export * from './types/user.types';
export * from './types/lead.types';
export * from './types/financial';
export * from './types/common';
export type { PaginatedModules, PaginatedInverters, PaginatedManufacturers } from './types/common/pagination';
export * from './types/module';
export * from './types/inverter';
export * from './types/manufacturer';
export type { 
  SystemCalculations as SystemSystemCalculations,
  FinancialCalculation as SystemFinancialCalculation,
  SystemConfiguration as SystemSystemConfiguration
} from './types/system';
export * from './types/validation';
export * from './config/financial';
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
// Export outros tipos conforme criados
