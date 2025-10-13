import { ValidationRule, ValidationResult, ValidationContext } from '../../../shared/validation/types/ValidationTypes';
import { ExtendedValidationResult, ValidationConfig, ValidationSchema } from '../../../shared/validation/types/ValidationTypes';

export class ValidationEngine {
  private rules: Map<string, ValidationRule[]> = new Map();
  private schemas: Map<string, ValidationSchema> = new Map();
  private config: ValidationConfig;

  constructor(config: ValidationConfig = { strictMode: false, failFast: false, includeWarnings: true }) {
    this.config = config;
  }

  /**
   * Register validation rules for an entity
   */
  registerRules(entityType: string, rules: ValidationRule[]): void {
    this.rules.set(entityType, rules);
  }

  /**
   * Register a validation schema
   */
  registerSchema(schema: ValidationSchema): void {
    this.schemas.set(schema.name, schema);
    this.registerRules(schema.name, schema.rules);
  }

  /**
   * Validate data against registered rules
   */
  async validate(data: any, entityType: string, context?: ValidationContext): Promise<ExtendedValidationResult> {
    const startTime = Date.now();
    const entityRules = this.rules.get(entityType) || [];

    if (entityRules.length === 0) {
      return {
        isValid: true,
        message: `No validation rules found for entity type: ${entityType}`,
        metadata: {
          executionTime: Date.now() - startTime,
          validatedAt: new Date(),
          validator: 'ValidationEngine'
        }
      };
    }

    const errors: Array<{ field: string; message: string; value?: any; code?: string }> = [];
    const warnings: Array<{ field: string; message: string; suggestion?: string }> = [];

    for (const rule of entityRules) {
      try {
        const result = await this.executeRule(rule, data, context);
        
        if (!result.isValid) {
          if (rule.severity === 'error' || this.config.strictMode) {
            errors.push({
              field: (rule as any).field || 'unknown',
              message: result.message,
              code: result.code
            });

            if (this.config.failFast) {
              break;
            }
          } else if (rule.severity === 'warning' && this.config.includeWarnings) {
            warnings.push({
              field: (rule as any).field || 'unknown',
              message: result.message,
              suggestion: result.suggestions?.[0]
            });
          }
        }
      } catch (error) {
        if (this.config.strictMode) {
          errors.push({
            field: 'validation_engine',
            message: `Rule execution failed: ${(error as Error).message}`,
            code: 'RULE_EXECUTION_ERROR'
          });
        }
      }
    }

    const result: ExtendedValidationResult = {
      isValid: errors.length === 0,
      message: errors.length > 0 
        ? `Validation failed with ${errors.length} error(s)` 
        : `Validation successful for ${entityType}`,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        executionTime: Date.now() - startTime,
        validatedAt: new Date(),
        validator: 'ValidationEngine'
      }
    };

    return result;
  }

  /**
   * Execute a single validation rule
   */
  private async executeRule(rule: ValidationRule, data: any, context?: ValidationContext): Promise<ValidationResult> {
    switch (rule.type) {
      case 'required':
        return this.validateRequired(rule, data);
      case 'range':
        return this.validateRange(rule, data);
      case 'pattern':
        return this.validatePattern(rule, data);
      case 'custom':
        return this.validateCustom(rule, data, context);
      default:
        return {
          isValid: false,
          message: `Unknown rule type: ${rule.type}`,
          code: 'UNKNOWN_RULE_TYPE'
        };
    }
  }

  private validateRequired(rule: ValidationRule, data: any): ValidationResult {
    const fieldRule = rule as any;
    const value = this.getNestedValue(data, fieldRule.field);
    
    if (value === undefined || value === null || value === '') {
      return {
        isValid: false,
        message: `${fieldRule.field} is required`,
        code: 'REQUIRED_FIELD'
      };
    }

    return { isValid: true, message: 'Required validation passed' };
  }

  private validateRange(rule: ValidationRule, data: any): ValidationResult {
    const fieldRule = rule as any;
    const value = this.getNestedValue(data, fieldRule.field);
    
    if (value === undefined || value === null) {
      return { isValid: true, message: 'Range validation skipped for null value' };
    }

    const { min, max } = fieldRule;
    const numValue = Number(value);

    if (isNaN(numValue)) {
      return {
        isValid: false,
        message: `${fieldRule.field} must be a number`,
        code: 'INVALID_NUMBER'
      };
    }

    if (min !== undefined && numValue < min) {
      return {
        isValid: false,
        message: `${fieldRule.field} must be at least ${min}`,
        code: 'MIN_VALUE'
      };
    }

    if (max !== undefined && numValue > max) {
      return {
        isValid: false,
        message: `${fieldRule.field} must be at most ${max}`,
        code: 'MAX_VALUE'
      };
    }

    return { isValid: true, message: 'Range validation passed' };
  }

  private validatePattern(rule: ValidationRule, data: any): ValidationResult {
    const fieldRule = rule as any;
    const value = this.getNestedValue(data, fieldRule.field);
    
    if (value === undefined || value === null) {
      return { isValid: true, message: 'Pattern validation skipped for null value' };
    }

    const pattern = new RegExp(fieldRule.pattern);
    if (!pattern.test(String(value))) {
      return {
        isValid: false,
        message: `${fieldRule.field} format is invalid`,
        code: 'INVALID_FORMAT'
      };
    }

    return { isValid: true, message: 'Pattern validation passed' };
  }

  private validateCustom(rule: ValidationRule, data: any, context?: ValidationContext): ValidationResult {
    const fieldRule = rule as any;
    
    if (typeof fieldRule.validate === 'function') {
      const result = fieldRule.validate(data, context);
      const isValid = typeof result === 'boolean' ? result : false;
      
      return {
        isValid,
        message: isValid ? 'Custom validation passed' : `Custom validation failed for ${fieldRule.field}`,
        code: isValid ? undefined : 'CUSTOM_VALIDATION_FAILED'
      };
    }

    return {
      isValid: false,
      message: `Custom validation function not provided for ${fieldRule.field}`,
      code: 'MISSING_VALIDATION_FUNCTION'
    };
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Get all registered rules for an entity type
   */
  getRules(entityType: string): ValidationRule[] {
    return this.rules.get(entityType) || [];
  }

  /**
   * Get all registered schemas
   */
  getSchemas(): ValidationSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Update validation configuration
   */
  updateConfig(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}