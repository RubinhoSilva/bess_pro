import { 
  AdvancedFinancialResults,
  CashFlowDetails,
  SensitivityAnalysis
} from '@bess-pro/shared';

// Local interfaces for all financial types
interface FinancialAnalysisResult {
  readonly investmentAnalysis: InvestmentAnalysisResult;
  readonly financialMetrics: FinancialMetricsResult;
  readonly cashFlowAnalysis: CashFlowAnalysisResult;
  readonly sensitivityAnalysis: SensitivityAnalysisResult;
  readonly riskAssessment: FinancialRiskResult;
  readonly benchmarks: FinancialBenchmarksResult;
  readonly calculatedAt: Date;
  readonly calculationVersion: string;
  readonly metadata?: any;
}

interface CashFlowAnalysisResult {
  readonly yearlyCashFlows: Array<{
    readonly year: number;
    readonly revenue: number;
    readonly costs: number;
    readonly netCashFlow: number;
    readonly cumulativeCashFlow: number;
    readonly discountedCashFlow: number;
    readonly savings: number;
    readonly roi: number;
  }>;
  readonly cashFlowSummary: {
    readonly totalRevenue: number;
    readonly totalCosts: number;
    readonly totalNetCashFlow: number;
    readonly averageAnnualCashFlow: number;
    readonly cashFlowStability: number;
    readonly positiveCashFlowYear: number;
  };
  readonly cashFlowProjections: {
    readonly fiveYearTotal: number;
    readonly tenYearTotal: number;
    readonly twentyFiveYearTotal: number;
  };
}

interface InvestmentAnalysisResult {
  readonly totalInvestment: number;
  readonly costBreakdown: {
    readonly equipmentCost: number;
    readonly installationCost: number;
    readonly engineeringCost: number;
    readonly permitCost: number;
    readonly interconnectionCost: number;
    readonly contingencyCost: number;
    readonly softCosts: number;
  };
  readonly costPerWatt: number;
  readonly financingStructure?: {
    readonly financingType: string;
    readonly downPayment: number;
    readonly loanAmount: number;
    readonly interestRate: number;
    readonly loanTerm: number;
    readonly monthlyPayment: number;
  };
  readonly incentives: Array<{
    readonly type: string;
    readonly amount: number;
    readonly percentage: number;
    readonly source: string;
    readonly expiration?: Date;
  }>;
}

interface FinancialMetricsResult {
  readonly netPresentValue: number;
  readonly internalRateOfReturn: number;
  readonly modifiedInternalRateOfReturn?: number;
  readonly paybackPeriod: number;
  readonly discountedPaybackPeriod: number;
  readonly returnOnInvestment: number;
  readonly benefitCostRatio: number;
  readonly profitabilityIndex: number;
  readonly levelizedCostOfEnergy: number;
  readonly levelizedCostOfStorage?: number;
  readonly equivalentAnnualAnnuity: number;
  readonly savingsOverLifetime: number;
  readonly cumulativeSavings: Array<{
    readonly year: number;
    readonly savings: number;
    readonly cumulative: number;
  }>;
}

interface SensitivityAnalysisResult {
  readonly parameters: Array<{
    readonly name: string;
    readonly baseValue: number;
    readonly scenarios: Array<{
      readonly variation: number;
      readonly npv: number;
      readonly irr: number;
      readonly paybackPeriod: number;
    }>;
    readonly sensitivity: number;
  }>;
  readonly tornadoChart: Array<{
    readonly parameter: string;
    readonly lowImpact: number;
    readonly highImpact: number;
    readonly range: number;
  }>;
  readonly monteCarloSimulation?: {
    readonly meanNPV: number;
    readonly standardDeviation: number;
    readonly confidenceIntervals: {
      readonly p90: number;
      readonly p75: number;
      readonly p50: number;
      readonly p25: number;
      readonly p10: number;
    };
    readonly probabilityOfPositiveNPV: number;
  };
}

interface FinancialRiskResult {
  readonly overallRiskLevel: 'low' | 'medium' | 'high' | 'very_high';
  readonly riskFactors: Array<{
    readonly category: string;
    readonly level: 'low' | 'medium' | 'high' | 'very_high';
    readonly description: string;
    readonly impact: number;
    readonly probability: number;
    readonly mitigation: string;
  }>;
  readonly riskMitigationStrategies: string[];
  readonly contingencyRecommendations: {
    readonly costContingency: number;
    readonly scheduleContingency: number;
    readonly performanceContingency: number;
  };
  readonly insuranceRequirements: string[];
}

interface FinancialBenchmarksResult {
  readonly industryComparisons: {
    readonly averagePaybackPeriod: number;
    readonly averageROI: number;
    readonly averageNPV: number;
    readonly marketPenetration: number;
  };
  readonly regionalComparisons: {
    readonly stateAverage: number;
    readonly nationalAverage: number;
    readonly globalAverage: number;
  };
  readonly technologyComparisons: {
    readonly solarOnly: number;
    readonly solarWithStorage: number;
    readonly storageOnly: number;
  };
  readonly performanceRating: 'excellent' | 'above_average' | 'average' | 'below_average' | 'poor';
  readonly competitiveAdvantage: string[];
}

// Local interfaces for types not yet in shared package
interface PaybackAnalysis {
  simplePaybackPeriod: number;
  discountedPaybackPeriod: number;
  paybackConfidence: number;
  paybackSensitivity: {
    optimistic: number;
    pessimistic: number;
    base: number;
  };
  monthlyPaybackProjection: Array<{
    month: number;
    cumulative: number;
    monthlyCashFlow: number;
  }>;
}

interface NPVAnalysis {
  netPresentValue: number;
  internalRateOfReturn: number;
  modifiedInternalRateOfReturn?: number;
  profitabilityIndex: number;
  equivalentAnnualAnnuity: number;
  npvSensitivity: Array<{
    discountRate: number;
    npv: number;
  }>;
  npvBreakdown: {
    initialInvestment: number;
    revenuePresentValue: number;
    costPresentValue: number;
    netPresentValue: number;
  };
}

interface CashFlowAnalysis {
  yearlyCashFlows: Array<{
    year: number;
    revenue: number;
    costs: number;
    netCashFlow: number;
    cumulativeCashFlow: number;
    discountedCashFlow: number;
    savings: number;
    roi: number;
  }>;
  cashFlowSummary: {
    totalRevenue: number;
    totalCosts: number;
    totalNetCashFlow: number;
    averageAnnualCashFlow: number;
    cashFlowStability: number;
    positiveCashFlowYear: number;
  };
  cashFlowProjections: {
    fiveYearTotal: number;
    tenYearTotal: number;
    twentyFiveYearTotal: number;
  };
}

/**
 * Mapper for financial analysis calculations
 * 
 * Handles conversion between domain objects and DTOs for financial calculations,
 * including investment analysis, cash flow projections, and economic metrics.
 */
export class FinancialAnalysisMapper {

  /**
   * Converts financial analysis result to comprehensive response DTO
   * 
   * @param analysis - Financial analysis domain object
   * @returns Comprehensive financial analysis result
   */
  static toResponseDto(analysis: any): FinancialAnalysisResult {
    if (!analysis) {
      throw new Error('Financial analysis data is required');
    }

    return {
      investmentAnalysis: this.mapInvestmentAnalysis(analysis),
      financialMetrics: this.mapFinancialMetrics(analysis),
      cashFlowAnalysis: this.mapCashFlowAnalysis(analysis),
      sensitivityAnalysis: this.mapSensitivityAnalysis(analysis),
      riskAssessment: this.mapRiskAssessment(analysis),
      benchmarks: this.mapBenchmarks(analysis),
      calculatedAt: analysis.calculatedAt || new Date(),
      calculationVersion: analysis.calculationVersion || '1.0.0',
      metadata: this.mapResultMetadata(analysis)
    };
  }

  /**
   * Converts financial data to cash flow analysis
   * 
   * @param data - Raw financial calculation data
   * @returns Detailed cash flow analysis
   */
  static toCashFlow(data: any): CashFlowAnalysis {
    const cashFlowData = data.cashFlow || data.fluxoCaixa || [];
    const yearlyCashFlows = this.mapYearlyCashFlows(cashFlowData);
    
    return {
      yearlyCashFlows,
      cashFlowSummary: this.calculateCashFlowSummary(yearlyCashFlows),
      cashFlowProjections: this.calculateCashFlowProjections(yearlyCashFlows)
    };
  }

  /**
   * Converts financial data to payback analysis
   * 
   * @param data - Raw financial calculation data
   * @returns Payback period analysis
   */
  static toPaybackAnalysis(data: any): PaybackAnalysis {
    const initialInvestment = data.investimento_inicial || data.initialInvestment || 0;
    const yearlyCashFlows = this.extractYearlyCashFlows(data);
    
    return {
      simplePaybackPeriod: this.calculateSimplePayback(initialInvestment, yearlyCashFlows),
      discountedPaybackPeriod: this.calculateDiscountedPayback(initialInvestment, yearlyCashFlows, data.taxa_desconto || 0.08),
      paybackConfidence: this.calculatePaybackConfidence(data),
      paybackSensitivity: this.calculatePaybackSensitivity(data),
      monthlyPaybackProjection: this.calculateMonthlyPaybackProjection(initialInvestment, yearlyCashFlows)
    };
  }

  /**
   * Converts financial data to NPV analysis
   * 
   * @param data - Raw financial calculation data
   * @returns Net Present Value analysis
   */
  static toNPVAnalysis(data: any): NPVAnalysis {
    const discountRate = data.taxa_desconto || data.discountRate || 0.08;
    const cashFlows = this.extractYearlyCashFlows(data);
    const initialInvestment = data.investimento_inicial || data.initialInvestment || 0;
    
    return {
      netPresentValue: this.calculateNPV(cashFlows, discountRate, initialInvestment),
      internalRateOfReturn: this.calculateIRR(cashFlows, initialInvestment),
      modifiedInternalRateOfReturn: this.calculateMIRR(cashFlows, discountRate, 0.12),
      profitabilityIndex: this.calculateProfitabilityIndex(cashFlows, discountRate, initialInvestment),
      equivalentAnnualAnnuity: this.calculateEAA(cashFlows, discountRate, initialInvestment),
      npvSensitivity: this.calculateNPVSensitivity(cashFlows, discountRate, initialInvestment),
      npvBreakdown: this.calculateNPVBreakdown(cashFlows, discountRate, initialInvestment)
    };
  }

  /**
   * Maps a list of financial analyses to response DTOs
   * 
   * @param analyses - Array of financial analyses
   * @returns Array of response DTOs
   */
  static toResponseDtoList(analyses: any[]): FinancialAnalysisResult[] {
    return analyses.map(analysis => this.toResponseDto(analysis));
  }

  /**
   * Converts Brazilian financial format to standard format
   * 
   * @param brazilianData - Financial data in Brazilian format (snake_case)
   * @returns Standardized financial analysis result
   */
  static fromBrazilianFormat(brazilianData: AdvancedFinancialResults): FinancialAnalysisResult {
    const yearlyCashFlows = this.convertBrazilianCashFlow(brazilianData.cash_flow || []);
    
    return {
      investmentAnalysis: {
        totalInvestment: brazilianData.investimento_inicial,
        costBreakdown: {
          equipmentCost: brazilianData.investimento_inicial * 0.6,
          installationCost: brazilianData.investimento_inicial * 0.2,
          engineeringCost: brazilianData.investimento_inicial * 0.05,
          permitCost: brazilianData.investimento_inicial * 0.02,
          interconnectionCost: brazilianData.investimento_inicial * 0.03,
          contingencyCost: brazilianData.investimento_inicial * 0.05,
          softCosts: brazilianData.investimento_inicial * 0.05
        },
        costPerWatt: brazilianData.investimento_inicial / 5000, // Assuming 5kW system
        incentives: []
      },
      financialMetrics: {
        netPresentValue: brazilianData.vpl,
        internalRateOfReturn: brazilianData.tir,
        paybackPeriod: brazilianData.payback_simples,
        discountedPaybackPeriod: brazilianData.payback_descontado,
        returnOnInvestment: brazilianData.indicadores?.retorno_sobre_investimento || 0,
        benefitCostRatio: brazilianData.lucratividade_index || 0,
        profitabilityIndex: brazilianData.lucratividade_index || 0,
        levelizedCostOfEnergy: brazilianData.indicadores?.custo_nivelado_energia || 0,
        equivalentAnnualAnnuity: 0,
        savingsOverLifetime: brazilianData.economia_total_25_anos,
        cumulativeSavings: this.mapCumulativeSavings(yearlyCashFlows)
      },
      cashFlowAnalysis: {
        yearlyCashFlows,
        cashFlowSummary: this.calculateCashFlowSummary(yearlyCashFlows),
        cashFlowProjections: this.calculateCashFlowProjections(yearlyCashFlows)
      },
      sensitivityAnalysis: this.convertBrazilianSensitivity(brazilianData.sensibilidade),
      riskAssessment: this.assessFinancialRisk(brazilianData),
      benchmarks: this.generateBenchmarks(brazilianData),
      calculatedAt: new Date(),
      calculationVersion: '1.0.0'
    };
  }

  // ============= PRIVATE HELPER METHODS =============

  /**
   * Maps investment analysis data
   */
  private static mapInvestmentAnalysis(analysis: any): InvestmentAnalysisResult {
    return {
      totalInvestment: analysis.totalInvestment || analysis.investimento_inicial || 0,
      costBreakdown: analysis.costBreakdown || {
        equipmentCost: 0,
        installationCost: 0,
        engineeringCost: 0,
        permitCost: 0,
        interconnectionCost: 0,
        contingencyCost: 0,
        softCosts: 0
      },
      costPerWatt: analysis.costPerWatt || 0,
      financingStructure: analysis.financingStructure,
      incentives: analysis.incentives || []
    };
  }

  /**
   * Maps financial metrics
   */
  private static mapFinancialMetrics(analysis: any): FinancialMetricsResult {
    return {
      netPresentValue: analysis.netPresentValue || analysis.npv || analysis.vpl || 0,
      internalRateOfReturn: analysis.internalRateOfReturn || analysis.irr || analysis.tir || 0,
      modifiedInternalRateOfReturn: analysis.modifiedInternalRateOfReturn,
      paybackPeriod: analysis.paybackPeriod || analysis.payback || 0,
      discountedPaybackPeriod: analysis.discountedPaybackPeriod || analysis.payback_descontado || 0,
      returnOnInvestment: analysis.returnOnInvestment || analysis.roi || 0,
      benefitCostRatio: analysis.benefitCostRatio || 0,
      profitabilityIndex: analysis.profitabilityIndex || 0,
      levelizedCostOfEnergy: analysis.levelizedCostOfEnergy || analysis.lcoe || 0,
      levelizedCostOfStorage: analysis.levelizedCostOfStorage,
      equivalentAnnualAnnuity: analysis.equivalentAnnualAnnuity || 0,
      savingsOverLifetime: analysis.savingsOverLifetime || 0,
      cumulativeSavings: analysis.cumulativeSavings || []
    };
  }

  /**
   * Maps cash flow analysis
   */
  private static mapCashFlowAnalysis(analysis: any): CashFlowAnalysisResult {
    const cashFlowData = analysis.cashFlow || analysis.fluxoCaixa || [];
    const yearlyCashFlows = this.mapYearlyCashFlows(cashFlowData);
    
    return {
      yearlyCashFlows,
      cashFlowSummary: this.calculateCashFlowSummary(yearlyCashFlows),
      cashFlowProjections: this.calculateCashFlowProjections(yearlyCashFlows)
    };
  }

  /**
   * Maps sensitivity analysis
   */
  private static mapSensitivityAnalysis(analysis: any): SensitivityAnalysisResult {
    return {
      parameters: analysis.sensitivityParameters || [],
      tornadoChart: analysis.tornadoChart || [],
      monteCarloSimulation: analysis.monteCarloSimulation
    };
  }

  /**
   * Maps risk assessment
   */
  private static mapRiskAssessment(analysis: any): FinancialRiskResult {
    return {
      overallRiskLevel: analysis.overallRiskLevel || 'medium',
      riskFactors: analysis.riskFactors || [],
      riskMitigationStrategies: analysis.riskMitigationStrategies || [],
      contingencyRecommendations: analysis.contingencyRecommendations || {
        costContingency: 10,
        scheduleContingency: 15,
        performanceContingency: 5
      },
      insuranceRequirements: analysis.insuranceRequirements || []
    };
  }

  /**
   * Maps benchmarks
   */
  private static mapBenchmarks(analysis: any): FinancialBenchmarksResult {
    return {
      industryComparisons: analysis.industryComparisons || {
        averagePaybackPeriod: 7,
        averageROI: 12,
        averageNPV: 15000,
        marketPenetration: 5
      },
      regionalComparisons: analysis.regionalComparisons || {
        stateAverage: 14,
        nationalAverage: 12,
        globalAverage: 10
      },
      technologyComparisons: analysis.technologyComparisons || {
        solarOnly: 12,
        solarWithStorage: 15,
        storageOnly: 8
      },
      performanceRating: analysis.performanceRating || 'average',
      competitiveAdvantage: analysis.competitiveAdvantage || []
    };
  }

  /**
   * Maps result metadata
   */
  private static mapResultMetadata(analysis: any): any {
    return {
      calculationId: analysis.id || this.generateId(),
      version: analysis.calculationVersion || '1.0.0',
      algorithm: analysis.algorithm || 'financial_dcf',
      dataSource: analysis.dataSource || 'market_data',
      assumptions: analysis.assumptions || [],
      limitations: analysis.limitations || [],
      accuracy: analysis.accuracy,
      validationStatus: analysis.validationStatus || 'pending',
      calculationTime: analysis.calculationTime || 0,
      processingSteps: analysis.processingSteps || [],
      warnings: analysis.warnings || [],
      errors: analysis.errors || []
    };
  }

  /**
   * Maps yearly cash flows from raw data
   */
  private static mapYearlyCashFlows(cashFlowData: any[]): any[] {
    return cashFlowData.map((item, index) => ({
      year: item.ano || item.year || index + 1,
      revenue: item.economia || item.revenue || 0,
      costs: item.custoComFV || item.costs || 0,
      netCashFlow: item.fluxoLiquido || item.netCashFlow || 0,
      cumulativeCashFlow: item.fluxo_acumulado || item.cumulativeCashFlow || 0,
      discountedCashFlow: item.valor_presente || item.discountedCashFlow || 0,
      savings: item.economia || item.savings || 0,
      roi: item.roi || 0
    }));
  }

  /**
   * Calculates cash flow summary
   */
  private static calculateCashFlowSummary(yearlyCashFlows: any[]): any {
    const totalRevenue = yearlyCashFlows.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalCosts = yearlyCashFlows.reduce((sum, item) => sum + (item.costs || 0), 0);
    const totalNetCashFlow = yearlyCashFlows.reduce((sum, item) => sum + (item.netCashFlow || 0), 0);
    
    return {
      totalRevenue,
      totalCosts,
      totalNetCashFlow,
      averageAnnualCashFlow: totalNetCashFlow / yearlyCashFlows.length,
      cashFlowStability: this.calculateCashFlowStability(yearlyCashFlows),
      positiveCashFlowYear: this.findPositiveCashFlowYear(yearlyCashFlows)
    };
  }

  /**
   * Calculates cash flow projections
   */
  private static calculateCashFlowProjections(yearlyCashFlows: any[]): any {
    const fiveYearTotal = yearlyCashFlows.slice(0, 5).reduce((sum, item) => sum + (item.netCashFlow || 0), 0);
    const tenYearTotal = yearlyCashFlows.slice(0, 10).reduce((sum, item) => sum + (item.netCashFlow || 0), 0);
    const twentyFiveYearTotal = yearlyCashFlows.reduce((sum, item) => sum + (item.netCashFlow || 0), 0);
    
    return {
      fiveYearTotal,
      tenYearTotal,
      twentyFiveYearTotal
    };
  }

  /**
   * Calculates simple payback period
   */
  private static calculateSimplePayback(initialInvestment: number, yearlyCashFlows: any[]): number {
    let cumulative = 0;
    for (const cashFlow of yearlyCashFlows) {
      cumulative += cashFlow.netCashFlow || 0;
      if (cumulative >= initialInvestment) {
        return cashFlow.year;
      }
    }
    return yearlyCashFlows.length;
  }

  /**
   * Calculates discounted payback period
   */
  private static calculateDiscountedPayback(initialInvestment: number, yearlyCashFlows: any[], discountRate: number): number {
    let cumulative = 0;
    for (const cashFlow of yearlyCashFlows) {
      const discounted = (cashFlow.netCashFlow || 0) / Math.pow(1 + discountRate, cashFlow.year);
      cumulative += discounted;
      if (cumulative >= initialInvestment) {
        return cashFlow.year;
      }
    }
    return yearlyCashFlows.length;
  }

  /**
   * Calculates NPV
   */
  private static calculateNPV(cashFlows: any[], discountRate: number, initialInvestment: number): number {
    let npv = -initialInvestment;
    for (const cashFlow of cashFlows) {
      npv += (cashFlow.netCashFlow || 0) / Math.pow(1 + discountRate, cashFlow.year);
    }
    return npv;
  }

  /**
   * Calculates IRR using Newton-Raphson method
   */
  private static calculateIRR(cashFlows: any[], initialInvestment: number): number {
    let rate = 0.1; // Initial guess
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = -initialInvestment;
      let dnpv = 0;
      
      for (const cashFlow of cashFlows) {
        const factor = Math.pow(1 + rate, cashFlow.year);
        npv += (cashFlow.netCashFlow || 0) / factor;
        dnpv -= (cashFlow.year * (cashFlow.netCashFlow || 0)) / (factor * (1 + rate));
      }
      
      const newRate = rate - npv / dnpv;
      if (Math.abs(newRate - rate) < tolerance) {
        return newRate;
      }
      rate = newRate;
    }
    
    return rate;
  }

  /**
   * Calculates MIRR
   */
  private static calculateMIRR(cashFlows: any[], financeRate: number, reinvestRate: number): number {
    const positiveFlows = cashFlows.filter(cf => (cf.netCashFlow || 0) > 0);
    const negativeFlows = cashFlows.filter(cf => (cf.netCashFlow || 0) < 0);
    
    const futureValue = positiveFlows.reduce((sum, cf) => {
      const years = cashFlows.length - cf.year + 1;
      return sum + (cf.netCashFlow || 0) * Math.pow(1 + reinvestRate, years);
    }, 0);
    
    const presentValue = negativeFlows.reduce((sum, cf) => {
      return sum + (cf.netCashFlow || 0) / Math.pow(1 + financeRate, cf.year);
    }, 0);
    
    const n = cashFlows.length;
    return Math.pow(futureValue / Math.abs(presentValue), 1 / n) - 1;
  }

  /**
   * Calculates profitability index
   */
  private static calculateProfitabilityIndex(cashFlows: any[], discountRate: number, initialInvestment: number): number {
    const npv = this.calculateNPV(cashFlows, discountRate, 0);
    return initialInvestment > 0 ? (npv / initialInvestment) + 1 : 0;
  }

  /**
   * Calculates Equivalent Annual Annuity
   */
  private static calculateEAA(cashFlows: any[], discountRate: number, initialInvestment: number): number {
    const npv = this.calculateNPV(cashFlows, discountRate, initialInvestment);
    const n = cashFlows.length;
    const annuityFactor = (1 - Math.pow(1 + discountRate, -n)) / discountRate;
    return npv / annuityFactor;
  }

  /**
   * Helper methods for Brazilian format conversion
   */
  private static convertBrazilianCashFlow(cashFlow: CashFlowDetails[]): any[] {
    return cashFlow.map(item => ({
      year: item.ano,
      revenue: item.economia_energia,
      costs: item.custos_om,
      netCashFlow: item.fluxo_liquido,
      cumulativeCashFlow: item.fluxo_acumulado,
      discountedCashFlow: item.valor_presente,
      savings: item.economia_energia
    }));
  }

  private static convertBrazilianSensitivity(sensibilidade: SensitivityAnalysis): any {
    return {
      parameters: [
        {
          name: 'Tarifa de Energia',
          baseValue: 0.65,
          scenarios: sensibilidade.vpl_variacao_tarifa?.map(point => ({
            variation: point.parametro,
            npv: point.vpl,
            irr: 0,
            paybackPeriod: 0
          })) || [],
          sensitivity: 0
        }
      ],
      tornadoChart: []
    };
  }

  private static assessFinancialRisk(_data: AdvancedFinancialResults): any {
    return {
      overallRiskLevel: 'medium',
      riskFactors: [],
      riskMitigationStrategies: [],
      contingencyRecommendations: {
        costContingency: 10,
        scheduleContingency: 15,
        performanceContingency: 5
      },
      insuranceRequirements: []
    };
  }

  private static generateBenchmarks(_data: AdvancedFinancialResults): any {
    return {
      industryComparisons: {
        averagePaybackPeriod: 7,
        averageROI: 12,
        averageNPV: 15000,
        marketPenetration: 5
      },
      regionalComparisons: {
        stateAverage: 14,
        nationalAverage: 12,
        globalAverage: 10
      },
      technologyComparisons: {
        solarOnly: 12,
        solarWithStorage: 15,
        storageOnly: 8
      },
      performanceRating: 'average',
      competitiveAdvantage: []
    };
  }

  private static mapCumulativeSavings(yearlyCashFlows: any[]): any[] {
    let cumulative = 0;
    return yearlyCashFlows.map(cf => {
      cumulative += cf.savings || 0;
      return {
        year: cf.year,
        savings: cf.savings || 0,
        cumulative
      };
    });
  }

  private static extractYearlyCashFlows(data: any): any[] {
    return data.yearlyCashFlows || data.cashFlow || data.fluxoCaixa || [];
  }

  private static calculatePaybackConfidence(data: any): number {
    // Simple confidence calculation based on data quality
    return data.accuracy ? data.accuracy / 100 : 0.8;
  }

  private static calculatePaybackSensitivity(data: any): any {
    return {
      optimistic: (data.paybackPeriod || 0) * 0.8,
      pessimistic: (data.paybackPeriod || 0) * 1.2,
      base: data.paybackPeriod || 0
    };
  }

  private static calculateMonthlyPaybackProjection(initialInvestment: number, yearlyCashFlows: any[]): any[] {
    const monthlyProjections = [];
    let cumulative = 0;
    
    for (const yearly of yearlyCashFlows) {
      const monthlyCashFlow = (yearly.netCashFlow || 0) / 12;
      for (let month = 1; month <= 12; month++) {
        cumulative += monthlyCashFlow;
        monthlyProjections.push({
          month: (yearly.year - 1) * 12 + month,
          cumulative,
          monthlyCashFlow
        });
        if (cumulative >= initialInvestment) break;
      }
      if (cumulative >= initialInvestment) break;
    }
    
    return monthlyProjections;
  }

  private static calculateNPVSensitivity(cashFlows: any[], _baseRate: number, initialInvestment: number): any {
    const rates = [0.05, 0.08, 0.10, 0.12, 0.15];
    return rates.map(rate => ({
      discountRate: rate,
      npv: this.calculateNPV(cashFlows, rate, initialInvestment)
    }));
  }

  private static calculateNPVBreakdown(cashFlows: any[], discountRate: number, initialInvestment: number): any {
    const revenuePV = cashFlows.reduce((sum, cf) => 
      sum + (cf.revenue || 0) / Math.pow(1 + discountRate, cf.year), 0);
    const costPV = cashFlows.reduce((sum, cf) => 
      sum + (cf.costs || 0) / Math.pow(1 + discountRate, cf.year), 0);
    
    return {
      initialInvestment: -initialInvestment,
      revenuePresentValue: revenuePV,
      costPresentValue: costPV,
      netPresentValue: revenuePV - costPV - initialInvestment
    };
  }

  private static calculateCashFlowStability(yearlyCashFlows: any[]): number {
    if (yearlyCashFlows.length === 0) return 0;
    
    const cashFlowValues = yearlyCashFlows.map(cf => cf.netCashFlow || 0);
    const mean = cashFlowValues.reduce((sum, val) => sum + val, 0) / cashFlowValues.length;
    const variance = cashFlowValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / cashFlowValues.length;
    const standardDeviation = Math.sqrt(variance);
    
    return mean > 0 ? (standardDeviation / Math.abs(mean)) * 100 : 100;
  }

  private static findPositiveCashFlowYear(yearlyCashFlows: any[]): number {
    for (const cashFlow of yearlyCashFlows) {
      if ((cashFlow.cumulativeCashFlow || 0) > 0) {
        return cashFlow.year;
      }
    }
    return yearlyCashFlows.length;
  }

  /**
   * Generates a unique ID for calculations
   */
  private static generateId(): string {
    return `fin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}