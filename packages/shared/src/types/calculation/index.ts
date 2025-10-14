/**
 * Calculation types module exports
 * 
 * This module exports all calculation-related types for the solar and BESS system.
 * Includes core types, requests, filters, and results.
 */

// Core calculation types
export type {
  CalculationType,
  SystemType,
  CalculationStatus,
  CalculationPeriod,
  BatteryType,
  BessStrategy,
  MountingType,
  Coordinates,
  IrradiationData,
  LossesConfiguration,
  FinancialParameters,
  SystemCalculations,
  SolarSystemCalculation,
  BessCalculation,
  FinancialCalculation,
  EnergyProduction,
  PerformanceMetrics,
  SystemConfiguration,
  EnergyManagement,
  BessEconomicBenefits,
  BessTechnicalSpecs,
  CostBreakdown,
  OperationalCosts,
  RevenueStreams,
  FinancialMetrics,
  CashFlowProjection,
  CalculationMetadata,
  TemperatureRange,
  BessWarranty,
  YearlyCashFlow,
  SensitivityAnalysis,
  SensitivityScenario,
  TrackingSystem,
  ShadingAnalysis,
  StringConfiguration,
  PeakShavingConfig,
  LoadShiftingConfig,
  BackupPowerConfig,
  GridServicesConfig
} from './calculation.types';

// Request types
export type {
  CreateSolarCalculationRequest,
  CreateBessCalculationRequest,
  CreateFinancialCalculationRequest,
  UpdateCalculationRequest,
  SolarSystemParams,
  BatteryParams,
  LoadProfile,
  GridConnectionParams,
  InvestmentParams,
  FinancingParams,
  RevenueParams,
  SensitivityParams,
  CalculationRequestValidation,
  ValidationError,
  ValidationWarning
} from './calculation.requests';

// Filter types
export type {
  CalculationFilters,
  SolarCalculationFilters,
  BessCalculationFilters,
  FinancialCalculationFilters,
  DateRange,
  NumericRange,
  GeographicFilter,
  PaginationParams,
  CalculationSortField,
  AdvancedCalculationFilters,
  FilterCondition,
  FilterOperator,
  AggregationFilter,
  AggregationOperation,
  PerformanceComparisonFilters,
  TemplateFilters,
  ValidationFilters,
  ExportFilters,
  CalculationQueryBuilder,
  SearchQuery,
  FilteredCalculationResult,
  AggregatedCalculationResult,
  CalculationSearchResult
} from './calculation.filters';

// Result types
export type {
  SolarCalculationResult,
  BessCalculationResult,
  FinancialAnalysisResult,
  SystemSummary,
  EnvironmentalImpactResult,
  EnergyProductionResult,
  SolarPerformanceMetrics,
  SystemConfigurationResult,
  EnergyManagementResult,
  BessTechnicalResult,
  BessEconomicResult,
  BessOperationalResult,
  InvestmentAnalysisResult,
  FinancialMetricsResult,
  CashFlowAnalysisResult,
  SensitivityAnalysisResult,
  FinancialRiskResult,
  FinancialBenchmarksResult,
  EconomicSummaryResult,
  ResultMetadata,
  CombinedSystemResult,
  SystemSynergiesResult,
  OptimizationRecommendationsResult
} from './calculation.results';