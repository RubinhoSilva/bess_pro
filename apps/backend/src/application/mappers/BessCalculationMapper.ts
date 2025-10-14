

/**
 * Mapper for Battery Energy Storage System (BESS) calculations
 * 
 * Handles conversion between domain objects and DTOs for BESS calculations,
 * including battery configuration, energy management, and economic benefits.
 */
export class BessCalculationMapper {

  /**
   * Converts BESS calculation result to response DTO
   * 
   * @param calculation - BESS calculation domain object
   * @returns Formatted response DTO for API consumption
   */
  static toResponseDto(calculation: any): any {
    if (!calculation) {
      throw new Error('BESS calculation data is required');
    }

    const bessData = calculation.bess || calculation;

    return {
      batteryCapacity: bessData.batteryCapacity || 0,
      batteryPower: bessData.batteryPower || 0,
      batteryCount: bessData.batteryCount || 0,
      batteryType: bessData.batteryType || 'LITHIUM_ION',
      energyManagement: this.mapEnergyManagement(bessData),
      technicalSpecifications: this.mapTechnicalSpecifications(bessData),
      economicBenefits: this.mapEconomicBenefits(bessData),
      operationalAnalysis: this.mapOperationalAnalysis(bessData),
      calculatedAt: calculation.calculatedAt || new Date(),
      calculationVersion: calculation.calculationVersion || '1.0.0',
      metadata: this.mapResultMetadata(calculation)
    };
  }

  /**
   * Converts battery specifications to configuration DTO
   * 
   * @param specs - Battery technical specifications
   * @returns Battery configuration for system design
   */
  static toBatteryConfiguration(specs: any): any {
    return {
      capacity: specs.capacity || 0,
      power: specs.power || 0,
      voltage: specs.voltage || 400,
      chemistry: specs.chemistry || 'LFP',
      formFactor: specs.formFactor || 'RACK_MOUNTED',
      dimensions: specs.dimensions || { width: 600, height: 800, depth: 300, weight: 150 },
      operatingConditions: {
        temperatureRange: specs.temperatureRange || { min: -10, max: 50 },
        humidityRange: specs.humidityRange || { min: 10, max: 90 },
        altitudeRange: specs.altitudeRange || { min: 0, max: 2000 }
      },
      electricalCharacteristics: {
        maxChargeCurrent: specs.maxChargeCurrent || 0,
        maxDischargeCurrent: specs.maxDischargeCurrent || 0,
        roundTripEfficiency: specs.roundTripEfficiency || 90,
        depthOfDischarge: specs.depthOfDischarge || 80,
        selfDischargeRate: specs.selfDischargeRate || 2
      },
      warranty: specs.warranty || { years: 10, cycles: 6000, throughput: 0, remainingCapacity: 70 },
      certifications: specs.certifications || [],
      communicationProtocol: specs.communicationProtocol || 'MODBUS_TCP'
    };
  }

  /**
   * Creates comprehensive BESS system analysis
   * 
   * @param results - BESS calculation results
   * @returns System analysis with performance and economic metrics
   */
  static toSystemAnalysis(results: any): any {
    const economicBenefits = results.economicBenefits || {};
    const technicalSpecs = results.technicalSpecifications || {};
    const energyManagement = results.energyManagement || {};

    return {
      systemOverview: {
        totalCapacity: results.batteryCapacity || 0,
        totalPower: results.batteryPower || 0,
        batteryCount: results.batteryCount || 0,
        systemType: this.determineSystemType(energyManagement.strategy),
        configurationComplexity: this.assessConfigurationComplexity(results)
      },
      performanceAnalysis: {
        expectedEfficiency: results.roundTripEfficiency || 90,
        cycleLifeExpectancy: results.cycleLife || 6000,
        throughputExpectancy: this.calculateThroughputExpectancy(results),
        degradationProfile: this.calculateDegradationProfile(results),
        availability: this.calculateAvailability(technicalSpecs)
      },
      economicAnalysis: {
        totalAnnualBenefit: economicBenefits.totalAnnualBenefit || 0,
        benefitBreakdown: {
          arbitrage: economicBenefits.arbitrageRevenue || 0,
          peakShaving: economicBenefits.peakShavingSavings || 0,
          gridServices: economicBenefits.gridServiceRevenue || 0,
          backupValue: economicBenefits.backupValue || 0
        },
        paybackPeriod: this.calculatePaybackPeriod(results),
        netPresentValue: this.calculateNPV(results),
        internalRateOfReturn: this.calculateIRR(results)
      },
      operationalAnalysis: {
        recommendedStrategy: energyManagement.strategy || 'SELF_CONSUMPTION',
        operatingConstraints: this.identifyOperatingConstraints(results),
        maintenanceRequirements: this.assessMaintenanceRequirements(results),
        monitoringNeeds: this.identifyMonitoringNeeds(results)
      },
      riskAssessment: {
        technicalRisks: this.assessTechnicalRisks(results),
        economicRisks: this.assessEconomicRisks(results),
        regulatoryRisks: this.assessRegulatoryRisks(results),
        mitigationStrategies: this.recommendMitigationStrategies(results)
      }
    };
  }

  /**
   * Maps a list of BESS calculations to response DTOs
   * 
   * @param calculations - Array of BESS calculations
   * @returns Array of response DTOs
   */
  static toResponseDtoList(calculations: any[]): BessCalculationResult[] {
    return calculations.map(calc => this.toResponseDto(calc));
  }

  // ============= PRIVATE HELPER METHODS =============

  /**
   * Determines system type based on energy management strategy
   */
  private static determineSystemType(strategy?: string): string {
    if (!strategy) return 'STANDALONE';
    
    const strategyMap: Record<string, string> = {
      'PEAK_SHAVING': 'GRID_SUPPORT',
      'LOAD_SHIFTING': 'GRID_SUPPORT',
      'BACKUP_ONLY': 'BACKUP',
      'GRID_SERVICES': 'GRID_SERVICES',
      'SELF_CONSUMPTION': 'HYBRID',
      'HYBRID': 'HYBRID'
    };
    
    return strategyMap[strategy] || 'STANDALONE';
  }

  /**
   * Assesses configuration complexity
   */
  private static assessConfigurationComplexity(results: any): 'simple' | 'moderate' | 'complex' {
    const batteryCount = results.batteryCount || 0;
    const hasMultipleStrategies = Object.keys(results.energyManagement || {}).length > 1;
    
    if (batteryCount <= 1 && !hasMultipleStrategies) return 'simple';
    if (batteryCount <= 4 && hasMultipleStrategies) return 'moderate';
    return 'complex';
  }

  /**
   * Calculates throughput expectancy
   */
  private static calculateThroughputExpectancy(results: any): number {
    const capacity = results.batteryCapacity || 0;
    const cycles = results.cycleLife || 6000;
    const dod = (results.depthOfDischarge || 80) / 100;
    
    return Math.round(capacity * cycles * dod);
  }

  /**
   * Calculates degradation profile
   */
  private static calculateDegradationProfile(results: any): any {
    const cycleLife = results.cycleLife || 6000;
    const initialCapacity = 100;
    const endOfLifeCapacity = 70; // Typically 70% at end of warranty
    
    return {
      initialCapacity,
      endOfLifeCapacity,
      annualDegradation: (initialCapacity - endOfLifeCapacity) / (cycleLife / 365), // Approximate
      degradationRate: 0.02 // 2% per year typical for Li-ion
    };
  }

  /**
   * Calculates system availability
   */
  private static calculateAvailability(technicalSpecs: any): number {
    // Base availability for well-maintained BESS systems
    const baseAvailability = 99.5;
    
    // Adjust based on warranty and specifications
    const warrantyYears = technicalSpecs.warranty?.years || 10;
    const warrantyAdjustment = Math.min(warrantyYears * 0.01, 0.3);
    
    return Math.min(baseAvailability + warrantyAdjustment, 99.9);
  }

  /**
   * Calculates payback period
   */
  private static calculatePaybackPeriod(results: any): number {
    const totalBenefit = results.economicBenefits?.totalAnnualBenefit || 0;
    const initialCost = results.initialCost || 0;
    
    if (totalBenefit <= 0) return 0;
    return Math.round((initialCost / totalBenefit) * 10) / 10;
  }

  /**
   * Calculates Net Present Value
   */
  private static calculateNPV(results: any): number {
    const annualBenefit = results.economicBenefits?.totalAnnualBenefit || 0;
    const initialCost = results.initialCost || 0;
    const discountRate = 0.08; // 8% default
    const lifespan = 10; // 10 years default
    
    let npv = -initialCost;
    for (let year = 1; year <= lifespan; year++) {
      npv += annualBenefit / Math.pow(1 + discountRate, year);
    }
    
    return Math.round(npv);
  }

  /**
   * Calculates Internal Rate of Return
   */
  private static calculateIRR(results: any): number {
    const annualBenefit = results.economicBenefits?.totalAnnualBenefit || 0;
    const initialCost = results.initialCost || 0;
    const lifespan = 10;
    
    if (initialCost <= 0 || annualBenefit <= 0) return 0;
    
    // Simple IRR approximation
    const totalBenefit = annualBenefit * lifespan;
    const totalReturn = (totalBenefit - initialCost) / initialCost;
    const annualReturn = totalReturn / lifespan;
    
    return Math.round(annualReturn * 100);
  }

  /**
   * Identifies operating constraints
   */
  private static identifyOperatingConstraints(results: any): string[] {
    const constraints: string[] = [];
    
    if (results.depthOfDischarge && results.depthOfDischarge > 90) {
      constraints.push('High depth of discharge may reduce battery lifespan');
    }
    
    if (results.roundTripEfficiency && results.roundTripEfficiency < 85) {
      constraints.push('Low round-trip efficiency affects economic viability');
    }
    
    const tempRange = results.technicalSpecifications?.operatingTemperature;
    if (tempRange && (tempRange.min > 0 || tempRange.max < 40)) {
      constraints.push('Limited operating temperature range');
    }
    
    return constraints;
  }

  /**
   * Assesses maintenance requirements
   */
  private static assessMaintenanceRequirements(results: any): any {
    const batteryCount = results.batteryCount || 0;
    const batteryType = results.batteryType || 'LITHIUM_ION';
    
    return {
      frequency: batteryType === 'LEAD_ACID' ? 'quarterly' : 'semiannual',
      estimatedAnnualCost: batteryCount * 50, // $50 per battery unit per year
      requiredExpertise: batteryCount > 4 ? 'specialized' : 'basic',
      sparePartsRecommendation: batteryCount > 2 ? 'recommended' : 'optional'
    };
  }

  /**
   * Identifies monitoring needs
   */
  private static identifyMonitoringNeeds(results: any): string[] {
    const needs: string[] = ['state_of_charge', 'power_flow', 'temperature'];
    
    if (results.batteryCount > 1) {
      needs.push('individual_battery_health');
    }
    
    if (results.energyManagement?.gridServices) {
      needs.push('grid_frequency', 'grid_voltage');
    }
    
    if (results.energyManagement?.backupPower) {
      needs.push('backup_status', 'load_monitoring');
    }
    
    return needs;
  }

  /**
   * Assesses technical risks
   */
  private static assessTechnicalRisks(results: any): any[] {
    const risks: any[] = [];
    
    const cycleLife = results.cycleLife || 6000;
    if (cycleLife < 4000) {
      risks.push({
        type: 'degradation',
        severity: 'high',
        description: 'Low cycle life expectancy',
        mitigation: 'Consider higher quality batteries'
      });
    }
    
    const efficiency = results.roundTripEfficiency || 90;
    if (efficiency < 85) {
      risks.push({
        type: 'efficiency',
        severity: 'medium',
        description: 'Low system efficiency',
        mitigation: 'Optimize system design and components'
      });
    }
    
    return risks;
  }

  /**
   * Assesses economic risks
   */
  private static assessEconomicRisks(results: any): any[] {
    const risks: any[] = [];
    
    const payback = this.calculatePaybackPeriod(results);
    if (payback > 10) {
      risks.push({
        type: 'payback',
        severity: 'high',
        description: 'Long payback period',
        mitigation: 'Optimize system size and explore additional revenue streams'
      });
    }
    
    const totalBenefit = results.economicBenefits?.totalAnnualBenefit || 0;
    if (totalBenefit < 1000) {
      risks.push({
        type: 'revenue',
        severity: 'medium',
        description: 'Low annual benefits',
        mitigation: 'Review energy management strategy and tariff structure'
      });
    }
    
    return risks;
  }

  /**
   * Assesses regulatory risks
   */
  private static assessRegulatoryRisks(results: any): any[] {
    const risks: any[] = [];
    
    if (results.energyManagement?.gridServices) {
      risks.push({
        type: 'regulation',
        severity: 'medium',
        description: 'Grid service regulations may change',
        mitigation: 'Stay updated with local grid codes and regulations'
      });
    }
    
    return risks;
  }

  /**
   * Recommends mitigation strategies
   */
  private static recommendMitigationStrategies(results: any): string[] {
    const strategies: string[] = [
      'Implement comprehensive monitoring system',
      'Establish regular maintenance schedule',
      'Consider warranty extensions for critical components'
    ];
    
    const batteryCount = results.batteryCount || 0;
    if (batteryCount > 4) {
      strategies.push('Implement modular design for easier maintenance');
    }
    
    if (results.energyManagement?.gridServices) {
      strategies.push('Maintain flexibility in control strategies');
    }
    
    return strategies;
  }

  /**
   * Maps energy management data
   */
  private static mapEnergyManagement(bessData: any): any {
    const energyManagement = bessData.energyManagement || {};
    
    return {
      strategy: energyManagement.strategy || 'SELF_CONSUMPTION',
      annualSavings: energyManagement.annualSavings || 0,
      peakShavingSavings: energyManagement.peakShavingSavings,
      loadShiftingSavings: energyManagement.loadShiftingSavings,
      arbitrageRevenue: energyManagement.arbitrageRevenue,
      backupValue: energyManagement.backupValue,
      gridServiceRevenue: energyManagement.gridServiceRevenue,
      utilizationRate: energyManagement.utilizationRate || 0,
      throughput: energyManagement.throughput || 0,
      cycleCount: energyManagement.cycleCount || 0,
      operationalProfile: energyManagement.operationalProfile || {
        chargingProfile: [],
        dischargingProfile: [],
        stateOfChargeProfile: []
      }
    };
  }

  /**
   * Maps technical specifications
   */
  private static mapTechnicalSpecifications(bessData: any): any {
    const technicalSpecs = bessData.technicalSpecifications || {};
    
    return {
      nominalVoltage: technicalSpecs.nominalVoltage || 400,
      maxChargeCurrent: technicalSpecs.maxChargeCurrent || 0,
      maxDischargeCurrent: technicalSpecs.maxDischargeCurrent || 0,
      roundTripEfficiency: bessData.roundTripEfficiency || technicalSpecs.roundTripEfficiency || 90,
      depthOfDischarge: bessData.depthOfDischarge || technicalSpecs.depthOfDischarge || 80,
      cycleLife: bessData.cycleLife || technicalSpecs.cycleLife || 6000,
      selfDischargeRate: technicalSpecs.selfDischargeRate || 2,
      operatingTemperature: technicalSpecs.operatingTemperature || { min: -10, max: 50, optimal: 25 },
      warranty: technicalSpecs.warranty || { years: 10, cycles: 6000, throughput: 0, remainingCapacity: 70 },
      degradationProfile: technicalSpecs.degradationProfile || {
        year1: 98,
        year10: 90,
        endOfLife: 70,
        annualDegradation: 0.02
      }
    };
  }

  /**
   * Maps economic benefits
   */
  private static mapEconomicBenefits(bessData: any): any {
    const economicBenefits = bessData.economicBenefits || {};
    
    return {
      totalAnnualBenefit: economicBenefits.totalAnnualBenefit || 0,
      benefitBreakdown: {
        arbitrage: economicBenefits.arbitrageRevenue || 0,
        peakShaving: economicBenefits.peakShavingSavings || 0,
        loadShifting: economicBenefits.loadShiftingSavings || 0,
        backupPower: economicBenefits.backupValue || 0,
        gridServices: economicBenefits.gridServiceRevenue || 0
      },
      levelizedCostOfStorage: economicBenefits.levelizedCostOfStorage || 0,
      paybackPeriod: economicBenefits.paybackPeriod || 0,
      netPresentValue: economicBenefits.netPresentValue || 0,
      internalRateOfReturn: economicBenefits.internalRateOfReturn || 0,
      benefitCostRatio: economicBenefits.benefitCostRatio || 0,
      revenueStreams: economicBenefits.revenueStreams || []
    };
  }

  /**
   * Maps operational analysis
   */
  private static mapOperationalAnalysis(bessData: any): any {
    const operationalAnalysis = bessData.operationalAnalysis || {};
    
    return {
      availability: operationalAnalysis.availability || 99.5,
      utilizationRate: operationalAnalysis.utilizationRate || 0,
      efficiency: bessData.roundTripEfficiency || 90,
      maintenanceRequirements: operationalAnalysis.maintenanceRequirements || {
        frequency: 'semiannual',
        estimatedAnnualCost: 0,
        requiredExpertise: 'basic',
        sparePartsRecommendation: 'optional'
      },
      monitoringNeeds: operationalAnalysis.monitoringNeeds || ['state_of_charge', 'power_flow', 'temperature'],
      operatingConstraints: operationalAnalysis.operatingConstraints || [],
      optimizationOpportunities: operationalAnalysis.optimizationOpportunities || [],
      performanceProjections: operationalAnalysis.performanceProjections || {
        year5: 95,
        year10: 90,
        year15: 85
      }
    };
  }

  /**
   * Maps result metadata
   */
  private static mapResultMetadata(calculation: any): any {
    return {
      calculationId: calculation.id || this.generateId(),
      version: calculation.calculationVersion || '1.0.0',
      algorithm: calculation.algorithm || 'bess_optimization',
      dataSource: calculation.dataSource || 'manufacturer_specs',
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
   * Generates a unique ID for calculations
   */
  private static generateId(): string {
    return `bess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============= SUPPORTING INTERFACES =============

/**
 * BESS calculation result interface
 */
export interface BessCalculationResult {
  batteryCapacity: number;
  batteryPower: number;
  batteryCount: number;
  batteryType: string;
  depthOfDischarge: number;
  roundTripEfficiency: number;
  cycleLife: number;
  energyManagement: {
    strategy: string;
    peakShaving?: any;
    loadShifting?: any;
    backupPower?: any;
    gridServices?: any;
  };
  economicBenefits: {
    arbitrageRevenue: number;
    peakShavingSavings: number;
    gridServiceRevenue: number;
    backupValue: number;
    totalAnnualBenefit: number;
  };
  technicalSpecifications: {
    nominalVoltage: number;
    maxChargeCurrent: number;
    maxDischargeCurrent: number;
    operatingTemperature: any;
    selfDischargeRate: number;
    warranty: any;
  };
  calculatedAt: Date;
  calculationVersion: string;
}

/**
 * Battery specifications interface
 */
export interface BatterySpecifications {
  capacity?: number;
  power?: number;
  voltage?: number;
  chemistry?: string;
  formFactor?: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    weight: number;
  };
  temperatureRange?: {
    min: number;
    max: number;
  };
  humidityRange?: {
    min: number;
    max: number;
  };
  altitudeRange?: {
    min: number;
    max: number;
  };
  maxChargeCurrent?: number;
  maxDischargeCurrent?: number;
  roundTripEfficiency?: number;
  depthOfDischarge?: number;
  selfDischargeRate?: number;
  warranty?: {
    years: number;
    cycles: number;
    throughput: number;
    remainingCapacity: number;
  };
  certifications?: string[];
  communicationProtocol?: string;
}

/**
 * Battery configuration interface
 */
export interface BatteryConfig {
  capacity: number;
  power: number;
  voltage: number;
  chemistry: string;
  formFactor: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
    weight: number;
  };
  operatingConditions: {
    temperatureRange: any;
    humidityRange: any;
    altitudeRange: any;
  };
  electricalCharacteristics: {
    maxChargeCurrent: number;
    maxDischargeCurrent: number;
    roundTripEfficiency: number;
    depthOfDischarge: number;
    selfDischargeRate: number;
  };
  warranty: any;
  certifications: string[];
  communicationProtocol: string;
}

/**
 * BESS system analysis interface
 */
export interface BessSystemAnalysis {
  systemOverview: {
    totalCapacity: number;
    totalPower: number;
    batteryCount: number;
    systemType: string;
    configurationComplexity: 'simple' | 'moderate' | 'complex';
  };
  performanceAnalysis: {
    expectedEfficiency: number;
    cycleLifeExpectancy: number;
    throughputExpectancy: number;
    degradationProfile: any;
    availability: number;
  };
  economicAnalysis: {
    totalAnnualBenefit: number;
    benefitBreakdown: {
      arbitrage: number;
      peakShaving: number;
      gridServices: number;
      backupValue: number;
    };
    paybackPeriod: number;
    netPresentValue: number;
    internalRateOfReturn: number;
  };
  operationalAnalysis: {
    recommendedStrategy: string;
    operatingConstraints: string[];
    maintenanceRequirements: any;
    monitoringNeeds: string[];
  };
  riskAssessment: {
    technicalRisks: any[];
    economicRisks: any[];
    regulatoryRisks: any[];
    mitigationStrategies: string[];
  };
}