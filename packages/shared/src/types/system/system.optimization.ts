/**
 * System optimization types for finding optimal configurations
 */

export interface OptimizationObjective {
  readonly type: 'cost' | 'efficiency' | 'space' | 'payback' | 'roi';
  readonly weight: number; // 0-1, importance weight
  readonly target?: number; // optional target value
}

export interface OptimizationConstraints {
  readonly maxBudget?: number;
  readonly maxSpace?: number; // m²
  readonly minEfficiency?: number; // percentage
  readonly maxPaybackPeriod?: number; // years
  readonly minROI?: number; // percentage
}

export interface OptimizationResult {
  readonly id: string;
  readonly objectives: OptimizationObjective[];
  readonly constraints: OptimizationConstraints;
  readonly optimalConfiguration: {
    readonly moduleCount: number;
    readonly inverterCount: number;
    readonly totalPower: number; // kWp
    readonly estimatedCost: number;
    readonly estimatedSavings: number;
    readonly paybackPeriod: number;
    readonly roi: number;
    readonly efficiency: number;
  };
  readonly alternatives: Array<{
    readonly rank: number;
    readonly configuration: any;
    readonly score: number;
    readonly pros: string[];
    readonly cons: string[];
  }>;
  readonly optimizationDate: Date;
  readonly algorithm: string;
}

export interface SystemSensitivityAnalysis {
  readonly parameter: string;
  readonly baseValue: number;
  readonly variations: Array<{
    readonly value: number;
    readonly impact: {
      readonly cost: number;
      readonly efficiency: number;
      readonly payback: number;
    };
  }>;
  readonly sensitivity: number; // how sensitive the result is to this parameter
}

export interface SystemComparativeAnalysis {
  readonly configurations: Array<{
    readonly id: string;
    readonly name: string;
    readonly modules: any[];
    readonly inverters: any[];
    readonly totalCost: number;
    readonly annualGeneration: number;
    readonly paybackPeriod: number;
    readonly roi: number;
  }>;
  readonly criteria: OptimizationObjective[];
  readonly recommendation: {
    readonly bestConfigurationId: string;
    readonly reasoning: string;
  };
}