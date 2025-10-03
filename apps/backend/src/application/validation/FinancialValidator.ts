/**
 * Validador simplificado para dados financeiros
 * Versão temporária com validações básicas
 */

interface FinancialInput {
  investimento_inicial: number;
  geracao_mensal: number[];
  consumo_mensal: number[];
  tarifa_energia: number;
  custo_fio_b: number;
  vida_util: number;
  taxa_desconto: number;
  inflacao_energia: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export class FinancialValidator {
  /**
   * Valida dados de entrada para cálculo financeiro
   */
  static validateFinancialInput(input: Partial<FinancialInput>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações básicas
    if (input.investimento_inicial !== undefined) {
      if (input.investimento_inicial <= 0) {
        errors.push('Investimento inicial deve ser maior que zero');
      }
      if (input.investimento_inicial > 10000000) {
        errors.push('Investimento inicial parece muito alto (>R$ 10 milhões)');
      }
    }

    if (input.tarifa_energia !== undefined) {
      if (input.tarifa_energia <= 0) {
        errors.push('Tarifa de energia deve ser maior que zero');
      }
      if (input.tarifa_energia > 2.0) {
        errors.push('Tarifa de energia muito alta (>R$ 2/kWh)');
      }
    }

    if (input.custo_fio_b !== undefined) {
      if (input.custo_fio_b < 0) {
        errors.push('Custo do fio B não pode ser negativo');
      }
      if (input.custo_fio_b > 1.0) {
        errors.push('Custo do fio B muito alto (>R$ 1/kWh)');
      }
    }

    if (input.vida_util !== undefined) {
      if (input.vida_util < 5) {
        errors.push('Vida útil muito curta (<5 anos)');
      }
      if (input.vida_util > 40) {
        errors.push('Vida útil muito longa (>40 anos)');
      }
    }

    if (input.taxa_desconto !== undefined) {
      if (input.taxa_desconto < 0) {
        errors.push('Taxa de desconto não pode ser negativa');
      }
      if (input.taxa_desconto > 20) {
        errors.push('Taxa de desconto muito alta (>20%/ano)');
      }
    }

    if (input.inflacao_energia !== undefined) {
      if (input.inflacao_energia < 0) {
        errors.push('Inflação de energia não pode ser negativa');
      }
      if (input.inflacao_energia > 15) {
        errors.push('Inflação de energia muito alta (>15%/ano)');
      }
    }

    // Validações de arrays
    if (input.geracao_mensal && input.geracao_mensal.length !== 12) {
      errors.push('Dados de geração mensal devem ter exatamente 12 valores');
    }

    if (input.consumo_mensal && input.consumo_mensal.length !== 12) {
      errors.push('Dados de consumo mensal devem ter exatamente 12 valores');
    }

    // Validar valores positivos
    if (input.geracao_mensal && input.geracao_mensal.some((v: number) => v < 0)) {
      errors.push('Valores de geração mensal não podem ser negativos');
    }

    if (input.consumo_mensal && input.consumo_mensal.some((v: number) => v < 0)) {
      errors.push('Valores de consumo mensal não podem ser negativos');
    }

    // Warnings de configuração
    if (input.taxa_desconto && input.taxa_desconto < 6) {
      warnings.push('Taxa de desconto muito baixa (<6%) pode resultar em VPL inflado');
    }

    if (input.inflacao_energia && input.inflacao_energia > 8) {
      warnings.push('Inflação de energia muito alta (>8%) pode ser irrealista');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida resultado do cálculo financeiro
   */
  static validateFinancialResult(result: any): ValidationResult {
    const errors: string[] = [];

    if (!result) {
      errors.push('Resultado do cálculo é nulo');
      return { isValid: false, errors };
    }

    if (typeof result.vpl !== 'number' || isNaN(result.vpl)) {
      errors.push('VPL inválido');
    }

    if (typeof result.tir !== 'number' || isNaN(result.tir)) {
      errors.push('TIR inválida');
    }

    if (typeof result.payback_simples !== 'number' || isNaN(result.payback_simples)) {
      errors.push('Payback simples inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}