/**
 * Validation error types for handling validation failures
 */

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly category: 'technical' | 'safety' | 'performance' | 'financial';
  readonly suggestions?: string[];
  readonly ruleId?: string;
}

export interface CompatibilityIssue {
  readonly type: 'power' | 'voltage' | 'current' | 'physical' | 'environmental';
  readonly severity: 'error' | 'warning' | 'info';
  readonly description: string;
  readonly impact: string;
  readonly resolution?: string;
}

export interface CompatibilityWarning extends CompatibilityIssue {
  readonly severity: 'warning';
}

export interface CompatibilityResult {
  readonly isCompatible: boolean;
  readonly issues: CompatibilityIssue[];
  readonly warnings: CompatibilityWarning[];
  readonly recommendations: string[];
  readonly confidence: number; // 0-1
}

export interface ValidationSummary {
  readonly isValid: boolean;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
  readonly errors: ValidationError[];
  readonly warnings: ValidationError[];
  readonly info: ValidationError[];
  readonly validatedAt: Date;
}

export interface SystemValidationResult extends ValidationSummary {
  readonly systemId?: string;
  readonly compatibility: CompatibilityResult;
  readonly performance: {
    readonly estimatedEfficiency: number;
    readonly expectedProduction: number;
    readonly qualityScore: number;
  };
}