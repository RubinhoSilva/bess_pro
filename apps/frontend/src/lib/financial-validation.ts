/**
 * Validações específicas para dados do Grupo A antes de enviar ao backend
 */

/**
 * Valida estrutura completa de dados do Grupo A
 */
export function validateGrupoADataBeforeSend(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // CORREÇÃO: Validar estrutura de tarifas (aceitar camelCase e snake_case)
  const tarifasForaPonta = data.tarifas?.fora_ponta || data.tarifas?.foraPonta;
  const tarifasPonta = data.tarifas?.ponta;
  const consumoLocalForaPonta = data.consumo_local?.fora_ponta || data.consumo_local?.foraPonta || data.consumoLocal?.foraPonta || data.consumoLocal?.fora_ponta;
  const consumoLocalPonta = data.consumo_local?.ponta || data.consumoLocal?.ponta;
  const teForaPonta = data.te?.fora_ponta || data.te?.foraPonta;
  const tePonta = data.te?.ponta;
  
  if (!tarifasForaPonta?.te || !tarifasForaPonta?.tusd) {
    errors.push('Tarifas fora ponta devem conter TE e TUSD');
  }
  
  if (!tarifasPonta?.te || !tarifasPonta?.tusd) {
    errors.push('Tarifas ponta devem conter TE e TUSD');
  }
  
  // Validar fator de simultaneidade
  const fatorSimultaneidade = data.fator_simultaneidade_local || data.fatorSimultaneidadeLocal;
  if (fatorSimultaneidade && (fatorSimultaneidade < 0 || fatorSimultaneidade > 1)) {
    errors.push('Fator de simultaneidade deve estar entre 0 e 1');
  }
  
  // Validar consumo local
  if (!consumoLocalForaPonta || !consumoLocalPonta) {
    errors.push('Consumo local deve conter dados fora ponta e ponta');
  }
  
  // Validar estrutura TE
  if (!teForaPonta || !tePonta) {
    errors.push('TE deve conter valores fora ponta e ponta');
  }
  
  // Validar dados financeiros
  if (!data.financeiros?.capex || data.financeiros.capex <= 0) {
    errors.push('CAPEX deve ser maior que zero');
  }
  
  if (!data.financeiros?.anos || data.financeiros.anos <= 0) {
    errors.push('Vida útil deve ser maior que zero');
  }
  
  // Validar geração mensal (aceitar chaves com maiúscula e minúscula)
  if (!data.geracao || typeof data.geracao !== 'object') {
    errors.push('Dados de geração mensal são obrigatórios');
  } else {
    const mesesLower = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const mesesCapital = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 0; i < mesesLower.length; i++) {
      const mesLower = mesesLower[i];
      const mesCapital = mesesCapital[i];
      const valor = data.geracao[mesLower] ?? data.geracao[mesCapital];

      if (valor === undefined || valor < 0) {
        errors.push(`Geração mensal de ${mesLower} deve ser maior ou igual a zero`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida dados de unidades remotas
 */
export function validateRemoteUnits(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validar Grupo B
  if (data.remoto_b?.enabled) {
    if (!data.remoto_b?.data || typeof data.remoto_b.data !== 'object') {
      errors.push('Unidade remota B habilitada mas sem dados de consumo');
    }
    if (!data.remoto_b?.tarifa_total || data.remoto_b.tarifa_total <= 0) {
      errors.push('Unidade remota B deve ter tarifa total maior que zero');
    }
  }
  
  // Validar Grupo A Verde
  if (data.remoto_a_verde?.enabled) {
    if (!data.remoto_a_verde?.data_off_peak || !data.remoto_a_verde?.data_peak) {
      errors.push('Unidade remota A Verde habilitada mas sem dados de consumo');
    }
    if (!data.remoto_a_verde?.tarifas?.off_peak || !data.remoto_a_verde?.tarifas?.peak) {
      errors.push('Unidade remota A Verde deve ter tarifas completas');
    }
  }
  
  // Validar Grupo A Azul
  if (data.remoto_a_azul?.enabled) {
    if (!data.remoto_a_azul?.data_off_peak || !data.remoto_a_azul?.data_peak) {
      errors.push('Unidade remota A Azul habilitada mas sem dados de consumo');
    }
    if (!data.remoto_a_azul?.tarifas?.off_peak || !data.remoto_a_azul?.tarifas?.peak) {
      errors.push('Unidade remota A Azul deve ter tarifas completas');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida percentuais de distribuição de créditos
 */
export function validateCreditDistribution(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  let totalPercentage = 0;
  
  if (data.remoto_b?.enabled) {
    totalPercentage += data.remoto_b.percentage || 0;
  }
  
  if (data.remoto_a_verde?.enabled) {
    totalPercentage += data.remoto_a_verde.percentage || 0;
  }
  
  if (data.remoto_a_azul?.enabled) {
    totalPercentage += data.remoto_a_azul.percentage || 0;
  }
  
  if (totalPercentage > 100) {
    errors.push(`Percentual total de créditos (${totalPercentage}%) não pode ultrapassar 100%`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}