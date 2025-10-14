import { SolarCalculationResponseDto } from '../dtos/output/SolarCalculationResponseDto';
import { 
  SystemCalculations,
  SystemConfiguration
} from '@bess-pro/shared';

// Local interfaces for types not yet properly exported
interface SolarCalculationResult {
  readonly systemSize: number;
  readonly moduleCount: number;
  readonly inverterCount: number;
  readonly totalArea: number;
  readonly energyProduction: EnergyProductionResult;
  readonly performanceMetrics: SolarPerformanceMetrics;
  readonly systemConfiguration: SystemConfiguration;
  readonly environmentalImpact: EnvironmentalImpactResult;
  readonly economicSummary: EconomicSummaryResult;
  readonly calculatedAt: Date;
  readonly calculationVersion: string;
  readonly metadata?: any;
}

interface SystemSummaryLocal {
  readonly projectId: string;
  readonly systemType: string;
  readonly totalCapacity: number;
  readonly solarCapacity?: number;
  readonly bessCapacity?: number;
  readonly annualGeneration?: number;
  readonly annualSavings?: number;
  readonly paybackPeriod?: number;
  readonly npv?: number;
  readonly irr?: number;
  readonly roi?: number;
  readonly environmentalImpact: EnvironmentalImpactResult;
  readonly performanceRating: 'excellent' | 'good' | 'fair' | 'poor';
  readonly lastUpdated: Date;
}

interface EnvironmentalImpactResult {
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

interface EnergyProductionResult {
  readonly annualProduction: number;
  readonly monthlyProduction: number[];
  readonly dailyProduction: number[];
  readonly hourlyProduction?: number[];
  readonly specificProduction: number;
  readonly capacityFactor: number;
  readonly worstMonthProduction: number;
  readonly bestMonthProduction: number;
  readonly averageDailyProduction: number;
  readonly productionVariability: number;
  readonly seasonalVariation: {
    readonly summer: number;
    readonly winter: number;
    readonly spring: number;
    readonly autumn: number;
  };
}

interface SolarPerformanceMetrics {
  readonly performanceRatio: number;
  readonly systemEfficiency: number;
  readonly temperatureCorrectedPR: number;
  readonly availability: number;
  readonly energyYield: number;
  readonly specificYield: number;
  readonly degradationRate: number;
  readonly lossesBreakdown: {
    readonly temperatureLosses: number;
    readonly soilingLosses: number;
    readonly mismatchLosses: number;
    readonly wiringLosses: number;
    readonly inverterLosses: number;
    readonly shadingLosses: number;
    readonly availabilityLosses: number;
    readonly totalLosses: number;
  };
}

interface EconomicSummaryResult {
  readonly totalInvestment: number;
  readonly annualSavings: number;
  readonly lifetimeSavings: number;
  readonly paybackPeriod: number;
  readonly netPresentValue: number;
  readonly returnOnInvestment: number;
  readonly levelizedCost: number;
  readonly costPerKwh: number;
  readonly savingsPerKwh: number;
  readonly valuePerDollar: number;
}

interface SystemConfigurationResult {
  readonly tiltAngle: number;
  readonly azimuthAngle: number;
  readonly mountingType: string;
  readonly trackingSystem?: {
    readonly type: string;
    readonly trackingGain: number;
    readonly backtracking: boolean;
  };
  readonly shadingAnalysis?: {
    readonly shadingLosses: number;
    readonly shadingProfile: number[];
    readonly horizonProfile: number[];
  };
  readonly stringConfiguration: Array<{
    readonly stringId: string;
    readonly moduleCount: number;
    readonly mpptId: number;
    readonly estimatedVoltage: number;
    readonly estimatedCurrent: number;
  }>;
  readonly layoutOptimization: {
    readonly rows: number;
    readonly columns: number;
    readonly spacing: number;
    readonly totalArea: number;
    readonly utilizationRate: number;
  };
}

/**
 * Mapper for solar system calculations
 * 
 * Handles conversion between domain objects and DTOs for solar calculations,
 * including energy production, performance metrics, and system configuration.
 */
export class SolarCalculationMapper {

  /**
   * Converts calculation result to response DTO
   * 
   * @param calculation - System calculation domain object
   * @param logger - Optional calculation logger for debugging
   * @returns Formatted response DTO for API consumption
   */
  static toResponseDto(
    calculation: any, 
    logger?: any
  ): SolarCalculationResponseDto {
    if (!calculation) {
      throw new Error('Calculation data is required');
    }

    const monthlyGeneration = calculation.monthlyGeneration || calculation.energy?.monthlyGeneration || [];
    const annualGeneration = calculation.annualGeneration || calculation.energy?.annualGeneration || 0;
    const moduleCount = calculation.moduleCount || calculation.sizing?.moduleCount || 0;
    const systemSize = calculation.systemSize || calculation.sizing?.recommendedPower || 0;
    const totalArea = calculation.totalArea || calculation.sizing?.totalArea || 0;

    return {
      monthlyGeneration,
      annualGeneration,
      optimalModuleCount: {
        moduleCount,
        totalPower: systemSize,
        areaUsed: totalArea
      },
      co2Savings: this.calculateCO2Savings(annualGeneration),
      orientationLoss: this.calculateOrientationLoss(calculation.azimuthAngle || 0),
      financialAnalysis: calculation.financial ? this.mapFinancialAnalysis(calculation.financial) : undefined,
      calculationLogs: logger?.getLogs?.() || [],
      _rawLogs: logger?.getRawLogs?.() || []
    };
  }

  /**
   * Converts calculation result to comprehensive SolarCalculationResult
   * 
   * @param calculation - System calculation domain object
   * @param logger - Optional calculation logger for debugging
   * @returns Comprehensive solar calculation result
   */
  static toSolarCalculationResult(
    calculation: any, 
    logger?: any
  ): SolarCalculationResult {
    if (!calculation) {
      throw new Error('Calculation data is required');
    }

    const systemSize = calculation.systemSize || calculation.sizing?.recommendedPower || 0;
    const moduleCount = calculation.moduleCount || calculation.sizing?.moduleCount || 0;
    const inverterCount = calculation.inverterCount || 1;
    const totalArea = calculation.totalArea || calculation.sizing?.totalArea || 0;
    const annualGeneration = calculation.annualGeneration || calculation.energy?.annualGeneration || 0;

    return {
      systemSize,
      moduleCount,
      inverterCount,
      totalArea,
      energyProduction: this.mapEnergyProduction(calculation),
      performanceMetrics: this.mapPerformanceMetrics(calculation),
      systemConfiguration: this.mapSystemConfiguration(calculation) as any,
      environmentalImpact: this.toEnvironmentalImpact(annualGeneration),
      economicSummary: this.mapEconomicSummary(calculation),
      calculatedAt: calculation.calculatedAt || new Date(),
      calculationVersion: calculation.calculationVersion || '1.0.0',
      metadata: this.mapResultMetadata(calculation, logger)
    };
  }

  /**
   * Creates a system summary from calculation data
   * 
   * @param data - Raw calculation data or system calculations
   * @returns System summary with key metrics
   */
  static toSystemSummary(data: any): SystemSummaryLocal {
    const annualGeneration = data.annualProduction || data.annualGeneration || 0;
    const systemSize = data.systemSize || data.potenciaNominal || 0;
    const performanceRatio = data.performanceRatio || data.performanceRatio || 0;

    return {
      projectId: data.projectId || 'unknown',
      systemType: data.systemType || 'GRID_TIED',
      totalCapacity: systemSize,
      solarCapacity: systemSize,
      annualGeneration,
      annualSavings: this.calculateEstimatedSavings(annualGeneration),
      paybackPeriod: data.paybackPeriod || data.payback,
      npv: data.financial?.npv || data.npv || 0,
      irr: data.financial?.irr || data.irr,
      roi: data.financial?.roi || data.roi,
      environmentalImpact: this.toEnvironmentalImpact(annualGeneration),
      performanceRating: this.determinePerformanceRating(data),
      lastUpdated: data.calculatedAt || new Date()
    };
  }

  /**
   * Calculates environmental impact from annual generation
   * 
   * @param annualGeneration - Annual energy generation in kWh
   * @returns Environmental impact metrics
   */
  static toEnvironmentalImpact(annualGeneration: number): EnvironmentalImpactResult {
    // Emission factor: 0.084 kg CO2/kWh for Brazilian grid (ANEEL 2023)
    const co2EmissionFactor = 0.084;
    const co2Savings = annualGeneration * co2EmissionFactor;

    // Trees equivalent: 1 tree absorbs ~22 kg CO2/year
    const treesEquivalent = co2Savings / 22;

    // Cars equivalent: 1 car emits ~4.6 tons CO2/year
    const carsEquivalent = co2Savings / 4600;

    return {
      co2SavingsKg: Math.round(co2Savings),
      co2SavingsTons: Number((co2Savings / 1000).toFixed(2)),
      treesEquivalent: Math.round(treesEquivalent),
      carsEquivalent: Number(carsEquivalent.toFixed(2)),
      coalReductionKg: Math.round(co2Savings * 2.5), // Coal factor approximation
      oilBarrelsSaved: Number((co2Savings / 430).toFixed(3)), // 1 barrel = 430 kg CO2
      equivalentHomesPowered: Number((annualGeneration / 3650).toFixed(2)) // Average home uses 10 kWh/day
    };
  }

  /**
   * Converts domain calculation to shared types format
   * 
   * @param domain - Domain calculation object
   * @returns Shared types SystemCalculations
   */
  static toSharedCalculation(domain: any): SystemCalculations {
    return {
      energy: {
        monthlyGeneration: domain.energy?.monthlyGeneration || domain.monthlyGeneration || [],
        annualGeneration: domain.energy?.annualGeneration || domain.annualGeneration || 0,
        specificProduction: domain.energy?.specificProduction || domain.specificProduction || 0,
        performanceRatio: domain.energy?.performanceRatio || domain.performanceRatio || 0,
        temperatureLosses: domain.energy?.temperatureLosses || domain.temperatureLosses || 0,
        systemLosses: domain.energy?.systemLosses || domain.systemLosses || 0
      },
      financial: {
        initialInvestment: domain.financial?.initialInvestment || domain.initialInvestment || 0,
        annualSavings: domain.financial?.annualSavings || domain.annualSavings || 0,
        paybackYears: domain.financial?.paybackYears || domain.paybackYears || 0,
        roi: domain.financial?.roi || domain.roi || 0,
        npv: domain.financial?.npv || domain.npv || 0,
        irr: domain.financial?.irr || domain.irr || 0,
        lcoe: domain.financial?.lcoe || domain.lcoe || 0
      },
      sizing: {
        recommendedPower: domain.sizing?.recommendedPower || domain.systemSize || 0,
        moduleCount: domain.sizing?.moduleCount || domain.moduleCount || 0,
        inverterCount: domain.sizing?.inverterCount || domain.inverterCount || 1,
        totalArea: domain.sizing?.totalArea || domain.totalArea || 0,
        roofUsagePercentage: domain.sizing?.roofUsagePercentage || domain.roofUsagePercentage || 0
      },
      production: {
        hourlyProduction: domain.production?.hourlyProduction || [],
        dailyProduction: domain.production?.dailyProduction || [],
        monthlyProduction: domain.production?.monthlyProduction || domain.monthlyGeneration || [],
        annualProduction: domain.production?.annualProduction || domain.annualGeneration || 0,
        worstMonthProduction: domain.production?.worstMonthProduction || 0,
        bestMonthProduction: domain.production?.bestMonthProduction || 0
      },
      calculatedAt: domain.calculatedAt || new Date(),
      calculationVersion: domain.calculationVersion || '1.0.0'
    };
  }

  /**
   * Maps a list of calculations to response DTOs
   * 
   * @param calculations - Array of system calculations
   * @param logger - Optional logger
   * @returns Array of response DTOs
   */
  static toResponseDtoList(
    calculations: any[], 
    logger?: any
  ): SolarCalculationResponseDto[] {
    return calculations.map(calc => this.toResponseDto(calc, logger));
  }

  // ============= PRIVATE HELPER METHODS =============

  /**
   * Calculates CO2 savings from annual generation
   */
  private static calculateCO2Savings(annualGeneration: number): number {
    const co2EmissionFactor = 0.084; // kg CO2/kWh
    return Math.round(annualGeneration * co2EmissionFactor);
  }

  /**
   * Calculates orientation losses based on azimuth angle
   */
  private static calculateOrientationLoss(azimuthAngle: number): number {
    // Optimal azimuth in southern hemisphere: 0° (North)
    const optimalAzimuth = 0;
    const deviation = Math.abs(azimuthAngle - optimalAzimuth);
    
    // Simple loss calculation: 0.5% per degree of deviation, max 20%
    const loss = Math.min(deviation * 0.5, 20);
    return Number(loss.toFixed(2));
  }

  /**
   * Maps financial analysis to DTO format
   */
  private static mapFinancialAnalysis(financial: any): any {
    return {
      economiaAnualEstimada: financial.revenueStreams?.energySavings || 0,
      vpl: financial.financialMetrics?.netPresentValue || 0,
      tir: financial.financialMetrics?.internalRateOfReturn || 0,
      payback: financial.financialMetrics?.paybackPeriod || 0,
      fluxoCaixa: financial.cashFlow?.yearlyCashFlows?.map((item: any) => ({
        ano: item.year,
        fluxoLiquido: item.netCashFlow,
        economia: item.revenue,
        custoSemFV: item.costs + item.revenue,
        custoComFV: item.costs
      })) || []
    };
  }

  /**
   * Calculates estimated annual savings
   */
  private static calculateEstimatedSavings(annualGeneration: number): number {
    const averageTariff = 0.65; // BRL/kWh (Brazilian average)
    return Math.round(annualGeneration * averageTariff);
  }

  /**
   * Determines system status based on calculation data
   */
  private static determineSystemStatus(data: any): 'optimal' | 'acceptable' | 'needs_improvement' {
    const performanceRatio = data.performanceRatio || 0;
    
    if (performanceRatio >= 0.75) return 'optimal';
    if (performanceRatio >= 0.65) return 'acceptable';
    return 'needs_improvement';
  }

  /**
   * Determines performance rating for system summary
   */
  private static determinePerformanceRating(data: any): 'excellent' | 'good' | 'fair' | 'poor' {
    const performanceRatio = data.performanceRatio || 0;
    
    if (performanceRatio >= 0.80) return 'excellent';
    if (performanceRatio >= 0.70) return 'good';
    if (performanceRatio >= 0.60) return 'fair';
    return 'poor';
  }

  /**
   * Maps energy production data
   */
  private static mapEnergyProduction(calculation: any): EnergyProductionResult {
    const monthlyGeneration = calculation.monthlyGeneration || calculation.energy?.monthlyGeneration || [];
    const annualGeneration = calculation.annualGeneration || calculation.energy?.annualGeneration || 0;
    const systemSize = calculation.systemSize || calculation.sizing?.recommendedPower || 1;

    return {
      annualProduction: annualGeneration,
      monthlyProduction: monthlyGeneration,
      dailyProduction: calculation.production?.dailyProduction || [],
      hourlyProduction: calculation.production?.hourlyProduction || [],
      specificProduction: systemSize > 0 ? annualGeneration / systemSize : 0,
      capacityFactor: systemSize > 0 ? (annualGeneration / (systemSize * 8760)) : 0,
      worstMonthProduction: Math.min(...monthlyGeneration.filter((v: number) => v > 0), 0),
      bestMonthProduction: Math.max(...monthlyGeneration, 0),
      averageDailyProduction: annualGeneration / 365,
      productionVariability: this.calculateProductionVariability(monthlyGeneration),
      seasonalVariation: this.calculateSeasonalVariation(monthlyGeneration)
    };
  }

  /**
   * Maps performance metrics
   */
  private static mapPerformanceMetrics(calculation: any): SolarPerformanceMetrics {
    const performanceRatio = calculation.performanceRatio || calculation.energy?.performanceRatio || 0;
    
    return {
      performanceRatio,
      systemEfficiency: calculation.systemEfficiency || 0.85,
      temperatureCorrectedPR: calculation.temperatureCorrectedPR || performanceRatio,
      availability: calculation.availability || 0.98,
      energyYield: calculation.energyYield || 0,
      specificYield: calculation.specificYield || 0,
      degradationRate: calculation.degradationRate || 0.005,
      lossesBreakdown: {
        temperatureLosses: calculation.temperatureLosses || 15,
        soilingLosses: calculation.soilingLosses || 2,
        mismatchLosses: calculation.mismatchLosses || 2,
        wiringLosses: calculation.wiringLosses || 2,
        inverterLosses: calculation.inverterLosses || 3,
        shadingLosses: calculation.shadingLosses || 0,
        availabilityLosses: calculation.availabilityLosses || 1,
        totalLosses: calculation.totalLosses || 25
      }
    };
  }

  /**
   * Maps system configuration
   */
  private static mapSystemConfiguration(calculation: any): any {
    return {
      tiltAngle: calculation.tiltAngle || 30,
      azimuthAngle: calculation.azimuthAngle || 0,
      mountingType: calculation.mountingType || 'fixed',
      trackingSystem: calculation.trackingSystem,
      shadingAnalysis: calculation.shadingAnalysis,
      stringConfiguration: calculation.stringConfiguration || [],
      layoutOptimization: {
        rows: calculation.layoutOptimization?.rows || 0,
        columns: calculation.layoutOptimization?.columns || 0,
        spacing: calculation.layoutOptimization?.spacing || 0,
        totalArea: calculation.totalArea || 0,
        utilizationRate: calculation.layoutOptimization?.utilizationRate || 0
      }
    };
  }

  /**
   * Maps economic summary
   */
  private static mapEconomicSummary(calculation: any): EconomicSummaryResult {
    const annualGeneration = calculation.annualGeneration || 0;
    
    return {
      totalInvestment: calculation.financial?.totalInvestment || calculation.totalInvestment || 0,
      annualSavings: this.calculateEstimatedSavings(annualGeneration),
      lifetimeSavings: calculation.financial?.lifetimeSavings || 0,
      paybackPeriod: calculation.paybackPeriod || calculation.financial?.paybackPeriod || 0,
      netPresentValue: calculation.financial?.npv || calculation.npv || 0,
      returnOnInvestment: calculation.financial?.roi || calculation.roi || 0,
      levelizedCost: calculation.financial?.lcoe || calculation.lcoe || 0,
      costPerKwh: calculation.financial?.costPerKwh || 0,
      savingsPerKwh: this.calculateEstimatedSavings(annualGeneration) / annualGeneration,
      valuePerDollar: calculation.financial?.valuePerDollar || 0
    };
  }

  /**
   * Maps result metadata
   */
  private static mapResultMetadata(calculation: any, _logger?: any): any {
    return {
      calculationId: calculation.id || this.generateId(),
      version: calculation.calculationVersion || '1.0.0',
      algorithm: calculation.algorithm || 'pvlib',
      dataSource: calculation.dataSource || 'NASA_POWER',
      assumptions: calculation.assumptions || [],
      limitations: calculation.limitations || [],
      accuracy: calculation.accuracy,
      validationStatus: calculation.validationStatus || 'pending',
      calculationTime: calculation.calculationTime || 0,
      processingSteps: calculation.processingSteps || [],
      warnings: calculation.warnings || [],
      errors: calculation.errors || []
    };
  }

  /**
   * Calculates production variability
   */
  private static calculateProductionVariability(monthlyGeneration: number[]): number {
    if (monthlyGeneration.length === 0) return 0;
    
    const mean = monthlyGeneration.reduce((sum: number, val: number) => sum + val, 0) / monthlyGeneration.length;
    const variance = monthlyGeneration.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / monthlyGeneration.length;
    const standardDeviation = Math.sqrt(variance);
    
    return mean > 0 ? (standardDeviation / mean) * 100 : 0;
  }

  /**
   * Calculates seasonal variation
   */
  private static calculateSeasonalVariation(monthlyGeneration: number[]): any {
    if (monthlyGeneration.length < 12) {
      return { summer: 0, winter: 0, spring: 0, autumn: 0 };
    }

    // Southern hemisphere seasons
    const summer = monthlyGeneration[11] + monthlyGeneration[0] + monthlyGeneration[1]; // Dec, Jan, Feb
    const autumn = monthlyGeneration[2] + monthlyGeneration[3] + monthlyGeneration[4]; // Mar, Apr, May
    const winter = monthlyGeneration[5] + monthlyGeneration[6] + monthlyGeneration[7]; // Jun, Jul, Aug
    const spring = monthlyGeneration[8] + monthlyGeneration[9] + monthlyGeneration[10]; // Sep, Oct, Nov

    return { summer, winter, spring, autumn };
  }

  /**
   * Maps system type from domain to shared types
   */
  private static mapSystemType(systemType: string): string {
    const typeMap: Record<string, string> = {
      'grid_tied': 'GRID_TIED',
      'off_grid': 'OFF_GRID',
      'hybrid': 'HYBRID',
      'grid-tied': 'GRID_TIED',
      'off-grid': 'OFF_GRID'
    };
    return typeMap[systemType] || 'GRID_TIED';
  }

  /**
   * Maps calculation status from domain to shared types
   */
  private static mapCalculationStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'PENDING',
      'in_progress': 'IN_PROGRESS',
      'completed': 'COMPLETED',
      'failed': 'FAILED',
      'cancelled': 'CANCELLED',
      'expired': 'EXPIRED'
    };
    return statusMap[status] || 'PENDING';
  }

  /**
   * Maps financial parameters
   */
  private static mapFinancialParameters(params: any): any {
    return {
      electricityRate: params?.electricityRate || 0.65,
      inflationRate: params?.inflationRate || 4.5,
      discountRate: params?.discountRate || 8.0,
      systemLifespan: params?.systemLifespan || 25,
      currency: params?.currency || 'BRL',
      tariffEscalationRate: params?.tariffEscalationRate,
      maintenanceCostRate: params?.maintenanceCostRate,
      insuranceCostRate: params?.insuranceCostRate
    };
  }

  /**
   * Generates a unique ID for calculations
   */
  private static generateId(): string {
    return `calc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============= SUPPORTING INTERFACES =============

/**
 * System summary interface
 */
export interface SystemSummary {
  systemSize: number;
  annualGeneration: number;
  specificProduction: number;
  performanceRatio: number;
  co2Savings: number;
  estimatedSavings: number;
  paybackPeriod: number;
  status: 'optimal' | 'acceptable' | 'needs_improvement';
  lastCalculated: Date;
  calculationVersion: string;
}

/**
 * Environmental impact interface
 */
export interface EnvironmentalImpact {
  co2SavingsKg: number;
  co2SavingsTons: number;
  treesEquivalent: number;
  carsEquivalent: number;
  coalReductionKg: number;
  oilBarrelsSaved: number;
}