import { ICustomerData, IEnergyData, ISystemData, IBudgetData, IResultsData } from '@/store/pv-dimensioning-store';
import { EnergyBillA, EnergyBillB } from '@/types/energy-bill-types';

/**
 * Interface para dados agregados do Grupo A
 */
export interface IGrupoAData {
  investimentoInicial: number;
  geracaoMensal: number[];
  consumoMensal: number[];
  // NOVO: Consumo separado por posto
  consumoForaPontaMensal?: number[];
  consumoPontaMensal?: number[];
  // Tarifas completas
  tarifaEnergiaPontaA: number;
  tarifaEnergiaForaPontaA: number;
  tePontaA: number;
  teForaPontaA: number;
  // NOVO: TUSD separado
  tusdPontaA?: number;
  tusdForaPontaA?: number;
  // Parâmetros financeiros
  vidaUtil: number;
  taxaDesconto: number;
  inflacaoEnergia: number;
  degradacaoAnual: number;
  custoOperacao: number;
  valorResidual: number;
  tipoRede?: string;
  fatorSimultaneidade?: number;
}

/**
 * Adapter para extrair e formatar dados do Grupo A da store
 */
export class GrupoAAdapter {
  /**
   * Extrai todos os dados necessários para o Grupo A da store
   */
  static extractGrupoAData(
    customerData: ICustomerData | null,
    energyData: IEnergyData | null,
    systemData: ISystemData,
    budgetData: IBudgetData | null,
    resultsData: IResultsData | null
  ): IGrupoAData {
    // NOVO: Extrair consumo separado por posto (usar EnergyBillA se disponível)
    let consumoForaPontaMensal: number[] = [];
    let consumoPontaMensal: number[] = [];
    let consumoMensal: number[] = [];
    
    // Verificar se há dados do Grupo A (com separação por posto)
    if (energyData?.energyBillsA && energyData.energyBillsA.length > 0) {
      const billA = energyData.energyBillsA[0];
      consumoForaPontaMensal = billA.consumoMensalForaPonta;
      consumoPontaMensal = billA.consumoMensalPonta;
      
      // Calcular consumo total para validação (soma ponta + fora ponta)
      consumoMensal = consumoForaPontaMensal.map((foraPonta, index) =>
        (foraPonta || 0) + (consumoPontaMensal[index] || 0)
      );
    } else {
      // Fallback: tentar extrair de energyBills (Grupo B) se não houver dados do Grupo A
      const fallbackConsumo = energyData?.energyBills?.[0]?.consumoMensal || Array(12).fill(0);
      consumoMensal = fallbackConsumo;
      consumoForaPontaMensal = consumoMensal.map(v => v * 0.8); // Padrão 80% fora ponta
      consumoPontaMensal = consumoMensal.map(v => v * 0.2); // Padrão 20% ponta
    }
    
    // Calcular investimento total se não existir nos resultados
    let investimentoInicial = resultsData?.calculationResults?.totalInvestment || 0;
    if (investimentoInicial === 0 && budgetData) {
      const subtotal = (budgetData.custoEquipamento || 0) +
                     (budgetData.custoMateriais || 0) +
                     (budgetData.custoMaoDeObra || 0);
      investimentoInicial = subtotal * (1 + (budgetData.bdi || 0) / 100);
    }
    
    // Extrair geração mensal dos resultados
    const geracaoMensal = resultsData?.calculationResults?.geracaoEstimadaMensal || Array(12).fill(0);
    
    
    // Valores padrão para parâmetros financeiros
    const defaultFinancialParams = {
      taxaDesconto: 0.08,      // 8% ao ano
      inflacaoEnergia: 0.045,  // 4.5% ao ano
      custoOperacao: 0.015,    // 1.5% do CAPEX
      valorResidual: 0.10      // 10% do CAPEX
    };
    
    return {
      investimentoInicial,
      geracaoMensal,
      consumoMensal,
      // NOVO: Consumo separado por posto
      consumoForaPontaMensal,
      consumoPontaMensal,
      // Tarifas de energia completas
      tarifaEnergiaPontaA: customerData?.tarifaEnergiaPontaA || 0.95,  // Default R$ 0,95/kWh
      tarifaEnergiaForaPontaA: customerData?.tarifaEnergiaForaPontaA || 0.65,  // Default R$ 0,65/kWh
      // TE separado
      tePontaA: customerData?.tePontaA || 0.60,  // Default R$ 0,60/kWh
      teForaPontaA: customerData?.teForaPontaA || 0.40,  // Default R$ 0,40/kWh
      // NOVO: TUSD separado
      tusdPontaA: customerData?.tusdPontaA || 0.35,  // Default R$ 0,35/kWh
      tusdForaPontaA: customerData?.tusdForaPontaA || 0.25,  // Default R$ 0,25/kWh
      // Parâmetros financeiros
      vidaUtil: systemData?.vidaUtil || 25,
      taxaDesconto: budgetData?.taxaDesconto || defaultFinancialParams.taxaDesconto,
      inflacaoEnergia: budgetData?.inflacaoEnergia || defaultFinancialParams.inflacaoEnergia,
      degradacaoAnual: (systemData?.degradacaoAnual || 0.5) / 100, // Converter % para decimal
      custoOperacao: budgetData?.custoOperacao || defaultFinancialParams.custoOperacao,
      valorResidual: budgetData?.valorResidual || defaultFinancialParams.valorResidual,
      tipoRede: customerData?.tipoRede,
      fatorSimultaneidade: customerData?.fatorSimultaneidade
    };
  }
  
  /**
   * Verifica se os dados são válidos para cálculo
   */
  static validateGrupoAData(data: IGrupoAData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.investimentoInicial <= 0) {
      errors.push('Investimento inicial deve ser maior que zero');
    }
    
    if (data.geracaoMensal.every(v => v === 0)) {
      errors.push('Geração mensal não pode ser toda zero');
    }
    
    // CORREÇÃO: Para Grupo A, validar consumo separado por posto
    const consumoTotalMensal = data.consumoForaPontaMensal && data.consumoPontaMensal
      ? data.consumoForaPontaMensal.map((foraPonta, index) =>
          (foraPonta || 0) + (data.consumoPontaMensal?.[index] || 0)
        )
      : data.consumoMensal;
    
    if (consumoTotalMensal.every(v => v === 0)) {
      errors.push('Consumo mensal não pode ser todo zero');
    }
    
    if (data.tarifaEnergiaPontaA <= 0) {
      errors.push('Tarifa de energia ponta deve ser maior que zero');
    }
    
    if (data.tarifaEnergiaForaPontaA <= 0) {
      errors.push('Tarifa de energia fora ponta deve ser maior que zero');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}