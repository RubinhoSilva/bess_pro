export interface FinancialParams {
  totalInvestment?: number;
  geracaoEstimadaMensal?: number[];
  consumoMensal?: number[];
  tarifaEnergiaB?: number;
  custoFioB?: number;
  vidaUtil?: number;
  inflacaoEnergia?: number;
  taxaDesconto?: number;
}

export interface CalculateSolarSystemCommand {
  projectId: string;
  userId: string;
  systemParams: {
    potenciaNominal: number;
    area: number;
    eficiencia: number;
    perdas: number;
    inclinacao: number;
    orientacao: number;
  };
  irradiationData: {
    monthly: number[];
    annual: number;
  };
  financialParams?: FinancialParams;
}