import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware de validação usando Zod
 * Valida o body da requisição contra um schema Zod
 */
export function validateWithZod<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Valida o body da requisição
      const validatedData = schema.parse(req.body);
      
      // Substitui o body com os dados validados e tipados
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Formata os erros de validação do Zod
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      } else {
        // Erro inesperado
        res.status(500).json({
          success: false,
          error: 'Internal server error during validation',
          timestamp: new Date().toISOString()
        });
      }
    }
  };
}

/**
 * Middleware de validação para query parameters
 */
export function validateQueryWithZod<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error during query validation',
          timestamp: new Date().toISOString()
        });
      }
    }
  };
}

/**
 * Middleware de validação para parâmetros de rota (params)
 */
export function validateParamsWithZod<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        res.status(400).json({
          success: false,
          error: 'Params validation failed',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error during params validation',
          timestamp: new Date().toISOString()
        });
      }
    }
  };
}

/**
 * Middleware combinado para validar body, query e params
 */
export function validateRequestWithZod<TBody, TQuery, TParams>(
  bodySchema?: ZodSchema<TBody>,
  querySchema?: ZodSchema<TQuery>,
  paramsSchema?: ZodSchema<TParams>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Valida body se fornecido
      if (bodySchema) {
        const validatedBody = bodySchema.parse(req.body);
        req.body = validatedBody;
      }

      // Valida query se fornecido
      if (querySchema) {
        const validatedQuery = querySchema.parse(req.query);
        req.query = validatedQuery as any;
      }

      // Valida params se fornecido
      if (paramsSchema) {
        const validatedParams = paramsSchema.parse(req.params);
        req.params = validatedParams as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        res.status(400).json({
          success: false,
          error: 'Request validation failed',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error during request validation',
          timestamp: new Date().toISOString()
        });
      }
    }
  };
}