/**
 * Validator para inputs de cálculos solares e financeiros
 */
export class CalculationInputValidator {
  /**
   * Valida entrada para cálculo solar standalone
   */
  static validateStandaloneSolarCalculation(input: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar systemParams
    if (!input.systemParams) {
      errors.push('systemParams é obrigatório');
    } else {
      const { systemParams } = input;
      
      if (typeof systemParams.potenciaNominal !== 'number' || systemParams.potenciaNominal <= 0) {
        errors.push('potenciaNominal deve ser um número maior que zero');
      }
      
      if (typeof systemParams.eficiencia !== 'number' || systemParams.eficiencia <= 0 || systemParams.eficiencia > 100) {
        errors.push('eficiencia deve ser um número entre 0 e 100');
      }
      
      if (typeof systemParams.perdas !== 'number' || systemParams.perdas < 0 || systemParams.perdas > 50) {
        errors.push('perdas deve ser um número entre 0 e 50');
      }
      
      if (typeof systemParams.inclinacao !== 'number' || systemParams.inclinacao < 0 || systemParams.inclinacao > 90) {
        errors.push('inclinacao deve ser um número entre 0 e 90 graus');
      }
      
      if (typeof systemParams.orientacao !== 'number' || systemParams.orientacao < 0 || systemParams.orientacao >= 360) {
        errors.push('orientacao deve ser um número entre 0 e 359 graus');
      }
      
      if (typeof systemParams.area !== 'number' || systemParams.area <= 0) {
        errors.push('area deve ser um número maior que zero');
      }
    }

    // Validar coordinates
    if (!input.coordinates) {
      errors.push('coordinates é obrigatório');
    } else {
      const { coordinates } = input;
      
      if (typeof coordinates.latitude !== 'number' || coordinates.latitude < -90 || coordinates.latitude > 90) {
        errors.push('latitude deve ser um número entre -90 e 90');
      }
      
      if (typeof coordinates.longitude !== 'number' || coordinates.longitude < -180 || coordinates.longitude > 180) {
        errors.push('longitude deve ser um número entre -180 e 180');
      }
    }

    // Validar irradiationData
    if (!input.irradiationData) {
      errors.push('irradiationData é obrigatório');
    } else {
      const { irradiationData } = input;
      
      if (!Array.isArray(irradiationData.monthly) || irradiationData.monthly.length !== 12) {
        errors.push('irradiationData.monthly deve ser um array com 12 valores');
      } else {
        irradiationData.monthly.forEach((value: number, index: number) => {
          if (typeof value !== 'number' || value < 0) {
            errors.push(`irradiationData.monthly[${index}] deve ser um número maior ou igual a zero`);
          }
        });
      }
      
      if (typeof irradiationData.annual !== 'number' || irradiationData.annual <= 0) {
        errors.push('irradiationData.annual deve ser um número maior que zero');
      }
    }

    // Validar financialParams (opcional)
    if (input.financialParams) {
      const { financialParams } = input;
      
      if (typeof financialParams.totalInvestment !== 'number' || financialParams.totalInvestment <= 0) {
        errors.push('financialParams.totalInvestment deve ser um número maior que zero');
      }
      
      if (financialParams.geracaoEstimadaMensal && (!Array.isArray(financialParams.geracaoEstimadaMensal) || financialParams.geracaoEstimadaMensal.length !== 12)) {
        errors.push('financialParams.geracaoEstimadaMensal deve ser um array com 12 valores');
      }
      
      if (financialParams.consumoMensal && (!Array.isArray(financialParams.consumoMensal) || financialParams.consumoMensal.length !== 12)) {
        errors.push('financialParams.consumoMensal deve ser um array com 12 valores');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }



  /**
   * Valida entrada para análise financeira
   */
  static validateFinancialAnalysis(input: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.financialParams) {
      errors.push('financialParams é obrigatório');
    } else {
      const { financialParams } = input;
      
      if (typeof financialParams.totalInvestment !== 'number' || financialParams.totalInvestment <= 0) {
        errors.push('totalInvestment deve ser um número maior que zero');
      }
    }

    if (!input.projectId || typeof input.projectId !== 'string') {
      errors.push('projectId é obrigatório e deve ser uma string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}