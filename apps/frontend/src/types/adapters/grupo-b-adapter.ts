import { ICustomerData, IEnergyData, ISystemData, IBudgetData, IResultsData } from '@/store/pv-dimensioning-store';

/**
 * Interface para dados agregados do Grupo B
 */
export interface IGrupoBData {
  investimentoInicial: number;
  geracaoMensal: number[];
  consumoMensal: number[];
  tarifaEnergiaB: number;
  custoFioB: number;
  vidaUtil: number;
  taxaDesconto: number;
  inflacaoEnergia: number;
  degradacaoAnual: number;
  custoOperacao: number;
  valorResidual: number;
  hasRemotoB?: boolean;
  consumoRemotoB?: number[];
  tipoRede?: string;
  fatorSimultaneidade?: number;
}

/**
 * Adapter para extrair e formatar dados do Grupo B da store
 */
export class GrupoBAdapter {
  /**
   * Extrai todos os dados necessários para o Grupo B da store
   */
  static extractGrupoBData(
    customerData: ICustomerData,
    energyData: IEnergyData,
    systemData: ISystemData,
    budgetData: IBudgetData,
    resultsData: IResultsData
  ): IGrupoBData {
    // Extrair consumo mensal das contas de energia
    const consumoMensal = energyData?.energyBills?.[0]?.consumoMensal || Array(12).fill(0);
    
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
    
    // Log para debug da geração mensal
    console.log('[GrupoBAdapter] Geração mensal extraída:', geracaoMensal);
    console.log('[GrupoBAdapter] Estrutura completa de resultsData:', resultsData);
    console.log('[GrupoBAdapter] Estrutura de calculationResults:', resultsData?.calculationResults);
    
    return {
      investimentoInicial,
      geracaoMensal,
      consumoMensal,
      tarifaEnergiaB: customerData.tarifaEnergiaB,
      custoFioB: customerData.custoFioB,
      vidaUtil: systemData.vidaUtil,
      taxaDesconto: budgetData.taxaDesconto,
      inflacaoEnergia: budgetData.inflacaoEnergia,
      degradacaoAnual: systemData.degradacaoAnual,
      custoOperacao: budgetData.custoOperacao,
      valorResidual: budgetData.valorResidual,
      hasRemotoB: energyData?.hasRemotoB || false,
      consumoRemotoB: energyData?.consumoRemotoB || Array(12).fill(0),
      tipoRede: customerData.tipoRede,
      fatorSimultaneidade: customerData.fatorSimultaneidade
    };
  }
  
  /**
   * Verifica se os dados são válidos para cálculo
   */
  static validateGrupoBData(data: IGrupoBData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.investimentoInicial <= 0) {
      errors.push('Investimento inicial deve ser maior que zero');
    }
    
    if (data.geracaoMensal.every(v => v === 0)) {
      errors.push('Geração mensal não pode ser toda zero');
    }
    
    if (data.consumoMensal.every(v => v === 0)) {
      errors.push('Consumo mensal não pode ser todo zero');
    }
    
    if (data.tarifaEnergiaB <= 0) {
      errors.push('Tarifa de energia deve ser maior que zero');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}