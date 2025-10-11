/**
 * System calculation types for energy and financial calculations
 */

export interface EnergyCalculation {
  readonly monthlyGeneration: number[];
  readonly annualGeneration: number;
  readonly specificProduction: number; // kWh/kWp
  readonly performanceRatio: number;
  readonly temperatureLosses: number;
  readonly systemLosses: number;
}

export interface FinancialCalculation {
  readonly initialInvestment: number;
  readonly annualSavings: number;
  readonly paybackYears: number;
  readonly roi: number; // Return on Investment percentage
  readonly npv: number; // Net Present Value
  readonly irr: number; // Internal Rate of Return
  readonly lcoe: number; // Levelized Cost of Energy
}

export interface SystemSizing {
  readonly recommendedPower: number; // kWp
  readonly moduleCount: number;
  readonly inverterCount: number;
  readonly totalArea: number; // m²
  readonly roofUsagePercentage: number;
}

export interface ProductionEstimate {
  readonly hourlyProduction: number[];
  readonly dailyProduction: number[];
  readonly monthlyProduction: number[];
  readonly annualProduction: number;
  readonly worstMonthProduction: number;
  readonly bestMonthProduction: number;
}

export interface SystemCalculations {
  readonly energy: EnergyCalculation;
  readonly financial: FinancialCalculation;
  readonly sizing: SystemSizing;
  readonly production: ProductionEstimate;
  readonly calculatedAt: Date;
  readonly calculationVersion: string;
}