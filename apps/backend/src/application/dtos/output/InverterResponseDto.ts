export interface InverterResponseDto {
  id: string;
  fabricante: string;
  modelo: string;
  potenciaSaidaCA: number; // Potência nominal de saída CA (W)
  tipoRede: string; // ex: 'Monofásico 220V', 'Trifásico 380V'
  
  // Dados de entrada (CC/FV)
  potenciaFvMax?: number; // Máxima potência FV (W)
  tensaoCcMax?: number; // Máxima tensão CC (V)
  numeroMppt?: number; // Número de MPPTs
  stringsPorMppt?: number; // Strings por MPPT
  faixaMppt?: string; // ex: '60-550V'
  correnteEntradaMax?: number; // Corrente máxima de entrada por MPPT (A)
  
  // Dados de saída (CA)
  potenciaAparenteMax?: number; // Potência aparente máxima (VA)
  correnteSaidaMax?: number; // Corrente máxima de saída (A)
  tensaoSaidaNominal?: string; // ex: '220V', '380V'
  frequenciaNominal?: number; // ex: 60 (Hz)
  
  // Eficiência
  eficienciaMax?: number; // Eficiência máxima (%)
  eficienciaEuropeia?: number; // Eficiência europeia (%)
  eficienciaMppt?: number; // Eficiência MPPT (%)
  
  // Proteções e certificações
  protecoes?: string[];
  certificacoes?: string[];
  grauProtecao?: string;
  
  // Características físicas
  dimensoes?: {
    larguraMm: number;
    alturaMm: number;
    profundidadeMm: number;
  };
  pesoKg?: number;
  temperaturaOperacao?: string;
  
  // Dados comerciais
  garantiaAnos?: number;
  datasheetUrl?: string;
  precoReferencia?: number;
  
  // Campos calculados
  maxModulosSuportados?: number; // Baseado na potência FV máxima
  maxStringsTotal?: number; // Total de strings suportadas
  tipoFase?: 'monofásico' | 'bifásico' | 'trifásico' | 'unknown';
  
  createdAt: string;
  updatedAt: string;
}

export interface InverterListResponseDto {
  inverters: InverterResponseDto[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}