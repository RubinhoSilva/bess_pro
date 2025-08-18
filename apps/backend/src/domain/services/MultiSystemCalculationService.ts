import { BatterySpecifications, LoadProfile, BessConfiguration } from './BessCalculationService';

export enum SystemType {
  SOLAR_ONLY = 'solar_only',
  BESS_ONLY = 'bess_only',
  DIESEL_ONLY = 'diesel_only',
  SOLAR_BESS = 'solar_bess',
  SOLAR_DIESEL = 'solar_diesel',
  BESS_DIESEL = 'bess_diesel',
  SOLAR_BESS_DIESEL = 'solar_bess_diesel'
}

export interface SolarSystemSpecs {
  capacity: number; // kWp
  panel_efficiency: number; // %
  inverter_efficiency: number; // %
  system_losses: number; // %
  tilt_angle: number; // graus
  azimuth: number; // graus
  cost_per_kwp: number; // R$/kWp
  irradiance_data: number[]; // kWh/m²/dia por mês
}

export interface DieselGeneratorSpecs {
  rated_power: number; // kW
  fuel_consumption: number; // L/h por kW
  fuel_cost: number; // R$/L
  maintenance_cost: number; // R$/h de operação
  start_time: number; // segundos para iniciar
  noise_level: number; // dB
  emissions_factor: number; // kg CO2/L
  initial_cost: number; // R$
  lifetime_hours: number; // horas
}

export interface MultiSystemConfiguration {
  system_type: SystemType;
  solar_specs?: SolarSystemSpecs;
  bess_config?: BessConfiguration;
  diesel_specs?: DieselGeneratorSpecs;
  control_strategy: ControlStrategy;
  total_cost: number;
  annual_energy_production: number; // kWh
  annual_fuel_cost: number; // R$
  annual_maintenance_cost: number; // R$
  carbon_footprint: number; // kg CO2/ano
  reliability_index: number; // %
}

export interface ControlStrategy {
  priority_order: SystemType[]; // Ordem de prioridade de acionamento
  solar_charging: boolean; // BESS carrega com solar
  grid_charging: boolean; // BESS carrega da rede
  diesel_backup_soc: number; // % SOC para acionar diesel
  load_management: boolean; // Gerenciamento automático de cargas
  peak_shaving: boolean; // Peak shaving ativo
  time_of_use: boolean; // Otimização por tarifa horária
  emergency_reserve: number; // % reserva de emergência BESS
}

export interface MultiSystemAnalysisResult {
  recommended_configuration: MultiSystemConfiguration;
  alternative_configurations: MultiSystemConfiguration[];
  comparative_analysis: {
    lcoe: number; // Levelized Cost of Energy (R$/kWh)
    reliability: number; // %
    autonomy_hours: number; // horas de autonomia total
    payback_period: number; // anos
    environmental_impact: number; // kg CO2/ano
  };
  operational_scenarios: {
    normal_operation: OperationalScenario;
    grid_outage: OperationalScenario;
    peak_demand: OperationalScenario;
    maintenance_mode: OperationalScenario;
  };
}

export interface OperationalScenario {
  scenario_name: string;
  duration_hours: number;
  energy_sources: {
    solar_contribution: number; // %
    battery_contribution: number; // %
    diesel_contribution: number; // %
    grid_contribution: number; // %
  };
  operational_cost: number; // R$
  emissions: number; // kg CO2
}

export class MultiSystemCalculationService {
  private static readonly DIESEL_DATABASE: DieselGeneratorSpecs[] = [
    {
      rated_power: 10,
      fuel_consumption: 2.5,
      fuel_cost: 5.50,
      maintenance_cost: 15,
      start_time: 10,
      noise_level: 65,
      emissions_factor: 2.7,
      initial_cost: 25000,
      lifetime_hours: 15000
    },
    {
      rated_power: 20,
      fuel_consumption: 4.8,
      fuel_cost: 5.50,
      maintenance_cost: 20,
      start_time: 15,
      noise_level: 68,
      emissions_factor: 2.7,
      initial_cost: 45000,
      lifetime_hours: 18000
    },
    {
      rated_power: 50,
      fuel_consumption: 11.5,
      fuel_cost: 5.50,
      maintenance_cost: 30,
      start_time: 20,
      noise_level: 72,
      emissions_factor: 2.7,
      initial_cost: 95000,
      lifetime_hours: 20000
    }
  ];

  /**
   * Calcula configuração ótima multi-sistema
   */
  static calculateMultiSystemConfiguration(
    loadProfile: LoadProfile,
    solarData?: SolarSystemSpecs,
    allowedSystems: SystemType[] = [SystemType.SOLAR_BESS_DIESEL],
    priorityFactors: {
      cost: number;
      reliability: number;
      environment: number;
      maintenance: number;
    } = { cost: 0.4, reliability: 0.3, environment: 0.2, maintenance: 0.1 }
  ): MultiSystemAnalysisResult {
    
    const configurations: MultiSystemConfiguration[] = [];

    // Gerar configurações para cada tipo de sistema permitido
    for (const systemType of allowedSystems) {
      const configs = this.generateSystemConfigurations(systemType, loadProfile, solarData);
      configurations.push(...configs);
    }

    // Analisar cada configuração
    const analyzedConfigs = configurations.map(config => 
      this.analyzeSystemConfiguration(config, loadProfile)
    );

    // Selecionar configuração ótima
    const recommendedConfig = this.selectOptimalMultiSystemConfiguration(
      analyzedConfigs, 
      priorityFactors
    );

    // Análise comparativa
    const comparativeAnalysis = this.calculateComparativeAnalysis(analyzedConfigs);

    // Cenários operacionais
    const operationalScenarios = this.simulateOperationalScenarios(
      recommendedConfig,
      loadProfile
    );

    return {
      recommended_configuration: recommendedConfig,
      alternative_configurations: analyzedConfigs.filter(config => config !== recommendedConfig),
      comparative_analysis: comparativeAnalysis,
      operational_scenarios: operationalScenarios
    };
  }

  /**
   * Gera configurações para um tipo de sistema específico
   */
  private static generateSystemConfigurations(
    systemType: SystemType,
    loadProfile: LoadProfile,
    solarData?: SolarSystemSpecs
  ): MultiSystemConfiguration[] {
    const configurations: MultiSystemConfiguration[] = [];

    switch (systemType) {
      case SystemType.SOLAR_BESS_DIESEL:
        configurations.push(...this.generateHybridConfigurations(loadProfile, solarData));
        break;
      case SystemType.SOLAR_BESS:
        configurations.push(...this.generateSolarBessConfigurations(loadProfile, solarData));
        break;
      case SystemType.BESS_DIESEL:
        configurations.push(...this.generateBessDieselConfigurations(loadProfile));
        break;
      // Adicionar outros casos conforme necessário
    }

    return configurations;
  }

  /**
   * Gera configurações híbridas (Solar + BESS + Diesel)
   */
  private static generateHybridConfigurations(
    loadProfile: LoadProfile,
    solarData?: SolarSystemSpecs
  ): MultiSystemConfiguration[] {
    const configurations: MultiSystemConfiguration[] = [];

    // Diferentes tamanhos de sistema solar (50%, 75%, 100%, 125% da carga)
    const solarSizingFactors = [0.5, 0.75, 1.0, 1.25];
    
    // Diferentes autonomias de bateria (4h, 8h, 12h, 24h)
    const batteryAutonomyHours = [4, 8, 12, 24];

    // Diferentes potências de diesel (50%, 75%, 100% da carga pico)
    const dieselSizingFactors = [0.5, 0.75, 1.0];

    solarSizingFactors.forEach(solarFactor => {
      batteryAutonomyHours.forEach(autonomyHours => {
        dieselSizingFactors.forEach(dieselFactor => {
          const config = this.createHybridConfiguration(
            loadProfile,
            solarFactor,
            autonomyHours,
            dieselFactor,
            solarData
          );
          
          if (config) {
            configurations.push(config);
          }
        });
      });
    });

    return configurations;
  }

  /**
   * Cria configuração híbrida específica
   */
  private static createHybridConfiguration(
    loadProfile: LoadProfile,
    solarFactor: number,
    batteryAutonomyHours: number,
    dieselFactor: number,
    solarData?: SolarSystemSpecs
  ): MultiSystemConfiguration | null {
    try {
      // Calcular sistema solar
      const solarCapacity = loadProfile.daily_consumption * solarFactor * 1.2; // kWp
      const solarSpecs: SolarSystemSpecs = solarData || this.getDefaultSolarSpecs();
      solarSpecs.capacity = solarCapacity;

      // Calcular sistema BESS
      const batteryCapacity = loadProfile.essential_loads * batteryAutonomyHours;
      const bessConfig = this.calculateOptimalBessForHybrid(
        batteryCapacity,
        loadProfile.peak_power
      );

      // Calcular sistema diesel
      const dieselPower = loadProfile.peak_power * dieselFactor;
      const dieselSpecs = this.selectOptimalDieselGenerator(dieselPower);

      // Estratégia de controle inteligente
      const controlStrategy: ControlStrategy = {
        priority_order: [SystemType.SOLAR_ONLY, SystemType.BESS_ONLY, SystemType.DIESEL_ONLY],
        solar_charging: true,
        grid_charging: false,
        diesel_backup_soc: 20, // Aciona diesel quando bateria ≤ 20%
        load_management: true,
        peak_shaving: true,
        time_of_use: true,
        emergency_reserve: 10
      };

      // Calcular custos
      const totalCost = solarSpecs.cost_per_kwp * solarSpecs.capacity +
                       bessConfig.system_cost +
                       dieselSpecs.initial_cost;

      // Estimativa de produção anual
      const annualSolarProduction = this.calculateAnnualSolarProduction(solarSpecs);
      
      // Custos operacionais
      const annualFuelCost = this.estimateAnnualFuelCost(dieselSpecs, loadProfile);
      const annualMaintenanceCost = this.estimateAnnualMaintenanceCost(
        solarSpecs, 
        bessConfig, 
        dieselSpecs
      );

      // Pegada de carbono
      const carbonFootprint = this.calculateCarbonFootprint(
        dieselSpecs,
        annualFuelCost / dieselSpecs.fuel_cost // Estimativa de litros/ano
      );

      // Índice de confiabilidade
      const reliabilityIndex = this.calculateReliabilityIndex(
        solarSpecs,
        bessConfig,
        dieselSpecs,
        controlStrategy
      );

      return {
        system_type: SystemType.SOLAR_BESS_DIESEL,
        solar_specs: solarSpecs,
        bess_config: bessConfig,
        diesel_specs: dieselSpecs,
        control_strategy: controlStrategy,
        total_cost: totalCost,
        annual_energy_production: annualSolarProduction,
        annual_fuel_cost: annualFuelCost,
        annual_maintenance_cost: annualMaintenanceCost,
        carbon_footprint: carbonFootprint,
        reliability_index: reliabilityIndex
      };

    } catch (error) {
      console.error('Erro ao criar configuração híbrida:', error);
      return null;
    }
  }

  /**
   * Configurações Solar + BESS
   */
  private static generateSolarBessConfigurations(
    loadProfile: LoadProfile,
    solarData?: SolarSystemSpecs
  ): MultiSystemConfiguration[] {
    // Similar à híbrida, mas sem diesel
    return this.generateHybridConfigurations(loadProfile, solarData)
      .map(config => ({
        ...config,
        system_type: SystemType.SOLAR_BESS,
        diesel_specs: undefined,
        total_cost: config.total_cost - (config.diesel_specs?.initial_cost || 0),
        annual_fuel_cost: 0,
        carbon_footprint: 0,
        reliability_index: config.reliability_index * 0.85 // Redução sem backup diesel
      }));
  }

  /**
   * Configurações BESS + Diesel
   */
  private static generateBessDieselConfigurations(
    loadProfile: LoadProfile
  ): MultiSystemConfiguration[] {
    const configurations: MultiSystemConfiguration[] = [];
    const autonomyHours = [8, 12, 24];
    const dieselFactors = [0.75, 1.0, 1.25];

    autonomyHours.forEach(hours => {
      dieselFactors.forEach(factor => {
        const config = this.createBessDieselConfiguration(loadProfile, hours, factor);
        if (config) configurations.push(config);
      });
    });

    return configurations;
  }

  /**
   * Cria configuração BESS + Diesel
   */
  private static createBessDieselConfiguration(
    loadProfile: LoadProfile,
    batteryAutonomyHours: number,
    dieselFactor: number
  ): MultiSystemConfiguration | null {
    const batteryCapacity = loadProfile.essential_loads * batteryAutonomyHours;
    const bessConfig = this.calculateOptimalBessForHybrid(
      batteryCapacity,
      loadProfile.peak_power
    );

    const dieselPower = loadProfile.peak_power * dieselFactor;
    const dieselSpecs = this.selectOptimalDieselGenerator(dieselPower);

    const controlStrategy: ControlStrategy = {
      priority_order: [SystemType.BESS_ONLY, SystemType.DIESEL_ONLY],
      solar_charging: false,
      grid_charging: true,
      diesel_backup_soc: 30,
      load_management: true,
      peak_shaving: true,
      time_of_use: true,
      emergency_reserve: 15
    };

    return {
      system_type: SystemType.BESS_DIESEL,
      bess_config: bessConfig,
      diesel_specs: dieselSpecs,
      control_strategy: controlStrategy,
      total_cost: bessConfig.system_cost + dieselSpecs.initial_cost,
      annual_energy_production: 0, // Sem geração solar
      annual_fuel_cost: this.estimateAnnualFuelCost(dieselSpecs, loadProfile),
      annual_maintenance_cost: this.estimateAnnualMaintenanceCost(
        undefined, 
        bessConfig, 
        dieselSpecs
      ),
      carbon_footprint: this.calculateCarbonFootprint(
        dieselSpecs,
        this.estimateAnnualFuelCost(dieselSpecs, loadProfile) / dieselSpecs.fuel_cost
      ),
      reliability_index: this.calculateReliabilityIndex(
        undefined,
        bessConfig,
        dieselSpecs,
        controlStrategy
      )
    };
  }

  // Métodos auxiliares privados

  private static getDefaultSolarSpecs(): SolarSystemSpecs {
    return {
      capacity: 0,
      panel_efficiency: 22,
      inverter_efficiency: 97,
      system_losses: 15,
      tilt_angle: 23,
      azimuth: 0,
      cost_per_kwp: 3500,
      irradiance_data: [5.2, 5.4, 5.1, 4.8, 4.2, 3.8, 4.1, 4.6, 5.0, 5.3, 5.5, 5.4]
    };
  }

  private static calculateOptimalBessForHybrid(
    requiredCapacity: number,
    requiredPower: number
  ): BessConfiguration {
    // Implementação simplificada - usar o serviço BESS existente
    return {
      battery_specs: {
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
      quantity: Math.ceil(requiredCapacity / 13.5),
      total_capacity: requiredCapacity,
      total_power: requiredPower,
      inverter_power: requiredPower,
      system_cost: Math.ceil(requiredCapacity / 13.5) * 45000,
      backup_time: requiredCapacity / requiredPower,
      cycles_per_year: 365,
      system_lifetime: 15,
      efficiency_losses: 5
    };
  }

  private static selectOptimalDieselGenerator(requiredPower: number): DieselGeneratorSpecs {
    return this.DIESEL_DATABASE.find(gen => gen.rated_power >= requiredPower) || 
           this.DIESEL_DATABASE[this.DIESEL_DATABASE.length - 1];
  }

  private static calculateAnnualSolarProduction(solarSpecs: SolarSystemSpecs): number {
    const monthlyProduction = solarSpecs.irradiance_data.map(irradiance => {
      return solarSpecs.capacity * irradiance * 30 * // kWh/mês
             (solarSpecs.panel_efficiency / 100) *
             (solarSpecs.inverter_efficiency / 100) *
             (1 - solarSpecs.system_losses / 100);
    });

    return monthlyProduction.reduce((sum, monthly) => sum + monthly, 0);
  }

  private static estimateAnnualFuelCost(
    dieselSpecs: DieselGeneratorSpecs,
    loadProfile: LoadProfile
  ): number {
    // Estimativa baseada em 2 horas/dia de operação média
    const averageOperationHours = 730; // horas/ano
    const fuelConsumption = averageOperationHours * 
                          dieselSpecs.fuel_consumption * 
                          (loadProfile.peak_power / dieselSpecs.rated_power);
    return fuelConsumption * dieselSpecs.fuel_cost;
  }

  private static estimateAnnualMaintenanceCost(
    solarSpecs?: SolarSystemSpecs,
    bessConfig?: BessConfiguration,
    dieselSpecs?: DieselGeneratorSpecs
  ): number {
    let totalMaintenance = 0;

    if (solarSpecs) {
      totalMaintenance += solarSpecs.capacity * 50; // R$ 50/kWp/ano
    }

    if (bessConfig) {
      totalMaintenance += bessConfig.system_cost * 0.02; // 2% do investimento/ano
    }

    if (dieselSpecs) {
      totalMaintenance += 730 * dieselSpecs.maintenance_cost; // Manutenção por hora de operação
    }

    return totalMaintenance;
  }

  private static calculateCarbonFootprint(
    dieselSpecs: DieselGeneratorSpecs,
    annualFuelConsumption: number
  ): number {
    return annualFuelConsumption * dieselSpecs.emissions_factor;
  }

  private static calculateReliabilityIndex(
    solarSpecs?: SolarSystemSpecs,
    bessConfig?: BessConfiguration,
    dieselSpecs?: DieselGeneratorSpecs,
    controlStrategy?: ControlStrategy
  ): number {
    let reliability = 0;

    if (solarSpecs) reliability += 70; // Solar base
    if (bessConfig) reliability += 25; // BESS adiciona confiabilidade
    if (dieselSpecs) reliability += 15; // Diesel como backup

    // Ajustes baseados na estratégia de controle
    if (controlStrategy?.load_management) reliability += 5;
    if (controlStrategy?.emergency_reserve && controlStrategy.emergency_reserve > 0) reliability += 5;

    return Math.min(100, reliability);
  }

  private static analyzeSystemConfiguration(
    config: MultiSystemConfiguration,
    loadProfile: LoadProfile
  ): MultiSystemConfiguration {
    // Análise detalhada da configuração
    // Por enquanto, retorna a configuração sem modificações
    // Aqui seria implementada lógica de validação e otimização
    return config;
  }

  private static selectOptimalMultiSystemConfiguration(
    configurations: MultiSystemConfiguration[],
    priorityFactors: { cost: number; reliability: number; environment: number; maintenance: number }
  ): MultiSystemConfiguration {
    // Calcular score para cada configuração
    const scoredConfigs = configurations.map(config => {
      const costScore = 1 / (config.total_cost / 100000); // Normalizado e invertido
      const reliabilityScore = config.reliability_index / 100;
      const environmentScore = 1 / (config.carbon_footprint / 1000 + 1); // Normalizado e invertido
      const maintenanceScore = 1 / (config.annual_maintenance_cost / 10000 + 1); // Normalizado e invertido

      const totalScore = (costScore * priorityFactors.cost) +
                        (reliabilityScore * priorityFactors.reliability) +
                        (environmentScore * priorityFactors.environment) +
                        (maintenanceScore * priorityFactors.maintenance);

      return { config, score: totalScore };
    });

    scoredConfigs.sort((a, b) => b.score - a.score);
    return scoredConfigs[0].config;
  }

  private static calculateComparativeAnalysis(
    configurations: MultiSystemConfiguration[]
  ) {
    // Calcular métricas comparativas
    const totalCosts = configurations.map(c => c.total_cost);
    const reliabilities = configurations.map(c => c.reliability_index);
    const emissions = configurations.map(c => c.carbon_footprint);

    return {
      lcoe: totalCosts.reduce((sum, cost) => sum + cost, 0) / totalCosts.length / 8760, // Média LCOE
      reliability: reliabilities.reduce((sum, rel) => sum + rel, 0) / reliabilities.length,
      autonomy_hours: 24, // Estimativa média
      payback_period: 8, // Estimativa média
      environmental_impact: emissions.reduce((sum, em) => sum + em, 0) / emissions.length
    };
  }

  private static simulateOperationalScenarios(
    config: MultiSystemConfiguration,
    loadProfile: LoadProfile
  ) {
    return {
      normal_operation: {
        scenario_name: "Operação Normal",
        duration_hours: 24,
        energy_sources: {
          solar_contribution: config.solar_specs ? 60 : 0,
          battery_contribution: config.bess_config ? 25 : 0,
          diesel_contribution: config.diesel_specs ? 5 : 0,
          grid_contribution: 10
        },
        operational_cost: 150,
        emissions: 2.5
      },
      grid_outage: {
        scenario_name: "Falta de Energia da Rede",
        duration_hours: 8,
        energy_sources: {
          solar_contribution: config.solar_specs ? 50 : 0,
          battery_contribution: config.bess_config ? 35 : 0,
          diesel_contribution: config.diesel_specs ? 15 : 0,
          grid_contribution: 0
        },
        operational_cost: 85,
        emissions: 8.2
      },
      peak_demand: {
        scenario_name: "Pico de Demanda",
        duration_hours: 3,
        energy_sources: {
          solar_contribution: config.solar_specs ? 30 : 0,
          battery_contribution: config.bess_config ? 45 : 0,
          diesel_contribution: config.diesel_specs ? 15 : 0,
          grid_contribution: 10
        },
        operational_cost: 45,
        emissions: 3.8
      },
      maintenance_mode: {
        scenario_name: "Modo Manutenção",
        duration_hours: 4,
        energy_sources: {
          solar_contribution: 0,
          battery_contribution: config.bess_config ? 60 : 0,
          diesel_contribution: config.diesel_specs ? 30 : 0,
          grid_contribution: 10
        },
        operational_cost: 95,
        emissions: 15.5
      }
    };
  }
}