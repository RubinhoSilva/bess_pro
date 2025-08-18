// Cálculos Financeiros Avançados para Sistemas Fotovoltaicos
// Baseado na NBR 14300 e regulamentações ANEEL

// Percentuais da Taxa Fio B por ano (NBR 14300)
const FIO_B_PERCENTAGES: { [key: number]: number } = {
  2023: 0.15,
  2024: 0.30,
  2025: 0.45,
  2026: 0.60,
  2027: 0.75,
  2028: 0.90,
  2029: 1.00, // 100% a partir de 2029 conforme ANEEL
};

const getFioBPercentage = (year: number): number => {
  if (year >= 2029) return 1.0;
  return FIO_B_PERCENTAGES[year] || 0;
};

export interface FinancialCalculationData {
  totalInvestment: number; // Investimento total inicial (R$)
  geracaoEstimadaMensal: number[]; // Geração mensal estimada (kWh) - 12 meses
  consumoMensal: number[]; // Consumo mensal (kWh) - 12 meses
  tarifaEnergiaB: number; // Tarifa completa de energia B (TE + TUSD) R$/kWh
  custoFioB?: number; // Custo específico do Fio B (TUSD) R$/kWh
  vidaUtil: number; // Vida útil do sistema (anos)
  inflacaoEnergia: number; // Inflação energética anual (%)
  taxaDesconto: number; // Taxa de desconto para VPL (%)
}

export interface FluxoCaixaItem {
  ano: number;
  fluxoLiquido: number;
  economia: number;
  custoSemFV: number;
  custoComFV: number;
  tarifaVigente: number;
  fioBPercentual: number;
}

export interface FinancialResults {
  economiaAnualEstimada: number; // Economia média anual (R$)
  economiaTotal25Anos: number; // Economia total em 25 anos (R$)
  vpl: number; // Valor Presente Líquido (R$)
  tir: number; // Taxa Interna de Retorno (%)
  payback: number; // Payback simples (anos)
  paybackDescontado: number; // Payback descontado (anos)
  fluxoCaixa: FluxoCaixaItem[]; // Fluxo de caixa detalhado
  roi: number; // Retorno sobre Investimento (%)
}

// Função para calcular TIR usando método Newton-Raphson
const calculateTIR = (fluxoCaixa: number[]): number => {
  let rate = 0.1; // Taxa inicial (10%)
  const tolerance = 1e-6;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let j = 0; j < fluxoCaixa.length; j++) {
      const power = Math.pow(1 + rate, j);
      npv += fluxoCaixa[j] / power;
      if (j > 0) {
        dnpv -= (j * fluxoCaixa[j]) / Math.pow(1 + rate, j + 1);
      }
    }
    
    if (Math.abs(npv) < tolerance) {
      return rate * 100;
    }
    
    if (Math.abs(dnpv) < tolerance) {
      break; // Evitar divisão por zero
    }
    
    rate = rate - npv / dnpv;
    
    // Limitar a taxa para valores razoáveis
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }
  
  return rate * 100;
};

export const calculateAdvancedFinancials = (data: FinancialCalculationData): FinancialResults => {
  const {
    totalInvestment,
    geracaoEstimadaMensal,
    consumoMensal,
    tarifaEnergiaB,
    custoFioB = tarifaEnergiaB * 0.3, // Se não informado, estima 30% da tarifa
    vidaUtil = 25,
    inflacaoEnergia = 4.5,
    taxaDesconto = 8.0,
  } = data;

  const startYear = new Date().getFullYear();
  const fluxoCaixa: FluxoCaixaItem[] = [];
  
  // Ano 0: Apenas o investimento inicial
  fluxoCaixa.push({
    ano: 0,
    fluxoLiquido: -totalInvestment,
    economia: 0,
    custoSemFV: 0,
    custoComFV: 0,
    tarifaVigente: tarifaEnergiaB,
    fioBPercentual: 0,
  });
  
  let economiaAnualTotalAcumulada = 0;
  
  // Cálculos anuais
  for (let i = 1; i <= vidaUtil; i++) {
    const anoAtual = startYear + i - 1;
    const fatorInflacao = Math.pow(1 + inflacaoEnergia / 100, i - 1);
    const tarifaAtual = tarifaEnergiaB * fatorInflacao;
    const custoFioBAtual = custoFioB * fatorInflacao;
    const fioBPercentual = getFioBPercentage(anoAtual);
    
    let custoAnualSemFV = 0;
    let custoAnualComFV = 0;
    
    // Cálculos mensais
    for (let mes = 0; mes < 12; mes++) {
      const consumoDoMes = consumoMensal[mes] || 0;
      const geracaoDoMes = geracaoEstimadaMensal[mes] || 0;
      
      // Custo sem sistema FV (cenário atual)
      custoAnualSemFV += consumoDoMes * tarifaAtual;
      
      // Cálculo com sistema FV
      const energiaInjetada = Math.max(0, geracaoDoMes - consumoDoMes);
      const energiaConsumidaDaRede = Math.max(0, consumoDoMes - geracaoDoMes);
      
      // Custo = Energia consumida da rede + Taxa Fio B sobre energia injetada
      const custoMesComFV = 
        (energiaConsumidaDaRede * tarifaAtual) + 
        (energiaInjetada * custoFioBAtual * fioBPercentual);
      
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
      tarifaVigente: tarifaAtual,
      fioBPercentual,
    });
  }
  
  const economiaAnualEstimada = economiaAnualTotalAcumulada / vidaUtil;
  const economiaTotal25Anos = economiaAnualTotalAcumulada;
  
  // Calcular VPL (Valor Presente Líquido)
  let vpl = 0;
  fluxoCaixa.forEach(item => {
    vpl += item.fluxoLiquido / Math.pow(1 + taxaDesconto / 100, item.ano);
  });
  
  // Calcular TIR (Taxa Interna de Retorno)
  const fluxoParaTIR = fluxoCaixa.map(f => f.fluxoLiquido);
  let tir = 0;
  if (totalInvestment > 0) {
    try {
      tir = calculateTIR(fluxoParaTIR);
    } catch (error) {
      console.warn('Erro ao calcular TIR:', error);
      tir = 0;
    }
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
    if (payback === 0) payback = vidaUtil + 1;
  } else {
    payback = vidaUtil + 1;
  }
  
  // Calcular Payback Descontado (com taxa de desconto)
  let paybackDescontado = 0;
  if (economiaAnualEstimada > 0) {
    let acumuladoDescontado = -totalInvestment;
    for (let i = 1; i <= vidaUtil; i++) {
      const fluxoDescontado = fluxoCaixa[i].fluxoLiquido / Math.pow(1 + taxaDesconto / 100, i);
      acumuladoDescontado += fluxoDescontado;
      if (acumuladoDescontado >= 0) {
        const valorFaltante = acumuladoDescontado - fluxoDescontado;
        paybackDescontado = (i - 1) + (Math.abs(valorFaltante) / fluxoDescontado);
        break;
      }
    }
    if (paybackDescontado === 0) paybackDescontado = vidaUtil + 1;
  } else {
    paybackDescontado = vidaUtil + 1;
  }
  
  // Calcular ROI (Retorno sobre Investimento)
  const roi = totalInvestment > 0 ? 
    ((economiaTotal25Anos - totalInvestment) / totalInvestment) * 100 : 0;
  
  return {
    economiaAnualEstimada,
    economiaTotal25Anos,
    vpl: Math.round(vpl * 100) / 100,
    tir: isFinite(tir) && tir > 0 ? Math.round(tir * 100) / 100 : 0,
    payback: payback > vidaUtil ? vidaUtil + 1 : Math.round(payback * 100) / 100,
    paybackDescontado: paybackDescontado > vidaUtil ? vidaUtil + 1 : Math.round(paybackDescontado * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    fluxoCaixa,
  };
};

// Função auxiliar para formatar valores monetários
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Função auxiliar para formatar percentuais
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Função auxiliar para formatar anos
export const formatYears = (value: number): string => {
  const years = Math.floor(value);
  const months = Math.round((value - years) * 12);
  
  if (months === 0) {
    return `${years} ano${years !== 1 ? 's' : ''}`;
  }
  
  return `${years} ano${years !== 1 ? 's' : ''} e ${months} ${months !== 1 ? 'meses' : 'mês'}`;
};