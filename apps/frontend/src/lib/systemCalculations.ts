// Cálculos padronizados para evitar inconsistências entre resumo e resultado
export interface SystemCalculationInputs {
  // Módulos
  numeroModulos: number;
  potenciaModulo: number; // W
  
  // Dados solares
  irradiacaoMensal: number[]; // kWh/m²/dia para cada mês
  
  // Sistema
  eficienciaSistema: number; // %
  dimensionamentoPercentual?: number; // %
  
  // Consumo (para cálculo automático quando necessário)
  consumoAnual?: number; // kWh
}

export interface SystemCalculationResults {
  potenciaPico: number; // kWp
  numeroModulos: number;
  areaEstimada: number; // m²
  geracaoEstimadaAnual: number; // kWh/ano
  geracaoEstimadaMensal: number[]; // kWh/mês para cada mês
  irradiacaoMediaAnual: number; // kWh/m²/dia
  coberturaConsumo?: number; // %
}

export class SystemCalculations {
  // Constantes padronizadas
  private static readonly AREA_POR_MODULO = 2.5; // m² por módulo
  private static readonly DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  /**
   * Calcula automaticamente o número de módulos baseado no consumo anual
   */
  static calculateModulesFromConsumption(
    consumoAnual: number,
    potenciaModulo: number,
    irradiacaoMensal: number[],
    eficienciaSistema: number,
    dimensionamentoPercentual: number = 100
  ): number {
    const irradiacaoMediaAnual = irradiacaoMensal.reduce((a, b) => a + b, 0) / 12;
    const eficienciaDecimal = eficienciaSistema / 100;
    const fatorDimensionamento = dimensionamentoPercentual / 100;
    
    const consumoMedioDiario = consumoAnual / 365;
    const irradiacaoEfetiva = irradiacaoMediaAnual * eficienciaDecimal;
    const potenciaPicoNecessaria = (consumoMedioDiario / irradiacaoEfetiva) * fatorDimensionamento;
    
    return Math.ceil((potenciaPicoNecessaria * 1000) / potenciaModulo);
  }

  /**
   * Executa todos os cálculos do sistema de forma padronizada
   */
  static calculate(inputs: SystemCalculationInputs): SystemCalculationResults {
    let { numeroModulos, potenciaModulo, irradiacaoMensal, eficienciaSistema, dimensionamentoPercentual = 100, consumoAnual } = inputs;
    
    // Se não há módulos definidos, calcular baseado no consumo
    if (numeroModulos === 0 && consumoAnual && consumoAnual > 0) {
      numeroModulos = this.calculateModulesFromConsumption(
        consumoAnual,
        potenciaModulo,
        irradiacaoMensal,
        eficienciaSistema,
        dimensionamentoPercentual
      );
    }
    
    // Cálculos básicos
    const potenciaPico = (numeroModulos * potenciaModulo) / 1000; // kWp
    const areaEstimada = numeroModulos * this.AREA_POR_MODULO; // m²
    const irradiacaoMediaAnual = irradiacaoMensal.reduce((a, b) => a + b, 0) / 12; // kWh/m²/dia
    const eficienciaDecimal = eficienciaSistema / 100;
    
    // Geração mensal detalhada
    const geracaoEstimadaMensal = irradiacaoMensal.map((irradiacao, index) => {
      const diasMes = this.DIAS_POR_MES[index];
      return potenciaPico * irradiacao * diasMes * eficienciaDecimal;
    });
    
    // Geração anual (soma dos meses para precisão)
    const geracaoEstimadaAnual = geracaoEstimadaMensal.reduce((a, b) => a + b, 0);
    
    // Cobertura do consumo (se fornecido)
    const coberturaConsumo = consumoAnual ? (geracaoEstimadaAnual / consumoAnual) * 100 : undefined;
    
    return {
      potenciaPico,
      numeroModulos,
      areaEstimada,
      geracaoEstimadaAnual,
      geracaoEstimadaMensal,
      irradiacaoMediaAnual,
      coberturaConsumo
    };
  }

  /**
   * Calcula apenas a geração estimada baseada em parâmetros básicos
   */
  static calculateGeneration(
    potenciaPico: number,
    irradiacaoMensal: number[],
    eficienciaSistema: number
  ): { mensal: number[], anual: number } {
    const eficienciaDecimal = eficienciaSistema / 100;
    
    const mensal = irradiacaoMensal.map((irradiacao, index) => {
      const diasMes = this.DIAS_POR_MES[index];
      return potenciaPico * irradiacao * diasMes * eficienciaDecimal;
    });
    
    const anual = mensal.reduce((a, b) => a + b, 0);
    
    return { mensal, anual };
  }
}