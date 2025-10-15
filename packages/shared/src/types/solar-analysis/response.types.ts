/**
 * Response wrapper and validation types for solar analysis
 */

import { PythonPvlibResponse, PythonIrradiationResponse, PythonFinancialResponse, PythonMPPTResponse } from './python-pvlib.types';

export interface SolarAnalysisResult {
  success: boolean;
  data: any;
  timestamp: string;
  message?: string;
  validation?: SolarAnalysisValidation;
}

export interface SolarAnalysisValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: ValidationMetadata;
}

export interface ValidationMetadata {
  executionTime: number;
  dataSource: string;
  processingSteps: string[];
  warningsCount: number;
  errorsCount: number;
}

export interface SystemCompatibility {
  compativel: boolean;
  alertas: string[];
  limitacoes: string[];
  recomendacoes?: string[];
}

export interface CalculationMetadata {
  calculationId: string;
  timestamp: string;
  executionTime: number;
  version: string;
  dataSource: string;
  parameters: any;
  processingSteps: ProcessingStep[];
}

export interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
  details?: any;
  error?: string;
}

// Frontend-compatible types
export interface FrontendIrradiationData {
  irradiacaoMensal: number[];
  mediaAnual: number;
  maximo: any;
  minimo: any;
  variacaoSazonal: number;
  configuracao: any;
  coordenadas: {
    lat: number;
    lon: number;
  };
  periodoAnalise: any;
  registrosProcessados: number;
}

export interface FrontendPvlibData {
  numModulos: number;
  potenciaTotalKwp: number;
  energiaPorModulo?: number;
  energiaAnualKwh: number;
  energiaDcAnualKwh: number;
  perdaClippingKwh?: number;
  perdaClippingPct?: number;
  geracaoMensalKwh: number[];
  consumoAnualKwh?: number;
  yieldEspecifico: number;
  coberturaPercentual?: number;
  fatorCapacidade?: number;
  prTotal: number;
  hspEquivalenteDia?: number;
  hspEquivalenteAnual?: number;
  energiaAnualStd?: number;
  variabilidadePercentual?: number;
  energiaPorAno?: number[];
  energiaDiariaMedia?: number;
  energiaDiariaStd?: number;
  energiaDiariaMin?: number;
  energiaDiariaMax?: number;
  compatibilidadeSistema?: any;
  areaNecessariaM2?: number;
  pesoTotalKg?: number;
  economiaAnualCo2?: number;
  perdasDetalhadas?: any;
  parametrosCompletos?: any;
  dadosProcessados?: any;
  anosAnalisados?: number;
  periodoDados?: string;
  inversores?: any[];
}

// Specific result types for each endpoint
export interface AdvancedModulesResult extends SolarAnalysisResult {
  data: FrontendPvlibData;
}

export interface MonthlyIrradiationResult extends SolarAnalysisResult {
  data: FrontendIrradiationData;
}

export interface FinancialAnalysisResult extends SolarAnalysisResult {
  data: PythonFinancialResponse;
}

export interface MPPTLimitsResult extends SolarAnalysisResult {
  data: PythonMPPTResponse;
}

export interface CompleteSystemResult extends SolarAnalysisResult {
  data: PythonPvlibResponse;
}

// Error response types
export interface SolarAnalysisError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}