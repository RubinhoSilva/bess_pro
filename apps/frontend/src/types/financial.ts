// Interfaces TypeScript para análise financeira
// Todas as implementações de cálculo foram movidas para a API Python (pvlib-service)

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