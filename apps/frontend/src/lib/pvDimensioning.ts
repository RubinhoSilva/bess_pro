import { SolarModule, Inverter } from '@/hooks/equipment-hooks';

export interface DimensioningInput {
  consumoAnual: number; // kWh/ano
  irradiacaoMedia: number; // kWh/m²/dia
  eficienciaSistema: number; // %
  location: {
    latitude: number;
    longitude: number;
    estado?: string;
  };
  budget?: {
    min: number;
    max: number;
  };
  preferences: {
    prioridadeEficiencia: boolean;
    prioridadeCusto: boolean;
    fabricantePreferido?: string;
  };
}

export interface DimensioningResult {
  potenciaSistemakWp: number;
  geracaoEstimadaAnual: number;
  modulos: {
    module: SolarModule;
    quantidade: number;
    potenciaTotal: number;
    areaTotal: number;
  }[];
  inversores: {
    inverter: Inverter;
    quantidade: number;
    potenciaTotal: number;
  }[];
  configuracoes: {
    modulosEmSerie: number;
    stringsParalelo: number;
    totalStrings: number;
  }[];
  compatibilidade: {
    ratioDcAc: number;
    status: 'excellent' | 'good' | 'acceptable' | 'problematic';
    warnings: string[];
  };
  estimativaCusto?: {
    modulos: number;
    inversores: number;
    total: number;
  };
  performance: {
    geracaoMensal: number[];
    fatorCapacidade: number;
    perdas: {
      temperatura: number;
      sombreamento: number;
      cabeamento: number;
      sujeira: number;
      total: number;
    };
  };
}

export class PVDimensioningService {
  
  static calculateOptimalSystem(
    input: DimensioningInput,
    availableModules: SolarModule[],
    availableInverters: Inverter[]
  ): DimensioningResult[] {
    
    const potenciaMinima = input.consumoAnual / (input.irradiacaoMedia * 365 * input.eficienciaSistema / 100);
    const potenciaIdeal = potenciaMinima * 1.1; // 10% de margem
    
    const options: DimensioningResult[] = [];
    
    // Filtrar módulos por preferências
    const filteredModules = this.filterModulesByPreferences(availableModules, input.preferences);
    const filteredInverters = this.filterInvertersByPreferences(availableInverters, input.preferences);
    
    // Gerar opções para cada módulo
    for (const module of filteredModules.slice(0, 5)) { // Top 5 módulos
      for (const inverter of filteredInverters.slice(0, 3)) { // Top 3 inversores
        const configuration = this.calculateConfiguration(potenciaIdeal, module, inverter);
        
        if (configuration && this.isConfigurationValid(configuration)) {
          const result = this.buildDimensioningResult(input, configuration, module, inverter);
          options.push(result);
        }
      }
    }
    
    // Ordenar por score combinado (eficiência, custo, compatibilidade)
    return options.sort((a, b) => this.calculateScore(b, input) - this.calculateScore(a, input));
  }
  
  private static filterModulesByPreferences(
    modules: SolarModule[],
    preferences: DimensioningInput['preferences']
  ): SolarModule[] {
    let filtered = modules.filter(m => m.potenciaNominal > 0);
    
    if (preferences.fabricantePreferido) {
      const preferred = filtered.filter(m => 
        m.fabricante.toLowerCase().includes(preferences.fabricantePreferido!.toLowerCase())
      );
      if (preferred.length > 0) {
        filtered = preferred;
      }
    }
    
    // Ordenar por eficiência se for prioridade
    if (preferences.prioridadeEficiencia) {
      filtered = filtered.sort((a, b) => (b.eficiencia || 0) - (a.eficiencia || 0));
    }
    
    return filtered;
  }
  
  private static filterInvertersByPreferences(
    inverters: Inverter[],
    preferences: DimensioningInput['preferences']
  ): Inverter[] {
    let filtered = inverters.filter(i => i.potenciaSaidaCA > 0);
    
    if (preferences.fabricantePreferido) {
      const preferred = filtered.filter(i => 
        i.fabricante.toLowerCase().includes(preferences.fabricantePreferido!.toLowerCase())
      );
      if (preferred.length > 0) {
        filtered = preferred;
      }
    }
    
    // Ordenar por eficiência se for prioridade
    if (preferences.prioridadeEficiencia) {
      filtered = filtered.sort((a, b) => (b.eficienciaMax || 0) - (a.eficienciaMax || 0));
    }
    
    return filtered;
  }
  
  private static calculateConfiguration(
    potenciaDesejada: number, // kW
    module: SolarModule,
    inverter: Inverter
  ): any {
    const potenciaModuloW = module.potenciaNominal;
    const numeroModulosNecessarios = Math.ceil((potenciaDesejada * 1000) / potenciaModuloW);
    
    // Calcular configuração de strings
    const tensaoMaxInverter = inverter.tensaoCcMax || 1000;
    const tensaoMinMppt = this.extractMinMpptVoltage(inverter.faixaMppt || '');
    const tensaoMaxMppt = this.extractMaxMpptVoltage(inverter.faixaMppt || '');
    
    const vmppModulo = module.vmpp || 40;
    const vocModulo = module.voc || 50;
    
    // Módulos máximos por string (considerando temperatura mínima)
    const maxModulosPorString = Math.floor(tensaoMaxInverter / (vocModulo * 1.25)); // 25% margem para baixa temperatura
    
    // Módulos mínimos por string (operação em MPPT)
    const minModulosPorString = Math.ceil(tensaoMinMppt / vmppModulo);
    
    if (minModulosPorString > maxModulosPorString) {
      return null; // Configuração impossível
    }
    
    // Encontrar configuração ótima
    const mpptChannels = inverter.numeroMppt || 1;
    const maxStringsPorMppt = inverter.stringsPorMppt || 2;
    const maxStringsTotal = mpptChannels * maxStringsPorMppt;
    
    let melhorConfig = null;
    let menorDiferenca = Infinity;
    
    for (let modulosPorString = minModulosPorString; modulosPorString <= maxModulosPorString; modulosPorString++) {
      const stringsNecessarias = Math.ceil(numeroModulosNecessarios / modulosPorString);
      
      if (stringsNecessarias <= maxStringsTotal) {
        const totalModulos = stringsNecessarias * modulosPorString;
        const diferenca = Math.abs(totalModulos - numeroModulosNecessarios);
        
        if (diferenca < menorDiferenca) {
          menorDiferenca = diferenca;
          melhorConfig = {
            modulosPorString,
            numeroStrings: stringsNecessarias,
            totalModulos,
            potenciaTotal: (totalModulos * potenciaModuloW) / 1000
          };
        }
      }
    }
    
    return melhorConfig;
  }
  
  private static isConfigurationValid(config: any): boolean {
    return config && config.totalModulos > 0 && config.numeroStrings > 0;
  }
  
  private static buildDimensioningResult(
    input: DimensioningInput,
    config: any,
    module: SolarModule,
    inverter: Inverter
  ): DimensioningResult {
    const ratioDcAc = config.potenciaTotal / (inverter.potenciaSaidaCA / 1000);
    
    // Calcular geração mensal estimada
    const geracaoMensal = this.calculateMonthlyGeneration(
      config.potenciaTotal,
      input.irradiacaoMedia,
      input.eficienciaSistema,
      input.location
    );
    
    const geracaoAnual = geracaoMensal.reduce((a, b) => a + b, 0);
    
    const compatibility = this.evaluateCompatibility(ratioDcAc, config, inverter);
    
    return {
      potenciaSistemakWp: config.potenciaTotal,
      geracaoEstimadaAnual: geracaoAnual,
      modulos: [{
        module,
        quantidade: config.totalModulos,
        potenciaTotal: config.potenciaTotal * 1000,
        areaTotal: config.totalModulos * (this.calculateModuleArea(module) || 2.5)
      }],
      inversores: [{
        inverter,
        quantidade: 1,
        potenciaTotal: inverter.potenciaSaidaCA
      }],
      configuracoes: [{
        modulosEmSerie: config.modulosPorString,
        stringsParalelo: config.numeroStrings,
        totalStrings: config.numeroStrings
      }],
      compatibilidade: compatibility,
      performance: {
        geracaoMensal,
        fatorCapacidade: this.calculateCapacityFactor(geracaoAnual, config.potenciaTotal),
        perdas: this.calculateSystemLosses(input.eficienciaSistema)
      }
    };
  }
  
  private static calculateScore(result: DimensioningResult, input: DimensioningInput): number {
    let score = 0;
    
    // Score de compatibilidade (40%)
    const compatibilityScore = {
      'excellent': 100,
      'good': 80,
      'acceptable': 60,
      'problematic': 20
    }[result.compatibilidade.status];
    score += compatibilityScore * 0.4;
    
    // Score de eficiência (30%)
    const efficiencyScore = result.performance.fatorCapacidade * 100;
    score += efficiencyScore * 0.3;
    
    // Score de atendimento ao consumo (20%)
    const consumptionCoverageScore = Math.min(100, (result.geracaoEstimadaAnual / input.consumoAnual) * 100);
    score += consumptionCoverageScore * 0.2;
    
    // Score de custo (10%) - se disponível
    if (input.budget && result.estimativaCusto) {
      const budgetScore = result.estimativaCusto.total <= input.budget.max ? 100 : 
                         result.estimativaCusto.total <= input.budget.max * 1.2 ? 50 : 0;
      score += budgetScore * 0.1;
    } else {
      score += 70 * 0.1; // Score médio se não há dados de custo
    }
    
    return score;
  }
  
  private static calculateMonthlyGeneration(
    potenciaKw: number,
    irradiacaoMedia: number,
    eficienciaSistema: number,
    location: { latitude: number }
  ): number[] {
    // Variação mensal simplificada baseada na latitude
    const variacao = this.getMonthlyIrradiationVariation(location.latitude);
    
    return variacao.map(fator => 
      potenciaKw * irradiacaoMedia * fator * 30 * (eficienciaSistema / 100)
    );
  }
  
  private static getMonthlyIrradiationVariation(latitude: number): number[] {
    // Variação típica para Brasil (simplificada)
    if (latitude < -10) { // Norte
      return [0.95, 0.98, 1.02, 1.05, 1.08, 1.0, 0.95, 0.98, 1.02, 1.05, 1.0, 0.95];
    } else if (latitude < -20) { // Sudeste
      return [1.15, 1.1, 1.05, 0.95, 0.85, 0.8, 0.85, 0.9, 0.95, 1.05, 1.1, 1.15];
    } else { // Sul
      return [1.25, 1.15, 1.05, 0.9, 0.75, 0.7, 0.75, 0.85, 0.95, 1.05, 1.15, 1.25];
    }
  }
  
  private static evaluateCompatibility(ratioDcAc: number, config: any, inverter: Inverter): DimensioningResult['compatibilidade'] {
    const warnings: string[] = [];
    let status: 'excellent' | 'good' | 'acceptable' | 'problematic' = 'excellent';
    
    // Avaliar ratio DC/AC
    if (ratioDcAc < 0.8) {
      warnings.push('Sistema pode estar subdimensionado (ratio DC/AC muito baixo)');
      status = 'acceptable';
    } else if (ratioDcAc > 1.3) {
      warnings.push('Sistema pode estar sobredimensionado (ratio DC/AC muito alto)');
      status = 'acceptable';
    } else if (ratioDcAc < 1.0 || ratioDcAc > 1.2) {
      status = 'good';
    }
    
    // Verificar utilização dos MPPTs
    const mpptUtilization = config.numeroStrings / (inverter.numeroMppt || 1);
    if (mpptUtilization < 0.5) {
      warnings.push('MPPTs subutilizados - considere menos strings ou inversor menor');
      if (status === 'excellent') status = 'good';
    }
    
    return {
      ratioDcAc,
      status,
      warnings
    };
  }
  
  private static calculateModuleArea(module: SolarModule): number | null {
    if (module.larguraMm && module.alturaMm) {
      return (module.larguraMm * module.alturaMm) / 1_000_000;
    }
    return null;
  }
  
  private static calculateCapacityFactor(geracaoAnual: number, potenciaKw: number): number {
    const geracaoTeoricaMaxima = potenciaKw * 365 * 24;
    return geracaoAnual / geracaoTeoricaMaxima;
  }
  
  private static calculateSystemLosses(eficienciaSistema: number) {
    const perdasTotais = 100 - eficienciaSistema;
    return {
      temperatura: perdasTotais * 0.4, // 40% das perdas por temperatura
      sombreamento: perdasTotais * 0.2, // 20% por sombreamento
      cabeamento: perdasTotais * 0.15, // 15% por cabeamento
      sujeira: perdasTotais * 0.15, // 15% por sujeira
      total: perdasTotais
    };
  }
  
  private static extractMinMpptVoltage(faixa: string): number {
    const match = faixa.match(/(\d+)-/);
    return match ? parseInt(match[1]) : 200;
  }
  
  private static extractMaxMpptVoltage(faixa: string): number {
    const match = faixa.match(/-(\d+)/);
    return match ? parseInt(match[1]) : 800;
  }
}