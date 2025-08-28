// Formatação de valores monetários
export const formatCurrency = (value: number, currency: string = 'BRL'): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Formatação de valores monetários simplificada (sem símbolo)
export const formatCurrencyValue = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Formatação para valores grandes (milhares, milhões)
export const formatCurrencyCompact = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0';
  }

  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }

  return formatCurrency(value);
};

// Formatação para números grandes (sem moeda)
export const formatNumber = (value: number, decimals: number = 0): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

// Formatação para percentuais
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0%';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

// Formatação para energia (kWh)
export const formatEnergy = (value: number, decimals: number = 0): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0 kWh';
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} GWh`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} MWh`;
  }

  return `${formatNumber(value, decimals)} kWh`;
};

// Formatação para potência (W, kW, MW)
export const formatPower = (value: number, unit: 'W' | 'kW' | 'MW' = 'kW', decimals: number = 1): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return `0 ${unit}`;
  }

  return `${formatNumber(value, decimals)} ${unit}`;
};

// Parse de valor monetário (remove formatação)
export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove símbolos de moeda, pontos e substitui vírgula por ponto
  const cleanValue = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(cleanValue) || 0;
};

// Validação de valor monetário
export const isValidCurrency = (value: string): boolean => {
  const cleanValue = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return !isNaN(parseFloat(cleanValue)) && parseFloat(cleanValue) >= 0;
};

// Formatação em tempo real durante digitação
export const formatCurrencyAsYouType = (value: string): string => {
  // Remove tudo exceto dígitos
  const numbers = value.replace(/\D/g, '');
  
  // Se vazio, retorna vazio
  if (!numbers) return '';
  
  // Converte para número tratando como reais, não centavos
  const reais = parseFloat(numbers);
  
  // Se for um número muito pequeno, evita problemas de precisão
  if (reais === 0) return 'R$ 0,00';
  
  // Formata usando Intl com configuração brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(reais);
};

// Parse de valor formatado em tempo real
export const parseCurrencyAsYouType = (value: string): number => {
  if (!value) return 0;
  
  // Remove símbolos de moeda, espaços e pontos (separadores de milhares)
  const cleanValue = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(cleanValue) || 0;
};