import { SolarCalculationResponseDto } from '../dtos/output/SolarCalculationResponseDto';

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
   * Creates a system summary from calculation data
   * 
   * @param data - Raw calculation data or system calculations
   * @returns System summary with key metrics
   */
  static toSystemSummary(data: any): SystemSummary {
    const annualGeneration = data.annualProduction || data.annualGeneration || 0;
    const systemSize = data.systemSize || data.potenciaNominal || 0;
    const performanceRatio = data.performanceRatio || data.performanceRatio || 0;

    return {
      systemSize,
      annualGeneration,
      specificProduction: systemSize > 0 ? annualGeneration / systemSize : 0,
      performanceRatio,
      co2Savings: this.calculateCO2Savings(annualGeneration),
      estimatedSavings: this.calculateEstimatedSavings(annualGeneration),
      paybackPeriod: data.paybackPeriod || data.payback || 0,
      status: this.determineSystemStatus(data),
      lastCalculated: data.calculatedAt || new Date(),
      calculationVersion: data.calculationVersion || '1.0.0'
    };
  }

  /**
   * Calculates environmental impact from annual generation
   * 
   * @param annualGeneration - Annual energy generation in kWh
   * @returns Environmental impact metrics
   */
  static toEnvironmentalImpact(annualGeneration: number): EnvironmentalImpact {
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
      oilBarrelsSaved: Number((co2Savings / 430).toFixed(3)) // 1 barrel = 430 kg CO2
    };
  }

  /**
   * Converts domain calculation to shared types format
   * 
   * @param domain - Domain calculation object
   * @returns Shared types SystemCalculations
   */
  static toSharedCalculation(domain: any): any {
    return {
      id: domain.id || this.generateId(),
      projectId: domain.projectId,
      type: 'SOLAR',
      systemType: this.mapSystemType(domain.systemType),
      status: this.mapCalculationStatus(domain.status),
      energy: domain.energy || {},
      financial: domain.financial || {},
      sizing: domain.sizing || {},
      production: domain.production || {},
      calculatedAt: domain.calculatedAt || new Date(),
      calculationVersion: domain.calculationVersion || '1.0.0',
      createdAt: domain.createdAt || new Date(),
      updatedAt: domain.updatedAt || new Date()
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
    return `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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