export interface CashFlowItemDto {
  ano: number;
  fluxoLiquido: number;
  economia: number;
  custoSemFV: number;
  custoComFV: number;
}

export interface FinancialAnalysisDto {
  economiaAnualEstimada: number;
  vpl: number;
  tir: number;
  payback: number;
  fluxoCaixa: CashFlowItemDto[];
}

export interface SolarCalculationResponseDto {
  monthlyGeneration: number[];
  annualGeneration: number;
  optimalModuleCount: {
    moduleCount: number;
    totalPower: number;
    areaUsed: number;
  };
  co2Savings: number;
  orientationLoss: number;
  financialAnalysis?: FinancialAnalysisDto;
}