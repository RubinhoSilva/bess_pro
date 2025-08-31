// Análise financeira avançada para sistemas fotovoltaicos

export interface AdvancedFinancialInput {
  investimentoInicial: number;
  geracaoMensal: number[];
  consumoMensal: number[];
  tarifaEnergia: number;
  custoFioB: number;
  vidaUtil: number;
  taxaDesconto: number;
  inflacaoEnergia: number;
  degradacaoModulos?: number;
  custoOM?: number;
  inflacaoOM?: number;
  tarifaBranca?: {
    pontaPonta: number;
    intermediaria: number;
    foraPonta: number;
  };
  modalidadeTarifaria?: 'convencional' | 'branca';
}

export interface CashFlowDetails {
  ano: number;
  geracaoAnual: number;
  economiaEnergia: number;
  custosOM: number;
  fluxoLiquido: number;
  fluxoAcumulado: number;
  valorPresente: number;
}

export interface AdvancedFinancialResults {
  vpl: number;
  tir: number;
  paybackSimples: number;
  paybackDescontado: number;
  economiaTotal25Anos: number;
  economiaAnualMedia: number;
  lucratividadeIndex: number;
  cashFlow: CashFlowDetails[];
  indicadores: {
    yieldEspecifico: number;
    custoNiveladoEnergia: number;
    eficienciaInvestimento: number;
    retornoSobreInvestimento: number;
  };
  sensibilidade: {
    vplVariacaoTarifa: { tarifa: number; vpl: number }[];
    vplVariacaoInflacao: { inflacao: number; vpl: number }[];
    vplVariacaoDesconto: { desconto: number; vpl: number }[];
  };
}

export class AdvancedFinancialAnalyzer {
  
  static calculateAdvancedFinancials(input: AdvancedFinancialInput): AdvancedFinancialResults {
    const {
      investimentoInicial,
      geracaoMensal,
      consumoMensal,
      tarifaEnergia,
      custoFioB,
      vidaUtil,
      taxaDesconto,
      inflacaoEnergia,
      degradacaoModulos = 0.5,
      custoOM = 0,
      inflacaoOM = 4.0
    } = input;

    // 1. Calcular fluxo de caixa detalhado
    const cashFlow = this.calculateDetailedCashFlow({
      investimentoInicial,
      geracaoMensal,
      consumoMensal,
      tarifaEnergia,
      custoFioB,
      vidaUtil,
      inflacaoEnergia,
      degradacaoModulos,
      custoOM,
      inflacaoOM,
      taxaDesconto
    });

    // 2. Calcular indicadores financeiros
    const vpl = this.calculateNPV(cashFlow, taxaDesconto) - investimentoInicial;
    const tir = this.calculateIRR(cashFlow, investimentoInicial);
    const paybackSimples = this.calculateSimplePayback(cashFlow);
    const paybackDescontado = this.calculateDiscountedPayback(cashFlow, taxaDesconto);

    // 3. Calcular métricas adicionais
    const geracaoAnualInicial = geracaoMensal.reduce((sum, gen) => sum + gen, 0);
    const economiaTotal25Anos = cashFlow.reduce((sum, year) => sum + year.economiaEnergia, 0);
    const economiaAnualMedia = economiaTotal25Anos / vidaUtil;
    const lucratividadeIndex = (vpl + investimentoInicial) / investimentoInicial;

    // 4. Indicadores de performance
    const yieldEspecifico = geracaoAnualInicial / (investimentoInicial / 1000); // kWh/kW/R$1000
    const custoNiveladoEnergia = this.calculateLCOE(investimentoInicial, cashFlow, taxaDesconto);
    const eficienciaInvestimento = (economiaAnualMedia / investimentoInicial) * 100;
    const retornoSobreInvestimento = ((economiaTotal25Anos - investimentoInicial) / investimentoInicial) * 100;

    // 5. Análise de sensibilidade
    const sensibilidade = this.calculateSensitivityAnalysis(input);

    return {
      vpl,
      tir,
      paybackSimples,
      paybackDescontado,
      economiaTotal25Anos,
      economiaAnualMedia,
      lucratividadeIndex,
      cashFlow,
      indicadores: {
        yieldEspecifico,
        custoNiveladoEnergia,
        eficienciaInvestimento,
        retornoSobreInvestimento
      },
      sensibilidade
    };
  }

  private static calculateDetailedCashFlow(params: {
    investimentoInicial: number;
    geracaoMensal: number[];
    consumoMensal: number[];
    tarifaEnergia: number;
    custoFioB: number;
    vidaUtil: number;
    inflacaoEnergia: number;
    degradacaoModulos: number;
    custoOM: number;
    inflacaoOM: number;
    taxaDesconto: number;
  }): CashFlowDetails[] {
    const {
      investimentoInicial,
      geracaoMensal,
      consumoMensal,
      tarifaEnergia,
      custoFioB,
      vidaUtil,
      inflacaoEnergia,
      degradacaoModulos,
      custoOM,
      inflacaoOM,
      taxaDesconto
    } = params;

    const geracaoAnualInicial = geracaoMensal.reduce((sum, gen) => sum + gen, 0);
    const consumoAnual = consumoMensal.reduce((sum, cons) => sum + cons, 0);
    
    const cashFlow: CashFlowDetails[] = [];
    let fluxoAcumulado = -investimentoInicial; // Ano 0

    for (let ano = 1; ano <= vidaUtil; ano++) {
      // Aplicar degradação dos módulos
      const fatorDegradacao = Math.pow((1 - degradacaoModulos / 100), ano - 1);
      const geracaoAnual = geracaoAnualInicial * fatorDegradacao;
      
      // Calcular economia considerando geração vs consumo
      const energiaInjetada = Math.max(0, geracaoAnual - consumoAnual);
      const energiaConsumida = Math.min(geracaoAnual, consumoAnual);
      
      // Economia pela energia consumida diretamente (evita compra da rede)
      const economiaConsumo = energiaConsumida * tarifaEnergia * Math.pow(1 + inflacaoEnergia / 100, ano - 1);
      
      // Compensação pela energia injetada (sistema de compensação SCEE)
      const compensacaoInjecao = energiaInjetada * custoFioB * Math.pow(1 + inflacaoEnergia / 100, ano - 1);
      
      const economiaEnergia = economiaConsumo + compensacaoInjecao;
      
      // Custos de O&M
      const custoOM_atual = custoOM * Math.pow(1 + inflacaoOM / 100, ano - 1);
      const custosOM = custoOM_atual;
      
      const fluxoLiquido = economiaEnergia - custosOM;
      fluxoAcumulado += fluxoLiquido;
      
      // Valor presente do fluxo
      const valorPresente = fluxoLiquido / Math.pow(1 + taxaDesconto / 100, ano);
      
      cashFlow.push({
        ano,
        geracaoAnual,
        economiaEnergia,
        custosOM,
        fluxoLiquido,
        fluxoAcumulado,
        valorPresente
      });
    }

    return cashFlow;
  }

  private static calculateNPV(cashFlow: CashFlowDetails[], taxaDesconto: number): number {
    // VPL = -Investimento_Inicial + Σ(Fluxos_Futuros / (1+taxa)^ano)
    const vplFluxos = cashFlow.reduce((npv, year) => npv + year.valorPresente, 0);
    
    // O investimento inicial já deve estar incluído no primeiro cálculo
    // Se não estiver, seria necessário subtrair aqui
    return vplFluxos;
  }

  private static calculateIRR(cashFlow: CashFlowDetails[], investimentoInicial: number): number {
    // Método de Newton-Raphson para encontrar a TIR
    let taxa = 0.1; // Chute inicial de 10%
    const maxIteracoes = 100;
    const tolerancia = 0.0001;
    
    for (let i = 0; i < maxIteracoes; i++) {
      let f = -investimentoInicial; // NPV começando com investimento inicial negativo
      let df = 0; // Derivada do NPV
      
      cashFlow.forEach((year) => {
        const denominador = Math.pow(1 + taxa, year.ano);
        f += year.fluxoLiquido / denominador;
        df -= (year.ano * year.fluxoLiquido) / Math.pow(1 + taxa, year.ano + 1);
      });
      
      if (Math.abs(f) < tolerancia) {
        return taxa * 100;
      }
      
      if (df === 0) break; // Evitar divisão por zero
      
      taxa = taxa - f / df;
      
      // Evitar valores negativos ou muito altos
      if (taxa < -0.99) taxa = -0.99;
      if (taxa > 10) taxa = 10;
    }
    
    return taxa * 100;
  }

  private static calculateSimplePayback(cashFlow: CashFlowDetails[]): number {
    let acumulado = 0;
    
    for (let i = 0; i < cashFlow.length; i++) {
      acumulado += cashFlow[i].fluxoLiquido;
      if (acumulado >= 0) {
        // Interpolação para maior precisão
        const anoAnterior = i > 0 ? cashFlow[i - 1].fluxoAcumulado + cashFlow[0].fluxoLiquido : -Math.abs(cashFlow[0].fluxoLiquido);
        const proporcao = Math.abs(anoAnterior) / cashFlow[i].fluxoLiquido;
        return i + 1 - proporcao;
      }
    }
    
    return cashFlow.length; // Não paga no período analisado
  }

  private static calculateDiscountedPayback(cashFlow: CashFlowDetails[], taxaDesconto: number): number {
    let acumuladoVP = 0;
    
    for (let i = 0; i < cashFlow.length; i++) {
      acumuladoVP += cashFlow[i].valorPresente;
      if (acumuladoVP >= 0) {
        // Interpolação para maior precisão
        const vpAnterior = i > 0 ? 
          cashFlow.slice(0, i).reduce((sum, year) => sum + year.valorPresente, 0) : 0;
        const proporcao = Math.abs(vpAnterior) / cashFlow[i].valorPresente;
        return i + 1 - proporcao;
      }
    }
    
    return cashFlow.length; // Não paga no período analisado
  }

  private static calculateLCOE(
    investimentoInicial: number, 
    cashFlow: CashFlowDetails[], 
    taxaDesconto: number
  ): number {
    // LCOE = Custo Total Presente / Geração Total Presente
    const custoTotalVP = investimentoInicial + cashFlow.reduce((sum, year) => {
      return sum + (year.custosOM / Math.pow(1 + taxaDesconto / 100, year.ano));
    }, 0);
    
    const geracaoTotalVP = cashFlow.reduce((sum, year) => {
      return sum + (year.geracaoAnual / Math.pow(1 + taxaDesconto / 100, year.ano));
    }, 0);
    
    return custoTotalVP / geracaoTotalVP;
  }

  private static calculateSensitivityAnalysis(input: AdvancedFinancialInput) {
    // Calcular VPL base sem análise de sensibilidade para evitar loop infinito
    const baseVPL = this.calculateNPV(
      this.calculateDetailedCashFlow({
        investimentoInicial: input.investimentoInicial,
        geracaoMensal: input.geracaoMensal,
        consumoMensal: input.consumoMensal,
        tarifaEnergia: input.tarifaEnergia,
        custoFioB: input.custoFioB,
        vidaUtil: input.vidaUtil,
        inflacaoEnergia: input.inflacaoEnergia,
        degradacaoModulos: input.degradacaoModulos || 0.5,
        custoOM: input.custoOM || 0,
        inflacaoOM: input.inflacaoOM || 0,
        taxaDesconto: input.taxaDesconto
      }),
      input.taxaDesconto
    );
    
    // Sensibilidade à variação da tarifa (-20% a +20%)
    const vplVariacaoTarifa = [];
    for (let variacao = -20; variacao <= 20; variacao += 5) {
      const novaInput = { ...input };
      novaInput.tarifaEnergia *= (1 + variacao / 100);
      const novoVPL = this.calculateNPV(
        this.calculateDetailedCashFlow({
          investimentoInicial: novaInput.investimentoInicial,
          geracaoMensal: novaInput.geracaoMensal,
          consumoMensal: novaInput.consumoMensal,
          tarifaEnergia: novaInput.tarifaEnergia,
          custoFioB: novaInput.custoFioB,
          vidaUtil: novaInput.vidaUtil,
          inflacaoEnergia: novaInput.inflacaoEnergia,
          degradacaoModulos: novaInput.degradacaoModulos || 0.5,
          custoOM: novaInput.custoOM || 0,
          inflacaoOM: novaInput.inflacaoOM || 0,
          taxaDesconto: novaInput.taxaDesconto
        }),
        novaInput.taxaDesconto
      );
      vplVariacaoTarifa.push({ tarifa: variacao, vpl: novoVPL });
    }
    
    // Sensibilidade à variação da inflação energética
    const vplVariacaoInflacao = [];
    for (let inflacao = 2; inflacao <= 8; inflacao += 0.5) {
      const novaInput = { ...input };
      novaInput.inflacaoEnergia = inflacao;
      const novoVPL = this.calculateNPV(
        this.calculateDetailedCashFlow({
          investimentoInicial: novaInput.investimentoInicial,
          geracaoMensal: novaInput.geracaoMensal,
          consumoMensal: novaInput.consumoMensal,
          tarifaEnergia: novaInput.tarifaEnergia,
          custoFioB: novaInput.custoFioB,
          vidaUtil: novaInput.vidaUtil,
          inflacaoEnergia: novaInput.inflacaoEnergia,
          degradacaoModulos: novaInput.degradacaoModulos || 0.5,
          custoOM: novaInput.custoOM || 0,
          inflacaoOM: novaInput.inflacaoOM || 0,
          taxaDesconto: novaInput.taxaDesconto
        }),
        novaInput.taxaDesconto
      );
      vplVariacaoInflacao.push({ inflacao, vpl: novoVPL });
    }
    
    // Sensibilidade à taxa de desconto
    const vplVariacaoDesconto = [];
    for (let desconto = 4; desconto <= 12; desconto += 0.5) {
      const novaInput = { ...input };
      novaInput.taxaDesconto = desconto;
      const novoVPL = this.calculateNPV(
        this.calculateDetailedCashFlow({
          investimentoInicial: novaInput.investimentoInicial,
          geracaoMensal: novaInput.geracaoMensal,
          consumoMensal: novaInput.consumoMensal,
          tarifaEnergia: novaInput.tarifaEnergia,
          custoFioB: novaInput.custoFioB,
          vidaUtil: novaInput.vidaUtil,
          inflacaoEnergia: novaInput.inflacaoEnergia,
          degradacaoModulos: novaInput.degradacaoModulos || 0.5,
          custoOM: novaInput.custoOM || 0,
          inflacaoOM: novaInput.inflacaoOM || 0,
          taxaDesconto: desconto
        }), 
        desconto
      );
      vplVariacaoDesconto.push({ desconto, vpl: novoVPL });
    }
    
    return {
      vplVariacaoTarifa,
      vplVariacaoInflacao,
      vplVariacaoDesconto
    };
  }

  // Método utilitário para análise de cenários
  static analyzeScenarios(baseInput: AdvancedFinancialInput) {
    const cenarios = {
      otimista: {
        ...baseInput,
        tarifaEnergia: baseInput.tarifaEnergia * 1.1,
        inflacaoEnergia: baseInput.inflacaoEnergia + 1,
        custoOM: baseInput.custoOM ? baseInput.custoOM * 0.9 : 0
      },
      conservador: {
        ...baseInput,
        tarifaEnergia: baseInput.tarifaEnergia * 0.95,
        inflacaoEnergia: baseInput.inflacaoEnergia - 0.5,
        custoOM: baseInput.custoOM ? baseInput.custoOM * 1.1 : 0,
        degradacaoModulos: 0.7
      },
      pessimista: {
        ...baseInput,
        tarifaEnergia: baseInput.tarifaEnergia * 0.9,
        inflacaoEnergia: Math.max(2, baseInput.inflacaoEnergia - 1),
        custoOM: baseInput.custoOM ? baseInput.custoOM * 1.2 : baseInput.investimentoInicial * 0.01,
        degradacaoModulos: 0.8
      }
    };

    return {
      base: this.calculateAdvancedFinancials(baseInput),
      otimista: this.calculateAdvancedFinancials(cenarios.otimista),
      conservador: this.calculateAdvancedFinancials(cenarios.conservador),
      pessimista: this.calculateAdvancedFinancials(cenarios.pessimista)
    };
  }
}