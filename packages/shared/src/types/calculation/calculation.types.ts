/**
 * Calculation types for solar and BESS system calculations
 * 
 * This module defines the core types for energy, financial, and system sizing calculations
 * used in solar photovoltaic and battery energy storage systems.
 */

import { BaseEntity, Status } from '../common';
import { Inverter } from '../inverter';
import { SolarModule } from '../module';

// ============= ENUMS =============

/**
 * Types of calculations available in the system
 */
export enum CalculationType {
  SOLAR = 'SOLAR',
  BESS = 'BESS',
  HYBRID = 'HYBRID',
  FINANCIAL = 'FINANCIAL',
  ENERGY_PRODUCTION = 'ENERGY_PRODUCTION',
  SYSTEM_SIZING = 'SYSTEM_SIZING'
}

/**
 * Types of energy systems
 */
export enum SystemType {
  GRID_TIED = 'GRID_TIED',
  OFF_GRID = 'OFF_GRID',
  HYBRID = 'HYBRID',
  BESS_ONLY = 'BESS_ONLY'
}

/**
 * Status of calculation processes
 */
export enum CalculationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

/**
 * Time periods for calculations
 */
export enum CalculationPeriod {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
  LIFETIME = 'LIFETIME'
}

// ============= VALUE OBJECTS =============

/**
 * Geographic coordinates for location-based calculations
 * 
 * @example
 * ```typescript
 * const location: Coordinates = {
 *   latitude: -23.5505,
 *   longitude: -46.6333,
 *   altitude: 760,
 *   timezone: 'America/Sao_Paulo'
 * };
 * ```
 */
export interface Coordinates {
  readonly latitude: number; // Decimal degrees (-90 to 90)
  readonly longitude: number; // Decimal degrees (-180 to 180)
  readonly altitude?: number; // Meters above sea level
  readonly timezone?: string; // IANA timezone identifier
  readonly address?: string; // Human readable address
}

/**
 * Solar irradiation and weather data for calculations
 * 
 * @example
 * ```typescript
 * const irradiation: IrradiationData = {
 *   globalHorizontalIrradiation: 4.8,
 *   directNormalIrradiation: 5.2,
 *   diffuseHorizontalIrradiation: 1.6,
 *   averageTemperature: 25,
 *   windSpeed: 3.5,
 *   source: 'NASA_POWER',
 *   period: CalculationPeriod.ANNUAL
 * };
 * ```
 */
export interface IrradiationData {
  readonly globalHorizontalIrradiation: number; // kWh/m²/day
  readonly directNormalIrradiation?: number; // kWh/m²/day
  readonly diffuseHorizontalIrradiation?: number; // kWh/m²/day
  readonly averageTemperature?: number; // °C
  readonly windSpeed?: number; // m/s
  readonly humidity?: number; // %
  readonly pressure?: number; // hPa
  readonly source: string; // Data source (NASA_POWER, PVGIS, etc.)
  readonly period: CalculationPeriod;
  readonly year?: number; // Reference year for data
  readonly dataQuality?: 'high' | 'medium' | 'low';
}

/**
 * System losses configuration for realistic calculations
 * 
 * @example
 * ```typescript
 * const losses: LossesConfiguration = {
 *   temperatureLosses: 15,
 *   soilingLosses: 2,
 *   mismatchLosses: 2,
 *   wiringLosses: 2,
 *   inverterLosses: 3,
 *   availabilityLosses: 1,
 *   totalLosses: 25
 * };
 * ```
 */
export interface LossesConfiguration {
  readonly temperatureLosses: number; // % losses due to temperature
  readonly soilingLosses: number; // % losses due to dirt/dust
  readonly mismatchLosses: number; // % losses due to module mismatch
  readonly wiringLosses: number; // % losses in cables/wiring
  readonly inverterLosses: number; // % inverter conversion losses
  readonly availabilityLosses: number; // % system downtime losses
  readonly shadingLosses?: number; // % losses due to shading
  readonly degradationLosses?: number; // % annual degradation
  readonly totalLosses: number; // Total system losses %
}

/**
 * Financial parameters for economic calculations
 * 
 * @example
 * ```typescript
 * const financial: FinancialParameters = {
 *   electricityRate: 0.65,
 *   inflationRate: 4.5,
 *   discountRate: 8.0,
 *   systemLifespan: 25,
 *   currency: 'BRL'
 * };
 * ```
 */
export interface FinancialParameters {
  readonly electricityRate: number; // $/kWh
  readonly inflationRate?: number; // % annual
  readonly discountRate?: number; // % annual (for NPV/IRR)
  readonly systemLifespan: number; // years
  readonly currency: string; // ISO currency code
  readonly tariffEscalationRate?: number; // % annual electricity price increase
  readonly maintenanceCostRate?: number; // % of initial cost per year
  readonly insuranceCostRate?: number; // % of initial cost per year
}

// ============= CORE INTERFACES =============

/**
 * Main interface for system calculations encompassing all calculation types
 * 
 * @example
 * ```typescript
 * const calculation: SystemCalculations = {
 *   id: 'calc-123',
 *   projectId: 'proj-456',
 *   type: CalculationType.SOLAR,
 *   systemType: SystemType.GRID_TIED,
 *   status: CalculationStatus.COMPLETED,
 *   solar: solarCalculation,
 *   bess: bessCalculation,
 *   financial: financialCalculation,
 *   coordinates: location,
 *   irradiationData: irradiation,
 *   lossesConfiguration: losses,
 *   financialParameters: financial,
 *   calculatedAt: new Date(),
 *   calculationVersion: '1.0.0'
 * };
 * ```
 */
export interface SystemCalculations extends BaseEntity {
  readonly projectId: string;
  readonly type: CalculationType;
  readonly systemType: SystemType;
  readonly status: CalculationStatus;
  readonly solar?: SolarSystemCalculation;
  readonly bess?: BessCalculation;
  readonly financial?: FinancialCalculation;
  readonly coordinates: Coordinates;
  readonly irradiationData: IrradiationData;
  readonly lossesConfiguration: LossesConfiguration;
  readonly financialParameters: FinancialParameters;
  readonly calculatedAt: Date;
  readonly calculationVersion: string;
  readonly calculatedBy?: string; // User ID
  readonly metadata?: CalculationMetadata;
}

/**
 * Solar photovoltaic system calculation results
 */
export interface SolarSystemCalculation {
  readonly systemSize: number; // kWp
  readonly moduleCount: number;
  readonly inverterCount: number;
  readonly totalArea: number; // m²
  readonly modules: SolarModule[];
  readonly inverters: Inverter[];
  readonly energyProduction: EnergyProduction;
  readonly performanceMetrics: PerformanceMetrics;
  readonly systemConfiguration: SystemConfiguration;
}

/**
 * Battery Energy Storage System calculation results
 */
export interface BessCalculation {
  readonly batteryCapacity: number; // kWh
  readonly batteryPower: number; // kW
  readonly batteryCount: number;
  readonly batteryType: BatteryType;
  readonly depthOfDischarge: number; // %
  readonly roundTripEfficiency: number; // %
  readonly cycleLife: number; // cycles
  readonly energyManagement: EnergyManagement;
  readonly economicBenefits: BessEconomicBenefits;
  readonly technicalSpecifications: BessTechnicalSpecs;
}

/**
 * Financial calculation results for the complete system
 */
export interface FinancialCalculation {
  readonly initialInvestment: CostBreakdown;
  readonly operationalCosts: OperationalCosts;
  readonly revenueStreams: RevenueStreams;
  readonly financialMetrics: FinancialMetrics;
  readonly cashFlow: CashFlowProjection;
  readonly sensitivityAnalysis?: SensitivityAnalysis;
}

// ============= SUPPORTING INTERFACES =============

/**
 * Energy production data for different time periods
 */
export interface EnergyProduction {
  readonly hourlyProduction: number[]; // kWh per hour
  readonly dailyProduction: number[]; // kWh per day
  readonly monthlyProduction: number[]; // kWh per month
  readonly annualProduction: number; // kWh per year
  readonly specificProduction: number; // kWh/kWp/year
  readonly capacityFactor: number; // %
  readonly worstMonthProduction: number; // kWh
  readonly bestMonthProduction: number; // kWh
  readonly averageDailyProduction: number; // kWh/day
}

/**
 * System performance metrics
 */
export interface PerformanceMetrics {
  readonly performanceRatio: number; // %
  readonly systemEfficiency: number; // %
  readonly temperatureCorrectedPR: number; // %
  readonly availability: number; // %
  readonly energyYield: number; // kWh/kWp
  readonly co2EmissionsAvoided: number; // tons/year
}

/**
 * Physical system configuration
 */
export interface SystemConfiguration {
  readonly tiltAngle: number; // degrees
  readonly azimuthAngle: number; // degrees
  readonly mountingType: MountingType;
  readonly trackingSystem?: TrackingSystem;
  readonly shadingAnalysis?: ShadingAnalysis;
  readonly stringConfiguration: StringConfiguration[];
}

/**
 * Battery energy management strategy
 */
export interface EnergyManagement {
  readonly strategy: BessStrategy;
  readonly peakShaving?: PeakShavingConfig;
  readonly loadShifting?: LoadShiftingConfig;
  readonly backupPower?: BackupPowerConfig;
  readonly gridServices?: GridServicesConfig;
}

/**
 * Economic benefits specific to BESS
 */
export interface BessEconomicBenefits {
  readonly arbitrageRevenue: number; // $/year
  readonly peakShavingSavings: number; // $/year
  readonly gridServiceRevenue: number; // $/year
  readonly backupValue: number; // $/year
  readonly totalAnnualBenefit: number; // $/year
}

/**
 * Technical specifications for BESS
 */
export interface BessTechnicalSpecs {
  readonly nominalVoltage: number; // V
  readonly maxChargeCurrent: number; // A
  readonly maxDischargeCurrent: number; // A
  readonly operatingTemperature: TemperatureRange;
  readonly selfDischargeRate: number; // %/month
  readonly warranty: BessWarranty;
}

/**
 * Cost breakdown for initial investment
 */
export interface CostBreakdown {
  readonly equipmentCost: number; // $
  readonly installationCost: number; // $
  readonly engineeringCost: number; // $
  readonly permitCost: number; // $
  readonly interconnectionCost: number; // $
  readonly contingencyCost: number; // $
  readonly totalCost: number; // $
  readonly costPerWatt: number; // $/W
}

/**
 * Annual operational costs
 */
export interface OperationalCosts {
  readonly maintenanceCost: number; // $/year
  readonly insuranceCost: number; // $/year
  readonly monitoringCost: number; // $/year
  readonly replacementCost: number; // $/year (escalated)
  readonly totalOperationalCost: number; // $/year
}

/**
 * Revenue streams from the system
 */
export interface RevenueStreams {
  readonly energySavings: number; // $/year
  readonly netMeteringCredits?: number; // $/year
  readonly srecRevenue?: number; // $/year
  readonly gridServiceRevenue?: number; // $/year
  readonly totalRevenue: number; // $/year
}

/**
 * Key financial performance indicators
 */
export interface FinancialMetrics {
  readonly paybackPeriod: number; // years
  readonly netPresentValue: number; // $
  readonly internalRateOfReturn: number; // %
  readonly levelizedCostOfEnergy: number; // $/kWh
  readonly returnOnInvestment: number; // %
  readonly benefitCostRatio: number;
  readonly modifiedInternalRateOfReturn?: number; // %
}

/**
 * Cash flow projection over system lifetime
 */
export interface CashFlowProjection {
  readonly yearlyCashFlows: YearlyCashFlow[];
  readonly cumulativeCashFlow: number[];
  readonly discountedCashFlow: number[];
  readonly positiveCashFlowYear: number; // Year when cash flow becomes positive
}

/**
 * Metadata for calculation tracking
 */
export interface CalculationMetadata {
  readonly version: string;
  readonly algorithm: string;
  readonly dataSource: string;
  readonly assumptions: string[];
  readonly limitations: string[];
  readonly accuracy?: number; // % confidence
  readonly validationStatus?: 'validated' | 'pending' | 'failed';
}

// ============= ENUMS FOR SUPPORTING TYPES =============

export enum BatteryType {
  LITHIUM_ION = 'LITHIUM_ION',
  LITHIUM_IRON_PHOSPHATE = 'LITHIUM_IRON_PHOSPHATE',
  LEAD_ACID = 'LEAD_ACID',
  FLOW_BATTERY = 'FLOW_BATTERY',
  SODIUM_ION = 'SODIUM_ION'
}

export enum MountingType {
  ROOF_MOUNTED = 'ROOF_MOUNTED',
  GROUND_MOUNTED = 'GROUND_MOUNTED',
  CARPORT = 'CARPORT',
  FACADE = 'FACADE',
  FLOATING = 'FLOATING'
}

export enum BessStrategy {
  PEAK_SHAVING = 'PEAK_SHAVING',
  LOAD_SHIFTING = 'LOAD_SHIFTING',
  BACKUP_ONLY = 'BACKUP_ONLY',
  GRID_SERVICES = 'GRID_SERVICES',
  SELF_CONSUMPTION = 'SELF_CONSUMPTION',
  HYBRID = 'HYBRID'
}

// ============= ADDITIONAL SUPPORTING INTERFACES =============

export interface TrackingSystem {
  readonly type: 'single_axis' | 'dual_axis';
  readonly trackingGain: number; // % energy increase
  readonly backtracking: boolean;
}

export interface ShadingAnalysis {
  readonly shadingLosses: number; // %
  readonly shadingProfile: number[]; // Hourly shading factor
  readonly horizonProfile?: number[]; // Horizon elevation angles
}

export interface StringConfiguration {
  readonly stringId: string;
  readonly moduleCount: number;
  readonly mpptId: number;
  readonly estimatedStringVoltage: number; // V
  readonly estimatedStringCurrent: number; // A
}

export interface PeakShavingConfig {
  readonly demandLimit: number; // kW
  readonly targetReduction: number; // %
  readonly monthlySavings: number; // $
}

export interface LoadShiftingConfig {
  readonly offPeakRate: number; // $/kWh
  readonly peakRate: number; // $/kWh
  readonly shoulderRate?: number; // $/kWh
  readonly annualSavings: number; // $
}

export interface BackupPowerConfig {
  readonly backupCapacity: number; // kWh
  readonly criticalLoad: number; // kW
  readonly autonomyHours: number;
  readonly outageValue: number; // $/year
}

export interface GridServicesConfig {
  readonly services: string[]; // Frequency regulation, spinning reserve, etc.
  readonly capacityPayments: number; // $/year
  readonly energyPayments: number; // $/year
}

export interface TemperatureRange {
  readonly min: number; // °C
  readonly max: number; // °C
  readonly optimal: number; // °C
}

export interface BessWarranty {
  readonly years: number;
  readonly throughput: number; // MWh
  readonly cycles: number;
  readonly remainingCapacity: number; // % at end of warranty
}

export interface YearlyCashFlow {
  readonly year: number;
  readonly revenue: number;
  readonly costs: number;
  readonly netCashFlow: number;
  readonly cumulativeCashFlow: number;
  readonly discountedCashFlow: number;
}

export interface SensitivityAnalysis {
  readonly parameter: string;
  readonly baseValue: number;
  readonly scenarios: SensitivityScenario[];
}

export interface SensitivityScenario {
  readonly variation: number; // % change
  readonly npv: number;
  readonly irr: number;
  readonly paybackPeriod: number;
}