import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { ClientController } from '../controllers/ClientController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { body, query, param } from 'express-validator';

export class ClientRoutes {
  static create(container: Container): Router {
    const router = Router();
    
    try {
      const clientController = container.resolve<ClientController>('ClientController');
      const authMiddleware = container.resolve<AuthMiddleware>('AuthMiddleware');

      // Validações para criação de cliente
    const createClientValidation = [
      body('name').notEmpty().withMessage('Nome é obrigatório').trim(),
      body('email').isEmail().withMessage('Email deve ser válido').normalizeEmail(),
      body('phone').optional().trim(),
      body('company').optional().trim(),
      body('document').optional().trim(),
      body('address').optional().trim(),
      body('city').optional().trim(),
      body('state').optional().trim(),
      body('zipCode').optional().trim(),
      body('status').optional().isIn(['active', 'inactive', 'potential', 'blocked']).withMessage('Status inválido'),
      body('clientType').optional().isIn(['residential', 'commercial', 'industrial']).withMessage('Tipo de cliente inválido'),
      body('notes').optional().trim(),
      body('tags').optional().isArray().withMessage('Tags devem ser um array'),
      body('totalProjectsValue').optional().isNumeric().withMessage('Valor total de projetos deve ser numérico'),
      body('lastContactDate').optional().isISO8601().withMessage('Data do último contato deve ser válida'),
      body('nextFollowUpDate').optional().isISO8601().withMessage('Data do próximo follow-up deve ser válida')
    ];

    // Validações para atualização de cliente
    const updateClientValidation = [
      param('id').custom((value) => {
        // Aceita UUID ou ObjectId para compatibilidade com dados antigos
        if (typeof value === 'string' && (
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) || // UUID
          /^[0-9a-f]{24}$/i.test(value) // ObjectId
        )) {
          return true;
        }
        throw new Error('ID do cliente inválido');
      }),
      body('name').optional().notEmpty().withMessage('Nome não pode estar vazio').trim(),
      body('email').optional().isEmail().withMessage('Email deve ser válido').normalizeEmail(),
      body('phone').optional().trim(),
      body('company').optional().trim(),
      body('document').optional().trim(),
      body('address').optional().trim(),
      body('city').optional().trim(),
      body('state').optional().trim(),
      body('zipCode').optional().trim(),
      body('status').optional().isIn(['active', 'inactive', 'potential', 'blocked']).withMessage('Status inválido'),
      body('clientType').optional().isIn(['residential', 'commercial', 'industrial']).withMessage('Tipo de cliente inválido'),
      body('notes').optional().trim(),
      body('tags').optional().isArray().withMessage('Tags devem ser um array'),
      body('totalProjectsValue').optional().isNumeric().withMessage('Valor total de projetos deve ser numérico'),
      body('lastContactDate').optional().isISO8601().withMessage('Data do último contato deve ser válida'),
      body('nextFollowUpDate').optional().isISO8601().withMessage('Data do próximo follow-up deve ser válida')
    ];

    // Validações para busca
    const listClientsValidation = [
      query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
      query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Tamanho da página deve ser entre 1 e 100'),
      query('searchTerm').optional().trim()
    ];

    // Validação para parâmetro ID
    const idValidation = [
      param('id').custom((value) => {
        // Aceita UUID ou ObjectId para compatibilidade com dados antigos
        if (typeof value === 'string' && (
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) || // UUID
          /^[0-9a-f]{24}$/i.test(value) // ObjectId
        )) {
          return true;
        }
        throw new Error('ID do cliente inválido');
      })
    ];

    // Rotas
    router.post(
      '/',
      authMiddleware.authenticate(),
      createClientValidation,
      ValidationMiddleware.handleValidationErrors(),
      clientController.create.bind(clientController)
    );

    router.get(
      '/',
      authMiddleware.authenticate(),
      listClientsValidation,
      ValidationMiddleware.handleValidationErrors(),
      clientController.list.bind(clientController)
    );

    router.get(
      '/:id',
      authMiddleware.authenticate(),
      idValidation,
      ValidationMiddleware.handleValidationErrors(),
      clientController.getById.bind(clientController)
    );

    router.put(
      '/:id',
      authMiddleware.authenticate(),
      updateClientValidation,
      ValidationMiddleware.handleValidationErrors(),
      clientController.update.bind(clientController)
    );

    router.delete(
      '/:id',
      authMiddleware.authenticate(),
      idValidation,
      ValidationMiddleware.handleValidationErrors(),
      clientController.delete.bind(clientController)
    );

    // Rota para converter lead em cliente
    router.post(
      '/convert-lead/:leadId',
      authMiddleware.authenticate(),
      [param('leadId').isMongoId().withMessage('ID do lead inválido')],
      ValidationMiddleware.handleValidationErrors(),
      clientController.convertLeadToClient.bind(clientController)
    );

    return router;
    
    } catch (error) {
      console.error('Error during ClientRoutes dependency resolution:', error);
      throw error;
    }
  }
}