// Constantes para dimensionamento de cabos baseado na NBR 5410

export const installationMethods = [
  { value: 'A1', label: 'A1 - Cabos isolados em conduto em parede termicamente isolante' },
  { value: 'A2', label: 'A2 - Cabo multipolar em conduto em parede termicamente isolante' },
  { value: 'B1', label: 'B1 - Cabos isolados em conduto aparente sobre parede' },
  { value: 'B2', label: 'B2 - Cabo multipolar em conduto aparente sobre parede' },
  { value: 'C', label: 'C - Cabo unipolar ou multipolar sobre parede de madeira' },
  { value: 'D', label: 'D - Cabo multipolar em conduto enterrado' },
];

export const installationMethodsCapacities = {
  A1: {
    pvc: { 1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134 },
    epr: { 1.5: 20, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 85, 25: 112, 35: 138, 50: 168 }
  },
  A2: {
    pvc: { 1.5: 14, 2.5: 18.5, 4: 25, 6: 32, 10: 44, 16: 59, 25: 77, 35: 96, 50: 118 },
    epr: { 1.5: 18, 2.5: 24, 4: 32, 6: 41, 10: 56, 16: 75, 25: 98, 35: 121, 50: 148 }
  },
  B1: {
    pvc: { 1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 101, 35: 125, 50: 151 },
    epr: { 1.5: 23, 2.5: 31, 4: 42, 6: 54, 10: 75, 16: 100, 25: 133, 35: 164, 50: 198 }
  },
  B2: {
    pvc: { 1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134 },
    epr: { 1.5: 20, 2.5: 27, 4: 37, 6: 48, 10: 66, 16: 89, 25: 117, 35: 144, 50: 175 }
  },
  C: {
    pvc: { 1.5: 19.5, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 85, 25: 112, 35: 138, 50: 168 },
    epr: { 1.5: 26, 2.5: 36, 4: 49, 6: 63, 10: 86, 16: 115, 25: 149, 35: 183, 50: 221 }
  },
  D: {
    pvc: { 1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 101, 35: 125, 50: 151 },
    epr: { 1.5: 23, 2.5: 31, 4: 42, 6: 54, 10: 75, 16: 100, 25: 133, 35: 164, 50: 198 }
  }
};

// Fatores de correção para temperatura
const getFatorCorrecaoTemperatura = (tipoCabo: string, temperaturaAmbiente = 30): number => {
  // Para fins de simplificação, mantemos 1.0
  // Em implementação real, seria baseado na temperatura ambiente
  return tipoCabo === 'epr' ? 1.0 : 1.0;
};

// Fatores de correção para agrupamento
const getFatorCorrecaoAgrupamento = (numCircuitos: number): number => {
  if (numCircuitos <= 1) return 1.0;
  if (numCircuitos === 2) return 0.8;
  if (numCircuitos === 3) return 0.7;
  return 0.6;
};

export interface CableSizingParams {
  inverterPower: number; // kW
  tipoLigacao: 'monofasico' | 'bifasico' | 'trifasico';
  tensaoCA: number; // V
  tipoCabo: 'pvc' | 'epr';
  distanciaCircuito: number; // m
  metodoInstalacao: string;
}

export interface CableSizingResult {
  correnteProjeto: number;
  correnteCorrigida: number;
  secaoMinimaCalculada: number;
  quedaTensaoPercentual: number;
  isQuedaTensaoOk: boolean;
  error?: string;
}

export const calculateCableSizingForInverter = (params: CableSizingParams): CableSizingResult => {
  const {
    inverterPower,
    tipoLigacao,
    tensaoCA,
    tipoCabo,
    distanciaCircuito,
    metodoInstalacao,
  } = params;

  let correnteProjeto: number;
  let divisorTensao: number;

  // Cálculo da corrente de projeto baseado no tipo de ligação
  switch (tipoLigacao) {
    case 'monofasico':
      correnteProjeto = (inverterPower * 1000) / tensaoCA;
      divisorTensao = tensaoCA;
      break;
    case 'bifasico':
      correnteProjeto = (inverterPower * 1000) / tensaoCA;
      divisorTensao = tensaoCA;
      break;
    case 'trifasico':
    default:
      correnteProjeto = (inverterPower * 1000) / (tensaoCA * Math.sqrt(3));
      divisorTensao = tensaoCA * Math.sqrt(3);
      break;
  }

  // Aplicação dos fatores de correção
  const fct = getFatorCorrecaoTemperatura(tipoCabo);
  const fca = getFatorCorrecaoAgrupamento(1);
  const correnteCorrigida = correnteProjeto / (fct * fca);

  // Busca na tabela de capacidades de condução
  const tabelaCapacidade = (installationMethodsCapacities as any)[metodoInstalacao]?.[tipoCabo];
  if (!tabelaCapacidade) {
    return { 
      correnteProjeto: 0,
      correnteCorrigida: 0,
      secaoMinimaCalculada: 0,
      quedaTensaoPercentual: 0,
      isQuedaTensaoOk: false,
      error: 'Método de instalação ou tipo de cabo inválido.' 
    };
  }

  // Encontra a seção mínima pela capacidade de condução
  let secaoMinimaPorCapacidade: number | null = null;
  for (const secao in tabelaCapacidade) {
    if (tabelaCapacidade[secao] >= correnteCorrigida) {
      secaoMinimaPorCapacidade = parseFloat(secao);
      break;
    }
  }

  if (secaoMinimaPorCapacidade === null) {
    return { 
      correnteProjeto,
      correnteCorrigida,
      secaoMinimaCalculada: 0,
      quedaTensaoPercentual: 0,
      isQuedaTensaoOk: false,
      error: 'Nenhum cabo adequado encontrado para a corrente de projeto.' 
    };
  }

  // Cálculo da queda de tensão
  const resistividadeCobre = 0.0172; // ohm.mm²/m
  const quedaTensaoPercentual = ((2 * resistividadeCobre * distanciaCircuito * correnteProjeto) / 
    (secaoMinimaPorCapacidade * divisorTensao)) * 100;

  // Verificação se a queda de tensão está dentro do limite (2%)
  let secaoFinal = secaoMinimaPorCapacidade;
  if (quedaTensaoPercentual > 2) {
    // Recalcula seção baseado na queda de tensão
    secaoFinal = (2 * resistividadeCobre * distanciaCircuito * correnteProjeto) / 
      (0.02 * divisorTensao);
    
    // Normaliza para seção comercial disponível
    let secaoNormalizada: number | null = null;
    const secoesDisponiveis = Object.keys(tabelaCapacidade)
      .map(parseFloat)
      .sort((a, b) => a - b);
    
    for (const s of secoesDisponiveis) {
      if (s >= secaoFinal) {
        secaoNormalizada = s;
        break;
      }
    }
    secaoFinal = secaoNormalizada || secoesDisponiveis[secoesDisponiveis.length - 1];
  }

  // Recalcula queda de tensão com a seção final
  const quedaTensaoFinal = ((2 * resistividadeCobre * distanciaCircuito * correnteProjeto) / 
    (secaoFinal * divisorTensao)) * 100;

  return {
    correnteProjeto,
    correnteCorrigida,
    secaoMinimaCalculada: secaoFinal,
    quedaTensaoPercentual: quedaTensaoFinal,
    isQuedaTensaoOk: quedaTensaoFinal <= 2,
  };
};