import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { CalculationLogger } from '../../../domain/services/CalculationLogger';

export interface HybridSystemRequest {
  location: {
    latitude: number;
    longitude: number;
  };
  pvSystem: {
    peakPower: number; // kWp
    tilt: number;
    azimuth: number;
    systemLoss: number; // percentage
    performanceRatio: number;
  };
  bessSystem: {
    capacity: number; // kWh
    maxChargePower: number; // kW
    maxDischargePower: number; // kW
    efficiency: number; // percentage
    depthOfDischarge: number; // percentage
    initialSOC: number; // percentage
  };
  loadProfile: {
    dailyConsumption: number; // kWh/day
    peakDemand: number; // kW
    loadProfile: number[]; // hourly consumption for 24h
  };
  economicParameters: {
    electricityPrice: number; // $/kWh
    feedInTariff: number; // $/kWh
    discountRate: number; // percentage
    projectLifespan: number; // years
  };
  irradiationData?: {
    monthlyGlobalHorizontal: number[]; // kWh/m²/month
    monthlyDiffuseHorizontal: number[]; // kWh/m²/month
  };
}

export interface HybridSystemResponse {
  pvGeneration: {
    annualEnergy: number; // kWh/year
    specificYield: number; // kWh/kWp/year
    capacityFactor: number; // percentage
    monthlyGeneration: number[]; // kWh/month
  };
  bessPerformance: {
    annualThroughput: number; // kWh/year
    cyclesPerYear: number;
    efficiency: number; // percentage
    stateOfChargeProfile: number[]; // hourly SOC for 24h
  };
  systemInteraction: {
    selfConsumptionRate: number; // percentage
    gridIndependence: number; // percentage
    energyFlow: {
      fromPV: number; // kWh/year
      fromBESS: number; // kWh/year
      fromGrid: number; // kWh/year
      toGrid: number; // kWh/year
      toBESS: number; // kWh/year
    };
  };
  financialAnalysis: {
    initialInvestment: number; // $
    annualSavings: number; // $/year
    paybackPeriod: number; // years
    npv: number; // Net Present Value
    irr: number; // Internal Rate of Return
    lcoe: number; // Levelized Cost of Energy ($/kWh)
  };
  metadata: {
    timestamp: string;
    calculationMethod: string;
    assumptions: string[];
  };
}

export class CalculateHybridSystemUseCase implements IUseCase<HybridSystemRequest, Result<HybridSystemResponse>> {
  constructor(private logger: CalculationLogger) {}

  async execute(request: HybridSystemRequest): Promise<Result<HybridSystemResponse>> {
    this.logger.info('CalculateHybridSystemUseCase', 'Iniciando cálculo de sistema híbrido', {
      location: request.location,
      pvPeakPower: request.pvSystem.peakPower,
      bessCapacity: request.bessSystem.capacity,
      dailyConsumption: request.loadProfile.dailyConsumption
    });

    try {
      // 1. Validações de negócio
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return Result.failure(validation.errors.join(', '));
      }

      // 2. Calcular geração PV
      const pvGeneration = this.calculatePVGeneration(request);

      // 3. Calcular desempenho BESS
      const bessPerformance = this.calculateBESSPerformance(request, pvGeneration);

      // 4. Calcular interação do sistema
      const systemInteraction = this.calculateSystemInteraction(request, pvGeneration, bessPerformance);

      // 5. Análise financeira
      const financialAnalysis = this.calculateFinancialAnalysis(request, systemInteraction);

      // 6. Compilar resultado
      const response: HybridSystemResponse = {
        pvGeneration,
        bessPerformance,
        systemInteraction,
        financialAnalysis,
        metadata: {
          timestamp: new Date().toISOString(),
          calculationMethod: 'Simplified Hybrid System Model',
          assumptions: [
            'Constant performance ratio throughout the year',
            'Simplified load profile (typical day repeated)',
            'Linear degradation not considered',
            'Maintenance costs not included',
            'Tax incentives not considered'
          ]
        }
      };

      this.logger.result('Sucesso', 'Cálculo de sistema híbrido concluído', {
        annualGeneration: pvGeneration.annualEnergy,
        selfConsumptionRate: systemInteraction.selfConsumptionRate,
        paybackPeriod: financialAnalysis.paybackPeriod,
        npv: financialAnalysis.npv
      });

      return Result.success(response);

    } catch (error: any) {
      this.logger.error('Erro', 'Falha no cálculo de sistema híbrido', {
        error: error.message,
        stack: error.stack
      });

      return Result.failure(`Erro ao calcular sistema híbrido: ${error.message}`);
    }
  }

  private validateRequest(request: HybridSystemRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate location
    if (!request.location?.latitude || !request.location?.longitude) {
      errors.push('Localização com latitude e longitude é obrigatória');
    }

    if (request.location?.latitude && (request.location.latitude < -90 || request.location.latitude > 90)) {
      errors.push('Latitude deve estar entre -90 e 90 graus');
    }

    if (request.location?.longitude && (request.location.longitude < -180 || request.location.longitude > 180)) {
      errors.push('Longitude deve estar entre -180 e 180 graus');
    }

    // Validate PV system
    if (!request.pvSystem?.peakPower || request.pvSystem.peakPower <= 0) {
      errors.push('Potência do sistema PV deve ser maior que zero');
    }

    if (request.pvSystem?.tilt !== undefined && (request.pvSystem.tilt < 0 || request.pvSystem.tilt > 90)) {
      errors.push('Inclinação do sistema PV deve estar entre 0 e 90 graus');
    }

    if (request.pvSystem?.performanceRatio && (request.pvSystem.performanceRatio <= 0 || request.pvSystem.performanceRatio > 1)) {
      errors.push('Performance ratio deve estar entre 0 e 1');
    }

    // Validate BESS system
    if (!request.bessSystem?.capacity || request.bessSystem.capacity <= 0) {
      errors.push('Capacidade do BESS deve ser maior que zero');
    }

    if (!request.bessSystem?.efficiency || request.bessSystem.efficiency <= 0 || request.bessSystem.efficiency > 100) {
      errors.push('Eficiência do BESS deve estar entre 0 e 100%');
    }

    if (request.bessSystem?.depthOfDischarge && (request.bessSystem.depthOfDischarge <= 0 || request.bessSystem.depthOfDischarge > 100)) {
      errors.push('Profundidade de descarga deve estar entre 0 e 100%');
    }

    // Validate load profile
    if (!request.loadProfile?.dailyConsumption || request.loadProfile.dailyConsumption <= 0) {
      errors.push('Consumo diário deve ser maior que zero');
    }

    if (!request.loadProfile?.loadProfile || request.loadProfile.loadProfile.length !== 24) {
      errors.push('Perfil de carga deve ter 24 valores horários');
    }

    // Validate economic parameters
    if (request.economicParameters?.discountRate && request.economicParameters.discountRate < 0) {
      errors.push('Taxa de desconto não pode ser negativa');
    }

    if (request.economicParameters?.projectLifespan && request.economicParameters.projectLifespan <= 0) {
      errors.push('Vida útil do projeto deve ser maior que zero');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private calculatePVGeneration(request: HybridSystemRequest): HybridSystemResponse['pvGeneration'] {
    const { pvSystem, location, irradiationData } = request;
    
    // Simplified PV calculation - in reality, this would use detailed irradiation data
    const baseSpecificYield = 1200; // kWh/kWp/year (typical value)
    const locationFactor = 1.0; // Would be calculated based on location irradiation
    const performanceFactor = pvSystem.performanceRatio || 0.75;
    
    const specificYield = baseSpecificYield * locationFactor * performanceFactor;
    const annualEnergy = pvSystem.peakPower * specificYield;
    const capacityFactor = (annualEnergy / (pvSystem.peakPower * 8760)) * 100;

    // Generate monthly profile (simplified)
    const monthlyFactors = [0.8, 0.85, 0.95, 1.0, 1.1, 1.2, 1.25, 1.2, 1.1, 0.95, 0.85, 0.8];
    const monthlyGeneration = monthlyFactors.map(factor => 
      (annualEnergy / 12) * factor
    );

    return {
      annualEnergy,
      specificYield,
      capacityFactor,
      monthlyGeneration
    };
  }

  private calculateBESSPerformance(
    request: HybridSystemRequest, 
    pvGeneration: HybridSystemResponse['pvGeneration']
  ): HybridSystemResponse['bessPerformance'] {
    const { bessSystem, loadProfile } = request;
    
    // Simplified BESS calculation
    const dailyEnergyThroughput = bessSystem.capacity * bessSystem.depthOfDischarge / 100;
    const annualThroughput = dailyEnergyThroughput * 365;
    const cyclesPerYear = annualThroughput / bessSystem.capacity;
    
    // Calculate hourly SOC profile for a typical day
    const hourlySOC = this.calculateHourlySOC(request, pvGeneration);
    
    return {
      annualThroughput,
      cyclesPerYear,
      efficiency: bessSystem.efficiency,
      stateOfChargeProfile: hourlySOC
    };
  }

  private calculateHourlySOC(
    request: HybridSystemRequest, 
    pvGeneration: HybridSystemResponse['pvGeneration']
  ): number[] {
    const { bessSystem, loadProfile, pvSystem } = request;
    const hourlySOC: number[] = [];
    let currentSOC = bessSystem.initialSOC;

    // Simplified hourly simulation for a typical day
    for (let hour = 0; hour < 24; hour++) {
      // Estimate PV generation for this hour (simplified)
      const hourlyPVGeneration = this.estimateHourlyPVGeneration(hour, pvGeneration.annualEnergy);
      
      // Energy balance
      const netEnergy = hourlyPVGeneration - loadProfile.loadProfile[hour];
      
      // Update SOC based on net energy
      if (netEnergy > 0) {
        // Excess energy can charge battery
        const chargeEnergy = Math.min(netEnergy, bessSystem.maxChargePower);
        const socIncrease = (chargeEnergy * bessSystem.efficiency / 100) / bessSystem.capacity * 100;
        currentSOC = Math.min(100, currentSOC + socIncrease);
      } else if (netEnergy < 0) {
        // Deficit can be supplied by battery
        const dischargeEnergy = Math.min(-netEnergy, bessSystem.maxDischargePower);
        const socDecrease = (dischargeEnergy / (bessSystem.efficiency / 100)) / bessSystem.capacity * 100;
        currentSOC = Math.max(bessSystem.depthOfDischarge, currentSOC - socDecrease);
      }
      
      hourlySOC.push(currentSOC);
    }

    return hourlySOC;
  }

  private estimateHourlyPVGeneration(hour: number, annualEnergy: number): number {
    // Simplified hourly PV generation profile
    const dailyEnergy = annualEnergy / 365;
    const hourlyProfile = [0, 0, 0, 0, 0, 0.1, 0.3, 0.6, 0.9, 1.0, 1.0, 0.9, 0.8, 0.7, 0.5, 0.3, 0.1, 0, 0, 0, 0, 0, 0, 0];
    return dailyEnergy * hourlyProfile[hour];
  }

  private calculateSystemInteraction(
    request: HybridSystemRequest,
    pvGeneration: HybridSystemResponse['pvGeneration'],
    bessPerformance: HybridSystemResponse['bessPerformance']
  ): HybridSystemResponse['systemInteraction'] {
    const { loadProfile } = request;
    
    // Simplified energy flow calculation
    const annualLoad = loadProfile.dailyConsumption * 365;
    const annualPVGeneration = pvGeneration.annualEnergy;
    
    // Energy that can be directly consumed (simplified)
    const directConsumption = Math.min(annualPVGeneration * 0.4, annualLoad);
    const excessToBESS = Math.max(0, annualPVGeneration - directConsumption) * 0.7;
    const excessToGrid = Math.max(0, annualPVGeneration - directConsumption - excessToBESS);
    
    // Energy from BESS (simplified)
    const fromBESS = Math.min(excessToBESS * bessPerformance.efficiency / 100, annualLoad - directConsumption);
    const fromGrid = Math.max(0, annualLoad - directConsumption - fromBESS);
    
    const totalConsumption = directConsumption + fromBESS + fromGrid;
    const selfConsumptionRate = ((directConsumption + fromBESS) / annualPVGeneration) * 100;
    const gridIndependence = ((directConsumption + fromBESS) / totalConsumption) * 100;

    return {
      selfConsumptionRate,
      gridIndependence,
      energyFlow: {
        fromPV: directConsumption,
        fromBESS,
        fromGrid,
        toGrid: excessToGrid,
        toBESS: excessToBESS
      }
    };
  }

  private calculateFinancialAnalysis(
    request: HybridSystemRequest,
    systemInteraction: HybridSystemResponse['systemInteraction']
  ): HybridSystemResponse['financialAnalysis'] {
    const { pvSystem, bessSystem, economicParameters } = request;
    
    // Simplified cost calculation
    const pvCostPerWatt = 1000; // $/kW (simplified)
    const bessCostPerKWh = 300; // $/kWh (simplified)
    const installationCost = 5000; // $ (simplified)
    
    const initialInvestment = 
      (pvSystem.peakPower * pvCostPerWatt) + 
      (bessSystem.capacity * bessCostPerKWh) + 
      installationCost;
    
    // Annual savings from reduced grid consumption
    const annualGridConsumption = systemInteraction.energyFlow.fromGrid;
    const annualSavings = annualGridConsumption * economicParameters.electricityPrice;
    
    // Revenue from excess energy fed to grid
    const annualRevenue = systemInteraction.energyFlow.toGrid * economicParameters.feedInTariff;
    const totalAnnualBenefit = annualSavings + annualRevenue;
    
    // Simple payback period
    const paybackPeriod = initialInvestment / totalAnnualBenefit;
    
    // NPV calculation (simplified)
    const discountFactor = economicParameters.discountRate / 100;
    let npv = -initialInvestment;
    
    for (let year = 1; year <= economicParameters.projectLifespan; year++) {
      npv += totalAnnualBenefit / Math.pow(1 + discountFactor, year);
    }
    
    // IRR approximation (simplified)
    let irr = 0;
    let low = 0;
    let high = 1;
    
    for (let i = 0; i < 100; i++) {
      irr = (low + high) / 2;
      let testNpv = -initialInvestment;
      
      for (let year = 1; year <= economicParameters.projectLifespan; year++) {
        testNpv += totalAnnualBenefit / Math.pow(1 + irr, year);
      }
      
      if (testNpv > 0) {
        low = irr;
      } else {
        high = irr;
      }
      
      if (Math.abs(testNpv) < 100) break;
    }
    
    // LCOE calculation
    const totalEnergyGeneration = systemInteraction.energyFlow.fromPV + systemInteraction.energyFlow.fromBESS;
    const lcoe = totalEnergyGeneration > 0 ? initialInvestment / (totalEnergyGeneration * economicParameters.projectLifespan) : 0;

    return {
      initialInvestment,
      annualSavings: totalAnnualBenefit,
      paybackPeriod,
      npv,
      irr: irr * 100,
      lcoe
    };
  }
}