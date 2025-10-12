// Local validation types to avoid circular dependencies
export interface ValidationRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: 'required' | 'range' | 'pattern' | 'custom';
  readonly severity: 'error' | 'warning' | 'info';
  readonly category: 'technical' | 'safety' | 'performance' | 'financial';
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

export interface ExtendedValidationResult extends ValidationResult {
  readonly errors?: Array<{
    field: string;
    message: string;
    value?: any;
    code?: string;
  }>;
  readonly warnings?: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
  readonly metadata?: {
    executionTime: number;
    validatedAt: Date;
    validator: string;
  };
}

export interface ValidationSchema {
  readonly name: string;
  readonly version: string;
  readonly rules: ValidationRule[];
  readonly dependencies?: string[];
}

export interface ValidationConfig {
  readonly strictMode: boolean;
  readonly failFast: boolean;
  readonly includeWarnings: boolean;
  readonly customRules?: ValidationRule[];
}

export interface ValidatorMetadata {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly supportedEntities: string[];
  readonly validationTypes: ('dto' | 'business' | 'schema')[];
}

export type { ValidationRule, ValidationResult, ValidationContext };