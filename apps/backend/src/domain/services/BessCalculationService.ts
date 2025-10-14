import { CalculationConstants } from "../constants/CalculationConstants";

export interface BatterySpecifications {
  capacity: number; // kWh
  voltage: number; // V
  current: number; // A
  cycles: number; // lifecycle
  efficiency: number; // %
  depth_of_discharge: number; // %
  weight: number; // kg
  dimensions: {
    length: number; // mm
    width: number; // mm  
    height: number; // mm
  };
  cost: number; // R$
  manufacturer: string;
  model: string;
}

export interface LoadProfile {
  hourly_consumption: number[]; // 24 horas em kWh
  daily_consumption: number; // kWh/dia
  peak_power: number; // kW
  essential_loads: number; // kW - cargas essenciais
  backup_duration: number; // horas
}

export interface BessSystemParams {
  autonomy_hours: number; // horas de autonomia desejada
  depth_of_discharge: number; // % DOD permitido
  system_efficiency: number; // % eficiência do sistema
  redundancy_factor: number; // fator de redundância
  peak_power_factor: number; // fator de pico de potência
  future_expansion: number; // % de expansão futura
}

export interface BessConfiguration {
  battery_specs: BatterySpecifications;
  quantity: number;
  total_capacity: number; // kWh
  total_power: number; // kW
  inverter_power: number; // kW
  system_cost: number; // R$
  backup_time: number; // horas
  cycles_per_year: number;
  system_lifetime: number; // anos
  efficiency_losses: number; // %
}

export interface BessAnalysisResult {
  recommended_config: BessConfiguration;
  alternative_configs: BessConfiguration[];
  financial_analysis: {
    initial_investment: number;
    operational_savings: number; // R$/ano
    payback_period: number; // anos
    roi: number; // %
    net_present_value: number; // R$
  };
  technical_analysis: {
    load_coverage: number; // %
    peak_shaving_potential: number; // kW
    grid_independence: number; // %
    system_efficiency: number; // %
  };
}

export class BessCalculationService {
  private static readonly BATTERY_DATABASE: BatterySpecifications[] = [
    {
      capacity: 13.5,
      voltage: 48,
      current: 281,
      cycles: 6000,
      efficiency: 95,
      depth_of_discharge: 95,
      weight: 114,
      dimensions: { length: 1150, width: 755, height: 155 },
      cost: 45000,
      manufacturer: "Tesla",
      model: "Powerwall 2"
    },
    {
      capacity: 10,
      voltage: 51.2,
      current: 195,
      cycles: 8000,
      efficiency: 96,
      depth_of_discharge: 90,
      weight: 85,
      dimensions: { length: 600, width: 400, height: 200 },
      cost: 32000,
      manufacturer: "BYD",
      model: "Battery-Box Premium LVS"
    },
    {
      capacity: 5.12,
      voltage: 51.2,
      current: 100,
      cycles: 6000,
      efficiency: 94,
      depth_of_discharge: 90,
      weight: 45,
      dimensions: { length: 440, width: 420, height: 130 },
      cost: 18000,
      manufacturer: "Pylontech",
      model: "US3000C"
    },
    {
      capacity: 20,
      voltage: 48,
      current: 417,
      cycles: 5000,
      efficiency: 93,
      depth_of_discharge: 80,
      weight: 180,
      dimensions: { length: 800, width: 600, height: 300 },
      cost: 65000,
      manufacturer: "Sonnen",
      model: "SonnenBatterie 10"
    }
  ];

  /**
   * Calcula dimensionamento automático do sistema BESS
   */
  static calculateBessSystem(
    loadProfile: LoadProfile,
    systemParams: BessSystemParams
  ): BessAnalysisResult {
    // 1. Calcular capacidade necessária
    const requiredCapacity = this.calculateRequiredCapacity(loadProfile, systemParams);
    
    // 2. Calcular potência necessária
    const requiredPower = this.calculateRequiredPower(loadProfile, systemParams);
    
    // 3. Selecionar configurações de bateria
    const configurations = this.generateBatteryConfigurations(
      requiredCapacity,
      requiredPower,
      systemParams
    );
    
    // 4. Analisar cada configuração
    const analyzedConfigs = configurations.map(config => 
      this.analyzeBatteryConfiguration(config, loadProfile, systemParams)
    );
    
    // 5. Selecionar melhor configuração
    const recommendedConfig = this.selectOptimalConfiguration(analyzedConfigs);
    
    // 6. Análise financeira
    const financialAnalysis = this.calculateFinancialAnalysis(
      recommendedConfig,
      loadProfile
    );
    
    // 7. Análise técnica
    const technicalAnalysis = this.calculateTechnicalAnalysis(
      recommendedConfig,
      loadProfile
    );

    return {
      recommended_config: recommendedConfig,
      alternative_configs: analyzedConfigs.filter(config => config !== recommendedConfig),
      financial_analysis: financialAnalysis,
      technical_analysis: technicalAnalysis
    };
  }

  /**
   * Calcula capacidade necessária baseada no perfil de carga
   */
  private static calculateRequiredCapacity(
    loadProfile: LoadProfile,
    systemParams: BessSystemParams
  ): number {
    // Capacidade base para autonomia desejada
    const baseCapacity = loadProfile.essential_loads * systemParams.autonomy_hours;
    
    // Ajuste para profundidade de descarga
    const dodAdjustedCapacity = baseCapacity / (systemParams.depth_of_discharge / 100);
    
    // Ajuste para eficiência do sistema
    const efficiencyAdjustedCapacity = dodAdjustedCapacity / (systemParams.system_efficiency / 100);
    
    // Aplicar fator de redundância e expansão futura
    const finalCapacity = efficiencyAdjustedCapacity * 
                         systemParams.redundancy_factor * 
                         (1 + systemParams.future_expansion / 100);

    return Math.ceil(finalCapacity);
  }

  /**
   * Calcula potência necessária baseada no pico de demanda
   */
  private static calculateRequiredPower(
    loadProfile: LoadProfile,
    systemParams: BessSystemParams
  ): number {
    // Potência base do pico de carga
    const basePower = Math.max(loadProfile.peak_power, loadProfile.essential_loads);
    
    // Aplicar fator de pico
    const peakAdjustedPower = basePower * systemParams.peak_power_factor;
    
    // Ajustar para eficiência do inversor (assumindo 95%)
    const inverterEfficiency = CalculationConstants.BESS.DEFAULT_SYSTEM_EFFICIENCY / 100;
    const finalPower = peakAdjustedPower / inverterEfficiency;

    return Math.ceil(finalPower);
  }

  /**
   * Gera configurações possíveis de baterias
   */
  private static generateBatteryConfigurations(
    requiredCapacity: number,
    requiredPower: number,
    systemParams: BessSystemParams
  ): BessConfiguration[] {
    const configurations: BessConfiguration[] = [];

    this.BATTERY_DATABASE.forEach(battery => {
      // Calcular quantidade necessária baseada na capacidade
      const quantityByCapacity = Math.ceil(requiredCapacity / battery.capacity);
      
      // Calcular quantidade necessária baseada na potência
      const maxContinuousPower = (battery.voltage * battery.current) / 1000; // kW
      const quantityByPower = Math.ceil(requiredPower / maxContinuousPower);
      
      // Usar a maior quantidade necessária
      const quantity = Math.max(quantityByCapacity, quantityByPower);
      
      // Verificar se é uma configuração válida
      if (quantity <= CalculationConstants.BESS.MAX_BATTERIES) {
        const config: BessConfiguration = {
          battery_specs: battery,
          quantity,
          total_capacity: battery.capacity * quantity,
          total_power: maxContinuousPower * quantity,
          inverter_power: requiredPower,
          system_cost: (battery.cost * quantity) + (requiredPower * CalculationConstants.ADVANCED_FINANCIAL.INVERTER_COST_PER_KW),
          backup_time: (battery.capacity * quantity * (battery.depth_of_discharge / 100)) / requiredPower,
          cycles_per_year: 365 * CalculationConstants.SIMULATION.DAILY_CYCLES,
          system_lifetime: Math.min(battery.cycles / (365 * CalculationConstants.SIMULATION.DAILY_CYCLES), CalculationConstants.SIMULATION.MAX_SYSTEM_LIFETIME_YEARS),
          efficiency_losses: 100 - battery.efficiency
        };
        
        configurations.push(config);
      }
    });

    return configurations;
  }

  /**
   * Analisa configuração de bateria específica
   */
  private static analyzeBatteryConfiguration(
    config: BessConfiguration,
    loadProfile: LoadProfile,
    systemParams: BessSystemParams
  ): BessConfiguration {
    // Verificar se atende aos requisitos mínimos
    const meetsCapacityRequirement = config.total_capacity >= 
      (loadProfile.essential_loads * systemParams.autonomy_hours * CalculationConstants.VALIDATION.CAPACITY_REDUNDANCY_FACTOR);
    
    const meetsPowerRequirement = config.total_power >= loadProfile.peak_power;
    
    // Ajustar custo se não atender completamente aos requisitos
    if (!meetsCapacityRequirement || !meetsPowerRequirement) {
      config.system_cost *= CalculationConstants.ADVANCED_FINANCIAL.CONFIGURATION_PENALTY_FACTOR;
    }
    
    return config;
  }

  /**
   * Seleciona configuração ótima baseada em custo-benefício
   */
  private static selectOptimalConfiguration(
    configurations: BessConfiguration[]
  ): BessConfiguration {
    // Calcular score para cada configuração
    const scoredConfigs = configurations.map(config => {
      // Score baseado na relação custo/benefício
      const capacityScore = config.total_capacity / 100; // Normalizado
      const lifetimeScore = config.system_lifetime / CalculationConstants.SIMULATION.MAX_SYSTEM_LIFETIME_YEARS; // Normalizado
      const efficiencyScore = (100 - config.efficiency_losses) / 100;
      const costScore = 1 / (config.system_cost / 100000); // Inverso do custo normalizado
      
      const totalScore = (capacityScore * 0.3) + 
                        (lifetimeScore * 0.25) + 
                        (efficiencyScore * 0.25) + 
                        (costScore * 0.2);
      
      return { config, score: totalScore };
    });

    // Ordenar por score e retornar o melhor
    scoredConfigs.sort((a, b) => b.score - a.score);
    return scoredConfigs[0].config;
  }

  /**
   * Calcula análise financeira do sistema
   */
  private static calculateFinancialAnalysis(
    config: BessConfiguration,
    loadProfile: LoadProfile
  ) {
    // Economia anual estimada (peak shaving + backup)
    const peakShavingSavings = loadProfile.peak_power * CalculationConstants.LOAD_OPTIMIZATION.PEAK_SHAVING_THRESHOLD * 365 * CalculationConstants.LOAD_OPTIMIZATION.PEAK_TARIFF;
    const backupValue = loadProfile.daily_consumption * 365 * 0.1; // R$/ano
    const operationalSavings = peakShavingSavings + backupValue;
    
    // Payback simples
    const paybackPeriod = config.system_cost / operationalSavings;
    
    // ROI baseado na vida útil
    const totalSavings = operationalSavings * config.system_lifetime;
    const roi = ((totalSavings - config.system_cost) / config.system_cost) * 100;
    
    // VPL com taxa de desconto padrão
    const discountRate = CalculationConstants.FINANCIAL.DEFAULT_TAXA_DESCONTO / 100;
    let npv = -config.system_cost;
    for (let year = 1; year <= config.system_lifetime; year++) {
      npv += operationalSavings / Math.pow(1 + discountRate, year);
    }

    return {
      initial_investment: config.system_cost,
      operational_savings: operationalSavings,
      payback_period: paybackPeriod,
      roi,
      net_present_value: npv
    };
  }

  /**
   * Calcula análise técnica do sistema
   */
  private static calculateTechnicalAnalysis(
    config: BessConfiguration,
    loadProfile: LoadProfile
  ) {
    // Cobertura de carga
    const loadCoverage = Math.min(
      (config.total_capacity / loadProfile.daily_consumption) * 100,
      100
    );
    
    // Potencial de peak shaving
    const peakShavingPotential = Math.min(config.total_power, loadProfile.peak_power);
    
    // Independência da rede
    const gridIndependence = Math.min(
      (config.backup_time / 24) * 100,
      100
    );
    
    // Eficiência do sistema
    const systemEfficiency = config.battery_specs.efficiency;

    return {
      load_coverage: loadCoverage,
      peak_shaving_potential: peakShavingPotential,
      grid_independence: gridIndependence,
      system_efficiency: systemEfficiency
    };
  }

  /**
   * Calcula perfil de carga otimizado
   */
  static optimizeLoadProfile(
    loadProfile: LoadProfile,
    bessConfig: BessConfiguration
  ): { optimized_profile: number[]; energy_savings: number } {
    const optimizedProfile = [...loadProfile.hourly_consumption];
    let totalSavings = 0;

    // Implementar lógica de otimização de carga
    for (let hour = 0; hour < 24; hour++) {
      const hourlyLoad = loadProfile.hourly_consumption[hour];
      
      // Peak shaving durante horários de pico
      if (hour >= CalculationConstants.LOAD_OPTIMIZATION.PEAK_HOUR_START && hour <= CalculationConstants.LOAD_OPTIMIZATION.PEAK_HOUR_END && hourlyLoad > bessConfig.total_power * CalculationConstants.LOAD_OPTIMIZATION.PEAK_SHAVING_THRESHOLD) {
        const reduction = Math.min(
          hourlyLoad - (bessConfig.total_power * CalculationConstants.LOAD_OPTIMIZATION.PEAK_SHAVING_THRESHOLD),
          bessConfig.total_power * CalculationConstants.LOAD_OPTIMIZATION.MAX_PEAK_SHAVING_REDUCTION
        );
        
        optimizedProfile[hour] -= reduction;
        totalSavings += reduction * CalculationConstants.LOAD_OPTIMIZATION.PEAK_TARIFF;
      }
      
      // Carregamento durante horários de tarifa baixa
      if (hour >= CalculationConstants.LOAD_OPTIMIZATION.OFF_PEAK_START && hour <= CalculationConstants.LOAD_OPTIMIZATION.OFF_PEAK_END) {
        const chargingPower = Math.min(
          bessConfig.total_power * CalculationConstants.LOAD_OPTIMIZATION.OFF_PEAK_CHARGE_FACTOR,
          bessConfig.total_capacity * CalculationConstants.LOAD_OPTIMIZATION.DAILY_CHARGE_CAPACITY
        );
        
        optimizedProfile[hour] += chargingPower;
      }
    }

    return {
      optimized_profile: optimizedProfile,
      energy_savings: totalSavings * 365 // Anual
    };
  }

  /**
   * Simula operação do sistema BESS
   */
  static simulateBessOperation(
    config: BessConfiguration,
    loadProfile: LoadProfile,
    days: number = CalculationConstants.SIMULATION.DEFAULT_SIMULATION_DAYS
  ) {
    const simulation = [];
    let batterySOC:number = CalculationConstants.SIMULATION.INITIAL_SOC;
    
    for (let day = 0; day < days; day++) {
      const dailyData = {
        day: day + 1,
        energy_charged: 0,
        energy_discharged: 0,
        peak_shaving: 0,
        soc_profile: [] as number[]
      };

      for (let hour = 0; hour < 24; hour++) {
        const load = loadProfile.hourly_consumption[hour];
        const maxChargePower = config.total_power * CalculationConstants.SIMULATION.CHARGE_POWER_FACTOR;
        const maxDischargePower = config.total_power * CalculationConstants.SIMULATION.DISCHARGE_POWER_FACTOR;
        
        // Lógica de carregamento/descarregamento
        if (hour >= CalculationConstants.LOAD_OPTIMIZATION.OFF_PEAK_START && hour <= CalculationConstants.LOAD_OPTIMIZATION.OFF_PEAK_END && batterySOC < CalculationConstants.SIMULATION.MAX_SOC_CHARGE) {
          // Carregamento noturno
          const chargeAmount = Math.min(
            maxChargePower,
            (CalculationConstants.SIMULATION.MAX_SOC_CHARGE - batterySOC) * config.total_capacity
          );
          batterySOC += chargeAmount / config.total_capacity;
          dailyData.energy_charged += chargeAmount;
        } else if (hour >= CalculationConstants.LOAD_OPTIMIZATION.PEAK_HOUR_START && hour <= CalculationConstants.LOAD_OPTIMIZATION.PEAK_HOUR_END && load > config.total_power * CalculationConstants.LOAD_OPTIMIZATION.PEAK_SHAVING_THRESHOLD) {
          // Descarregamento no pico
          const dischargeNeeded = load - (config.total_power * CalculationConstants.LOAD_OPTIMIZATION.PEAK_SHAVING_THRESHOLD);
          const dischargeAmount = Math.min(
            maxDischargePower,
            dischargeNeeded,
            batterySOC * config.total_capacity
          );
          
          if (dischargeAmount > 0) {
            batterySOC -= dischargeAmount / config.total_capacity;
            dailyData.energy_discharged += dischargeAmount;
            dailyData.peak_shaving += dischargeAmount;
          }
        }
        
        // Manter SOC entre limites seguros
        const minSOC = CalculationConstants.SIMULATION.MIN_SOC_DISCHARGE as number;
        const maxSOC = CalculationConstants.SIMULATION.MAX_SOC_ABSOLUTE as number;
        batterySOC = Math.max(minSOC, Math.min(maxSOC, batterySOC));
        dailyData.soc_profile.push(batterySOC);
      }
      
      simulation.push(dailyData);
    }

    return simulation;
  }
}