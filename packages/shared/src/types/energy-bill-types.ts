/**
 * @fileoverview Tipos específicos para EnergyBill por grupo tarifário
 * @description Define estruturas especializadas para contas de energia
 *              conforme o grupo tarifário (A ou B)
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-15
 * 
 * ESTE ARQUIVO CONTÉM:
 * - EnergyBillB: Estrutura para contas do Grupo B
 * - EnergyBillA: Estrutura para contas do Grupo A (com ponta/fora ponta)
 * - Type guards para identificação dos tipos
 * - Utilitários para validação e conversão
 */

import { CommonTypes } from './common-types';

// =================================================================================
// TIPO BASE COMPATÍVEL (MANTER EXISTENTE)
// =================================================================================

/**
 * Tipo EnergyBill original (compatibilidade)
 * @description Mantido para compatibilidade com código existente
 * @deprecated Usar EnergyBillB ou EnergyBillA para novos desenvolvimentos
 */
export interface EnergyBill {
  id: string;
  name: string;
  consumoMensal: number[];
}

// =================================================================================
// TIPOS ESPECIALIZADOS POR GRUPO TARIFÁRIO
// =================================================================================

/**
 * Estrutura para conta de energia do Grupo B
 * @description Conta de energia para clientes de baixa tensão (residencial, pequeno comercial)
 * @pattern Consumo único mensal (sem separação por posto)
 * @example
 * ```typescript
 * const billB: EnergyBillB = {
 *   id: 'bill-001',
 *   name: 'Conta Residencial Jan/2025',
 *   consumo: { Jan: 350, Fev: 370, ..., Dez: 320 },
 *   tarifaMedia: 0.85,
 *   valorTotal: 297.50,
 *   dataReferencia: '2025-01-15',
 *   fornecedor: 'Light S.A.'
 * };
 * ```
 */
export interface EnergyBillB {
  /** Identificador único da conta */
  id: string;
  
  /** Nome/descrição da conta */
  name: string;
  
  /** Consumo mensal em kWh (único valor por mês) */
  consumo: CommonTypes.MonthlyData;
  
  /** Tarifa média praticada (R$/kWh) */
  tarifaMedia?: number;
  
  /** Valor total da conta (R$) */
  valorTotal?: number;
  
  /** Data de referência da conta */
  dataReferencia?: string;
  
  /** Fornecedor de energia */
  fornecedor?: string;
  
  /** Tipo de conexão (Monofásico, Bifásico, Trifásico) */
  tipoConexao?: 'Monofasico' | 'Bifasico' | 'Trifasico';
  
  /** Metadados adicionais */
  metadados?: Record<string, any>;
}

/**
 * Estrutura para conta de energia do Grupo A
 * @description Conta de energia para clientes de média/alta tensão (comercial, industrial)
 * @pattern Consumo separado por posto tarifário (ponta e fora de ponta)
 * @example
 * ```typescript
 * const billA: EnergyBillA = {
 *   id: 'bill-002',
 *   name: 'Conta Comercial Jan/2025',
 *   consumo: {
 *     foraPonta: { Jan: 3000, Fev: 3100, ..., Dez: 2900 },
 *     ponta: { Jan: 800, Fev: 850, ..., Dez: 750 }
 *   },
 *   tarifas: {
 *     foraPonta: 0.65,
 *     ponta: 0.95,
 *     demanda: 45.00
 *   },
 *   demandaContratada: 100,
 *   dataReferencia: '2025-01-15',
 *   fornecedor: 'Enel Distribuição'
 * };
 * ```
 */
export interface EnergyBillA {
  /** Identificador único da conta */
  id: string;
  
  /** Nome/descrição da conta */
  name: string;
  
  /** Consumo mensal separado por posto tarifário */
  consumo: {
    /** Consumo fora de ponta em kWh */
    foraPonta: CommonTypes.MonthlyData;
    
    /** Consumo em ponta em kWh */
    ponta: CommonTypes.MonthlyData;
  };
  
  /** Tarifas praticadas por posto */
  tarifas: {
    /** Tarifa fora de ponta (R$/kWh) */
    foraPonta: number;
    
    /** Tarifa em ponta (R$/kWh) */
    ponta: number;
    
    /** Custo de demanda (R$/kW) */
    demanda: number;
  };
  
  /** Demanda contratada (kW) */
  demandaContratada?: number;
  
  /** Demanda medida no mês (kW) */
  demandaMedida?: CommonTypes.MonthlyData;
  
  /** Valor total da conta (R$) */
  valorTotal?: number;
  
  /** Data de referência da conta */
  dataReferencia?: string;
  
  /** Fornecedor de energia */
  fornecedor?: string;
  
  /** Subgrupo tarifário (Verde ou Azul) */
  subgrupo?: 'verde' | 'azul';
  
  /** Metadados adicionais */
  metadados?: Record<string, any>;
}

// =================================================================================
// TIPO UNIÃO E TYPE GUARDS
// =================================================================================

/**
 * Tipo união para EnergyBill de qualquer grupo
 * @description Aceita EnergyBillB ou EnergyBillA
 * @usage Para APIs e funções que aceitam ambos os formatos
 */
export type EnergyBillGrupo = EnergyBillB | EnergyBillA;

/**
 * Tipo união para todos os formatos de EnergyBill
 * @description Inclui tipo legado para compatibilidade
 */
export type EnergyBillAny = EnergyBill | EnergyBillGrupo;

/**
 * Type guard para verificar se EnergyBill é do Grupo B
 * @description Verifica se o objeto tem estrutura do Grupo B
 */
export function isEnergyBillB(bill: EnergyBillAny): bill is EnergyBillB {
  return 'consumo' in bill && 
         typeof bill.consumo === 'object' && 
         !('foraPonta' in bill.consumo) &&
         !('ponta' in bill.consumo);
}

/**
 * Type guard para verificar se EnergyBill é do Grupo A
 * @description Verifica se o objeto tem estrutura do Grupo A
 */
export function isEnergyBillA(bill: EnergyBillAny): bill is EnergyBillA {
  return 'consumo' in bill && 
         typeof bill.consumo === 'object' && 
         'foraPonta' in bill.consumo && 
         'ponta' in bill.consumo &&
         'tarifas' in bill &&
         'ponta' in bill.tarifas;
}

/**
 * Type guard para verificar se EnergyBill é tipo legado
 * @description Verifica se o objeto tem estrutura antiga
 */
export function isEnergyBillLegacy(bill: EnergyBillAny): bill is EnergyBill {
  return 'consumoMensal' in bill && Array.isArray(bill.consumoMensal);
}

// =================================================================================
// UTILITÁRIOS E CONVERSÕES
// =================================================================================

/**
 * Obtém o tipo do grupo tarifário da conta
 * @description Retorna string identificadora do tipo de conta
 */
export function getEnergyBillTipo(bill: EnergyBillAny): 'GrupoB' | 'GrupoA' | 'Legado' | 'Desconhecido' {
  if (isEnergyBillB(bill)) return 'GrupoB';
  if (isEnergyBillA(bill)) return 'GrupoA';
  if (isEnergyBillLegacy(bill)) return 'Legado';
  return 'Desconhecido';
}

/**
 * Converte EnergyBill legado para EnergyBillB
 * @description Migração do formato antigo para o novo padrão
 */
export function convertLegacyToEnergyBillB(legacy: EnergyBill): EnergyBillB {
  return {
    id: legacy.id,
    name: legacy.name,
    consumo: CommonTypes.arrayToMonthlyData(legacy.consumoMensal),
    metadados: {
      convertedFrom: 'legacy',
      originalData: legacy
    }
  };
}

/**
 * Converte EnergyBillB para formato legado
 * @description Para compatibilidade com código existente
 */
export function convertEnergyBillBToLegacy(bill: EnergyBillB): EnergyBill {
  return {
    id: bill.id,
    name: bill.name,
    consumoMensal: CommonTypes.monthlyDataToArray(bill.consumo)
  };
}

/**
 * Calcula consumo total mensal para EnergyBillA
 * @description Soma consumo fora de ponta + ponta
 */
export function calculateConsumoTotalMensal(bill: EnergyBillA): CommonTypes.MonthlyData {
  const consumoTotal: CommonTypes.MonthlyData = {} as CommonTypes.MonthlyData;
  
  const meses: (keyof CommonTypes.MonthlyData)[] = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  
  for (const mes of meses) {
    consumoTotal[mes] = (bill.consumo.foraPonta[mes] || 0) + (bill.consumo.ponta[mes] || 0);
  }
  
  return consumoTotal;
}

/**
 * Valida estrutura de EnergyBillB
 * @description Verifica se todos os campos obrigatórios estão presentes
 */
export function validateEnergyBillB(bill: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!bill.id || typeof bill.id !== 'string') {
    errors.push('id é obrigatório e deve ser string');
  }
  
  if (!bill.name || typeof bill.name !== 'string') {
    errors.push('name é obrigatório e deve ser string');
  }
  
  if (!CommonTypes.validateMonthlyData(bill.consumo)) {
    errors.push('consumo deve conter todos os meses com valores numéricos');
  }
  
  if (bill.tarifaMedia !== undefined && (typeof bill.tarifaMedia !== 'number' || bill.tarifaMedia < 0)) {
    errors.push('tarifaMedia deve ser número não negativo');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida estrutura de EnergyBillA
 * @description Verifica se todos os campos obrigatórios estão presentes
 */
export function validateEnergyBillA(bill: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!bill.id || typeof bill.id !== 'string') {
    errors.push('id é obrigatório e deve ser string');
  }
  
  if (!bill.name || typeof bill.name !== 'string') {
    errors.push('name é obrigatório e deve ser string');
  }
  
  // Validação do consumo
  if (!bill.consumo || typeof bill.consumo !== 'object') {
    errors.push('consumo é obrigatório');
  } else {
    if (!CommonTypes.validateMonthlyData(bill.consumo.foraPonta)) {
      errors.push('consumo.foraPonta deve conter todos os meses com valores numéricos');
    }
    if (!CommonTypes.validateMonthlyData(bill.consumo.ponta)) {
      errors.push('consumo.ponta deve conter todos os meses com valores numéricos');
    }
  }
  
  // Validação das tarifas
  if (!bill.tarifas || typeof bill.tarifas !== 'object') {
    errors.push('tarifas é obrigatório');
  } else {
    if (typeof bill.tarifas.foraPonta !== 'number' || bill.tarifas.foraPonta <= 0) {
      errors.push('tarifas.foraPonta deve ser número positivo');
    }
    if (typeof bill.tarifas.ponta !== 'number' || bill.tarifas.ponta <= 0) {
      errors.push('tarifas.ponta deve ser número positivo');
    }
    if (typeof bill.tarifas.demanda !== 'number' || bill.tarifas.demanda < 0) {
      errors.push('tarifas.demanda deve ser número não negativo');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cria EnergyBillB a partir de dados simples
 * @description Helper para criar instância com validação
 */
export function createEnergyBillB(data: {
  id: string;
  name: string;
  consumo: number[] | CommonTypes.MonthlyData;
  tarifaMedia?: number;
  dataReferencia?: string;
  fornecedor?: string;
  tipoConexao?: 'Monofasico' | 'Bifasico' | 'Trifasico';
}): EnergyBillB {
  const consumo = Array.isArray(data.consumo) 
    ? CommonTypes.arrayToMonthlyData(data.consumo)
    : data.consumo;
    
  const bill: EnergyBillB = {
    id: data.id,
    name: data.name,
    consumo,
    ...(data.tarifaMedia && { tarifaMedia: data.tarifaMedia }),
    ...(data.dataReferencia && { dataReferencia: data.dataReferencia }),
    ...(data.fornecedor && { fornecedor: data.fornecedor }),
    ...(data.tipoConexao && { tipoConexao: data.tipoConexao })
  };
  
  const validation = validateEnergyBillB(bill);
  if (!validation.isValid) {
    throw new Error(`EnergyBillB inválido: ${validation.errors.join(', ')}`);
  }
  
  return bill;
}

/**
 * Cria EnergyBillA a partir de dados simples
 * @description Helper para criar instância com validação
 */
export function createEnergyBillA(data: {
  id: string;
  name: string;
  consumoForaPonta: number[] | CommonTypes.MonthlyData;
  consumoPonta: number[] | CommonTypes.MonthlyData;
  tarifaForaPonta: number;
  tarifaPonta: number;
  tarifaDemanda: number;
  demandaContratada?: number;
  dataReferencia?: string;
  fornecedor?: string;
  subgrupo?: 'verde' | 'azul';
}): EnergyBillA {
  const consumoForaPonta = Array.isArray(data.consumoForaPonta) 
    ? CommonTypes.arrayToMonthlyData(data.consumoForaPonta)
    : data.consumoForaPonta;
    
  const consumoPonta = Array.isArray(data.consumoPonta) 
    ? CommonTypes.arrayToMonthlyData(data.consumoPonta)
    : data.consumoPonta;
    
  const bill: EnergyBillA = {
    id: data.id,
    name: data.name,
    consumo: {
      foraPonta: consumoForaPonta,
      ponta: consumoPonta
    },
    tarifas: {
      foraPonta: data.tarifaForaPonta,
      ponta: data.tarifaPonta,
      demanda: data.tarifaDemanda
    },
    ...(data.demandaContratada && { demandaContratada: data.demandaContratada }),
    ...(data.dataReferencia && { dataReferencia: data.dataReferencia }),
    ...(data.fornecedor && { fornecedor: data.fornecedor }),
    ...(data.subgrupo && { subgrupo: data.subgrupo })
  };
  
  const validation = validateEnergyBillA(bill);
  if (!validation.isValid) {
    throw new Error(`EnergyBillA inválido: ${validation.errors.join(', ')}`);
  }
  
  return bill;
}