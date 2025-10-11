/**
 * Validation rule types for equipment and system validation
 */

export interface ValidationRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: 'required' | 'range' | 'pattern' | 'custom';
  readonly severity: 'error' | 'warning' | 'info';
  readonly category: 'technical' | 'safety' | 'performance' | 'financial';
}

export interface FieldValidationRule extends ValidationRule {
  readonly field: string;
  readonly validate: (value: any) => ValidationResult;
}

export interface SystemValidationRule extends ValidationRule {
  readonly validate: (system: any) => ValidationResult;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly message: string;
  readonly code?: string;
  readonly suggestions?: string[];
}

export interface ValidationContext {
  readonly equipment?: any;
  readonly system?: any;
  readonly location?: any;
  readonly userRole?: 'admin' | 'engineer' | 'sales' | 'customer';
}

export interface ValidationEngine {
  readonly rules: ValidationRule[];
  readonly validateField: (field: string, value: any, context?: ValidationContext) => ValidationResult;
  readonly validateSystem: (system: any, context?: ValidationContext) => ValidationResult[];
  readonly addRule: (rule: ValidationRule) => void;
  readonly removeRule: (ruleId: string) => void;
}