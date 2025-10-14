/**
 * Solar Analysis types module exports
 * 
 * This module exports all solar analysis-related types for communication
 * between frontend, Node.js backend, and Python PVLIB service.
 */

// Core solar analysis types
export type {
  SolarAnalysisRequest,
  SolarAnalysisResponse,
  Coordinates,
  DataSource,
  DecompositionModel,
  TranspositionModel,
  MountType
} from './solar-analysis.types';

// Module-related types
export type {
  ModuleWithSandiaParams,
  TemperatureCoefficients,
  SandiaParameters,
  DiodeParameters
} from './module.types';

// Roof water area types
export type {
  RoofWaterArea,
  RoofWaterAreaRequest,
  InverterConfiguration,
  InverterPower,
  MPPTConfiguration
} from './roof-water.types';

// Losses types
export type {
  LossesBreakdown,
  DetailedLosses,
  SystemLosses
} from './losses.types';

// Python PVLIB communication types
export type {
  PythonPvlibRequest,
  PythonPvlibResponse,
  PythonIrradiationRequest,
  PythonIrradiationResponse,
  PythonFinancialRequest,
  PythonFinancialResponse,
  PythonMPPTRequest,
  PythonMPPTResponse
} from './python-pvlib.types';

// Response wrapper types
export type {
  SolarAnalysisResult,
  SolarAnalysisValidation,
  SystemCompatibility,
  CalculationMetadata
} from './response.types';