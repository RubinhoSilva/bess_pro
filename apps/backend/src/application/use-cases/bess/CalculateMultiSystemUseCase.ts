import { Result } from '../../common/Result';
import { 
  MultiSystemCalculationService, 
  MultiSystemAnalysisResult, 
  SystemType,
  SolarSystemSpecs 
} from '../../../domain/services/MultiSystemCalculationService';
import { LoadProfile } from '../../../domain/services/BessCalculationService';

export interface CalculateMultiSystemRequest {
  loadProfile: LoadProfile;
  allowedSystems?: SystemType[];
  solarData?: SolarSystemSpecs;
  priorityFactors?: {
    cost: number;
    reliability: number;
    environment: number;
    maintenance: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
  };
  economicParameters?: {
    electricity_tariff: number; // R$/kWh
    demand_tariff: number; // R$/kW
    discount_rate: number; // %
    analysis_period: number; // anos
    inflation_rate: number; // %
  };
}

export interface CalculateMultiSystemResponse {
  analysis_result: MultiSystemAnalysisResult;
  detailed_comparison: {
    configurations_summary: ConfigurationSummary[];
    economic_metrics: EconomicMetrics;
    technical_metrics: TechnicalMetrics;
    environmental_metrics: EnvironmentalMetrics;
  };
  recommendations: {
    optimal_choice: string;
    reasoning: string[];
    implementation_steps: string[];
    considerations: string[];
  };
}

interface ConfigurationSummary {
  system_type: SystemType;
  total_cost: number;
  annual_savings: number;
  payback_period: number;
  reliability_score: number;
  carbon_footprint: number;
  pros: string[];
  cons: string[];
}

interface EconomicMetrics {
  lcoe_comparison: { [key in SystemType]?: number };
  npv_analysis: { [key in SystemType]?: number };
  irr_analysis: { [key in SystemType]?: number };
  sensitivity_analysis: {
    electricity_price_impact: number;
    fuel_price_impact: number;
    equipment_cost_impact: number;
  };
}

interface TechnicalMetrics {
  energy_independence: { [key in SystemType]?: number };
  system_efficiency: { [key in SystemType]?: number };
  maintenance_complexity: { [key in SystemType]?: number };
  scalability_potential: { [key in SystemType]?: number };
}

interface EnvironmentalMetrics {
  co2_emissions: { [key in SystemType]?: number };
  renewable_percentage: { [key in SystemType]?: number };
  environmental_score: { [key in SystemType]?: number };
}

export class CalculateMultiSystemUseCase {
  async execute(request: CalculateMultiSystemRequest): Promise<Result<CalculateMultiSystemResponse>> {
    try {
      // Validar dados de entrada
      const validationResult = this.validateRequest(request);
      if (!validationResult.isValid) {
        return Result.failure(validationResult.error || 'Erro de validação');
      }

      // Configurar parâmetros padrão
      const allowedSystems = request.allowedSystems || [
        SystemType.SOLAR_BESS_DIESEL,
        SystemType.SOLAR_BESS,
        SystemType.BESS_DIESEL
      ];

      const priorityFactors = request.priorityFactors || {
        cost: 0.4,
        reliability: 0.3,
        environment: 0.2,
        maintenance: 0.1
      };

      // Calcular configuração multi-sistema
      const analysisResult = MultiSystemCalculationService.calculateMultiSystemConfiguration(
        request.loadProfile,
        request.solarData,
        allowedSystems,
        priorityFactors
      );

      // Gerar comparação detalhada
      const detailedComparison = this.generateDetailedComparison(
        analysisResult,
        request.economicParameters
      );

      // Gerar recomendações
      const recommendations = this.generateRecommendations(
        analysisResult,
        request.loadProfile,
        request.location
      );

      const response: CalculateMultiSystemResponse = {
        analysis_result: analysisResult,
        detailed_comparison: detailedComparison,
        recommendations
      };

      return Result.success(response);

    } catch (error) {
      console.error('CalculateMultiSystemUseCase error:', error);
      return Result.failure('Erro ao calcular configuração multi-sistema');
    }
  }

  private validateRequest(request: CalculateMultiSystemRequest): { isValid: boolean; error?: string } {
    // Validar perfil de carga
    if (!request.loadProfile) {
      return { isValid: false, error: 'Perfil de carga é obrigatório' };
    }

    if (!request.loadProfile.hourly_consumption || request.loadProfile.hourly_consumption.length !== 24) {
      return { isValid: false, error: 'Consumo horário deve ter 24 valores' };
    }

    if (request.loadProfile.daily_consumption <= 0) {
      return { isValid: false, error: 'Consumo diário deve ser maior que zero' };
    }

    if (request.loadProfile.peak_power <= 0) {
      return { isValid: false, error: 'Potência de pico deve ser maior que zero' };
    }

    if (request.loadProfile.essential_loads < 0) {
      return { isValid: false, error: 'Cargas essenciais não podem ser negativas' };
    }

    // Validar fatores de prioridade
    if (request.priorityFactors) {
      const factors = request.priorityFactors;
      const sum = factors.cost + factors.reliability + factors.environment + factors.maintenance;
      if (Math.abs(sum - 1.0) > 0.01) {
        return { isValid: false, error: 'Soma dos fatores de prioridade deve ser 1.0' };
      }
    }

    // Validar dados solares se fornecidos
    if (request.solarData) {
      const solar = request.solarData;
      if (solar.capacity < 0 || solar.capacity > 1000) {
        return { isValid: false, error: 'Capacidade solar deve estar entre 0 e 1000 kWp' };
      }
      
      if (solar.irradiance_data && solar.irradiance_data.length !== 12) {
        return { isValid: false, error: 'Dados de irradiância devem ter 12 valores mensais' };
      }
    }

    return { isValid: true };
  }

  private generateDetailedComparison(
    analysisResult: MultiSystemAnalysisResult,
    economicParams?: CalculateMultiSystemRequest['economicParameters']
  ) {
    const allConfigs = [
      analysisResult.recommended_configuration,
      ...analysisResult.alternative_configurations
    ];

    // Resumo das configurações
    const configurationsSummary: ConfigurationSummary[] = allConfigs.map(config => ({
      system_type: config.system_type,
      total_cost: config.total_cost,
      annual_savings: this.calculateAnnualSavings(config, economicParams),
      payback_period: this.calculatePaybackPeriod(config, economicParams),
      reliability_score: config.reliability_index,
      carbon_footprint: config.carbon_footprint,
      pros: this.getSystemPros(config.system_type),
      cons: this.getSystemCons(config.system_type)
    }));

    // Métricas econômicas
    const economicMetrics: EconomicMetrics = {
      lcoe_comparison: this.calculateLCOEComparison(allConfigs),
      npv_analysis: this.calculateNPVAnalysis(allConfigs, economicParams),
      irr_analysis: this.calculateIRRAnalysis(allConfigs, economicParams),
      sensitivity_analysis: {
        electricity_price_impact: 0.15, // ±15% de impacto
        fuel_price_impact: 0.25, // ±25% de impacto
        equipment_cost_impact: 0.20 // ±20% de impacto
      }
    };

    // Métricas técnicas
    const technicalMetrics: TechnicalMetrics = {
      energy_independence: this.calculateEnergyIndependence(allConfigs),
      system_efficiency: this.calculateSystemEfficiency(allConfigs),
      maintenance_complexity: this.calculateMaintenanceComplexity(allConfigs),
      scalability_potential: this.calculateScalabilityPotential(allConfigs)
    };

    // Métricas ambientais
    const environmentalMetrics: EnvironmentalMetrics = {
      co2_emissions: this.mapConfigsToMetric(allConfigs, c => c.carbon_footprint),
      renewable_percentage: this.calculateRenewablePercentage(allConfigs),
      environmental_score: this.calculateEnvironmentalScore(allConfigs)
    };

    return {
      configurations_summary: configurationsSummary,
      economic_metrics: economicMetrics,
      technical_metrics: technicalMetrics,
      environmental_metrics: environmentalMetrics
    };
  }

  private generateRecommendations(
    analysisResult: MultiSystemAnalysisResult,
    loadProfile: LoadProfile,
    location?: CalculateMultiSystemRequest['location']
  ) {
    const optimalConfig = analysisResult.recommended_configuration;
    
    const reasoning = [];
    const implementationSteps = [];
    const considerations = [];

    // Análise do sistema recomendado
    switch (optimalConfig.system_type) {
      case SystemType.SOLAR_BESS_DIESEL:
        reasoning.push(
          'Sistema híbrido oferece máxima confiabilidade e flexibilidade',
          'Combina geração renovável com backup robusto',
          'Otimização inteligente reduz custos operacionais'
        );
        implementationSteps.push(
          '1. Instalação do sistema fotovoltaico',
          '2. Implementação do sistema de armazenamento',
          '3. Instalação e configuração do gerador diesel',
          '4. Integração e comissionamento do sistema de controle',
          '5. Testes e otimização da operação'
        );
        considerations.push(
          'Requer espaço adequado para todos os equipamentos',
          'Manutenção mais complexa devido aos múltiplos sistemas',
          'Maior investimento inicial, mas melhor retorno a longo prazo'
        );
        break;

      case SystemType.SOLAR_BESS:
        reasoning.push(
          'Solução limpa e silenciosa',
          'Baixos custos operacionais',
          'Ideal para locais com boa irradiação solar'
        );
        implementationSteps.push(
          '1. Dimensionamento e instalação fotovoltaica',
          '2. Implementação do sistema de baterias',
          '3. Configuração do sistema de gestão energética',
          '4. Comissionamento e testes'
        );
        considerations.push(
          'Dependente das condições climáticas',
          'Pode necessitar backup adicional em períodos críticos',
          'Excelente para redução da pegada de carbono'
        );
        break;

      case SystemType.BESS_DIESEL:
        reasoning.push(
          'Backup confiável independente do clima',
          'Boa relação custo-benefício para autonomias médias',
          'Sistema robusto para aplicações críticas'
        );
        implementationSteps.push(
          '1. Instalação do sistema de baterias',
          '2. Instalação do gerador diesel',
          '3. Configuração do sistema de controle automático',
          '4. Testes de autonomia e comissionamento'
        );
        considerations.push(
          'Custos operacionais com combustível',
          'Emissões de CO2 durante operação do diesel',
          'Necessita manutenção regular do gerador'
        );
        break;
    }

    // Recomendações específicas baseadas na localização
    if (location) {
      if (location.latitude && Math.abs(location.latitude) < 30) {
        considerations.push('Localização tropical favorável para energia solar');
      }
      
      if (location.state && ['AM', 'PA', 'AC', 'RR'].includes(location.state)) {
        considerations.push('Considerar logística de manutenção para região remota');
      }
    }

    // Recomendações baseadas no perfil de carga
    if (loadProfile.backup_duration > 24) {
      considerations.push('Longa duração de backup pode justificar sistema híbrido');
    }

    if (loadProfile.peak_power / loadProfile.daily_consumption > 0.5) {
      considerations.push('Alto pico de demanda requer dimensionamento cuidadoso');
    }

    return {
      optimal_choice: this.getSystemTypeName(optimalConfig.system_type),
      reasoning,
      implementation_steps: implementationSteps,
      considerations
    };
  }

  // Métodos auxiliares para cálculos específicos

  private calculateAnnualSavings(
    config: any,
    economicParams?: CalculateMultiSystemRequest['economicParameters']
  ): number {
    const electricityTariff = economicParams?.electricity_tariff || 0.75; // R$/kWh
    const demandTariff = economicParams?.demand_tariff || 25; // R$/kW
    
    // Estimativa baseada na geração e redução de demanda
    let savings = 0;
    
    if (config.annual_energy_production > 0) {
      savings += config.annual_energy_production * electricityTariff;
    }
    
    if (config.bess_config) {
      // Peak shaving savings
      savings += config.bess_config.total_power * 0.5 * demandTariff * 12;
    }
    
    // Subtrair custos operacionais
    savings -= config.annual_fuel_cost;
    savings -= config.annual_maintenance_cost;
    
    return Math.max(0, savings);
  }

  private calculatePaybackPeriod(
    config: any,
    economicParams?: CalculateMultiSystemRequest['economicParameters']
  ): number {
    const annualSavings = this.calculateAnnualSavings(config, economicParams);
    return annualSavings > 0 ? config.total_cost / annualSavings : 999;
  }

  private calculateLCOEComparison(configs: any[]): { [key in SystemType]?: number } {
    const result: { [key in SystemType]?: number } = {};
    
    configs.forEach(config => {
      // LCOE simplificado: custo total / energia produzida ao longo da vida útil
      const totalEnergy = (config.annual_energy_production || 8760) * 20; // 20 anos
      result[config.system_type as SystemType] = config.total_cost / totalEnergy;
    });
    
    return result;
  }

  private calculateNPVAnalysis(
    configs: any[],
    economicParams?: CalculateMultiSystemRequest['economicParameters']
  ): { [key in SystemType]?: number } {
    const result: { [key in SystemType]?: number } = {};
    const discountRate = (economicParams?.discount_rate || 10) / 100;
    const analysisPeriod = economicParams?.analysis_period || 20;
    
    configs.forEach(config => {
      let npv = -config.total_cost;
      const annualSavings = this.calculateAnnualSavings(config, economicParams);
      
      for (let year = 1; year <= analysisPeriod; year++) {
        npv += annualSavings / Math.pow(1 + discountRate, year);
      }
      
      result[config.system_type as SystemType] = npv;
    });
    
    return result;
  }

  private calculateIRRAnalysis(
    configs: any[],
    economicParams?: CalculateMultiSystemRequest['economicParameters']
  ): { [key in SystemType]?: number } {
    const result: { [key in SystemType]?: number } = {};
    
    configs.forEach(config => {
      const annualSavings = this.calculateAnnualSavings(config, economicParams);
      // IRR simplificado
      result[config.system_type as SystemType] = (annualSavings / config.total_cost) * 100;
    });
    
    return result;
  }

  private calculateEnergyIndependence(configs: any[]): { [key in SystemType]?: number } {
    const result: { [key in SystemType]?: number } = {};
    
    configs.forEach(config => {
      let independence = 0;
      
      if (config.solar_specs) independence += 40;
      if (config.bess_config) independence += 30;
      if (config.diesel_specs) independence += 30;
      
      result[config.system_type as SystemType] = Math.min(100, independence);
    });
    
    return result;
  }

  private calculateSystemEfficiency(configs: any[]): { [key in SystemType]?: number } {
    const result: { [key in SystemType]?: number } = {};
    
    configs.forEach(config => {
      let efficiency = 0;
      let components = 0;
      
      if (config.solar_specs) {
        efficiency += config.solar_specs.panel_efficiency * config.solar_specs.inverter_efficiency / 100;
        components++;
      }
      
      if (config.bess_config) {
        efficiency += config.bess_config.battery_specs.efficiency;
        components++;
      }
      
      if (config.diesel_specs) {
        efficiency += 35; // Eficiência típica de gerador diesel
        components++;
      }
      
      result[config.system_type as SystemType] = components > 0 ? efficiency / components : 0;
    });
    
    return result;
  }

  private calculateMaintenanceComplexity(configs: any[]): { [key in SystemType]?: number } {
    const result: { [key in SystemType]?: number } = {};
    
    configs.forEach(config => {
      let complexity = 0;
      
      if (config.solar_specs) complexity += 1;
      if (config.bess_config) complexity += 2;
      if (config.diesel_specs) complexity += 3;
      
      result[config.system_type as SystemType] = complexity;
    });
    
    return result;
  }

  private calculateScalabilityPotential(configs: any[]): { [key in SystemType]?: number } {
    const result: { [key in SystemType]?: number } = {};
    
    configs.forEach(config => {
      let scalability = 0;
      
      if (config.solar_specs) scalability += 40; // Solar é altamente escalável
      if (config.bess_config) scalability += 35; // BESS é moderadamente escalável
      if (config.diesel_specs) scalability += 25; // Diesel é menos escalável
      
      result[config.system_type as SystemType] = Math.min(100, scalability);
    });
    
    return result;
  }

  private calculateRenewablePercentage(configs: any[]): { [key in SystemType]?: number } {
    const result: { [key in SystemType]?: number } = {};
    
    configs.forEach(config => {
      let renewable = 0;
      
      if (config.solar_specs && config.annual_energy_production > 0) {
        renewable = 100; // Solar é 100% renovável
      }
      
      if (config.diesel_specs) {
        renewable = renewable * 0.7; // Reduz percentual devido ao diesel
      }
      
      result[config.system_type as SystemType] = renewable;
    });
    
    return result;
  }

  private calculateEnvironmentalScore(configs: any[]): { [key in SystemType]?: number } {
    const result: { [key in SystemType]?: number } = {};
    
    configs.forEach(config => {
      let score = 100;
      
      // Penalizar por emissões
      if (config.carbon_footprint > 0) {
        score -= Math.min(50, config.carbon_footprint / 100);
      }
      
      // Bonus por energia renovável
      if (config.annual_energy_production > 0) {
        score += 10;
      }
      
      result[config.system_type as SystemType] = Math.max(0, Math.min(100, score));
    });
    
    return result;
  }

  private mapConfigsToMetric(configs: any[], extractor: (config: any) => number): { [key in SystemType]?: number } {
    const result: { [key in SystemType]?: number } = {};
    configs.forEach(config => {
      result[config.system_type as SystemType] = extractor(config);
    });
    return result;
  }

  private getSystemPros(systemType: SystemType): string[] {
    const prosMap = {
      [SystemType.SOLAR_ONLY]: ['Energia limpa', 'Baixo custo operacional', 'Manutenção simples'],
      [SystemType.BESS_ONLY]: ['Resposta rápida', 'Controle de demanda', 'Sem emissões'],
      [SystemType.DIESEL_ONLY]: ['Alta confiabilidade', 'Funcionamento independente', 'Custo inicial baixo'],
      [SystemType.SOLAR_BESS]: ['Energia renovável', 'Autonomia parcial', 'Redução de custos'],
      [SystemType.SOLAR_DIESEL]: ['Backup confiável', 'Redução de combustível', 'Operação flexível'],
      [SystemType.BESS_DIESEL]: ['Alta autonomia', 'Controle inteligente', 'Backup robusto'],
      [SystemType.SOLAR_BESS_DIESEL]: ['Máxima confiabilidade', 'Otimização completa', 'Independência energética']
    };
    
    return prosMap[systemType] || [];
  }

  private getSystemCons(systemType: SystemType): string[] {
    const consMap = {
      [SystemType.SOLAR_ONLY]: ['Dependente do clima', 'Sem armazenamento', 'Produção variável'],
      [SystemType.BESS_ONLY]: ['Capacidade limitada', 'Degradação das baterias', 'Alto custo inicial'],
      [SystemType.DIESEL_ONLY]: ['Altos custos de combustível', 'Emissões', 'Ruído'],
      [SystemType.SOLAR_BESS]: ['Investimento alto', 'Dependente do clima', 'Complexidade média'],
      [SystemType.SOLAR_DIESEL]: ['Emissões residuais', 'Manutenção diesel', 'Ruído ocasional'],
      [SystemType.BESS_DIESEL]: ['Custos de combustível', 'Emissões do diesel', 'Manutenção complexa'],
      [SystemType.SOLAR_BESS_DIESEL]: ['Investimento elevado', 'Manutenção complexa', 'Espaço necessário']
    };
    
    return consMap[systemType] || [];
  }

  private getSystemTypeName(systemType: SystemType): string {
    const nameMap = {
      [SystemType.SOLAR_ONLY]: 'Sistema Solar Fotovoltaico',
      [SystemType.BESS_ONLY]: 'Sistema de Armazenamento (BESS)',
      [SystemType.DIESEL_ONLY]: 'Gerador Diesel',
      [SystemType.SOLAR_BESS]: 'Sistema Solar + Armazenamento',
      [SystemType.SOLAR_DIESEL]: 'Sistema Solar + Diesel',
      [SystemType.BESS_DIESEL]: 'Armazenamento + Diesel',
      [SystemType.SOLAR_BESS_DIESEL]: 'Sistema Híbrido Completo'
    };
    
    return nameMap[systemType] || 'Sistema Desconhecido';
  }
}