export interface SystemCalculationResults {
  potenciaPico: number; // kWp
  numeroModulos: number;
  areaEstimada: number; // m²
  geracaoEstimadaAnual: number; // kWh/ano
  geracaoEstimadaMensal: number[]; // kWh/mês para cada mês
  irradiacaoMediaAnual: number; // kWh/m²/dia
  coberturaConsumo?: number; // %
  usedPVLIB?: boolean; // Se usou cálculos PVLIB mais precisos
}