export interface AnalyzeFinancialCommand {
  projectId: string;
  userId: string;
  financialParams: {
    investimentoInicial: number;
    economiaMensal: number;
    taxaDesconto: number;
    tarifaEnergia: number;
    aumentoTarifa: number;
    periodoAnalise: number;
    custoManutencao: number;
  };
}