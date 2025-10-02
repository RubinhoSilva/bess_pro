/**
 * Validador centralizado para dados financeiros
 * Baseado nos tipos compartilhados e configurações
 */

import { FinancialInput, FINANCIAL_VALIDATION_RULES, FINANCIAL_CONFIG } from '@bess-pro/shared';
import { ValidationError } from '@/domain/errors/ValidationError';

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

    // Aplicar regras de validação compartilhadas
    for (const rule of FINANCIAL_VALIDATION_RULES) {
      const value = input[rule.field];
      
      if (rule.required && (value === undefined || value === null)) {
        errors.push(rule.message);
        continue;
      }

      if (value !== undefined && value !== null) {
        // Validações específicas por tipo
        if (typeof value === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(`${rule.message}. Valor mínimo: ${rule.min}`);
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push(`${rule.message}. Valor máximo: ${rule.max}`);
          }
        }

        if (Array.isArray(value)) {
          if (rule.minLength !== undefined && value.length < rule.minLength) {
            errors.push(`${rule.message}. Mínimo de ${rule.minLength} valores`);
          }
          if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            errors.push(`${rule.message}. Máximo de ${rule.maxLength} valores`);
          }
        }
      }
    }

    // Validações de negócio específicas
    FinancialValidator.validateBusinessRules(input, errors, warnings);

    // Aplicar defaults para campos ausentes
    FinancialValidator.applyDefaults(input);

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Valida regras de negócio específicas
   */
  private static validateBusinessRules(
    input: Partial<FinancialInput>,
    errors: string[],
    warnings: string[]
  ): void {
    // Validar percentuais de autoconsumo remoto
    const hasAutoconsumoRemoto = 
      input.autoconsumo_remoto_b || 
      input.autoconsumo_remoto_a_verde || 
      input.autoconsumo_remoto_a_azul;

    if (hasAutoconsumoRemoto) {
      const percB = input.perc_creditos_b || 0;
      const percVerde = input.perc_creditos_a_verde || 0;
      const percAzul = input.perc_creditos_a_azul || 0;
      const total = percB + percVerde + percAzul;

      if (Math.abs(total - 1.0) > 0.01) {
        errors.push(
          `Soma dos percentuais de créditos deve ser 100%. ` +
          `Atual: B=${(percB * 100).toFixed(1)}%, ` +
          `Verde=${(percVerde * 100).toFixed(1)}%, ` +
          `Azul=${(percAzul * 100).toFixed(1)}% ` +
          `-> Total=${(total * 100).toFixed(1)}%`
        );
      }
    }

    // Validar arrays de 12 valores
    if (input.geracao_mensal && input.geracao_mensal.length !== 12) {
      errors.push('Geração mensal deve ter exatamente 12 valores');
    }

    if (input.consumo_mensal && input.consumo_mensal.length !== 12) {
      errors.push('Consumo mensal deve ter exatamente 12 valores');
    }

    // Validar arrays de consumo remoto
    if (input.autoconsumo_remoto_b && input.consumo_remoto_b_mensal) {
      if (input.consumo_remoto_b_mensal.length !== 12) {
        errors.push('Consumo remoto Grupo B deve ter exatamente 12 valores');
      }
    }

    if (input.autoconsumo_remoto_a_verde) {
      if (input.consumo_remoto_a_verde_fp_mensal && input.consumo_remoto_a_verde_fp_mensal.length !== 12) {
        errors.push('Consumo remoto A Verde fora ponta deve ter exatamente 12 valores');
      }
      if (input.consumo_remoto_a_verde_p_mensal && input.consumo_remoto_a_verde_p_mensal.length !== 12) {
        errors.push('Consumo remoto A Verde ponta deve ter exatamente 12 valores');
      }
    }

    if (input.autoconsumo_remoto_a_azul) {
      if (input.consumo_remoto_a_azul_fp_mensal && input.consumo_remoto_a_azul_fp_mensal.length !== 12) {
        errors.push('Consumo remoto A Azul fora ponta deve ter exatamente 12 valores');
      }
      if (input.consumo_remoto_a_azul_p_mensal && input.consumo_remoto_a_azul_p_mensal.length !== 12) {
        errors.push('Consumo remoto A Azul ponta deve ter exatamente 12 valores');
      }
    }

    // Validar valores positivos
    if (input.geracao_mensal && input.geracao_mensal.some(v => v < 0)) {
      errors.push('Valores de geração mensal não podem ser negativos');
    }

    if (input.consumo_mensal && input.consumo_mensal.some(v => v < 0)) {
      errors.push('Valores de consumo mensal não podem ser negativos');
    }

    // Warnings de configuração
    if (input.taxa_desconto && input.taxa_desconto < 6) {
      warnings.push('Taxa de desconto muito baixa (<6%) pode resultar em VPL inflado');
    }

    if (input.inflacao_energia && input.inflacao_energia > 8) {
      warnings.push('Inflação de energia muito alta (>8%) pode ser irrealista');
    }

    if (input.degradacao_modulos && input.degradacao_modulos > 1) {
      warnings.push('Degradação de módulos muito alta (>1%/ano) pode ser pessimista');
    }
  }

  /**
   * Aplica valores padrão para campos ausentes
   */
  private static applyDefaults(input: Partial<FinancialInput>): void {
    const defaults = FINANCIAL_CONFIG;

    // Aplicar defaults apenas se o campo não existir
    if (input.vida_util === undefined) {
      input.vida_util = defaults.vida_util_padrao;
    }

    if (input.taxa_desconto === undefined) {
      input.taxa_desconto = defaults.taxa_desconto_padrao;
    }

    if (input.inflacao_energia === undefined) {
      input.inflacao_energia = defaults.inflacao_energia_padrao;
    }

    if (input.degradacao_modulos === undefined) {
      input.degradacao_modulos = defaults.degradacao_modulos_padrao;
    }

    if (input.custo_om === undefined) {
      input.custo_om = defaults.custo_om_percentual_padrao * (input.investimento_inicial || 0);
    }

    if (input.inflacao_om === undefined) {
      input.inflacao_om = defaults.inflacao_om_padrao;
    }

    if (input.fator_simultaneidade === undefined) {
      input.fator_simultaneidade = defaults.fator_simultaneidade_padrao;
    }

    if (input.fio_b_schedule === undefined) {
      input.fio_b_schedule = defaults.fio_b_schedule;
    }

    if (input.base_year === undefined) {
      input.base_year = defaults.base_year;
    }

    // Defaults para autoconsumo remoto
    if (input.autoconsumo_remoto_b && input.perc_creditos_b === undefined) {
      input.perc_creditos_b = defaults.percentuais_creditos.grupo_b;
    }

    if (input.autoconsumo_remoto_a_verde && input.perc_creditos_a_verde === undefined) {
      input.perc_creditos_a_verde = defaults.percentuais_creditos.grupo_a_verde;
    }

    if (input.autoconsumo_remoto_a_azul && input.perc_creditos_a_azul === undefined) {
      input.perc_creditos_a_azul = defaults.percentuais_creditos.grupo_a_azul;
    }

    // Defaults para tarifas remotas
    if (input.autoconsumo_remoto_b) {
      if (input.tarifa_remoto_b === undefined) {
        input.tarifa_remoto_b = defaults.tarifas_grupo_b.tarifa_residencial;
      }
      if (input.fio_b_remoto_b === undefined) {
        input.fio_b_remoto_b = defaults.tarifas_grupo_b.fio_b_residencial;
      }
    }

    if (input.autoconsumo_remoto_a_verde) {
      const tarifasA = defaults.tarifas_grupo_a_verde;
      if (input.tarifa_remoto_a_verde_fp === undefined) {
        input.tarifa_remoto_a_verde_fp = tarifasA.tarifa_fora_ponta;
      }
      if (input.tarifa_remoto_a_verde_p === undefined) {
        input.tarifa_remoto_a_verde_p = tarifasA.tarifa_ponta;
      }
      if (input.tusd_remoto_a_verde_fp === undefined) {
        input.tusd_remoto_a_verde_fp = tarifasA.tusd_fora_ponta;
      }
      if (input.tusd_remoto_a_verde_p === undefined) {
        input.tusd_remoto_a_verde_p = tarifasA.tusd_ponta;
      }
      if (input.te_ponta_a_verde === undefined) {
        input.te_ponta_a_verde = tarifasA.te_ponta;
      }
      if (input.te_fora_ponta_a_verde === undefined) {
        input.te_fora_ponta_a_verde = tarifasA.te_fora_ponta;
      }
    }

    if (input.autoconsumo_remoto_a_azul) {
      const tarifasA = defaults.tarifas_grupo_a_azul;
      if (input.tarifa_remoto_a_azul_fp === undefined) {
        input.tarifa_remoto_a_azul_fp = tarifasA.tarifa_fora_ponta;
      }
      if (input.tarifa_remoto_a_azul_p === undefined) {
        input.tarifa_remoto_a_azul_p = tarifasA.tarifa_ponta;
      }
      if (input.tusd_remoto_a_azul_fp === undefined) {
        input.tusd_remoto_a_azul_fp = tarifasA.tusd_fora_ponta;
      }
      if (input.tusd_remoto_a_azul_p === undefined) {
        input.tusd_remoto_a_azul_p = tarifasA.tusd_ponta;
      }
      if (input.te_ponta_a_azul === undefined) {
        input.te_ponta_a_azul = tarifasA.te_ponta;
      }
      if (input.te_fora_ponta_a_azul === undefined) {
        input.te_fora_ponta_a_azul = tarifasA.te_fora_ponta;
      }
    }

    if (input.modalidade_tarifaria === undefined) {
      input.modalidade_tarifaria = 'convencional';
    }
  }

  /**
   * Valida e lança erro se inválido
   */
  static validateOrThrow(input: Partial<FinancialInput>): void {
    const result = FinancialValidator.validateFinancialInput(input);
    
    if (!result.isValid) {
      throw new ValidationError(
        `Dados financeiros inválidos: ${result.errors.join('; ')}`
      );
    }
  }

  /**
   * Valida limites específicos
   */
  static validateLimits(
    valor: number,
    tipo: keyof typeof FINANCIAL_CONFIG.limites
  ): boolean {
    const limites = FINANCIAL_CONFIG.limites;
    const config = limites[tipo] as { min: number; max: number };
    
    if (!config || typeof config !== 'object') return true;
    
    if ('min' in config && 'max' in config) {
      return valor >= config.min && valor <= config.max;
    }
    
    return true;
  }
}