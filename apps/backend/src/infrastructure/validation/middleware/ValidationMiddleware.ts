import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass, ClassConstructor } from 'class-transformer';
import { BaseValidator } from '../core/BaseValidator';
import { ExtendedValidationResult } from '../../shared/validation/types/ValidationTypes';

export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
    code?: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
}

export function validationMiddleware<T extends object>(
  type: ClassConstructor<T>,
  source: 'body' | 'query' | 'params' = 'body',
  customValidator?: BaseValidator
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = plainToClass(type, req[source]);
      const errors = await validate(dto as object);

      if (errors.length > 0) {
        const formattedErrors = formatValidationErrors(errors);
        const response: ValidationErrorResponse = {
          success: false,
          message: 'Dados de entrada inválidos',
          errors: formattedErrors
        };
        
        res.status(400).json(response);
        return;
      }

      // Apply custom validation if provided
      if (customValidator) {
        const validationResult = await customValidator.validateDTO(dto, {
          userRole: req.user?.role,
          equipment: req[source]
        });

        if (!validationResult.isValid) {
          const response: ValidationErrorResponse = {
            success: false,
            message: validationResult.message,
            errors: validationResult.errors || []
          };

          if ((validationResult as ExtendedValidationResult).warnings) {
            response.warnings = (validationResult as ExtendedValidationResult).warnings;
          }
          
          res.status(400).json(response);
          return;
        }
      }

      // Replace the original request data with validated and transformed data
      req[source] = dto;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno na validação',
        errors: [{
          field: 'validation',
          message: 'Internal validation error',
          code: 'VALIDATION_EXCEPTION'
        }]
      });
    }
  };
}

export function schemaValidationMiddleware(
  validator: BaseValidator,
  entityType: string
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validationResult = await validator.validateSchema(req.body, entityType);

      if (!validationResult.isValid) {
        const response: ValidationErrorResponse = {
          success: false,
          message: validationResult.message,
          errors: validationResult.errors || []
        };

        if (validationResult.warnings) {
          response.warnings = validationResult.warnings;
        }
        
        res.status(400).json(response);
        return;
      }

      next();
    } catch (error) {
      console.error('Schema validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno na validação de schema',
        errors: [{
          field: 'schema_validation',
          message: 'Internal schema validation error',
          code: 'SCHEMA_VALIDATION_EXCEPTION'
        }]
      });
    }
  };
}

export function validateMultiple<T extends object, U extends object>(
  bodyType?: ClassConstructor<T>,
  queryType?: ClassConstructor<U>,
  bodyValidator?: BaseValidator,
  queryValidator?: BaseValidator
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors: ValidationError[] = [];
      const allWarnings: Array<{ field: string; message: string; suggestion?: string }> = [];

      // Validate body if type provided
      if (bodyType && req.body) {
        const bodyDto = plainToClass(bodyType, req.body);
        const bodyErrors = await validate(bodyDto as object);
        errors.push(...bodyErrors.map(err => ({ ...err, property: `body.${err.property}` })));

        // Apply custom body validation if provided
        if (bodyValidator && bodyErrors.length === 0) {
          const bodyValidationResult = await bodyValidator.validateDTO(bodyDto, {
            userRole: req.user?.role,
            equipment: req.body
          });

          if (!bodyValidationResult.isValid) {
            const extendedResult = bodyValidationResult as ExtendedValidationResult;
            errors.push(...(extendedResult.errors || []).map(err => ({
              property: `body.${err.field}`,
              constraints: { [err.code || 'CUSTOM']: err.message }
            })));

            if (extendedResult.warnings) {
              allWarnings.push(...extendedResult.warnings.map(w => ({
                field: `body.${w.field}`,
                message: w.message,
                suggestion: w.suggestion
              })));
            }
          }
        }

        req.body = bodyDto;
      }

      // Validate query if type provided
      if (queryType && req.query) {
        const queryDto = plainToClass(queryType, req.query);
        const queryErrors = await validate(queryDto as object);
        errors.push(...queryErrors.map(err => ({ ...err, property: `query.${err.property}` })));

        // Apply custom query validation if provided
        if (queryValidator && queryErrors.length === 0) {
          const queryValidationResult = await queryValidator.validateDTO(queryDto, {
            userRole: req.user?.role,
            equipment: req.query
          });

          if (!queryValidationResult.isValid) {
            const extendedResult = queryValidationResult as ExtendedValidationResult;
            errors.push(...(extendedResult.errors || []).map(err => ({
              property: `query.${err.field}`,
              constraints: { [err.code || 'CUSTOM']: err.message }
            })));

            if (extendedResult.warnings) {
              allWarnings.push(...extendedResult.warnings.map(w => ({
                field: `query.${w.field}`,
                message: w.message,
                suggestion: w.suggestion
              })));
            }
          }
        }

        req.query = queryDto as any;
      }

      if (errors.length > 0) {
        const formattedErrors = formatValidationErrors(errors);
        const response: ValidationErrorResponse = {
          success: false,
          message: 'Dados de entrada inválidos',
          errors: formattedErrors
        };

        if (allWarnings.length > 0) {
          response.warnings = allWarnings;
        }

        res.status(400).json(response);
        return;
      }

      next();
    } catch (error) {
      console.error('Multi-validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno na validação',
        errors: [{
          field: 'validation',
          message: 'Internal validation error',
          code: 'VALIDATION_EXCEPTION'
        }]
      });
    }
  };
}

function formatValidationErrors(errors: ValidationError[]): Array<{
  field: string;
  message: string;
  value?: any;
  code?: string;
}> {
  const formattedErrors: Array<{
    field: string;
    message: string;
    value?: any;
    code?: string;
  }> = [];

  for (const error of errors) {
    if (error.constraints) {
      for (const [code, message] of Object.entries(error.constraints)) {
        formattedErrors.push({
          field: error.property,
          message,
          value: error.value,
          code
        });
      }
    }

    // Handle nested validation errors
    if (error.children && error.children.length > 0) {
      const nestedErrors = formatNestedErrors(error.children, error.property);
      formattedErrors.push(...nestedErrors);
    }
  }

  return formattedErrors;
}

function formatNestedErrors(errors: ValidationError[], prefix: string): Array<{
  field: string;
  message: string;
  value?: any;
  code?: string;
}> {
  const nestedErrors: Array<{
    field: string;
    message: string;
    value?: any;
    code?: string;
  }> = [];

  for (const error of errors) {
    const fieldPath = `${prefix}.${error.property}`;
    
    if (error.constraints) {
      for (const [code, message] of Object.entries(error.constraints)) {
        nestedErrors.push({
          field: fieldPath,
          message,
          value: error.value,
          code
        });
      }
    }

    if (error.children && error.children.length > 0) {
      const deeperErrors = formatNestedErrors(error.children, fieldPath);
      nestedErrors.push(...deeperErrors);
    }
  }

  return nestedErrors;
}