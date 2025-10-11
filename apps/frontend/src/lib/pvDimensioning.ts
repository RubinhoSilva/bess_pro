import { SolarModule, Inverter } from '@/hooks/legacy-equipment-hooks';
import { FrontendCalculationLogger } from './calculationLogger';

// Função utilitária para calcular eficiência do sistema a partir das perdas específicas
export function calculateSystemEfficiency(losses: SystemLosses | undefined, fallbackEfficiency: number = 85): number {
  if (!losses) {
    return fallbackEfficiency;
  }
  
  const totalLosses = (losses.perdaSombreamento || 3) + 
                     (losses.perdaMismatch || 2) + 
                     (losses.perdaCabeamento || 2) + 
                     (losses.perdaSujeira || 5) + 
                     (losses.perdaOutras || 0);
  
  return Math.max(0, Math.min(100, 100 - totalLosses));
}

export interface SystemLosses {
  temperatura?: number;
  perdaSombreamento?: number;
  perdaMismatch?: number;
  perdaCabeamento?: number;
  perdaSujeira?: number;
  perdaInversor?: number;
  perdaOutras?: number;
}

export interface DimensioningInput {
  consumoAnual: number; // kWh/ano
  irradiacaoMedia: number; // kWh/m²/dia
  eficienciaSistema?: number; // % (deprecated, use systemLosses)
  eficienciaInversor?: number; // %
  eficienciaModulo?: number; // %
  systemLosses?: SystemLosses;
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

  /**
   * Calcula o resumo detalhado do sistema fotovoltaico com logging completo
   */
  static calculateSystemSummary(
    potenciaDesejadaKwp: number,
    consumoAnualKwh: number,
    irradiacaoMediaDiaria: number,
    eficienciaSistema: number = 80,
    logger?: FrontendCalculationLogger,
    systemLosses?: SystemLosses
  ) {
    // Calcular eficiência real baseada nas perdas específicas se fornecidas
    const eficienciaReal = systemLosses ? 
      calculateSystemEfficiency(systemLosses, eficienciaSistema) : 
      eficienciaSistema;
    logger?.startCalculationSection('Resumo do Sistema Fotovoltaico');
    
    logger?.context('Sistema', 'Iniciando cálculo do resumo do sistema fotovoltaico', {
      potenciaDesejada: potenciaDesejadaKwp,
      consumoAnual: consumoAnualKwh,
      irradiacaoMedia: irradiacaoMediaDiaria,
      eficiencia: eficienciaReal,
      perdas: systemLosses
    }, 'Cálculo completo do resumo do sistema incluindo potência pico, número de módulos, área necessária e geração anual estimada.');

    // 1. Potência Pico Real (considerando múltiplos de módulos)
    const potenciaModulo = 550; // W padrão para módulos modernos
    const numeroModulos = Math.ceil((potenciaDesejadaKwp * 1000) / potenciaModulo);
    const potenciaPicoReal = (numeroModulos * potenciaModulo) / 1000;

    logger?.formula('Potência', 'Número de Módulos Necessários',
      'N_módulos = TETO(P_desejada_W / P_módulo_W)',
      {
        P_desejada_kWp: potenciaDesejadaKwp,
        P_desejada_W: potenciaDesejadaKwp * 1000,
        P_modulo_W: potenciaModulo,
        divisao: (potenciaDesejadaKwp * 1000) / potenciaModulo
      },
      numeroModulos,
      {
        description: 'Número inteiro de módulos necessários para atingir a potência desejada. Usa função TETO para arredondar para cima, garantindo que a potência mínima seja atingida.',
        units: 'unidades',
        references: ['NBR 16274:2014 - Dimensionamento de sistemas FV']
      }
    );

    logger?.formula('Potência', 'Potência Pico Real do Sistema',
      'P_pico_real = (N_módulos × P_módulo_W) / 1000',
      {
        N_modulos: numeroModulos,
        P_modulo_W: potenciaModulo
      },
      potenciaPicoReal,
      {
        description: 'Potência real do sistema considerando o número inteiro de módulos instalados. Geralmente é ligeiramente superior à potência desejada.',
        units: 'kWp',
        references: ['IEA PVPS Task 2 - Performance Analysis']
      }
    );

    // 2. Área Necessária
    const areaModulo = 2.79; // m² para módulo de 550W típico (dimensões padrão da indústria)
    const areaNecessaria = numeroModulos * areaModulo;

    logger?.formula('Area', 'Área Total Necessária',
      'A_total = N_módulos × A_módulo',
      {
        N_modulos: numeroModulos,
        A_modulo_m2: areaModulo
      },
      areaNecessaria,
      {
        description: 'Área total necessária para instalação dos módulos fotovoltaicos. Baseada na área individual de cada módulo (considerando módulos de 550W com dimensões típicas de 2,3m × 1,13m).',
        units: 'm²',
        references: ['Manual de Engenharia FV - CRESESB', 'Dimensões típicas da indústria solar']
      }
    );

    // 3. Geração Anual Estimada
    const diasAno = 365;
    const geracaoEstimadaAnual = potenciaPicoReal * irradiacaoMediaDiaria * diasAno * (eficienciaReal / 100);

    logger?.formula('Geração', 'Geração Anual Estimada',
      'E_anual = P_pico × H_solar_diária × dias_ano × η_sistema',
      {
        P_pico_kWp: potenciaPicoReal,
        H_solar_diaria: irradiacaoMediaDiaria,
        dias_ano: diasAno,
        η_sistema_decimal: eficienciaReal / 100,
        η_sistema_percent: eficienciaReal
      },
      geracaoEstimadaAnual,
      {
        description: 'Estimativa da energia total gerada pelo sistema durante um ano. Considera a irradiação solar média diária, a potência instalada e a eficiência global do sistema (incluindo perdas por temperatura, cabeamento, inversor, etc.).',
        units: 'kWh/ano',
        references: ['PVGIS - Photovoltaic Geographical Information System', 'ABNT NBR 16274:2014']
      }
    );

    // 4. Geração Mensal Média
    const geracaoMensalMedia = geracaoEstimadaAnual / 12;

    logger?.formula('Geração', 'Geração Mensal Média',
      'E_mensal = E_anual / 12',
      {
        E_anual_kWh: geracaoEstimadaAnual
      },
      geracaoMensalMedia,
      {
        description: 'Média mensal de energia gerada pelo sistema. É uma simplificação, pois a geração varia ao longo do ano devido à variação sazonal da irradiação solar.',
        units: 'kWh/mês'
      }
    );

    // 5. Cobertura do Consumo
    const coberturaConsumo = (geracaoEstimadaAnual / consumoAnualKwh) * 100;

    logger?.formula('Análise', 'Cobertura do Consumo Anual',
      'Cobertura_% = (E_gerada / E_consumida) × 100',
      {
        E_gerada_kWh: geracaoEstimadaAnual,
        E_consumida_kWh: consumoAnualKwh
      },
      coberturaConsumo,
      {
        description: 'Percentual do consumo anual coberto pela geração do sistema fotovoltaico. Valores próximos a 100% indicam sistema bem dimensionado. Valores acima de 100% indicam excesso de geração que pode ser injetado na rede.',
        units: '%',
        references: ['REN 482/2012 - Sistema de compensação de energia elétrica']
      }
    );

    // 6. Economia Anual Estimada (baseada em tarifa média)
    const tarifaMediaKwh = 0.75; // R$/kWh - tarifa residencial média Brasil 2024
    const economiaAnual = geracaoEstimadaAnual * tarifaMediaKwh;

    logger?.formula('Financeiro', 'Economia Anual Estimada',
      'Economia_anual = E_gerada × Tarifa_kWh',
      {
        E_gerada_kWh: geracaoEstimadaAnual,
        Tarifa_R_kWh: tarifaMediaKwh
      },
      economiaAnual,
      {
        description: 'Estimativa da economia anual em reais proporcionada pelo sistema fotovoltaico. Baseada na tarifa média residencial brasileira.',
        units: 'R$/ano',
        references: ['ANEEL - Tarifas de energia elétrica']
      }
    );

    const resumo = {
      potenciaPico: {
        valor: potenciaPicoReal,
        unidade: 'kWp',
        descricao: `${numeroModulos} módulos de ${potenciaModulo}W`
      },
      numeroModulos: {
        valor: numeroModulos,
        potenciaUnitaria: potenciaModulo,
        unidade: 'unidades'
      },
      areaNecessaria: {
        valor: areaNecessaria,
        unidade: 'm²',
        descricao: 'Para instalação dos módulos'
      },
      geracaoAnual: {
        valor: geracaoEstimadaAnual,
        unidade: 'kWh',
        mensal: geracaoMensalMedia,
        descricao: `~${Math.round(geracaoMensalMedia)} kWh/mês`
      },
      coberturaConsumo: {
        valor: coberturaConsumo,
        unidade: '%'
      },
      economiaAnual: {
        valor: economiaAnual,
        unidade: 'R$/ano'
      }
    };

    logger?.result('Sistema', 'Resumo do sistema calculado com sucesso', resumo);
    logger?.endCalculationSection('Resumo do Sistema Fotovoltaico', {
      potenciaPico: `${potenciaPicoReal} kWp`,
      modulos: `${numeroModulos} × ${potenciaModulo}W`,
      area: `${areaNecessaria.toFixed(1)} m²`,
      geracao: `${Math.round(geracaoEstimadaAnual)} kWh/ano`,
      economia: `R$ ${economiaAnual.toFixed(0)}/ano`
    });

    return resumo;
  }
  
  static calculateOptimalSystem(
    input: DimensioningInput,
    availableModules: SolarModule[],
    availableInverters: Inverter[]
  ): DimensioningResult[] {
    
    const eficienciaReal = calculateSystemEfficiency(input.systemLosses, input.eficienciaSistema || 85);
    const potenciaMinima = input.consumoAnual / (input.irradiacaoMedia * 365 * eficienciaReal / 100);
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
    const eficienciaReal = (input.eficienciaInversor || 95) * (input.eficienciaModulo || 85) / 10000;
    const geracaoMensal = this.calculateMonthlyGeneration(
      config.potenciaTotal,
      input.irradiacaoMedia,
      eficienciaReal,
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
        perdas: this.calculateSystemLosses(eficienciaReal, input.systemLosses || {})
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
    eficienciaReal: number,
    location: { latitude: number }
  ): number[] {
    // Variação mensal simplificada baseada na latitude
    const variacao = this.getMonthlyIrradiationVariation(location.latitude);
    
    return variacao.map(fator => 
      potenciaKw * irradiacaoMedia * fator * 30 * (eficienciaReal / 100)
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
  
  private static calculateSystemLosses(eficienciaReal: number, systemLosses?: SystemLosses) {
    if (systemLosses) {
      return {
        temperatura: systemLosses.temperatura || 8,
        sombreamento: systemLosses.perdaSombreamento || 3,
        cabeamento: systemLosses.perdaCabeamento || 2,
        sujeira: systemLosses.perdaSujeira || 5,
        total: 100 - eficienciaReal
      };
    }
    
    // Fallback para método antigo
    const perdasTotais = 100 - eficienciaReal;
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