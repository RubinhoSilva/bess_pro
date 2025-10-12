import { validate, ValidationError } from 'class-validator';
import { plainToClass, ClassConstructor } from 'class-transformer';
import { ValidationResult, ValidationContext } from '../../../shared/validation/types/ValidationTypes';
import { ValidationEngine } from './ValidationEngine';

export abstract class BaseValidator<T = any> {
  protected validationEngine: ValidationEngine;
  protected entityName: string;

  constructor(entityName: string) {
    this.entityName = entityName;
    this.validationEngine = new ValidationEngine();
    this.initializeRules();
  }

  /**
   * Initialize validation rules for the entity
   */
  protected abstract initializeRules(): void;

  /**
   * Validate DTO using class-validator
   */
  async validateDTO(dto: T, context?: ValidationContext): Promise<ValidationResult> {
    try {
      const errors = await validate(dto as object);
      
      if (errors.length > 0) {
        return {
          isValid: false,
          message: `Validation failed for ${this.entityName}`,
          errors: this.formatValidationErrors(errors),
          code: 'DTO_VALIDATION_ERROR'
        };
      }

      // Apply custom business rules
      const businessValidation = await this.validateBusinessRules(dto, context);
      if (!businessValidation.isValid) {
        return businessValidation;
      }

      return {
        isValid: true,
        message: `${this.entityName} validation successful`
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Validation error for ${this.entityName}`,
        errors: [{ message: (error as Error).message }],
        code: 'VALIDATION_EXCEPTION'
      };
    }
  }

  /**
   * Validate business rules specific to the entity
   */
  protected abstract validateBusinessRules(data: T, context?: ValidationContext): Promise<ValidationResult>;

  /**
   * Validate using schema-based validation
   */
  async validateSchema(data: any, schema: any): Promise<ValidationResult> {
    try {
      const result = await this.validationEngine.validate(data, schema);
      return result;
    } catch (error) {
      return {
        isValid: false,
        message: `Schema validation failed for ${this.entityName}`,
        errors: [{ message: (error as Error).message }],
        code: 'SCHEMA_VALIDATION_ERROR'
      };
    }
  }

  /**
   * Format class-validator errors
   */
  private formatValidationErrors(errors: ValidationError[]): Array<{ field: string; message: string; value?: any }> {
    const formattedErrors: Array<{ field: string; message: string; value?: any }> = [];

    for (const error of errors) {
      if (error.constraints) {
        for (const message of Object.values(error.constraints)) {
          formattedErrors.push({
            field: error.property,
            message,
            value: error.value
          });
        }
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatNestedErrors(error.children, error.property);
        formattedErrors.push(...nestedErrors);
      }
    }

    return formattedErrors;
  }

  private formatNestedErrors(errors: ValidationError[], prefix: string): Array<{ field: string; message: string; value?: any }> {
    const nestedErrors: Array<{ field: string; message: string; value?: any }> = [];

    for (const error of errors) {
      const fieldPath = `${prefix}.${error.property}`;
      
      if (error.constraints) {
        for (const message of Object.values(error.constraints)) {
          nestedErrors.push({
            field: fieldPath,
            message,
            value: error.value
          });
        }
      }

      if (error.children && error.children.length > 0) {
        const deeperErrors = this.formatNestedErrors(error.children, fieldPath);
        nestedErrors.push(...deeperErrors);
      }
    }

    return nestedErrors;
  }

  /**
   * Transform and validate request data
   */
  async transformAndValidate(
    data: any, 
    DTOClass: ClassConstructor<T>,
    context?: ValidationContext
  ): Promise<{ dto: T; result: ValidationResult }> {
    const dto = plainToClass(DTOClass, data);
    const result = await this.validateDTO(dto, context);
    
    return { dto, result };
  }
}