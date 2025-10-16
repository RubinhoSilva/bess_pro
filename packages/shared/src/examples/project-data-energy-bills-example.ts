/**
 * @fileoverview Exemplo de uso dos novos tipos EnergyBill no ProjectData
 * @description Demonstra como migrar e usar os tipos especializados
 * @author BessPro Team
 * @version 1.0.0
 * @since 2025-10-15
 */

import { 
  EnergyBillB,
  EnergyBillA,
  createEnergyBillB,
  createEnergyBillA,
  ProjectDataEnergyBillManager,
  adaptProjectDataEnergyBills
} from '../adapters/energy-bill-adapter';

import { CommonTypes } from '../types/common-types';

// =================================================================================
// EXEMPLO 1: CRIAÇÃO DE CONTAS DO GRUPO B
// =================================================================================

/**
 * Exemplo de criação de contas para cliente residencial (Grupo B)
 */
export function criarContasGrupoB() {
  // Conta de energia residencial típica
  const contaResidencial: EnergyBillB = createEnergyBillB({
    id: 'residencial-001',
    name: 'Conta Residencial Jan/2025',
    consumo: [350, 370, 390, 410, 430, 450, 440, 420, 400, 380, 360, 340],
    tarifaMedia: 0.85,
    dataReferencia: '2025-01-15',
    fornecedor: 'Light S.A.',
    tipoConexao: 'Monofasico'
  });

  // Conta de pequeno comércio
  const contaComercialPequeno: EnergyBillB = createEnergyBillB({
    id: 'comercial-pequeno-001',
    name: 'Conta Comercial Pequeno Fev/2025',
    consumo: CommonTypes.arrayToMonthlyData([800, 850, 900, 950, 1000, 1100, 1050, 980, 920, 880, 820, 780]),
    tarifaMedia: 0.92,
    dataReferencia: '2025-02-15',
    fornecedor: 'Enel Distribuição',
    tipoConexao: 'Trifasico'
  });

  return [contaResidencial, contaComercialPequeno];
}

// =================================================================================
// EXEMPLO 2: CRIAÇÃO DE CONTAS DO GRUPO A
// =================================================================================

/**
 * Exemplo de criação de contas para cliente industrial (Grupo A)
 */
export function criarContasGrupoA() {
  // Conta de energia industrial típica
  const contaIndustrial: EnergyBillA = createEnergyBillA({
    id: 'industrial-001',
    name: 'Conta Industrial Jan/2025',
    consumoForaPonta: [3000, 3100, 3200, 3300, 3400, 3500, 3450, 3350, 3250, 3150, 3050, 2950],
    consumoPonta: [800, 850, 900, 950, 1000, 1100, 1050, 980, 920, 880, 820, 750],
    tarifaForaPonta: 0.65,
    tarifaPonta: 0.95,
    tarifaDemanda: 45.00,
    demandaContratada: 100,
    dataReferencia: '2025-01-15',
    fornecedor: 'CPFL Paulista',
    subgrupo: 'verde'
  });

  // Conta de grande comércio (Grupo A Azul)
  const contaComercialGrande: EnergyBillA = createEnergyBillA({
    id: 'comercial-grande-001',
    name: 'Conta Shopping Center Fev/2025',
    consumoForaPonta: [5000, 5200, 5400, 5600, 5800, 6000, 5900, 5700, 5500, 5300, 5100, 4900],
    consumoPonta: [1500, 1600, 1700, 1800, 1900, 2000, 1950, 1850, 1750, 1650, 1550, 1450],
    tarifaForaPonta: 0.62,
    tarifaPonta: 0.98,
    tarifaDemanda: 52.00,
    demandaContratada: 200,
    dataReferencia: '2025-02-15',
    fornecedor: 'AES Eletropaulo',
    subgrupo: 'azul'
  });

  return [contaIndustrial, contaComercialGrande];
}

// =================================================================================
// EXEMPLO 3: MIGRAÇÃO DE DADOS LEGADOS
// =================================================================================

/**
 * Exemplo de migração do formato antigo para o novo
 */
export function migrarDadosLegados() {
  // Dados no formato antigo (ProjectData atual)
  const dadosLegados = [
    {
      id: 'legado-001',
      name: 'Conta Antiga Jan/2025',
      consumoMensal: [350, 370, 390, 410, 430, 450, 440, 420, 400, 380, 360, 340]
    },
    {
      id: 'legado-002',
      name: 'Conta Antiga Fev/2025',
      consumoMensal: [800, 850, 900, 950, 1000, 1100, 1050, 980, 920, 880, 820, 780]
    }
  ];

  // Migrar para novo formato
  const resultadoMigracao = adaptProjectDataEnergyBills(dadosLegados, 'B');

  console.log('Migração:', resultadoMigracao);
  
  return resultadoMigracao.bills;
}

// =================================================================================
// EXEMPLO 4: GERENCIAMENTO COM PROJECTDATAENERGYBILLMANAGER
// =================================================================================

/**
 * Exemplo de uso do gerenciador para Grupo B
 */
export function gerenciarContasGrupoB() {
  const manager = new ProjectDataEnergyBillManager('B');

  // Carregar dados legados
  const dadosLegados = [
    {
      id: 'legado-001',
      name: 'Conta Antiga',
      consumoMensal: [350, 370, 390, 410, 430, 450, 440, 420, 400, 380, 360, 340]
    }
  ];

  const migracao = manager.loadFromProjectData(dadosLegados);
  console.log('Resultado migração:', migracao);

  // Adicionar nova conta
  const novaConta = createEnergyBillB({
    id: 'nova-001',
    name: 'Nova Conta Mar/2025',
    consumo: [400, 420, 440, 460, 480, 500, 490, 470, 450, 430, 410, 390],
    tarifaMedia: 0.87
  });

  manager.addBill(novaConta);

  // Validar todas as contas
  const validacao = manager.validate();
  console.log('Validação:', validacao);

  // Obter estatísticas
  const estatisticas = manager.getStatistics();
  console.log('Estatísticas:', estatisticas);

  // Preparar para salvar no ProjectData
  const dadosParaSalvar = manager.prepareForSave();
  console.log('Dados para salvar:', dadosParaSalvar);

  return {
    manager,
    validacao,
    estatisticas,
    dadosParaSalvar
  };
}

/**
 * Exemplo de uso do gerenciador para Grupo A
 */
export function gerenciarContasGrupoA() {
  const manager = new ProjectDataEnergyBillManager('A');

  // Adicionar contas do Grupo A
  const contasA = criarContasGrupoA();
  contasA.forEach(conta => manager.addBill(conta));

  // Atualizar uma conta
  manager.updateBill('industrial-001', {
    name: 'Conta Industrial Atualizada Jan/2025',
    dataReferencia: '2025-01-20'
  });

  // Remover uma conta
  manager.removeBill('comercial-grande-001');

  // Obter contas restantes
  const contasRestantes = manager.getBills();
  console.log('Contas restantes:', contasRestantes);

  return {
    manager,
    contasRestantes
  };
}

// =================================================================================
// EXEMPLO 5: INTEGRAÇÃO COM PROJECTDATA
// =================================================================================

/**
 * Exemplo de como o ProjectData ficaria com os novos tipos
 */
export interface ProjectDataAtualizado {
  // Dados do cliente (inalterados)
  customer?: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };

  // Localização (inalterada)
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    estado?: string;
    cidade?: string;
  };

  // NOVO: Energy Bills especializadas
  energyBills?: {
    grupoTarifario: 'A' | 'B';
    bills: Array<{
      id: string;
      name: string;
      // Para Grupo B
      consumo?: CommonTypes.MonthlyData;
      // Para Grupo A
      consumo?: {
        foraPonta: CommonTypes.MonthlyData;
        ponta: CommonTypes.MonthlyData;
      };
      // Metadados comuns
      dataReferencia?: string;
      fornecedor?: string;
      metadados?: Record<string, any>;
    }>;
  };

  // Campos legados mantidos para compatibilidade
  energyBillsLegacy?: Array<{
    id: string;
    name: string;
    consumoMensal: number[];
  }>;

  // Demais campos (inalterados)
  potenciaModulo?: number;
  numeroModulos?: number | null;
  eficienciaSistema?: number;
  selectedModuleId?: string;
  // ... outros campos
}

/**
 * Exemplo de ProjectData completo para Grupo B
 */
export function criarProjectDataGrupoB(): ProjectDataAtualizado {
  const contasB = criarContasGrupoB();

  return {
    customer: {
      name: 'João Silva',
      email: 'joao@exemplo.com',
      phone: '11999999999'
    },
    location: {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'Rua A, 123 - São Paulo/SP'
    },
    energyBills: {
      grupoTarifario: 'B',
      bills: contasB.map(conta => ({
        id: conta.id,
        name: conta.name,
        consumo: conta.consumo,
        dataReferencia: conta.dataReferencia,
        fornecedor: conta.fornecedor
      }))
    },
    potenciaModulo: 550,
    numeroModulos: 12,
    eficienciaSistema: 0.85
  };
}

/**
 * Exemplo de ProjectData completo para Grupo A
 */
export function criarProjectDataGrupoA(): ProjectDataAtualizado {
  const contasA = criarContasGrupoA();

  return {
    customer: {
      name: 'Indústria ABC Ltda',
      email: 'contato@industriaabc.com.br',
      phone: '11333333333',
      company: 'Indústria ABC Ltda'
    },
    location: {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'Av. Industrial, 1000 - São Paulo/SP'
    },
    energyBills: {
      grupoTarifario: 'A',
      bills: contasA.map(conta => ({
        id: conta.id,
        name: conta.name,
        consumo: {
          foraPonta: conta.consumo.foraPonta,
          ponta: conta.consumo.ponta
        },
        dataReferencia: conta.dataReferencia,
        fornecedor: conta.fornecedor
      }))
    },
    potenciaModulo: 550,
    numeroModulos: 120,
    eficienciaSistema: 0.85
  };
}

// =================================================================================
// EXEMPLO 6: FUNÇÕES DE UTILIDADE
// =================================================================================

/**
 * Converte ProjectData com energyBills legados para novo formato
 */
export function converterProjectDataLegado(projectDataLegado: any): ProjectDataAtualizado {
  const projectDataAtualizado: ProjectDataAtualizado = { ...projectDataLegado };

  // Se há energyBills legados, migrar
  if (projectDataLegado.energyBills && Array.isArray(projectDataLegado.energyBills)) {
    const migracao = adaptProjectDataEnergyBills(projectDataLegado.energyBills);
    
    if (migracao.success) {
      projectDataAtualizado.energyBills = {
        grupoTarifario: 'B', // Default, pode ser ajustado
        bills: migracao.bills.map(bill => ({
          id: bill.id,
          name: bill.name,
          consumo: 'consumo' in bill ? bill.consumo : undefined,
          dataReferencia: (bill as any).dataReferencia,
          fornecedor: (bill as any).fornecedor
        }))
      };
      
      // Manter legados para compatibilidade
      projectDataAtualizado.energyBillsLegacy = projectDataLegado.energyBills;
    }
  }

  return projectDataAtualizado;
}

/**
 * Valida ProjectData com energyBills
 */
export function validarProjectDataEnergyBills(projectData: ProjectDataAtualizado): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!projectData.energyBills) {
    warnings.push('Nenhuma conta de energia encontrada');
    return { isValid: true, errors, warnings };
  }

  const { grupoTarifario, bills } = projectData.energyBills;

  // Validar grupo tarifário
  if (!['A', 'B'].includes(grupoTarifario)) {
    errors.push('Grupo tarifário inválido');
  }

  // Validar contas
  if (!Array.isArray(bills) || bills.length === 0) {
    errors.push('Nenhuma conta de energia válida encontrada');
  } else {
    // Verificar duplicação de IDs
    const ids = bills.map(b => b.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      errors.push('IDs duplicados nas contas de energia');
    }

    // Validar estrutura conforme grupo
    bills.forEach((bill, index) => {
      if (grupoTarifario === 'B') {
        if (!bill.consumo || typeof bill.consumo !== 'object') {
          errors.push(`Conta ${index + 1}: consumo é obrigatório para Grupo B`);
        }
      } else if (grupoTarifario === 'A') {
        if (!bill.consumo || !bill.consumo.foraPonta || !bill.consumo.ponta) {
          errors.push(`Conta ${index + 1}: consumo.foraPonta e consumo.ponta são obrigatórios para Grupo A`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// =================================================================================
// EXPORTS PARA TESTES
// =================================================================================

export {
  criarContasGrupoB,
  criarContasGrupoA,
  migrarDadosLegados,
  gerenciarContasGrupoB,
  gerenciarContasGrupoA,
  criarProjectDataGrupoB,
  criarProjectDataGrupoA,
  converterProjectDataLegado,
  validarProjectDataEnergyBills
};