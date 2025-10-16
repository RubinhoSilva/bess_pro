/**
 * @fileoverview Adaptador para EnergyBill especializados
 * @description Converte e adapta entre diferentes formatos de EnergyBill
 *              e integra com ProjectData existente
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-15
 */

import { 
  EnergyBill, 
  EnergyBillB, 
  EnergyBillA, 
  EnergyBillGrupo, 
  EnergyBillAny,
  isEnergyBillB,
  isEnergyBillA,
  isEnergyBillLegacy,
  convertLegacyToEnergyBillB,
  convertEnergyBillBToLegacy,
  getEnergyBillTipo
} from '../types/energy-bill-types';

import { CommonTypes } from '../types/common-types';

// =================================================================================
// TIPOS PARA INTEGRAÇÃO COM PROJECTDATA
// =================================================================================

/**
 * Estrutura para energyBills no ProjectData
 * @description Formato atualizado que aceita ambos os tipos
 */
export interface ProjectDataEnergyBills {
  bills: EnergyBillGrupo[];
  grupoTarifario: 'A' | 'B';
  metadados?: {
    ultimaAtualizacao: string;
    fonteDados: string;
    versaoFormato: string;
  };
}

/**
 * Resultado da conversão/migração
 */
export interface EnergyBillMigrationResult {
  success: boolean;
  bills: EnergyBillGrupo[];
  errors: string[];
  warnings: string[];
  migrated: number;
  total: number;
}

// =================================================================================
// ADAPTADORES E CONVERSÕES
// =================================================================================

/**
 * Converte energyBills do ProjectData para novo formato
 * @description Migração do formato legado para tipos especializados
 */
export function adaptProjectDataEnergyBills(
  energyBills: any[], 
  grupoTarifario?: 'A' | 'B'
): EnergyBillMigrationResult {
  const result: EnergyBillMigrationResult = {
    success: true,
    bills: [],
    errors: [],
    warnings: [],
    migrated: 0,
    total: energyBills.length
  };

  for (const bill of energyBills) {
    try {
      // Verificar se já é formato novo
      if (isEnergyBillB(bill) || isEnergyBillA(bill)) {
        result.bills.push(bill);
        continue;
      }

      // Converter formato legado
      if (isEnergyBillLegacy(bill)) {
        const convertedBill = convertLegacyToEnergyBillB(bill);
        result.bills.push(convertedBill);
        result.migrated++;
        result.warnings.push(`Conta "${bill.name}" migrada do formato legado`);
        continue;
      }

      // Tentar criar EnergyBillB a partir de dados genéricos
      if (bill.id && bill.name && bill.consumoMensal) {
        const newBill: EnergyBillB = {
          id: bill.id,
          name: bill.name,
          consumo: CommonTypes.arrayToMonthlyData(bill.consumoMensal),
          metadados: {
            convertedFrom: 'generic',
            originalData: bill
          }
        };
        result.bills.push(newBill);
        result.migrated++;
        continue;
      }

      result.errors.push(`Conta "${bill.name || 'desconhecida'}" não pôde ser convertida`);

    } catch (error) {
      result.errors.push(`Erro ao converter conta "${bill.name || 'desconhecida'}": ${error}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Adapta EnergyBill para o grupo tarifário especificado
 * @description Converte entre EnergyBillB e EnergyBillA conforme necessário
 */
export function adaptEnergyBillToGrupo(
  bill: EnergyBillAny, 
  targetGrupo: 'A' | 'B'
): EnergyBillGrupo {
  // Se já é do tipo correto, retornar como está
  if (targetGrupo === 'B' && isEnergyBillB(bill)) {
    return bill;
  }
  
  if (targetGrupo === 'A' && isEnergyBillA(bill)) {
    return bill;
  }

  // Converter de legado para B
  if (isEnergyBillLegacy(bill)) {
    return convertLegacyToEnergyBillB(bill);
  }

  // Se precisa converter B para A (requer dados adicionais)
  if (isEnergyBillB(bill) && targetGrupo === 'A') {
    throw new Error(`Conversão de Grupo B para A requer dados adicionais (consumo ponta/fora ponta, tarifas)`);
  }

  // Se precisa converter A para B
  if (isEnergyBillA(bill) && targetGrupo === 'B') {
    const consumoTotal = calculateConsumoTotalFromA(bill);
    return {
      id: bill.id,
      name: bill.name,
      consumo: consumoTotal,
      tarifaMedia: calculateTarifaMediaFromA(bill),
      dataReferencia: bill.dataReferencia,
      fornecedor: bill.fornecedor,
      metadados: {
        convertedFrom: 'GrupoA',
        originalData: bill
      }
    };
  }

  throw new Error(`Não foi possível adaptar conta para o grupo ${targetGrupo}`);
}

/**
 * Prepara energyBills para salvar no ProjectData
 * @description Converte para formato compatível com backend
 */
export function prepareEnergyBillsForProjectData(
  bills: EnergyBillGrupo[]
): Array<{ id: string; name: string; consumoMensal: number[] }> {
  return bills.map(bill => {
    if (isEnergyBillB(bill)) {
      return {
        id: bill.id,
        name: bill.name,
        consumoMensal: CommonTypes.monthlyDataToArray(bill.consumo)
      };
    } else if (isEnergyBillA(bill)) {
      const consumoTotal = calculateConsumoTotalFromA(bill);
      return {
        id: bill.id,
        name: bill.name,
        consumoMensal: CommonTypes.monthlyDataToArray(consumoTotal)
      };
    }
    
    // Fallback para formato legado
    return {
      id: bill.id,
      name: bill.name,
      consumoMensal: []
    };
  });
}

// =================================================================================
// UTILITÁRIOS DE CÁLCULO
// =================================================================================

/**
 * Calcula consumo total a partir de EnergyBillA
 */
function calculateConsumoTotalFromA(bill: EnergyBillA): CommonTypes.MonthlyData {
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
 * Calcula tarifa média a partir de EnergyBillA
 */
function calculateTarifaMediaFromA(bill: EnergyBillA): number {
  const consumoTotal = calculateConsumoTotalFromA(bill);
  const consumoAnual = CommonTypes.calculateAnnualTotal(consumoTotal);
  
  if (consumoAnual === 0) return 0;
  
  const consumoForaPontaAnual = CommonTypes.calculateAnnualTotal(bill.consumo.foraPonta);
  const consumoPontaAnual = CommonTypes.calculateAnnualTotal(bill.consumo.ponta);
  
  const custoForaPonta = consumoForaPontaAnual * bill.tarifas.foraPonta;
  const custoPonta = consumoPontaAnual * bill.tarifas.ponta;
  const custoDemanda = bill.demandaContratada ? bill.demandaContratada * bill.tarifas.demanda * 12 : 0;
  
  const custoTotal = custoForaPonta + custoPonta + custoDemanda;
  
  return custoTotal / consumoAnual;
}

/**
 * Valida conjunto de energyBills
 */
export function validateEnergyBills(bills: EnergyBillGrupo[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();

  for (const bill of bills) {
    // Verificar duplicação de IDs
    if (ids.has(bill.id)) {
      errors.push(`ID duplicado: ${bill.id}`);
    } else {
      ids.add(bill.id);
    }

    // Validar estrutura específica
    if (isEnergyBillB(bill)) {
      const validation = validateEnergyBillB(bill);
      if (!validation.isValid) {
        errors.push(`Conta "${bill.name}" (Grupo B): ${validation.errors.join(', ')}`);
      }
    } else if (isEnergyBillA(bill)) {
      const validation = validateEnergyBillA(bill);
      if (!validation.isValid) {
        errors.push(`Conta "${bill.name}" (Grupo A): ${validation.errors.join(', ')}`);
      }
    }
  }

  // Verificar consistência do grupo
  const grupos = bills.map(bill => getEnergyBillTipo(bill));
  const uniqueGrupos = [...new Set(grupos)];
  
  if (uniqueGrupos.length > 1) {
    warnings.push('Contas de grupos tarifários diferentes detectados');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Importa validadores (evitar dependência circular)
 */
function validateEnergyBillB(bill: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!bill.id || typeof bill.id !== 'string') {
    errors.push('id é obrigatório');
  }
  
  if (!bill.name || typeof bill.name !== 'string') {
    errors.push('name é obrigatório');
  }
  
  if (!CommonTypes.validateMonthlyData(bill.consumo)) {
    errors.push('consumo inválido');
  }
  
  return { isValid: errors.length === 0, errors };
}

function validateEnergyBillA(bill: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!bill.id || typeof bill.id !== 'string') {
    errors.push('id é obrigatório');
  }
  
  if (!bill.name || typeof bill.name !== 'string') {
    errors.push('name é obrigatório');
  }
  
  if (!bill.consumo || !bill.consumo.foraPonta || !bill.consumo.ponta) {
    errors.push('consumo.foraPonta e consumo.ponta são obrigatórios');
  }
  
  if (!bill.tarifas || !bill.tarifas.foraPonta || !bill.tarifas.ponta || !bill.tarifas.demanda) {
    errors.push('tarifas.foraPonta, tarifas.ponta e tarifas.demanda são obrigatórios');
  }
  
  return { isValid: errors.length === 0, errors };
}

// =================================================================================
// EXPORTS PARA USO NO FRONTEND/BACKEND
// =================================================================================

/**
 * Hook/utilitário para gerenciar energyBills no ProjectData
 */
export class ProjectDataEnergyBillManager {
  private bills: EnergyBillGrupo[] = [];
  private grupoTarifario: 'A' | 'B' = 'B';

  constructor(grupoTarifario: 'A' | 'B' = 'B') {
    this.grupoTarifario = grupoTarifario;
  }

  /**
   * Carrega bills do formato ProjectData
   */
  loadFromProjectData(energyBills: any[]): EnergyBillMigrationResult {
    const result = adaptProjectDataEnergyBills(energyBills, this.grupoTarifario);
    
    if (result.success) {
      this.bills = result.bills;
    }
    
    return result;
  }

  /**
   * Adiciona nova conta
   */
  addBill(bill: EnergyBillGrupo): void {
    // Adaptar para o grupo correto se necessário
    const adaptedBill = adaptEnergyBillToGrupo(bill, this.grupoTarifario);
    this.bills.push(adaptedBill);
  }

  /**
   * Remove conta por ID
   */
  removeBill(id: string): boolean {
    const index = this.bills.findIndex(bill => bill.id === id);
    if (index >= 0) {
      this.bills.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Atualiza conta existente
   */
  updateBill(id: string, updates: Partial<EnergyBillGrupo>): boolean {
    const index = this.bills.findIndex(bill => bill.id === id);
    if (index >= 0) {
      this.bills[index] = { ...this.bills[index], ...updates } as EnergyBillGrupo;
      return true;
    }
    return false;
  }

  /**
   * Obtém todas as contas
   */
  getBills(): EnergyBillGrupo[] {
    return [...this.bills];
  }

  /**
   * Obtém conta por ID
   */
  getBill(id: string): EnergyBillGrupo | undefined {
    return this.bills.find(bill => bill.id === id);
  }

  /**
   * Prepara para salvar no ProjectData
   */
  prepareForSave(): Array<{ id: string; name: string; consumoMensal: number[] }> {
    return prepareEnergyBillsForProjectData(this.bills);
  }

  /**
   * Valida todas as contas
   */
  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    return validateEnergyBills(this.bills);
  }

  /**
   * Obtém estatísticas
   */
  getStatistics(): {
    totalBills: number;
    grupoTarifario: string;
    consumoAnualTotal: number;
    consumoMedioMensal: number;
  } {
    const consumoAnualTotal = this.bills.reduce((total, bill) => {
      if (isEnergyBillB(bill)) {
        return total + CommonTypes.calculateAnnualTotal(bill.consumo);
      } else if (isEnergyBillA(bill)) {
        const consumoTotal = calculateConsumoTotalFromA(bill);
        return total + CommonTypes.calculateAnnualTotal(consumoTotal);
      }
      return total;
    }, 0);

    return {
      totalBills: this.bills.length,
      grupoTarifario: this.grupoTarifario,
      consumoAnualTotal,
      consumoMedioMensal: consumoAnualTotal / 12
    };
  }
}