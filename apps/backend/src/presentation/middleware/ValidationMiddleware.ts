import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

export class ValidationMiddleware {
  static handleValidationErrors() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados de entrada inválidos',
            details: errors.array(),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next();
    };
  }

  // Auth validation rules
  static validateRegister() {
    return [
      body('email').isEmail().normalizeEmail().withMessage('Email deve ser válido'),
      body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
      body('name').isLength({ min: 2, max: 100 }).trim().withMessage('Nome deve ter entre 2 e 100 caracteres'),
      body('company').optional().isLength({ max: 100 }).trim(),
      body('role').optional().isIn(['admin', 'vendedor', 'viewer']).withMessage('Role inválido'),
    ];
  }

  static validateLogin() {
    return [
      body('email').isEmail().normalizeEmail().withMessage('Email deve ser válido'),
      body('password').notEmpty().withMessage('Senha é obrigatória'),
    ];
  }

  // Project validation rules
  static validateCreateProject() {
    return [
      body('projectName').isLength({ min: 3, max: 100 }).trim().withMessage('Nome do projeto deve ter entre 3 e 100 caracteres'),
      body('projectType').isIn(['pv', 'bess', 'hybrid']).withMessage('Tipo de projeto deve ser "pv", "bess" ou "hybrid"'),
      body('address').optional().isLength({ max: 200 }).trim(),
      body('leadId').optional().isMongoId().withMessage('ID do lead inválido'),
      body('projectData').optional().isObject(),
    ];
  }

  static validateUpdateProject() {
    return [
      param('id').isMongoId().withMessage('ID do projeto inválido'),
      body('projectName').optional().isLength({ min: 3, max: 100 }).trim(),
      body('address').optional().isLength({ max: 200 }).trim(),
      body('projectData').optional().isObject(),
    ];
  }

  static validateProjectId() {
    return [
      param('id').isMongoId().withMessage('ID do projeto inválido'),
    ];
  }

  static validateLeadId() {
    return [
      param('id').isMongoId().withMessage('ID do lead inválido'),
    ];
  }

  static validateUpdateLeadStage() {
    return [
      param('id').isMongoId().withMessage('ID do lead inválido'),
      body('stage').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Estágio do lead deve ser uma string válida entre 1 e 50 caracteres'),
    ];
  }

  // Lead validation rules
  static validateCreateLead() {
    return [
      body('name').isLength({ min: 2, max: 100 }).trim().withMessage('Nome deve ter entre 2 e 100 caracteres'),
      body('email').isEmail().normalizeEmail().withMessage('Email deve ser válido'),
      body('phone').optional().isLength({ max: 20 }).trim(),
      body('company').optional().isLength({ max: 100 }).trim(),
      body('address').optional().isLength({ max: 200 }).trim(),
      body('stage').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('Estágio deve ser uma string válida entre 1 e 50 caracteres'),
    ];
  }

  static validateUpdateLead() {
    return [
      param('id').isMongoId().withMessage('ID do lead inválido'),
      body('name').optional().isLength({ min: 2, max: 100 }).trim(),
      body('email').optional().isEmail().normalizeEmail(),
      body('phone').optional().isLength({ max: 20 }).trim(),
      body('company').optional().isLength({ max: 100 }).trim(),
      body('address').optional().isLength({ max: 200 }).trim(),
      body('stage').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('Estágio deve ser uma string válida entre 1 e 50 caracteres'),
    ];
  }

  static validateConvertLead() {
    return [
      param('id').isMongoId().withMessage('ID do lead inválido'),
      body('projectName').isLength({ min: 3, max: 100 }).trim().withMessage('Nome do projeto é obrigatório'),
      body('projectType').isIn(['pv', 'bess', 'hybrid']).withMessage('Tipo de projeto deve ser "pv", "bess" ou "hybrid"'),
    ];
  }

  // Model3D validation rules
  static validateUploadModel() {
    return [
      body('projectId').isMongoId().withMessage('ID do projeto inválido'),
      body('name').isLength({ min: 3, max: 100 }).trim().withMessage('Nome deve ter entre 3 e 100 caracteres'),
      body('description').optional().isLength({ max: 500 }).trim(),
    ];
  }

  // Query validation rules
  static validatePagination() {
    return [
      query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
      query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Tamanho da página deve estar entre 1 e 100'),
    ];
  }

  static validateProjectFilters() {
    return [
      query('projectType').optional().isIn(['pv', 'bess']),
      query('hasLocation').optional().isBoolean(),
      query('hasLead').optional().isBoolean(),
      query('searchTerm').optional().isLength({ max: 100 }).trim(),
    ];
  }
}
