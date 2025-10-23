/**
 * Adapter para conversão entre dados do formulário (any) e tipos tipados
 * Mantém compatibilidade com código existente enquanto adiciona type safety
 */

import { 
  GrupoBConfig, 
  GrupoAConfig, 
  GrupoConfig,
  CommonTypes,
  validateGrupoBConfig,
  validateGrupoAConfig
} from '@bess-pro/shared';

export class GrupoConfigAdapter {
  
  /**
   * Converte dados do formulário para GrupoBConfig
   */
  static toGrupoBConfig(formData: any): GrupoBConfig {
    // Converter arrays de 12 elementos para MonthlyData
    const geracao = Array.isArray(formData.geracaoMensal) 
      ? CommonTypes.arrayToMonthlyData(formData.geracaoMensal)
      : formData.geracao || { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 };

    const consumoLocal = Array.isArray(formData.consumoMensal)
      ? CommonTypes.arrayToMonthlyData(formData.consumoMensal)
      : formData.consumoLocal || { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 };

    const config: GrupoBConfig = {
      financeiros: {
        capex: formData.investimentoInicial || formData.custoEquipamento || 0,
        anos: formData.vidaUtil || 25,
        taxaDesconto: formData.taxaDesconto || 0.08,
        inflacaoEnergia: formData.inflacaoEnergia || 0.045,
        degradacao: formData.degradacaoModulos || 0.005,
        salvagePct: 0.10,
        omaFirstPct: formData.custoOm ? (formData.custoOm / formData.investimentoInicial) : 0.015,
        omaInflacao: formData.inflacaoOm || 0.04
      },
      geracao,
      consumoLocal,
      tarifaBase: formData.tarifaEnergia || 0.85,
      fioBBase: formData.fioBBase || 0.25,
      tipoConexao: formData.tipoRede || formData.tipoConexao || 'monofasico',
      fatorSimultaneidade: (formData.fatorSimultaneidade || 100) / 100,
      fioB: {
        schedule: formData.fioBSchedule || { 2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90, 2029: 0.90 },
        baseYear: formData.baseYear || 2025
      },
      remotoB: {
        enabled: formData.autoconsumoRemotoB || false,
        percentage: formData.percCreditosB || 0.40,
        data: Array.isArray(formData.consumoMensalRemotoB) 
          ? CommonTypes.arrayToMonthlyData(formData.consumoMensalRemotoB)
          : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
        tarifaTotal: formData.tarifaRemotoB || 0.90,
        fioBValue: formData.fioBRemotoB || 0.30
      },
      remotoAVerde: {
        enabled: formData.autoconsumoRemotoAVerde || false,
        percentage: formData.percCreditosAVerde || 0.30,
        dataOffPeak: Array.isArray(formData.consumoMensalRemotoAVerdeFp)
          ? CommonTypes.arrayToMonthlyData(formData.consumoMensalRemotoAVerdeFp)
          : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
        dataPeak: Array.isArray(formData.consumoMensalRemotoAVerdeP)
          ? CommonTypes.arrayToMonthlyData(formData.consumoMensalRemotoAVerdeP)
          : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
        tarifas: {
          offPeak: formData.tarifaRemotoAVerdeFp || 0,
          peak: formData.tarifaRemotoAVerdeP || 0
        },
        tusd: {
          offPeak: formData.tusdRemotoAVerdeFp || 0,
          peak: formData.tusdRemotoAVerdeP || 0
        },
        te: {
          offPeak: formData.teForaPontaAVerde || 0,
          peak: formData.tePontaAVerde || 0
        }
      },
      remotoAAzul: {
        enabled: formData.autoconsumoRemotoAAzul || false,
        percentage: formData.percCreditosAAzul || 0.30,
        dataOffPeak: Array.isArray(formData.consumoMensalRemotoAAzulFp)
          ? CommonTypes.arrayToMonthlyData(formData.consumoMensalRemotoAAzulFp)
          : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
        dataPeak: Array.isArray(formData.consumoMensalRemotoAAzulP)
          ? CommonTypes.arrayToMonthlyData(formData.consumoMensalRemotoAAzulP)
          : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
        tarifas: {
          offPeak: formData.tarifaRemotoAAzulFp || 0,
          peak: formData.tarifaRemotoAAzulP || 0
        },
        tusd: {
          offPeak: formData.tusdRemotoAAzulFp || 0,
          peak: formData.tusdRemotoAAzulP || 0
        },
        te: {
          offPeak: formData.teForaPontaAAzul || 0,
          peak: formData.tePontaAAzul || 0
        }
      }
    };

    return config;
  }

  /**
   * Converte dados do formulário para GrupoAConfig
   */
  static toGrupoAConfig(formData: any): GrupoAConfig {
    const geracao = Array.isArray(formData.geracaoMensal) 
      ? CommonTypes.arrayToMonthlyData(formData.geracaoMensal)
      : formData.geracao || { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 };

    const consumoForaPonta = Array.isArray(formData.consumoMensalForaPonta)
      ? CommonTypes.arrayToMonthlyData(formData.consumoMensalForaPonta)
      : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 };

    const consumoPonta = Array.isArray(formData.consumoMensalPonta)
      ? CommonTypes.arrayToMonthlyData(formData.consumoMensalPonta)
      : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 };

    const config: GrupoAConfig = {
      financeiros: {
        capex: formData.investimentoInicial || formData.custoEquipamento || 0,
        anos: formData.vidaUtil || 25,
        taxaDesconto: formData.taxaDesconto || 0.08,
        inflacaoEnergia: formData.inflacaoEnergia || 0.045,
        degradacao: formData.degradacaoModulos || 0.005,
        salvagePct: 0.10,
        omaFirstPct: formData.custoOm ? (formData.custoOm / formData.investimentoInicial) : 0.015,
        omaInflacao: formData.inflacaoOm || 0.04
      },
      geracao,
      consumoLocal: {
        foraPonta: consumoForaPonta,
        ponta: consumoPonta,
        // demanda: formData.demanda || 0
      },
      tarifas: {
        foraPonta: formData.tarifaForaPonta || 0.65,
        ponta: formData.tarifaPonta || 0.95,
      },
      te: {
        foraPonta: formData.teForaPonta || 0.40,
        ponta: formData.tePonta || 0.60
      },
      fatorSimultaneidadeLocal: (formData.fatorSimultaneidadeLocal || 85) / 100,
      fioB: {
        schedule: formData.fioBSchedule || { 2025: 0.45, 2026: 0.60, 2027: 0.75, 2028: 0.90, 2029: 0.90 },
        baseYear: formData.baseYear || 2025
      },
      remotoB: {
        enabled: formData.autoconsumoRemotoB || false,
        percentage: formData.percCreditosB || 0.40,
        data: Array.isArray(formData.consumoMensalRemotoB) 
          ? CommonTypes.arrayToMonthlyData(formData.consumoMensalRemotoB)
          : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
        tarifaTotal: formData.tarifaRemotoB || 0.90,
        fioBValue: formData.fioBRemotoB || 0.30
      },
      remotoAVerde: {
        enabled: formData.autoconsumoRemotoAVerde || false,
        percentage: formData.percCreditosAVerde || 0.30,
        dataOffPeak: Array.isArray(formData.consumoMensalRemotoAVerdeFp)
          ? CommonTypes.arrayToMonthlyData(formData.consumoMensalRemotoAVerdeFp)
          : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
        dataPeak: Array.isArray(formData.consumoMensalRemotoAVerdeP)
          ? CommonTypes.arrayToMonthlyData(formData.consumoMensalRemotoAVerdeP)
          : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
        tarifas: {
          offPeak: formData.tarifaRemotoAVerdeFp || 0,
          peak: formData.tarifaRemotoAVerdeP || 0
        },
        tusd: {
          offPeak: formData.tusdRemotoAVerdeFp || 0,
          peak: formData.tusdRemotoAVerdeP || 0
        },
        te: {
          offPeak: formData.teForaPontaAVerde || 0,
          peak: formData.tePontaAVerde || 0
        }
      },
      remotoAAzul: {
        enabled: formData.autoconsumoRemotoAAzul || false,
        percentage: formData.percCreditosAAzul || 0.30,
        dataOffPeak: Array.isArray(formData.consumoMensalRemotoAAzulFp)
          ? CommonTypes.arrayToMonthlyData(formData.consumoMensalRemotoAAzulFp)
          : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
        dataPeak: Array.isArray(formData.consumoMensalRemotoAAzulP)
          ? CommonTypes.arrayToMonthlyData(formData.consumoMensalRemotoAAzulP)
          : { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 },
        tarifas: {
          offPeak: formData.tarifaRemotoAAzulFp || 0,
          peak: formData.tarifaRemotoAAzulP || 0
        },
        tusd: {
          offPeak: formData.tusdRemotoAAzulFp || 0,
          peak: formData.tusdRemotoAAzulP || 0
        },
        te: {
          offPeak: formData.teForaPontaAAzul || 0,
          peak: formData.tePontaAAzul || 0
        }
      }
    };

    return config;
  }

  /**
   * Converte GrupoBConfig para formato do formulário
   */
  static fromGrupoBConfig(config: GrupoBConfig): any {
    return {
      investimentoInicial: config.financeiros.capex,
      vidaUtil: config.financeiros.anos,
      taxaDesconto: config.financeiros.taxaDesconto,
      inflacaoEnergia: config.financeiros.inflacaoEnergia,
      degradacaoModulos: config.financeiros.degradacao,
      custoOm: config.financeiros.capex * config.financeiros.omaFirstPct,
      inflacaoOm: config.financeiros.omaInflacao,
      geracaoMensal: CommonTypes.monthlyDataToArray(config.geracao),
      consumoMensal: CommonTypes.monthlyDataToArray(config.consumoLocal),
      tarifaEnergia: config.tarifaBase,
      tipoConexao: config.tipoConexao,
      fatorSimultaneidade: config.fatorSimultaneidade,
      fioBSchedule: config.fioB.schedule,
      baseYear: config.fioB.baseYear,
      autoconsumoRemotoB: config.remotoB.enabled,
      consumoMensalRemotoB: CommonTypes.monthlyDataToArray(config.remotoB.data),
      tarifaRemotoB: config.remotoB.tarifaTotal,
      fioBRemotoB: config.remotoB.fioBValue,
      percCreditosB: config.remotoB.percentage,
      autoconsumoRemotoAVerde: config.remotoAVerde.enabled,
      consumoMensalRemotoAVerdeFp: CommonTypes.monthlyDataToArray(config.remotoAVerde.dataOffPeak),
      consumoMensalRemotoAVerdeP: CommonTypes.monthlyDataToArray(config.remotoAVerde.dataPeak),
      tarifaRemotoAVerdeFp: config.remotoAVerde.tarifas.offPeak,
      tarifaRemotoAVerdeP: config.remotoAVerde.tarifas.peak,
      tusdRemotoAVerdeFp: config.remotoAVerde.tusd.offPeak,
      tusdRemotoAVerdeP: config.remotoAVerde.tusd.peak,
      teForaPontaAVerde: config.remotoAVerde.te.offPeak,
      tePontaAVerde: config.remotoAVerde.te.peak,
      percCreditosAVerde: config.remotoAVerde.percentage,
      autoconsumoRemotoAAzul: config.remotoAAzul.enabled,
      consumoMensalRemotoAAzulFp: CommonTypes.monthlyDataToArray(config.remotoAAzul.dataOffPeak),
      consumoMensalRemotoAAzulP: CommonTypes.monthlyDataToArray(config.remotoAAzul.dataPeak),
      tarifaRemotoAAzulFp: config.remotoAAzul.tarifas.offPeak,
      tarifaRemotoAAzulP: config.remotoAAzul.tarifas.peak,
      tusdRemotoAAzulFp: config.remotoAAzul.tusd.offPeak,
      tusdRemotoAAzulP: config.remotoAAzul.tusd.peak,
      teForaPontaAAzul: config.remotoAAzul.te.offPeak,
      tePontaAAzul: config.remotoAAzul.te.peak,
      percCreditosAAzul: config.remotoAAzul.percentage
    };
  }

  /**
   * Converte GrupoAConfig para formato do formulário
   */
  static fromGrupoAConfig(config: GrupoAConfig): any {
    return {
      investimentoInicial: config.financeiros.capex,
      vidaUtil: config.financeiros.anos,
      taxaDesconto: config.financeiros.taxaDesconto,
      inflacaoEnergia: config.financeiros.inflacaoEnergia,
      degradacaoModulos: config.financeiros.degradacao,
      custoOm: config.financeiros.capex * config.financeiros.omaFirstPct,
      inflacaoOm: config.financeiros.omaInflacao,
      geracaoMensal: CommonTypes.monthlyDataToArray(config.geracao),
      consumoMensalForaPonta: CommonTypes.monthlyDataToArray(config.consumoLocal.foraPonta),
      consumoMensalPonta: CommonTypes.monthlyDataToArray(config.consumoLocal.ponta),
      tarifaForaPonta: config.tarifas.foraPonta,
      tarifaPonta: config.tarifas.ponta,
      teForaPonta: config.te.foraPonta,
      tePonta: config.te.ponta,
      fatorSimultaneidadeLocal: config.fatorSimultaneidadeLocal,
      fioBSchedule: config.fioB.schedule,
      baseYear: config.fioB.baseYear,
      autoconsumoRemotoB: config.remotoB.enabled,
      consumoMensalRemotoB: CommonTypes.monthlyDataToArray(config.remotoB.data),
      tarifaRemotoB: config.remotoB.tarifaTotal,
      fioBRemotoB: config.remotoB.fioBValue,
      percCreditosB: config.remotoB.percentage,
      autoconsumoRemotoAVerde: config.remotoAVerde.enabled,
      consumoMensalRemotoAVerdeFp: CommonTypes.monthlyDataToArray(config.remotoAVerde.dataOffPeak),
      consumoMensalRemotoAVerdeP: CommonTypes.monthlyDataToArray(config.remotoAVerde.dataPeak),
      tarifaRemotoAVerdeFp: config.remotoAVerde.tarifas.offPeak,
      tarifaRemotoAVerdeP: config.remotoAVerde.tarifas.peak,
      tusdRemotoAVerdeFp: config.remotoAVerde.tusd.offPeak,
      tusdRemotoAVerdeP: config.remotoAVerde.tusd.peak,
      teForaPontaAVerde: config.remotoAVerde.te.offPeak,
      tePontaAVerde: config.remotoAVerde.te.peak,
      percCreditosAVerde: config.remotoAVerde.percentage,
      autoconsumoRemotoAAzul: config.remotoAAzul.enabled,
      consumoMensalRemotoAAzulFp: CommonTypes.monthlyDataToArray(config.remotoAAzul.dataOffPeak),
      consumoMensalRemotoAAzulP: CommonTypes.monthlyDataToArray(config.remotoAAzul.dataPeak),
      tarifaRemotoAAzulFp: config.remotoAAzul.tarifas.offPeak,
      tarifaRemotoAAzulP: config.remotoAAzul.tarifas.peak,
      tusdRemotoAAzulFp: config.remotoAAzul.tusd.offPeak,
      tusdRemotoAAzulP: config.remotoAAzul.tusd.peak,
      teForaPontaAAzul: config.remotoAAzul.te.offPeak,
      tePontaAAzul: config.remotoAAzul.te.peak,
      percCreditosAAzul: config.remotoAAzul.percentage
    };
  }

  /**
   * Valida e converte dados do formulário para GrupoConfig
   */
  static validateAndConvert(formData: any, grupo: 'GrupoB' | 'GrupoA'): { 
    success: boolean; 
    config?: GrupoConfig; 
    errors?: string[] 
  } {
    try {
      let config: GrupoConfig;
      let validation: { isValid: boolean; errors: string[] };

      if (grupo === 'GrupoB') {
        config = this.toGrupoBConfig(formData);
        validation = validateGrupoBConfig(config);
      } else {
        config = this.toGrupoAConfig(formData);
        validation = validateGrupoAConfig(config);
      }

      return {
        success: validation.isValid,
        config: validation.isValid ? config : undefined,
        errors: validation.isValid ? undefined : validation.errors
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido na conversão']
      };
    }
  }
}