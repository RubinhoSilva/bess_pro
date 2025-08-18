import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass, ClassConstructor } from 'class-transformer';

export interface ValidationErrorResponse {
  message: string;
  errors: Array<{
    field: string;
    value: any;
    messages: string[];
  }>;
}

export function validationMiddleware<T extends object>(
  type: ClassConstructor<T>,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = plainToClass(type, req[source]);
      const errors = await validate(dto as object);

      if (errors.length > 0) {
        const formattedErrors = formatValidationErrors(errors);
        res.status(400).json({
          success: false,
          message: 'Dados de entrada inválidos',
          errors: formattedErrors
        });
        return;
      }

      // Replace the original request data with validated and transformed data
      req[source] = dto;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno na validação',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
}

function formatValidationErrors(errors: ValidationError[]): Array<{
  field: string;
  value: any;
  messages: string[];
}> {
  return errors.map(error => ({
    field: error.property,
    value: error.value,
    messages: Object.values(error.constraints || {})
  }));
}

// Helper function for multiple validation sources
export function validateMultiple<T extends object, U extends object>(
  bodyType?: ClassConstructor<T>,
  queryType?: ClassConstructor<U>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors: ValidationError[] = [];

      // Validate body if type provided
      if (bodyType && req.body) {
        const bodyDto = plainToClass(bodyType, req.body);
        const bodyErrors = await validate(bodyDto as object);
        errors.push(...bodyErrors.map(err => ({ ...err, property: `body.${err.property}` })));
        req.body = bodyDto;
      }

      // Validate query if type provided
      if (queryType && req.query) {
        const queryDto = plainToClass(queryType, req.query);
        const queryErrors = await validate(queryDto as object);
        errors.push(...queryErrors.map(err => ({ ...err, property: `query.${err.property}` })));
        req.query = queryDto as any;
      }

      if (errors.length > 0) {
        const formattedErrors = formatValidationErrors(errors);
        res.status(400).json({
          success: false,
          message: 'Dados de entrada inválidos',
          errors: formattedErrors
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Multi-validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno na validação',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
}