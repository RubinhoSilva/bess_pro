import { AdvancedModuleCalculationResult } from './solarSystemService';

export interface AdvancedSolarAnalysisData {
  irradiacaoMensal: number[];
  irradiacaoInclinada: number[];
  fatorTemperatura: number[];
  perdas: {
    temperatura: number[];
    sombreamento: number[];
    mismatch: number[];
    cabeamento: number[];
    sujeira: number[];
    inversor: number[];
    outras?: number[];
    total: number[];
  };
  performance: {
    prMedio: number;
    yieldEspecifico: number;
    fatorCapacidade: number;
  };
  geracaoEstimada: {
    mensal: number[];
    anual: number;
    diarioMedio: number;
  };
}

export class AdvancedSolarDataAdapter {
  
  /**
   * Adapta dados da nossa API para o formato esperado pelo AdvancedSolarAnalysis
   */
  static adaptData(
    advancedResult: AdvancedModuleCalculationResult,
    irradiationData?: any
  ): AdvancedSolarAnalysisData {
    
    // Dados de irradiação
    const irradiacaoMensal = irradiationData?.irradiacaoMensal || this.estimateMonthlyIrradiation();
    
    // Fator de temperatura baseado na sazonalidade
    const fatorTemperatura = this.calculateTemperatureFactors(irradiacaoMensal);
    
    return {
      // Irradiação
      irradiacaoMensal,
      irradiacaoInclinada: irradiacaoMensal, // Já vem corrigida da API
      fatorTemperatura,
      
      // Perdas detalhadas
      perdas: {
        temperatura: advancedResult.perdas_detalhadas?.temperatura || this.getDefaultLosses('temperatura'),
        sombreamento: advancedResult.perdas_detalhadas?.sombreamento || this.getDefaultLosses('sombreamento'),
        mismatch: advancedResult.perdas_detalhadas?.mismatch || this.getDefaultLosses('mismatch'),
        cabeamento: advancedResult.perdas_detalhadas?.cabeamento || this.getDefaultLosses('cabeamento'),
        sujeira: advancedResult.perdas_detalhadas?.sujeira || this.getDefaultLosses('sujeira'),
        inversor: advancedResult.perdas_detalhadas?.inversor || this.getDefaultLosses('inversor'),
        outras: advancedResult.perdas_detalhadas?.outras,
        total: advancedResult.perdas_detalhadas?.total || this.getDefaultLosses('total')
      },
      
      // Performance
      performance: {
        prMedio: advancedResult.pr_medio || this.calculatePR(advancedResult),
        yieldEspecifico: advancedResult.yield_especifico || this.calculateYield(advancedResult),
        fatorCapacidade: advancedResult.fator_capacidade
      },
      
      // Geração
      geracaoEstimada: {
        mensal: advancedResult.geracao_mensal || this.estimateMonthlyGeneration(advancedResult.energia_total_anual_kwh),
        anual: advancedResult.energia_total_anual_kwh,
        diarioMedio: (advancedResult.energia_total_anual_kwh / 365) || 0
      }
    };
  }
  
  /**
   * Calcula Performance Ratio se não disponível
   */
  private static calculatePR(result: AdvancedModuleCalculationResult): number {
    const energiaIdeal = result.potencia_total_kw * 8760; // kWh ideal por ano
    if (energiaIdeal === 0) return 0;
    return (result.energia_total_anual_kwh / energiaIdeal) * 100;
  }
  
  /**
   * Calcula Yield Específico se não disponível
   */
  private static calculateYield(result: AdvancedModuleCalculationResult): number {
    if (result.potencia_total_kw === 0) return 0;
    return result.energia_total_anual_kwh / result.potencia_total_kw;
  }
  
  /**
   * Estima irradiação mensal padrão se não disponível
   */
  private static estimateMonthlyIrradiation(): number[] {
    // Valores médios para Brasil Central
    return [5.2, 4.8, 4.1, 3.5, 2.8, 2.4, 2.6, 3.2, 3.8, 4.5, 5.0, 5.3];
  }
  
  /**
   * Estima geração mensal se não disponível
   */
  private static estimateMonthlyGeneration(annualGeneration: number): number[] {
    // Distribuição sazonal típica do Brasil
    const seasonalFactors = [1.25, 1.15, 1.05, 0.90, 0.75, 0.70, 0.75, 0.85, 0.95, 1.10, 1.20, 1.25];
    const avgFactor = seasonalFactors.reduce((a, b) => a + b, 0) / 12;
    const normalizedFactors = seasonalFactors.map(f => f / avgFactor);
    
    const monthlyAvg = annualGeneration / 12;
    return normalizedFactors.map(factor => monthlyAvg * factor);
  }
  
  /**
   * Calcula fatores de temperatura baseados na irradiação
   */
  private static calculateTemperatureFactors(irradiation: number[]): number[] {
    return irradiation.map(irr => {
      // Maior irradiação = maior temperatura = maior perda
      const tempFactor = 0.7 + (irr / 10); // Fórmula simplificada
      return Math.min(1.2, Math.max(0.6, tempFactor));
    });
  }
  
  /**
   * Perdas padrão por tipo
   */
  private static getDefaultLosses(type: string): number[] {
    const defaultValues = {
      temperatura: [6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5],
      sombreamento: [4, 3, 3, 2, 2, 2, 2, 2, 3, 3, 4, 4],
      mismatch: Array(12).fill(2),
      cabeamento: Array(12).fill(2),
      sujeira: [8, 7, 6, 4, 3, 2, 3, 4, 5, 6, 7, 8],
      inversor: Array(12).fill(3),
      total: [22, 20, 19, 17, 17, 17, 17, 17, 19, 20, 21, 22]
    };
    
    return defaultValues[type as keyof typeof defaultValues] || Array(12).fill(0);
  }
}