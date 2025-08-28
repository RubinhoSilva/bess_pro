import { CalculationLogger } from "./CalculationLogger";

export interface FinancialParams {
  investimentoInicial: number; // R$
  geracaoAnual: number; // kWh/ano
  tarifaEnergia: number; // R$/kWh
  inflacaoEnergia: number; // % ao ano
  taxaDesconto: number; // % ao ano
  vidaUtil: number; // anos
  custoOperacional: number; // R$/ano
  valorResidual: number; // R$
}

export interface FinancialResults {
  vpl: number; // R$
  tir: number; // %
  payback: number; // anos
  lcoe: number; // R$/kWh
  economiaAnual: number; // R$
  economiaAcumulada25Anos: number; // R$
  fluxoCaixa: number[]; // R$ por ano
}

export class EnhancedFinancialCalculationService {
  
  /**
   * Calcula todos os indicadores financeiros do projeto
   */
  static calculateFinancialIndicators(
    params: FinancialParams,
    logger?: CalculationLogger
  ): FinancialResults {
    
    logger?.context('Financeiro', 'Iniciando análise financeira completa', params, 
      'Análise de viabilidade econômica do projeto fotovoltaico considerando VPL, TIR, Payback e LCOE conforme metodologia padrão da engenharia econômica.');

    // 1. Cálculo da economia anual no primeiro ano
    const economiaAnual = this.calculateAnnualSavings(params, logger);
    
    // 2. Cálculo do fluxo de caixa
    const fluxoCaixa = this.calculateCashFlow(params, economiaAnual, logger);
    
    // 3. Cálculo do VPL
    const vpl = this.calculateNPV(fluxoCaixa, params.taxaDesconto, params.investimentoInicial, logger);
    
    // 4. Cálculo da TIR
    const tir = this.calculateIRR(fluxoCaixa, params.investimentoInicial, logger);
    
    // 5. Cálculo do Payback
    const payback = this.calculatePayback(fluxoCaixa, params.investimentoInicial, logger);
    
    // 6. Cálculo do LCOE
    const lcoe = this.calculateLCOE(params, logger);
    
    // 7. Economia acumulada em 25 anos
    const economiaAcumulada25Anos = this.calculateAccumulatedSavings(params, logger);

    const results: FinancialResults = {
      vpl,
      tir,
      payback,
      lcoe,
      economiaAnual,
      economiaAcumulada25Anos,
      fluxoCaixa
    };

    logger?.result('Financeiro', 'Análise financeira concluída', results);
    
    return results;
  }

  /**
   * Calcula a economia anual de energia no primeiro ano
   */
  private static calculateAnnualSavings(params: FinancialParams, logger?: CalculationLogger): number {
    const economia = params.geracaoAnual * params.tarifaEnergia - params.custoOperacional;
    
    logger?.formula('Financeiro', 'Economia anual no primeiro ano',
      'Economia_1 = E_gerada × Tarifa - Custo_O&M',
      {
        E_gerada: params.geracaoAnual,
        Tarifa: params.tarifaEnergia,
        Custo_OM: params.custoOperacional
      },
      economia,
      {
        description: 'Economia líquida no primeiro ano, considerando a energia gerada valorada à tarifa atual menos os custos de operação e manutenção.',
        units: 'R$/ano',
        references: ['Manual de Engenharia FV - CRESESB', 'IEA PVPS Task 12']
      }
    );

    return economia;
  }

  /**
   * Calcula o fluxo de caixa projetado para toda a vida útil
   */
  private static calculateCashFlow(params: FinancialParams, economiaInicial: number, logger?: CalculationLogger): number[] {
    const fluxoCaixa: number[] = [];
    
    logger?.context('Financeiro', 'Calculando fluxo de caixa', {
      economiaInicial,
      inflacaoEnergia: params.inflacaoEnergia,
      vidaUtil: params.vidaUtil
    }, 'Projeção do fluxo de caixa considerando a inflação da tarifa de energia elétrica ao longo da vida útil do sistema.');

    for (let ano = 1; ano <= params.vidaUtil; ano++) {
      // Economia com inflação da tarifa
      const economiaAno = economiaInicial * Math.pow(1 + params.inflacaoEnergia / 100, ano - 1);
      
      // No último ano, adiciona valor residual
      const valorResidualAno = ano === params.vidaUtil ? params.valorResidual : 0;
      
      const fluxoAno = economiaAno + valorResidualAno;
      fluxoCaixa.push(fluxoAno);
      
      if (ano <= 5 || ano === params.vidaUtil) { // Log dos primeiros 5 anos e último
        logger?.formula('Financeiro', `Fluxo de caixa - Ano ${ano}`,
          'FC_ano = Economia_1 × (1 + i_energia)^(ano-1) + Valor_residual',
          {
            Economia_1: economiaInicial,
            i_energia: params.inflacaoEnergia / 100,
            ano: ano,
            fator_inflacao: Math.pow(1 + params.inflacaoEnergia / 100, ano - 1),
            Valor_residual: valorResidualAno
          },
          fluxoAno,
          {
            description: `Fluxo de caixa do ano ${ano}, considerando economia inflacionada ${ano === params.vidaUtil ? 'e valor residual' : ''}.`,
            units: 'R$'
          }
        );
      }
    }

    return fluxoCaixa;
  }

  /**
   * Calcula o Valor Presente Líquido (VPL/NPV)
   */
  private static calculateNPV(fluxoCaixa: number[], taxaDesconto: number, investimentoInicial: number, logger?: CalculationLogger): number {
    logger?.context('VPL', 'Calculando Valor Presente Líquido', {
      taxaDesconto,
      investimentoInicial,
      periodos: fluxoCaixa.length
    }, 'O VPL representa o valor presente de todos os fluxos de caixa futuros descontados pela taxa mínima de atratividade, menos o investimento inicial.');

    let vpl = -investimentoInicial;
    const taxaDecimal = taxaDesconto / 100;
    
    fluxoCaixa.forEach((fluxo, index) => {
      const ano = index + 1;
      const valorPresente = fluxo / Math.pow(1 + taxaDecimal, ano);
      vpl += valorPresente;
      
      if (ano <= 3) { // Log dos primeiros anos
        logger?.formula('VPL', `Valor presente - Ano ${ano}`,
          'VP_ano = FC_ano / (1 + r)^ano',
          {
            FC_ano: fluxo,
            r: taxaDecimal,
            ano: ano,
            denominador: Math.pow(1 + taxaDecimal, ano)
          },
          valorPresente,
          {
            description: `Valor presente do fluxo de caixa do ano ${ano}.`,
            units: 'R$'
          }
        );
      }
    });

    logger?.formula('VPL', 'Valor Presente Líquido final',
      'VPL = -I₀ + Σ(FC_t / (1+r)^t)',
      {
        I0: investimentoInicial,
        r: taxaDecimal,
        somaVP: vpl + investimentoInicial,
        periodos: fluxoCaixa.length
      },
      vpl,
      {
        description: 'VPL positivo indica que o projeto é financeiramente atrativo, gerando valor superior à taxa mínima de atratividade.',
        units: 'R$',
        references: ['Engenharia Econômica - Blank & Tarquin', 'Análise de Investimentos - Casarotto & Kopittke']
      }
    );

    return vpl;
  }

  /**
   * Calcula a Taxa Interna de Retorno (TIR/IRR) usando método de Newton-Raphson
   */
  private static calculateIRR(fluxoCaixa: number[], investimentoInicial: number, logger?: CalculationLogger): number {
    logger?.context('TIR', 'Calculando Taxa Interna de Retorno', {
      investimentoInicial,
      fluxoCaixaTotal: fluxoCaixa.reduce((a, b) => a + b, 0)
    }, 'A TIR é a taxa de desconto que torna o VPL igual a zero. Representa a rentabilidade intrínseca do projeto.');

    let tir = 0.1; // Chute inicial de 10%
    let iteracoes = 0;
    const maxIteracoes = 100;
    const tolerancia = 0.0001;

    while (iteracoes < maxIteracoes) {
      let f = -investimentoInicial;
      let df = 0;

      fluxoCaixa.forEach((fluxo, index) => {
        const ano = index + 1;
        const denominador = Math.pow(1 + tir, ano);
        f += fluxo / denominador;
        df -= (ano * fluxo) / Math.pow(1 + tir, ano + 1);
      });

      if (Math.abs(f) < tolerancia) break;
      
      const tirAnterior = tir;
      tir = tir - f / df;
      
      if (iteracoes < 3) { // Log das primeiras iterações
        logger?.formula('TIR', `Iteração ${iteracoes + 1} - Newton-Raphson`,
          'r_novo = r_atual - f(r)/f\'(r)',
          {
            r_atual: tirAnterior,
            f_r: f,
            df_r: df,
            r_novo: tir
          },
          tir,
          {
            description: `Iteração ${iteracoes + 1} do método Newton-Raphson para encontrar a TIR.`,
            units: 'decimal'
          }
        );
      }

      iteracoes++;
    }

    const tirPercent = tir * 100;

    logger?.result('TIR', `TIR calculada em ${iteracoes} iterações`, {
      tir: tirPercent,
      iteracoes,
      convergiu: iteracoes < maxIteracoes
    });

    return tirPercent;
  }

  /**
   * Calcula o tempo de retorno do investimento (Payback)
   */
  private static calculatePayback(fluxoCaixa: number[], investimentoInicial: number, logger?: CalculationLogger): number {
    logger?.context('Payback', 'Calculando tempo de retorno', {
      investimentoInicial
    }, 'Payback é o tempo necessário para que os fluxos de caixa acumulados se igualem ao investimento inicial.');

    let acumulado = 0;
    let payback = 0;

    for (let i = 0; i < fluxoCaixa.length; i++) {
      const ano = i + 1;
      acumulado += fluxoCaixa[i];
      
      if (acumulado >= investimentoInicial) {
        // Interpolação linear para maior precisão
        const excessoAno = acumulado - investimentoInicial;
        const fluxoAno = fluxoCaixa[i];
        payback = ano - (excessoAno / fluxoAno);
        break;
      }
    }

    logger?.formula('Payback', 'Tempo de retorno calculado',
      'Payback = ano + (saldo_restante / fluxo_ano)',
      {
        fluxoAcumulado: acumulado,
        investimentoInicial,
        anoInteiro: Math.floor(payback),
        fracaoAno: payback - Math.floor(payback)
      },
      payback,
      {
        description: 'Tempo em anos para recuperar o investimento inicial através dos fluxos de caixa positivos.',
        units: 'anos',
        references: ['Análise de Investimentos - Casarotto & Kopittke']
      }
    );

    return payback;
  }

  /**
   * Calcula o Custo Nivelado da Energia (LCOE)
   */
  private static calculateLCOE(params: FinancialParams, logger?: CalculationLogger): number {
    logger?.context('LCOE', 'Calculando Custo Nivelado da Energia', params,
      'LCOE representa o custo médio de produção de energia ao longo de toda a vida útil do sistema, considerando valor do dinheiro no tempo.');

    const taxaDecimal = params.taxaDesconto / 100;
    
    // Valor presente dos custos
    let vpCustos = params.investimentoInicial;
    
    // Valor presente dos custos operacionais
    for (let ano = 1; ano <= params.vidaUtil; ano++) {
      vpCustos += params.custoOperacional / Math.pow(1 + taxaDecimal, ano);
    }
    
    // Subtrai valor residual
    vpCustos -= params.valorResidual / Math.pow(1 + taxaDecimal, params.vidaUtil);
    
    // Valor presente da geração
    let vpGeracao = 0;
    for (let ano = 1; ano <= params.vidaUtil; ano++) {
      vpGeracao += params.geracaoAnual / Math.pow(1 + taxaDecimal, ano);
    }
    
    const lcoe = vpCustos / vpGeracao;

    logger?.formula('LCOE', 'Custo Nivelado da Energia',
      'LCOE = VP_custos / VP_geração',
      {
        VP_custos: vpCustos,
        VP_geração: vpGeracao,
        investimento_inicial: params.investimentoInicial,
        custo_operacional_anual: params.custoOperacional,
        valor_residual: params.valorResidual
      },
      lcoe,
      {
        description: 'Custo por kWh considerando todos os investimentos e custos ao longo da vida útil, descontados ao valor presente.',
        units: 'R$/kWh',
        references: ['IEA Energy Technology Roadmaps', 'NREL LCOE Documentation']
      }
    );

    return lcoe;
  }

  /**
   * Calcula a economia acumulada em 25 anos
   */
  private static calculateAccumulatedSavings(params: FinancialParams, logger?: CalculationLogger): number {
    let economiaAcumulada = 0;
    const economiaInicial = params.geracaoAnual * params.tarifaEnergia - params.custoOperacional;
    
    for (let ano = 1; ano <= 25; ano++) {
      const economiaAno = economiaInicial * Math.pow(1 + params.inflacaoEnergia / 100, ano - 1);
      economiaAcumulada += economiaAno;
    }
    
    economiaAcumulada += params.valorResidual; // Valor residual no final

    logger?.formula('Financeiro', 'Economia acumulada em 25 anos',
      'Economia_total = Σ(Economia_1 × (1+i)^(t-1)) + Valor_residual',
      {
        economia_inicial: economiaInicial,
        inflacao_energia: params.inflacaoEnergia / 100,
        valor_residual: params.valorResidual,
        periodos: 25
      },
      economiaAcumulada,
      {
        description: 'Total de economia financeira acumulada ao longo de 25 anos, considerando inflação da tarifa de energia.',
        units: 'R$'
      }
    );

    return economiaAcumulada;
  }
}