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
  // Percentuais configurados pelo usuário
  percCreditosRemotoB?: number;
  percCreditosRemotoAVerde?: number;
  percCreditosRemotoAAzul?: number;
  // Dados do Grupo A para remotoAVerde
  hasRemotoAVerde?: boolean;
  consumoRemotoAVerdePonta?: number[];
  consumoRemotoAVerdeForaPonta?: number[];
  tarifaEnergiaPontaA?: number;
  tarifaEnergiaForaPontaA?: number;
  tePontaA?: number;
  teForaPontaA?: number;
  tusdPontaA?: number;
  tusdForaPontaA?: number;
  subgrupoTarifario?: string;
  // Dados do Grupo A para remotoAAzul
  hasRemotoAAzul?: boolean;
  consumoRemotoAAzulPonta?: number[];
  consumoRemotoAAzulForaPonta?: number[];
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
    
    // Extrair dados do Grupo A se houver contas do Grupo A
    let hasRemotoAVerde = false;
    let consumoRemotoAVerdePonta = Array(12).fill(0);
    let consumoRemotoAVerdeForaPonta = Array(12).fill(0);
    let hasRemotoAAzul = false;
    let consumoRemotoAAzulPonta = Array(12).fill(0);
    let consumoRemotoAAzulForaPonta = Array(12).fill(0);
    
    if (energyData?.energyBillsA && energyData.energyBillsA.length > 0) {
      // Verificar o subgrupo tarifário para determinar se é Verde ou Azul
      const subgrupoTarifario = customerData?.subgrupoTarifario || 'verde';
      
      if (subgrupoTarifario === 'verde') {
        hasRemotoAVerde = true;
        // Extrair consumo das contas do Grupo A Verde
        energyData.energyBillsA.forEach((bill: any) => {
          if (bill.consumoMensalPonta) {
            consumoRemotoAVerdePonta = consumoRemotoAVerdePonta.map((val: number, idx: number) =>
              val + (bill.consumoMensalPonta[idx] || 0)
            );
          }
          if (bill.consumoMensalForaPonta) {
            consumoRemotoAVerdeForaPonta = consumoRemotoAVerdeForaPonta.map((val: number, idx: number) =>
              val + (bill.consumoMensalForaPonta[idx] || 0)
            );
          }
        });
      } else if (subgrupoTarifario === 'azul') {
        hasRemotoAAzul = true;
        // Extrair consumo das contas do Grupo A Azul
        energyData.energyBillsA.forEach((bill: any) => {
          if (bill.consumoMensalPonta) {
            consumoRemotoAAzulPonta = consumoRemotoAAzulPonta.map((val: number, idx: number) =>
              val + (bill.consumoMensalPonta[idx] || 0)
            );
          }
          if (bill.consumoMensalForaPonta) {
            consumoRemotoAAzulForaPonta = consumoRemotoAAzulForaPonta.map((val: number, idx: number) =>
              val + (bill.consumoMensalForaPonta[idx] || 0)
            );
          }
        });
      }
    }
    
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
      fatorSimultaneidade: customerData.fatorSimultaneidade,
      // Percentuais configurados pelo usuário
      percCreditosRemotoB: energyData?.percCreditosRemotoB,
      percCreditosRemotoAVerde: energyData?.percCreditosRemotoAVerde,
      percCreditosRemotoAAzul: energyData?.percCreditosRemotoAAzul,
      // Dados do Grupo A para remotoAVerde
      hasRemotoAVerde,
      consumoRemotoAVerdePonta,
      consumoRemotoAVerdeForaPonta,
      tarifaEnergiaPontaA: customerData.tarifaEnergiaPontaA,
      tarifaEnergiaForaPontaA: customerData.tarifaEnergiaForaPontaA,
      tePontaA: customerData.tePontaA,
      teForaPontaA: customerData.teForaPontaA,
      tusdPontaA: customerData.tusdPontaA,
      tusdForaPontaA: customerData.tusdForaPontaA,
      subgrupoTarifario: customerData.subgrupoTarifario,
      // Dados do Grupo A para remotoAAzul
      hasRemotoAAzul,
      consumoRemotoAAzulPonta,
      consumoRemotoAAzulForaPonta
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