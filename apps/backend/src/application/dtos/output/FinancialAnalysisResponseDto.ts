export interface FinancialAnalysisResponseDto {
  vpl: number;
  tir: number;
  payback: number;
  economiaTotal: number;
  fluxoCaixa: number[];
  isViable: boolean;
}