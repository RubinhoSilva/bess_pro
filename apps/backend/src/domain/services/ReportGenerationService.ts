import { AdvancedFinancialResult } from './FinancialAnalysisService';

export interface ReportData {
  projectInfo: {
    name: string;
    location: string;
    clientName: string;
    date: Date;
  };
  technicalSpecs: {
    totalPower: number; // kWp
    moduleCount: number;
    moduleModel: string;
    inverterModel: string;
    estimatedGeneration: number; // kWh/ano
    co2Savings: number; // kg/ano
  };
  financialAnalysis: AdvancedFinancialResult;
  tariffParams: {
    energyTariff: number; // R$/kWh
    fioBCost: number; // R$/kWh
    inflationRate: number; // % ao ano
    discountRate: number; // % ao ano
  };
}

export interface ExecutiveSummaryData {
  totalInvestment: number;
  annualSavings: number;
  paybackPeriod: number;
  roi: number;
  co2ReductionEquivalent: string;
}

export interface TechnicalRecommendations {
  moduleOrientation: string;
  maintenanceSchedule: string;
  performanceMonitoring: string;
  safetyConsiderations: string[];
}

export class ReportGenerationService {
  /**
   * Gera resumo executivo do projeto
   */
  static generateExecutiveSummary(data: ReportData): ExecutiveSummaryData {
    const treesEquivalent = Math.round(data.technicalSpecs.co2Savings / 22); // ~22kg CO2/árvore/ano
    
    return {
      totalInvestment: data.financialAnalysis.fluxoCaixa[0].fluxoLiquido * -1,
      annualSavings: data.financialAnalysis.economiaAnualEstimada,
      paybackPeriod: data.financialAnalysis.payback,
      roi: data.financialAnalysis.tir,
      co2ReductionEquivalent: `${treesEquivalent} árvores plantadas`
    };
  }

  /**
   * Gera recomendações técnicas
   */
  static generateTechnicalRecommendations(data: ReportData): TechnicalRecommendations {
    const recommendations: TechnicalRecommendations = {
      moduleOrientation: this.getOrientationRecommendation(data),
      maintenanceSchedule: this.getMaintenanceSchedule(data),
      performanceMonitoring: this.getMonitoringRecommendations(data),
      safetyConsiderations: this.getSafetyConsiderations(data)
    };

    return recommendations;
  }

  /**
   * Calcula indicadores de performance
   */
  static calculatePerformanceIndicators(data: ReportData) {
    const specificGeneration = data.technicalSpecs.estimatedGeneration / data.technicalSpecs.totalPower;
    const performanceRatio = specificGeneration / 1500; // 1500 kWh/kWp é uma referência padrão
    
    return {
      specificGeneration: Math.round(specificGeneration),
      performanceRatio: Math.round(performanceRatio * 100) / 100,
      capacityFactor: Math.round((specificGeneration / 8760) * 100 * 100) / 100, // 8760 horas/ano
      economicEfficiency: data.financialAnalysis.vpl / (data.financialAnalysis.fluxoCaixa[0].fluxoLiquido * -1)
    };
  }

  /**
   * Gera análise de cenários
   */
  static generateScenarioAnalysis(baseData: ReportData) {
    const scenarios = {
      conservative: this.adjustScenario(baseData, 0.85), // 15% menos geração
      realistic: baseData,
      optimistic: this.adjustScenario(baseData, 1.15)  // 15% mais geração
    };

    return scenarios;
  }

  /**
   * Calcula impacto ambiental detalhado
   */
  static calculateEnvironmentalImpact(data: ReportData) {
    const annualCO2Savings = data.technicalSpecs.co2Savings;
    const lifetimeCO2Savings = annualCO2Savings * 25; // 25 anos de vida útil
    
    return {
      annualCO2Reduction: Math.round(annualCO2Savings),
      lifetimeCO2Reduction: Math.round(lifetimeCO2Savings),
      treesEquivalent: Math.round(lifetimeCO2Savings / 22),
      coalEquivalent: Math.round(lifetimeCO2Savings / 820), // kg de carvão
      carKmEquivalent: Math.round(lifetimeCO2Savings / 0.12) // km de carro
    };
  }

  private static getOrientationRecommendation(data: ReportData): string {
    return "Módulos orientados ao Norte com inclinação entre 15° e 25° para otimização da geração no Brasil.";
  }

  private static getMaintenanceSchedule(data: ReportData): string {
    return "Limpeza trimestral dos módulos, inspeção semestral das conexões elétricas e verificação anual do sistema.";
  }

  private static getMonitoringRecommendations(data: ReportData): string {
    return "Sistema de monitoramento online para acompanhamento da geração em tempo real e detecção de falhas.";
  }

  private static getSafetyConsiderations(data: ReportData): string[] {
    return [
      "Instalação deve seguir NBR 5410 e NBR 16690",
      "Uso obrigatório de dispositivos de proteção contra surtos",
      "Aterramento adequado do sistema",
      "Sinalização de segurança em todos os pontos elétricos",
      "Treinamento da equipe de manutenção"
    ];
  }

  private static adjustScenario(baseData: ReportData, factor: number): ReportData {
    return {
      ...baseData,
      technicalSpecs: {
        ...baseData.technicalSpecs,
        estimatedGeneration: baseData.technicalSpecs.estimatedGeneration * factor,
        co2Savings: baseData.technicalSpecs.co2Savings * factor
      }
    };
  }

  /**
   * Gera sumário de economia por ano
   */
  static generateYearlySavingsSummary(financialAnalysis: AdvancedFinancialResult) {
    return financialAnalysis.fluxoCaixa.slice(1, 11).map(item => ({
      year: item.ano,
      savings: Math.round(item.economia),
      cumulativeSavings: Math.round(
        financialAnalysis.fluxoCaixa
          .slice(1, item.ano + 1)
          .reduce((sum, cashFlow) => sum + cashFlow.economia, 0)
      ),
      costWithoutPV: Math.round(item.custoSemFV),
      costWithPV: Math.round(item.custoComFV)
    }));
  }

  /**
   * Calcula métricas de risco do investimento
   */
  static calculateInvestmentRisk(financialAnalysis: AdvancedFinancialResult) {
    const paybackRisk = financialAnalysis.payback > 8 ? 'Alto' : 
                       financialAnalysis.payback > 5 ? 'Médio' : 'Baixo';
    
    const tirRisk = financialAnalysis.tir < 10 ? 'Alto' :
                   financialAnalysis.tir < 15 ? 'Médio' : 'Baixo';
    
    const vplRisk = financialAnalysis.vpl < 0 ? 'Alto' :
                   financialAnalysis.vpl < 50000 ? 'Médio' : 'Baixo';

    return {
      paybackRisk,
      tirRisk,
      vplRisk,
      overallRisk: [paybackRisk, tirRisk, vplRisk].includes('Alto') ? 'Alto' :
                   [paybackRisk, tirRisk, vplRisk].includes('Médio') ? 'Médio' : 'Baixo'
    };
  }
}