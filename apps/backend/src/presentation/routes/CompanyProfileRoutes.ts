import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { CompanyProfileController } from '../controllers/CompanyProfileController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { FileUploadMiddleware } from '../middleware/FileUploadMiddleware';
import { body, query, param } from 'express-validator';

export class CompanyProfileRoutes {
  static create(container: Container): Router {
    const router = Router();
    
    try {
      const companyProfileController = container.resolve<CompanyProfileController>('CompanyProfileController');
      const authMiddleware = container.resolve<AuthMiddleware>('AuthMiddleware');
      const fileUploadMiddleware = container.resolve<FileUploadMiddleware>('FileUploadMiddleware');

      // Validações para criação de perfil de empresa
      const createCompanyProfileValidation = [
        body('companyName').notEmpty().withMessage('Nome da empresa é obrigatório').trim(),
        body('tradingName').optional().trim(),
        body('taxId').optional().trim(),
        body('stateRegistration').optional().trim(),
        body('municipalRegistration').optional().trim(),
        body('phone').optional().trim(),
        body('email').optional().isEmail().withMessage('Email deve ser válido').normalizeEmail(),
        body('logoUrl').optional().isURL().withMessage('URL do logo deve ser válida'),
        body('logoPath').optional().trim(),
        body('website').optional().isURL().withMessage('Website deve ser uma URL válida'),
        body('address').optional().trim(),
        body('city').optional().trim(),
        body('state').optional().trim(),
        body('zipCode').optional().trim(),
        body('country').optional().trim(),
        body('isActive').optional().isBoolean().withMessage('Status deve ser booleano')
      ];

      // Validações para atualização de perfil de empresa
      const updateCompanyProfileValidation = [
        param('id').isUUID().withMessage('ID do perfil da empresa inválido'),
        body('companyName').optional().notEmpty().withMessage('Nome da empresa não pode estar vazio').trim(),
        body('tradingName').optional().trim(),
        body('taxId').optional().trim(),
        body('stateRegistration').optional().trim(),
        body('municipalRegistration').optional().trim(),
        body('phone').optional().trim(),
        body('email').optional().isEmail().withMessage('Email deve ser válido').normalizeEmail(),
        body('logoUrl').optional().isURL().withMessage('URL do logo deve ser válida'),
        body('logoPath').optional().trim(),
        body('website').optional().isURL().withMessage('Website deve ser uma URL válida'),
        body('address').optional().trim(),
        body('city').optional().trim(),
        body('state').optional().trim(),
        body('zipCode').optional().trim(),
        body('country').optional().trim(),
        body('isActive').optional().isBoolean().withMessage('Status deve ser booleano')
      ];

      // Validações para busca
      const listCompanyProfilesValidation = [
        query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
        query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Tamanho da página deve ser entre 1 e 100'),
        query('searchTerm').optional().trim(),
        query('activeOnly').optional().isBoolean().withMessage('activeOnly deve ser booleano'),
        query('all').optional().isBoolean().withMessage('all deve ser booleano')
      ];

      // Validação para parâmetro ID
      const idValidation = [
        param('id').isUUID().withMessage('ID do perfil da empresa inválido')
      ];

      // Validação para upload de logo
      const uploadLogoValidation = [
        param('id').isUUID().withMessage('ID do perfil da empresa inválido')
      ];

      // Rotas
      router.post(
        '/',
        authMiddleware.authenticate(),
        createCompanyProfileValidation,
        ValidationMiddleware.handleValidationErrors(),
        companyProfileController.create.bind(companyProfileController)
      );

      router.get(
        '/',
        authMiddleware.authenticate(),
        listCompanyProfilesValidation,
        ValidationMiddleware.handleValidationErrors(),
        companyProfileController.list.bind(companyProfileController)
      );

      router.get(
        '/:id',
        authMiddleware.authenticate(),
        idValidation,
        ValidationMiddleware.handleValidationErrors(),
        companyProfileController.getById.bind(companyProfileController)
      );

      router.put(
        '/:id',
        authMiddleware.authenticate(),
        updateCompanyProfileValidation,
        ValidationMiddleware.handleValidationErrors(),
        companyProfileController.update.bind(companyProfileController)
      );

      router.delete(
        '/:id',
        authMiddleware.authenticate(),
        idValidation,
        ValidationMiddleware.handleValidationErrors(),
        companyProfileController.delete.bind(companyProfileController)
      );

      // Rota para upload de logo
      router.post(
        '/:id/logo',
        authMiddleware.authenticate(),
        uploadLogoValidation,
        ValidationMiddleware.handleValidationErrors(),
        FileUploadMiddleware.images().single('logo'),
        companyProfileController.uploadLogo.bind(companyProfileController)
      );

      // Rota para deletar logo
      router.delete(
        '/:id/logo',
        authMiddleware.authenticate(),
        idValidation,
        ValidationMiddleware.handleValidationErrors(),
        companyProfileController.deleteLogo.bind(companyProfileController)
      );

      return router;
      
    } catch (error) {
      console.error('Error during CompanyProfileRoutes dependency resolution:', error);
      throw error;
    }
  }
}