/**
 * Result types for calculation outputs
 * 
 * This module defines the result interfaces for calculation outputs
 * in the solar and BESS system.
 */

import { CalculationType, SystemType } from './calculation.types';

// ============= CORE RESULT INTERFACES =============

/**
 * Solar calculation result
 * 
 * @example
 * ```typescript
 * const result: SolarCalculationResult = {
 *   systemSize: 5000,
 *   moduleCount: 15,
 *   inverterCount: 1,
 *   totalArea: 35,
 *   energyProduction: {
 *     annualProduction: 6500,
 *     monthlyProduction: [450, 480, 520, ...],
 *     specificProduction: 1300
 *   },
 *   performanceMetrics: {
 *     performanceRatio: 0.78,
 *     systemEfficiency: 0.85,
 *     capacityFactor: 0.148
 *   }
 * };
 * ```
 */
export interface SolarCalculationResult {
  readonly systemSize: number; // Wp
  readonly moduleCount: number;
  readonly inverterCount: number;
  readonly totalArea: number; // m²
  readonly energyProduction: EnergyProductionResult;
  readonly performanceMetrics: SolarPerformanceMetrics;
  readonly systemConfiguration: SystemConfigurationResult;
  readonly environmentalImpact: EnvironmentalImpactResult;
  readonly economicSummary: EconomicSummaryResult;
  readonly calculatedAt: Date;
  readonly calculationVersion: string;
  readonly metadata?: ResultMetadata;
}

/**
 * BESS calculation result
 * 
 * @example
 * ```typescript
 * const result: BessCalculationResult = {
 *   batteryCapacity: 10000,
 *   batteryPower: 5000,
 *   batteryCount: 2,
 *   batteryType: 'LITHIUM_ION',
 *   energyManagement: {
 *     strategy: 'SELF_CONSUMPTION',
 *     annualSavings: 1200,
 *   },
 *   technicalSpecifications: {
 *     roundTripEfficiency: 92,
 *     cycleLife: 6000,
 *     depthOfDischarge: 80
 *   }
 * };
 * ```
 */
export interface BessCalculationResult {
  readonly batteryCapacity: number; // Wh
  readonly batteryPower: number; // W
  readonly batteryCount: number;
  readonly batteryType: string;
  readonly energyManagement: EnergyManagementResult;
  readonly technicalSpecifications: BessTechnicalResult;
  readonly economicBenefits: BessEconomicResult;
  readonly operationalAnalysis: BessOperationalResult;
  readonly calculatedAt: Date;
  readonly calculationVersion: string;
  readonly metadata?: ResultMetadata;
}

/**
 * Financial analysis result
 * 
 * @example
 * ```typescript
 * const result: FinancialAnalysisResult = {
 *   investmentAnalysis: {
 *     totalInvestment: 25000,
 *     equipmentCost: 18000,
 *     installationCost: 5000
 *   },
 *   financialMetrics: {
 *     npv: 15000,
 *     irr: 0.12,
 *     paybackPeriod: 6.5,
 *     roi: 0.60
 *   },
 *   cashFlowAnalysis: {
 *     yearlyCashFlows: [
 *       { year: 1, netCashFlow: 2000, cumulativeCashFlow: -23000 },
 *       { year: 2, netCashFlow: 2100, cumulativeCashFlow: -20900 }
 *     ]
 *   }
 * };
 * ```
 */
export interface FinancialAnalysisResult {
  readonly investmentAnalysis: InvestmentAnalysisResult;
  readonly financialMetrics: FinancialMetricsResult;
  readonly cashFlowAnalysis: CashFlowAnalysisResult;
  readonly sensitivityAnalysis: SensitivityAnalysisResult;
  readonly riskAssessment: FinancialRiskResult;
  readonly benchmarks: FinancialBenchmarksResult;
  readonly calculatedAt: Date;
  readonly calculationVersion: string;
  readonly metadata?: ResultMetadata;
}

/**
 * System summary result
 * 
 * @example
 * ```typescript
 * const summary: SystemSummary = {
 *   projectId: 'proj-123',
 *   systemType: 'HYBRID',
 *   totalCapacity: 15000,
 *   solarCapacity: 5000,
 *   bessCapacity: 10000,
 *   annualGeneration: 6500,
 *   annualSavings: 4200,
 *   paybackPeriod: 6.5,
 *   npv: 15000,
 *   environmentalImpact: {
 *     co2Savings: 546,
 *     treesEquivalent: 25
 *   }
 * };
 * ```
 */
export interface SystemSummary {
  readonly projectId: string;
  readonly systemType: SystemType;
  readonly totalCapacity: number; // W
  readonly solarCapacity?: number; // W
  readonly bessCapacity?: number; // Wh
  readonly annualGeneration?: number; // kWh
  readonly annualSavings?: number; // $
  readonly paybackPeriod?: number; // years
  readonly npv?: number; // $
  readonly irr?: number; // decimal
  readonly roi?: number; // decimal
  readonly environmentalImpact: EnvironmentalImpactResult;
  readonly performanceRating: 'excellent' | 'good' | 'fair' | 'poor';
  readonly lastUpdated: Date;
}

/**
 * Environmental impact result
 * 
 * @example
 * ```typescript
 * const impact: EnvironmentalImpact = {
 *   co2SavingsKg: 546,
 *   co2SavingsTons: 0.546,
 *   treesEquivalent: 25,
 *   carsEquivalent: 0.12,
 *   coalReductionKg: 1365,
 *   oilBarrelsSaved: 1.27,
 *   equivalentHomesPowered: 0.8
 * };
 * ```
 */
export interface EnvironmentalImpactResult {
  readonly co2SavingsKg: number;
  readonly co2SavingsTons: number;
  readonly treesEquivalent: number;
  readonly carsEquivalent: number;
  readonly coalReductionKg: number;
  readonly oilBarrelsSaved: number;
  readonly equivalentHomesPowered: number;
  readonly waterSavingsLiters?: number;
  readonly landUseHectares?: number;
}

// ============= DETAILED RESULT INTERFACES =============

/**
 * Energy production result details
 */
export interface EnergyProductionResult {
  readonly annualProduction: number; // kWh
  readonly monthlyProduction: number[]; // 12 months
  readonly dailyProduction: number[]; // 365 days
  readonly hourlyProduction?: number[]; // 8760 hours
  readonly specificProduction: number; // kWh/kWp
  readonly capacityFactor: number; // decimal
  readonly worstMonthProduction: number; // kWh
  readonly bestMonthProduction: number; // kWh
  readonly averageDailyProduction: number; // kWh/day
  readonly productionVariability: number; // % coefficient of variation
  readonly seasonalVariation: {
    readonly summer: number; // kWh
    readonly winter: number; // kWh
    readonly spring: number; // kWh
    readonly autumn: number; // kWh
  };
}

/**
 * Solar performance metrics
 */
export interface SolarPerformanceMetrics {
  readonly performanceRatio: number; // decimal
  readonly systemEfficiency: number; // decimal
  readonly temperatureCorrectedPR: number; // decimal
  readonly availability: number; // decimal
  readonly energyYield: number; // kWh/kWp
  readonly specificYield: number; // kWh/m²
  readonly degradationRate: number; // %/year
  readonly lossesBreakdown: {
    readonly temperatureLosses: number; // %
    readonly soilingLosses: number; // %
    readonly mismatchLosses: number; // %
    readonly wiringLosses: number; // %
    readonly inverterLosses: number; // %
    readonly shadingLosses: number; // %
    readonly availabilityLosses: number; // %
    readonly totalLosses: number; // %
  };
}

/**
 * System configuration result
 */
export interface SystemConfigurationResult {
  readonly tiltAngle: number; // degrees
  readonly azimuthAngle: number; // degrees
  readonly mountingType: string;
  readonly trackingSystem?: {
    readonly type: string;
    readonly trackingGain: number; // %
    readonly backtracking: boolean;
  };
  readonly shadingAnalysis?: {
    readonly shadingLosses: number; // %
    readonly shadingProfile: number[]; // hourly
    readonly horizonProfile: number[]; // degrees
  };
  readonly stringConfiguration: Array<{
    readonly stringId: string;
    readonly moduleCount: number;
    readonly mpptId: number;
    readonly estimatedVoltage: number; // V
    readonly estimatedCurrent: number; // A
  }>;
  readonly layoutOptimization: {
    readonly rows: number;
    readonly columns: number;
    readonly spacing: number; // m
    readonly totalArea: number; // m²
    readonly utilizationRate: number; // %
  };
}

/**
 * Energy management result for BESS
 */
export interface EnergyManagementResult {
  readonly strategy: string;
  readonly annualSavings: number; // $
  readonly peakShavingSavings?: number; // $
  readonly loadShiftingSavings?: number; // $
  readonly arbitrageRevenue?: number; // $
  readonly backupValue?: number; // $
  readonly gridServiceRevenue?: number; // $
  readonly utilizationRate: number; // %
  readonly throughput: number; // kWh/year
  readonly cycleCount: number; // cycles/year
  readonly operationalProfile: {
    readonly chargingProfile: number[]; // hourly
    readonly dischargingProfile: number[]; // hourly
    readonly stateOfChargeProfile: number[]; // hourly
  };
}

/**
 * BESS technical specifications result
 */
export interface BessTechnicalResult {
  readonly nominalVoltage: number; // V
  readonly maxChargeCurrent: number; // A
  readonly maxDischargeCurrent: number; // A
  readonly roundTripEfficiency: number; // %
  readonly depthOfDischarge: number; // %
  readonly cycleLife: number; // cycles
  readonly selfDischargeRate: number; // %/month
  readonly operatingTemperature: {
    readonly min: number; // °C
    readonly max: number; // °C
    readonly optimal: number; // °C
  };
  readonly warranty: {
    readonly years: number;
    readonly cycles: number;
    readonly throughput: number; // MWh
    readonly remainingCapacity: number; // %
  };
  readonly degradationProfile: {
    readonly year1: number; // % capacity
    readonly year10: number; // % capacity
    readonly endOfLife: number; // % capacity
    readonly annualDegradation: number; // %/year
  };
}

/**
 * BESS economic benefits result
 */
export interface BessEconomicResult {
  readonly totalAnnualBenefit: number; // $
  readonly benefitBreakdown: {
    readonly arbitrage: number; // $
    readonly peakShaving: number; // $
    readonly loadShifting: number; // $
    readonly backupPower: number; // $
    readonly gridServices: number; // $
  };
  readonly levelizedCostOfStorage: number; // $/kWh
  readonly paybackPeriod: number; // years
  readonly netPresentValue: number; // $
  readonly internalRateOfReturn: number; // %
  readonly benefitCostRatio: number;
  readonly revenueStreams: Array<{
    readonly source: string;
    readonly annualRevenue: number; // $
    readonly revenuePerKwh: number; // $/kWh
    readonly reliability: number; // % (confidence level)
  }>;
}

/**
 * BESS operational analysis result
 */
export interface BessOperationalResult {
  readonly availability: number; // %
  readonly utilizationRate: number; // %
  readonly efficiency: number; // %
  readonly maintenanceRequirements: {
    readonly frequency: string;
    readonly estimatedAnnualCost: number; // $
    readonly requiredExpertise: string;
    readonly sparePartsRecommendation: string;
  };
  readonly monitoringNeeds: string[];
  readonly operatingConstraints: string[];
  readonly optimizationOpportunities: string[];
  readonly performanceProjections: {
    readonly year5: number; // % of original capacity
    readonly year10: number; // % of original capacity
    readonly year15: number; // % of original capacity
  };
}

/**
 * Investment analysis result
 */
export interface InvestmentAnalysisResult {
  readonly totalInvestment: number; // $
  readonly costBreakdown: {
    readonly equipmentCost: number; // $
    readonly installationCost: number; // $
    readonly engineeringCost: number; // $
    readonly permitCost: number; // $
    readonly interconnectionCost: number; // $
    readonly contingencyCost: number; // $
    readonly softCosts: number; // $
  };
  readonly costPerWatt: number; // $/W
  readonly financingStructure?: {
    readonly financingType: string;
    readonly downPayment: number; // $
    readonly loanAmount: number; // $
    readonly interestRate: number; // %
    readonly loanTerm: number; // years
    readonly monthlyPayment: number; // $
  };
  readonly incentives: Array<{
    readonly type: string;
    readonly amount: number; // $
    readonly percentage: number; // % of investment
    readonly source: string;
    readonly expiration?: Date;
  }>;
}

/**
 * Financial metrics result
 */
export interface FinancialMetricsResult {
  readonly netPresentValue: number; // $
  readonly internalRateOfReturn: number; // %
  readonly modifiedInternalRateOfReturn?: number; // %
  readonly paybackPeriod: number; // years
  readonly discountedPaybackPeriod: number; // years
  readonly returnOnInvestment: number; // %
  readonly benefitCostRatio: number;
  readonly profitabilityIndex: number;
  readonly levelizedCostOfEnergy: number; // $/kWh
  readonly levelizedCostOfStorage?: number; // $/kWh
  readonly equivalentAnnualAnnuity: number; // $/year
  readonly savingsOverLifetime: number; // $
  readonly cumulativeSavings: Array<{
    readonly year: number;
    readonly savings: number; // $
    readonly cumulative: number; // $
  }>;
}

/**
 * Cash flow analysis result
 */
export interface CashFlowAnalysisResult {
  readonly yearlyCashFlows: Array<{
    readonly year: number;
    readonly revenue: number; // $
    readonly costs: number; // $
    readonly netCashFlow: number; // $
    readonly cumulativeCashFlow: number; // $
    readonly discountedCashFlow: number; // $
    readonly savings: number; // $
    readonly roi: number; // %
  }>;
  readonly cashFlowSummary: {
    readonly totalRevenue: number; // $
    readonly totalCosts: number; // $
    readonly totalNetCashFlow: number; // $
    readonly averageAnnualCashFlow: number; // $
    readonly cashFlowStability: number; // % (lower is more stable)
    readonly positiveCashFlowYear: number; // year when cash flow becomes positive
  };
  readonly cashFlowProjections: {
    readonly fiveYearTotal: number; // $
    readonly tenYearTotal: number; // $
    readonly twentyFiveYearTotal: number; // $
  };
}

/**
 * Sensitivity analysis result
 */
export interface SensitivityAnalysisResult {
  readonly parameters: Array<{
    readonly name: string;
    readonly baseValue: number;
    readonly scenarios: Array<{
      readonly variation: number; // % change
      readonly npv: number; // $
      readonly irr: number; // %
      readonly paybackPeriod: number; // years
    }>;
    readonly sensitivity: number; // NPV change per % parameter change
  }>;
  readonly tornadoChart: Array<{
    readonly parameter: string;
    readonly lowImpact: number; // $
    readonly highImpact: number; // $
    readonly range: number; // $
  }>;
  monteCarloSimulation?: {
    readonly meanNPV: number; // $
    readonly standardDeviation: number; // $
    readonly confidenceIntervals: {
      readonly p90: number; // $
      readonly p75: number; // $
      readonly p50: number; // $
      readonly p25: number; // $
      readonly p10: number; // $
    };
    readonly probabilityOfPositiveNPV: number; // %
  };
}

/**
 * Financial risk assessment result
 */
export interface FinancialRiskResult {
  readonly overallRiskLevel: 'low' | 'medium' | 'high' | 'very_high';
  readonly riskFactors: Array<{
    readonly category: string;
    readonly level: 'low' | 'medium' | 'high' | 'very_high';
    readonly description: string;
    readonly impact: number; // $ potential impact
    readonly probability: number; // % likelihood
    readonly mitigation: string;
  }>;
  readonly riskMitigationStrategies: string[];
  readonly contingencyRecommendations: {
    readonly costContingency: number; // % of investment
    readonly scheduleContingency: number; // % of timeline
    readonly performanceContingency: number; // % of production
  };
  readonly insuranceRequirements: string[];
}

/**
 * Financial benchmarks result
 */
export interface FinancialBenchmarksResult {
  readonly industryComparisons: {
    readonly averagePaybackPeriod: number; // years
    readonly averageROI: number; // %
    readonly averageNPV: number; // $ (for similar system size)
    readonly marketPenetration: number; // %
  };
  readonly regionalComparisons: {
    readonly stateAverage: number; // ROI
    readonly nationalAverage: number; // ROI
    readonly globalAverage: number; // ROI
  };
  readonly technologyComparisons: {
    readonly solarOnly: number; // ROI
    readonly solarWithStorage: number; // ROI
    readonly storageOnly: number; // ROI
  };
  readonly performanceRating: 'excellent' | 'above_average' | 'average' | 'below_average' | 'poor';
  readonly competitiveAdvantage: string[];
}

/**
 * Economic summary result
 */
export interface EconomicSummaryResult {
  readonly totalInvestment: number; // $
  readonly annualSavings: number; // $
  readonly lifetimeSavings: number; // $
  readonly paybackPeriod: number; // years
  readonly netPresentValue: number; // $
  readonly returnOnInvestment: number; // %
  readonly levelizedCost: number; // $/kWh
  readonly costPerKwh: number; // $/kWh
  readonly savingsPerKwh: number; // $/kWh
  readonly valuePerDollar: number; // lifetime savings / investment
}

/**
 * Result metadata
 */
export interface ResultMetadata {
  readonly calculationId: string;
  readonly version: string;
  readonly algorithm: string;
  readonly dataSource: string;
  readonly assumptions: string[];
  readonly limitations: string[];
  readonly accuracy?: number; // % confidence
  readonly validationStatus?: 'validated' | 'pending' | 'failed';
  readonly calculationTime: number; // ms
  readonly processingSteps: Array<{
    readonly step: string;
    readonly duration: number; // ms
    readonly status: 'success' | 'warning' | 'error';
    readonly message?: string;
  }>;
  readonly warnings?: string[];
  readonly errors?: string[];
}

// ============= AGGREGATED RESULT INTERFACES =============

/**
 * Combined system calculation result
 */
export interface CombinedSystemResult {
  readonly projectId: string;
  readonly systemType: SystemType;
  readonly solarResult?: SolarCalculationResult;
  readonly bessResult?: BessCalculationResult;
  readonly financialResult: FinancialAnalysisResult;
  readonly systemSummary: SystemSummary;
  readonly synergies: SystemSynergiesResult;
  readonly optimizationRecommendations: OptimizationRecommendationsResult;
  readonly calculatedAt: Date;
  readonly calculationVersion: string;
}

/**
 * System synergies result
 */
export interface SystemSynergiesResult {
  readonly totalSystemEfficiency: number; // %
  readonly combinedBenefits: {
    readonly increasedSelfConsumption: number; // %
    readonly peakDemandReduction: number; // %
    readonly gridIndependence: number; // %
    readonly revenueEnhancement: number; // $
  };
  readonly operationalSynergies: string[];
  readonly financialSynergies: string[];
  readonly environmentalSynergies: string[];
}

/**
 * Optimization recommendations result
 */
export interface OptimizationRecommendationsResult {
  readonly systemOptimization: Array<{
    readonly category: string;
    readonly recommendation: string;
    readonly potentialSavings: number; // $
    readonly implementationCost: number; // $
    readonly paybackPeriod: number; // years
    readonly priority: 'high' | 'medium' | 'low';
  }>;
  readonly operationalOptimization: Array<{
    readonly area: string;
    readonly action: string;
    readonly expectedBenefit: string;
    readonly complexity: 'simple' | 'moderate' | 'complex';
  }>;
  readonly financialOptimization: Array<{
    readonly strategy: string;
    readonly description: string;
    readonly potentialImprovement: number; // %
    readonly requirements: string[];
  }>;
}