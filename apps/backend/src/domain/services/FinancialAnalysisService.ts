export interface FinancialParams {
  investimentoInicial: number;
  economiaMensal: number;
  taxaDesconto: number; // % ao ano
  tarifaEnergia: number; // R$/kWh
  aumentoTarifa: number; // % ao ano
  periodoAnalise: number; // anos
  custoManutencao: number; // % do investimento por ano
}

export interface AdvancedFinancialParams {
  totalInvestment: number;
  geracaoEstimadaMensal: number[]; // 12 meses
  consumoMensal: number[]; // 12 meses
  tarifaEnergiaB: number; // Tarifa completa (TE + TUSD)
  custoFioB: number; // Custo específico do TUSD Fio B
  vidaUtil: number; // anos
  inflacaoEnergia: number; // % ao ano
  taxaDesconto: number; // % ao ano
}

export interface FinancialResult {
  vpl: number;
  tir: number;
  payback: number; // anos
  economiaTotal: number;
  fluxoCaixa: number[];
}

export interface CashFlowItem {
  ano: number;
  fluxoLiquido: number;
  economia: number;
  custoSemFV: number;
  custoComFV: number;
}

export interface AdvancedFinancialResult {
  economiaAnualEstimada: number;
  vpl: number;
  tir: number;
  payback: number;
  fluxoCaixa: CashFlowItem[];
}

export class FinancialAnalysisService {
  // NBR 14300 Fio B Payment Percentages by year
  private static readonly FIO_B_PERCENTAGES: Record<number, number> = {
    2023: 0.15,
    2024: 0.30,
    2025: 0.45,
    2026: 0.60,
    2027: 0.75,
    2028: 0.90,
    2029: 1.00, // Assuming 100% from 2029 onwards as defined by ANEEL
  };

  /**
   * Realiza análise financeira completa do projeto
   */
  static analyzeProject(params: FinancialParams): FinancialResult {
    const fluxoCaixa = this.calculateCashFlow(params);
    const vpl = this.calculateNPV(fluxoCaixa, params.taxaDesconto);
    const tir = this.calculateIRR(fluxoCaixa);
    const payback = this.calculatePayback(fluxoCaixa);
    const economiaTotal = fluxoCaixa.slice(1).reduce((sum, value) => sum + value, 0);

    return {
      vpl,
      tir,
      payback,
      economiaTotal,
      fluxoCaixa
    };
  }

  /**
   * Realiza análise financeira avançada com Fio B
   */
  static calculateAdvancedFinancials(data: AdvancedFinancialParams): AdvancedFinancialResult {
    const {
      totalInvestment,
      geracaoEstimadaMensal,
      consumoMensal,
      tarifaEnergiaB,
      custoFioB,
      vidaUtil,
      inflacaoEnergia,
      taxaDesconto,
    } = data;

    const startYear = new Date().getFullYear();
    const fluxoCaixa: CashFlowItem[] = [];

    // Ano 0: Apenas o investimento inicial
    fluxoCaixa.push({
      ano: 0,
      fluxoLiquido: -totalInvestment,
      economia: 0,
      custoSemFV: 0,
      custoComFV: 0,
    });
    
    let economiaAnualTotalAcumulada = 0;

    for (let i = 1; i <= vidaUtil; i++) {
      const anoAtual = startYear + i - 1;
      const fatorInflacao = Math.pow(1 + inflacaoEnergia / 100, i - 1);
      const tarifaAtual = tarifaEnergiaB * fatorInflacao;
      const custoFioBAtual = custoFioB * fatorInflacao;
      const fioBPercentual = this.getFioBPercentage(anoAtual);

      let custoAnualSemFV = 0;
      let custoAnualComFV = 0;

      for (let mes = 0; mes < 12; mes++) {
        const consumoDoMes = consumoMensal[mes];
        const geracaoDoMes = geracaoEstimadaMensal[mes];

        custoAnualSemFV += consumoDoMes * tarifaAtual;
        
        const energiaInjetada = Math.max(0, geracaoDoMes - consumoDoMes);
        const energiaConsumidaDaRede = Math.max(0, consumoDoMes - geracaoDoMes);
        
        // Custo da energia consumida da rede + custo do Fio B sobre a energia injetada
        const custoMesComFV = (energiaConsumidaDaRede * tarifaAtual) + (energiaInjetada * custoFioBAtual * fioBPercentual);
        custoAnualComFV += custoMesComFV;
      }

      const economiaAnual = custoAnualSemFV - custoAnualComFV;
      economiaAnualTotalAcumulada += economiaAnual;

      fluxoCaixa.push({
        ano: i,
        fluxoLiquido: economiaAnual,
        economia: economiaAnual,
        custoSemFV: custoAnualSemFV,
        custoComFV: custoAnualComFV,
      });
    }
    
    const economiaAnualEstimada = economiaAnualTotalAcumulada / vidaUtil;

    // Calcular VPL (Valor Presente Líquido)
    let vpl = 0;
    fluxoCaixa.forEach(item => {
      vpl += item.fluxoLiquido / Math.pow(1 + taxaDesconto / 100, item.ano);
    });

    // Calcular TIR (Taxa Interna de Retorno)
    let tir = 0;
    if (totalInvestment > 0) {
      const cashFlowValues = fluxoCaixa.map(f => f.fluxoLiquido);
      tir = this.calculateIRRAdvanced(cashFlowValues);
    }

    // Calcular Payback Simples
    let payback = 0;
    if (economiaAnualEstimada > 0) {
      let acumulado = -totalInvestment;
      for (let i = 1; i <= vidaUtil; i++) {
        acumulado += fluxoCaixa[i].fluxoLiquido;
        if (acumulado >= 0) {
          // Interpolação para encontrar o ponto exato dentro do ano
          const fluxoDoAno = fluxoCaixa[i].fluxoLiquido;
          const valorFaltante = acumulado - fluxoDoAno;
          payback = (i - 1) + (Math.abs(valorFaltante) / fluxoDoAno);
          break;
        }
      }
      if (payback === 0) payback = vidaUtil + 1; // Se não houver payback
    } else {
      payback = vidaUtil + 1; // Se não houver economia
    }

    return {
      economiaAnualEstimada,
      vpl,
      tir: isFinite(tir) ? tir : 0,
      payback: payback > vidaUtil ? vidaUtil + 1 : payback,
      fluxoCaixa,
    };
  }

  private static getFioBPercentage(year: number): number {
    if (year >= 2029) return 1.0;
    return this.FIO_B_PERCENTAGES[year] || 0;
  }

  /**
   * Calcula o fluxo de caixa do projeto
   */
  private static calculateCashFlow(params: FinancialParams): number[] {
    const {
      investimentoInicial,
      economiaMensal,
      taxaDesconto,
      tarifaEnergia,
      aumentoTarifa,
      periodoAnalise,
      custoManutencao
    } = params;

    const fluxoCaixa: number[] = [-investimentoInicial]; // Ano 0

    let economiaAnual = economiaMensal * 12;
    const custoManutencaoAnual = investimentoInicial * (custoManutencao / 100);

    for (let ano = 1; ano <= periodoAnalise; ano++) {
      // Economia com aumento da tarifa
      economiaAnual *= (1 + aumentoTarifa / 100);
      
      // Fluxo líquido = Economia - Manutenção
      const fluxoLiquido = economiaAnual - custoManutencaoAnual;
      fluxoCaixa.push(fluxoLiquido);
    }

    return fluxoCaixa;
  }

  /**
   * Calcula o Valor Presente Líquido (VPL)
   */
  private static calculateNPV(cashFlow: number[], discountRate: number): number {
    return cashFlow.reduce((npv, cash, index) => {
      return npv + cash / Math.pow(1 + discountRate / 100, index);
    }, 0);
  }

  /**
   * Calcula a Taxa Interna de Retorno (TIR)
   */
  private static calculateIRR(cashFlow: number[]): number {
    // Método de Newton-Raphson simplificado
    let rate = 0.1; // Taxa inicial de 10%
    let iteration = 0;
    const maxIterations = 100;
    const tolerance = 0.00001;

    while (iteration < maxIterations) {
      const npv = this.calculateNPV(cashFlow, rate * 100);
      const derivative = this.calculateNPVDerivative(cashFlow, rate);

      if (Math.abs(npv) < tolerance) {
        return rate * 100;
      }

      rate = rate - npv / derivative;
      iteration++;
    }

    return rate * 100;
  }

  /**
   * Calcula TIR avançada usando método iterativo
   */
  private static calculateIRRAdvanced(values: number[]): number {
    let rate = 0.1; // Chute inicial
    for (let i = 0; i < 50; i++) { // Aumentar iterações para precisão
      let npv = values.reduce((acc, val, j) => acc + val / Math.pow(1 + rate, j), 0);
      if (Math.abs(npv) < 1e-5) return rate * 100;
      
      let derivative = values.reduce((acc, val, j) => acc - j * val / Math.pow(1 + rate, j + 1), 0);
      if (Math.abs(derivative) < 1e-5) break; // Evitar divisão por zero
      
      rate -= npv / derivative;
    }
    return rate * 100;
  }

  private static calculateNPVDerivative(cashFlow: number[], rate: number): number {
    return cashFlow.reduce((derivative, cash, index) => {
      if (index === 0) return derivative;
      return derivative - (index * cash) / Math.pow(1 + rate, index + 1);
    }, 0);
  }

  /**
   * Calcula o tempo de retorno do investimento (Payback)
   */
  private static calculatePayback(cashFlow: number[]): number {
    let cumulativeCash = cashFlow[0]; // Investimento inicial (negativo)
    
    for (let i = 1; i < cashFlow.length; i++) {
      cumulativeCash += cashFlow[i];
      
      if (cumulativeCash >= 0) {
        // Interpolação para obter o payback mais preciso
        const previousCumulative = cumulativeCash - cashFlow[i];
        const fraction = -previousCumulative / cashFlow[i];
        return i - 1 + fraction;
      }
    }

    return -1; // Payback não encontrado no período analisado
  }

  /**
   * Calcula a economia de CO2
   */
  static calculateCO2Savings(
    annualGeneration: number, // kWh/ano
    gridEmissionFactor: number = 0.074 // kg CO2/kWh (média Brasil)
  ): number {
    return annualGeneration * gridEmissionFactor;
  }
}