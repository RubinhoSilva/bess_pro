import { Router } from 'express';
import { AlertController } from '../controllers/AlertController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { Container } from '../../infrastructure/di/Container';
import { body, param, query } from 'express-validator';

export class AlertRoutes {
  static create(container: Container): Router {
    const router = Router();
    const alertController = new AlertController(container);
    const authMiddleware = new AuthMiddleware(container);

    // Validation rules for creating alerts
    const validateCreateAlert = [
      body('leadId').isMongoId().withMessage('ID do lead inválido'),
      body('type').isIn(['follow-up', 'reminder', 'deadline', 'callback']).withMessage('Tipo de alerta inválido'),
      body('title').isLength({ min: 1, max: 100 }).trim().withMessage('Título deve ter entre 1 e 100 caracteres'),
      body('message').isLength({ min: 1, max: 500 }).trim().withMessage('Mensagem deve ter entre 1 e 500 caracteres'),
      body('alertTime').isISO8601().withMessage('Data do alerta deve ser uma data válida'),
    ];

    // Validation rules for updating alert status
    const validateUpdateAlertStatus = [
      param('alertId').isMongoId().withMessage('ID do alerta inválido'),
      body('status').isIn(['active', 'completed', 'cancelled']).withMessage('Status do alerta inválido'),
    ];

    // Validation rules for getting lead alerts
    const validateGetLeadAlerts = [
      param('leadId').isMongoId().withMessage('ID do lead inválido'),
    ];

    // Query validation for user alerts
    const validateUserAlertsQuery = [
      query('status').optional().isIn(['active', 'completed', 'cancelled']).withMessage('Status inválido'),
      query('includeOverdue').optional().isBoolean().withMessage('includeOverdue deve ser boolean'),
      query('includeUpcoming').optional().isBoolean().withMessage('includeUpcoming deve ser boolean'),
      query('minutesAhead').optional().isInt({ min: 1, max: 1440 }).withMessage('minutesAhead deve ser entre 1 e 1440'),
    ];

    // Routes
    router.post(
      '/',
      authMiddleware.authenticate(),
      validateCreateAlert,
      ValidationMiddleware.handleValidationErrors(),
      alertController.createAlert.bind(alertController)
    );

    router.get(
      '/',
      authMiddleware.authenticate(),
      validateUserAlertsQuery,
      ValidationMiddleware.handleValidationErrors(),
      alertController.getUserAlerts.bind(alertController)
    );

    router.patch(
      '/:alertId/status',
      authMiddleware.authenticate(),
      validateUpdateAlertStatus,
      ValidationMiddleware.handleValidationErrors(),
      alertController.updateAlertStatus.bind(alertController)
    );

    router.get(
      '/lead/:leadId',
      authMiddleware.authenticate(),
      validateGetLeadAlerts,
      ValidationMiddleware.handleValidationErrors(),
      alertController.getLeadAlerts.bind(alertController)
    );

    return router;
  }
}