/**
 * Request types for calculation operations
 * 
 * This module defines the request DTOs for creating and updating calculations
 * in the solar and BESS system.
 */

import { Coordinates, IrradiationData, LossesConfiguration, FinancialParameters } from './calculation.types';

// ============= CREATE REQUESTS =============

/**
 * Request to create a solar calculation
 * 
 * @example
 * ```typescript
 * const request: CreateSolarCalculationRequest = {
 *   projectId: 'proj-123',
 *   systemParams: {
 *     potenciaNominal: 5000,
 *     area: 35,
 *     eficiencia: 0.85,
 *     perdas: 15,
 *     inclinacao: 30,
 *     orientacao: 0
 *   },
 *   coordinates: {
 *     latitude: -23.5505,
 *     longitude: -46.6333
 *   },
 *   irradiationData: {
 *     globalHorizontalIrradiation: 4.8,
 *     source: 'NASA_POWER',
 *     period: 'ANNUAL'
 *   }
 * };
 * ```
 */
export interface CreateSolarCalculationRequest {
  readonly projectId: string;
  readonly userId: string;
  readonly systemParams: SolarSystemParams;
  readonly coordinates: Coordinates;
  readonly irradiationData: IrradiationData;
  readonly lossesConfiguration?: Partial<LossesConfiguration>;
  readonly financialParams?: FinancialParameters;
  readonly metadata?: CalculationMetadata;
}

/**
 * Request to create a BESS calculation
 * 
 * @example
 * ```typescript
 * const request: CreateBessCalculationRequest = {
 *   projectId: 'proj-123',
 *   userId: 'user-456',
 *   batteryParams: {
 *     capacity: 10000,
 *     power: 5000,
 *     batteryType: 'LITHIUM_ION',
 *     depthOfDischarge: 80
 *   },
 *   energyManagementStrategy: 'SELF_CONSUMPTION',
 *   loadProfile: {
 *     averageDailyConsumption: 30,
 *     peakDemand: 5,
 *     loadProfile: [2.5, 2.8, 3.2, ...]
 *   }
 * };
 * ```
 */
export interface CreateBessCalculationRequest {
  readonly projectId: string;
  readonly userId: string;
  readonly batteryParams: BatteryParams;
  readonly energyManagementStrategy: BessStrategy;
  readonly loadProfile: LoadProfile;
  readonly gridConnection?: GridConnectionParams;
  readonly financialParams?: FinancialParameters;
  readonly metadata?: CalculationMetadata;
}

/**
 * Request to create a financial calculation
 * 
 * @example
 * ```typescript
 * const request: CreateFinancialCalculationRequest = {
 *   projectId: 'proj-123',
 *   userId: 'user-456',
 *   investmentParams: {
 *     totalInvestment: 25000,
 *     equipmentCost: 18000,
 *     installationCost: 5000,
 *     otherCosts: 2000
 *   },
 *   revenueParams: {
 *     electricityRate: 0.65,
 *     annualConsumption: 6000,
 *     exportTariff: 0.45
 *   },
 *   financialParams: {
 *     discountRate: 0.08,
 *     systemLifespan: 25,
 *     inflationRate: 0.04
 *   }
 * };
 * ```
 */
export interface CreateFinancialCalculationRequest {
  readonly projectId: string;
  readonly userId: string;
  readonly investmentParams: InvestmentParams;
  readonly revenueParams: RevenueParams;
  readonly financialParams: FinancialParameters;
  readonly sensitivityParams?: SensitivityParams;
  readonly metadata?: CalculationMetadata;
}

/**
 * Request to update an existing calculation
 * 
 * @example
 * ```typescript
 * const request: UpdateCalculationRequest = {
 *   calculationId: 'calc-123',
 *   systemParams: {
 *     potenciaNominal: 6000, // Updated from 5000
 *     area: 42
 *   },
 *   financialParams: {
 *     electricityRate: 0.68 // Updated rate
 *   }
 * };
 * ```
 */
export interface UpdateCalculationRequest {
  readonly calculationId: string;
  readonly userId: string;
  readonly systemParams?: Partial<SolarSystemParams>;
  readonly batteryParams?: Partial<BatteryParams>;
  readonly investmentParams?: Partial<InvestmentParams>;
  readonly revenueParams?: Partial<RevenueParams>;
  readonly financialParams?: Partial<FinancialParameters>;
  readonly lossesConfiguration?: Partial<LossesConfiguration>;
  readonly metadata?: Partial<CalculationMetadata>;
  readonly version?: string; // For optimistic locking
}

// ============= SUPPORTING INTERFACES =============

/**
 * Solar system parameters
 */
export interface SolarSystemParams {
  readonly potenciaNominal: number; // Wp
  readonly area: number; // m²
  readonly eficiencia?: number; // % (0-1)
  readonly perdas?: number; // % (0-100)
  readonly inclinacao: number; // degrees
  readonly orientacao: number; // degrees (0 = North)
  readonly tipoMontagem?: 'roof_mounted' | 'ground_mounted' | 'carport';
  readonly sistemaRastreamento?: boolean;
  readonly fatorSombreamento?: number; // % (0-100)
  readonly temperaturaProjeto?: number; // °C
}

/**
 * Battery parameters for BESS
 */
export interface BatteryParams {
  readonly capacity: number; // Wh
  readonly power: number; // W
  readonly batteryType: BatteryType;
  readonly depthOfDischarge?: number; // % (0-100)
  readonly roundTripEfficiency?: number; // % (0-100)
  readonly cycleLife?: number; // cycles
  readonly nominalVoltage?: number; // V
  readonly batteryCount?: number;
  readonly configuration?: 'series' | 'parallel' | 'hybrid';
}

/**
 * Load profile for BESS calculations
 */
export interface LoadProfile {
  readonly averageDailyConsumption: number; // kWh/day
  readonly peakDemand: number; // kW
  readonly loadProfile?: number[]; // Hourly consumption for 24h
  readonly criticalLoad?: number; // kW (for backup calculations)
  readonly seasonality?: 'summer' | 'winter' | 'average';
  readonly loadGrowthRate?: number; // % annual
}

/**
 * Grid connection parameters
 */
export interface GridConnectionParams {
  readonly isConnected: boolean;
  readonly exportAllowed: boolean;
  readonly importTariff?: number; // $/kWh
  readonly exportTariff?: number; // $/kWh
  readonly demandCharges?: number; // $/kW/month
  readonly connectionCapacity?: number; // kW
  readonly gridType?: 'monofasico' | 'bifasico' | 'trifasico';
}

/**
 * Investment parameters
 */
export interface InvestmentParams {
  readonly totalInvestment: number; // $
  readonly equipmentCost?: number; // $
  readonly installationCost?: number; // $
  readonly engineeringCost?: number; // $
  readonly permitCost?: number; // $
  readonly interconnectionCost?: number; // $
  readonly contingencyCost?: number; // $
  readonly financingParams?: FinancingParams;
}

/**
 * Financing parameters
 */
export interface FinancingParams {
  readonly financingType: 'cash' | 'loan' | 'lease' | 'ppa';
  readonly downPayment?: number; // $ or %
  readonly loanAmount?: number; // $
  readonly interestRate?: number; // % annual
  readonly loanTerm?: number; // years
  readonly leaseRate?: number; // $/month or $/kW/month
  readonly ppaRate?: number; // $/kWh
}

/**
 * Revenue parameters
 */
export interface RevenueParams {
  readonly electricityRate: number; // $/kWh
  readonly annualConsumption?: number; // kWh/year
  readonly exportTariff?: number; // $/kWh
  readonly netMetering?: boolean;
  readonly srecRevenue?: number; // $/SREC
  readonly srecYield?: number; // SREC/MWh/year
  readonly demandChargeReduction?: number; // $/year
  readonly capacityPayments?: number; // $/year
}

/**
 * Sensitivity analysis parameters
 */
export interface SensitivityParams {
  readonly electricityRateVariation?: number; // % (±)
  readonly investmentCostVariation?: number; // % (±)
  readonly productionVariation?: number; // % (±)
  readonly discountRateVariation?: number; // % (±)
  readonly scenarios?: SensitivityScenario[];
}

/**
 * Sensitivity scenario definition
 */
export interface SensitivityScenario {
  readonly name: string;
  readonly electricityRateMultiplier?: number;
  readonly investmentCostMultiplier?: number;
  readonly productionMultiplier?: number;
  readonly discountRate?: number;
}

/**
 * Calculation metadata
 */
export interface CalculationMetadata {
  readonly name?: string;
  readonly description?: string;
  readonly tags?: string[];
  readonly assumptions?: string[];
  readonly limitations?: string[];
  readonly dataSource?: string;
  readonly calculationMethod?: string;
  readonly version?: string;
  readonly isTemplate?: boolean;
  readonly sharedWith?: string[]; // User IDs
}

// ============= ENUMS =============

/**
 * Battery chemistry types
 */
export enum BatteryType {
  LITHIUM_ION = 'LITHIUM_ION',
  LITHIUM_IRON_PHOSPHATE = 'LITHIUM_IRON_PHOSPHATE',
  LEAD_ACID = 'LEAD_ACID',
  FLOW_BATTERY = 'FLOW_BATTERY',
  SODIUM_ION = 'SODIUM_ION',
  NICKEL_METAL_HYDRIDE = 'NICKEL_METAL_HYDRIDE'
}

/**
 * BESS energy management strategies
 */
export enum BessStrategy {
  PEAK_SHAVING = 'PEAK_SHAVING',
  LOAD_SHIFTING = 'LOAD_SHIFTING',
  BACKUP_ONLY = 'BACKUP_ONLY',
  GRID_SERVICES = 'GRID_SERVICES',
  SELF_CONSUMPTION = 'SELF_CONSUMPTION',
  HYBRID = 'HYBRID',
  ARBITRAGE = 'ARBITRAGE'
}

// ============= VALIDATION INTERFACES =============

/**
 * Validation result for calculation requests
 */
export interface CalculationRequestValidation {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'low' | 'medium' | 'high';
}