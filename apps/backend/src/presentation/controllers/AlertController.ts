import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';
import { CreateAlertUseCase } from '../../application/use-cases/alert/CreateAlertUseCase';
import { GetUserAlertsUseCase } from '../../application/use-cases/alert/GetUserAlertsUseCase';
import { UpdateAlertStatusUseCase } from '../../application/use-cases/alert/UpdateAlertStatusUseCase';
import { AlertMapper } from '../../application/mappers/AlertMapper';
import { AlertType, AlertStatus } from '../../domain/entities/Alert';

export class AlertController extends BaseController {
  constructor(private container: Container) {
    super();
  }
  
  async createAlert(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);

      const { leadId, type, title, message, alertTime } = req.body;

      const createAlertUseCase = this.container.resolve<CreateAlertUseCase>(ServiceTokens.CREATE_ALERT_USE_CASE);
      
      const result = await createAlertUseCase.execute({
        leadId,
        userId,
        type: type as AlertType,
        title,
        message,
        alertTime: new Date(alertTime)
      });

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: result.error
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const alertDto = AlertMapper.toResponseDto(result.value!);

      res.status(201).json({
        success: true,
        data: alertDto,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Create alert error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getUserAlerts(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);

      const { status, includeOverdue, includeUpcoming, minutesAhead } = req.query;

      const getUserAlertsUseCase = this.container.resolve<GetUserAlertsUseCase>(ServiceTokens.GET_USER_ALERTS_USE_CASE);
      
      const result = await getUserAlertsUseCase.execute({
        userId,
        status: status as AlertStatus,
        includeOverdue: includeOverdue === 'true',
        includeUpcoming: includeUpcoming === 'true',
        minutesAhead: minutesAhead ? parseInt(minutesAhead as string) : undefined
      });

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: result.error
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const alertsDto = AlertMapper.toResponseDtoArray(result.value!);

      res.status(200).json({
        success: true,
        data: alertsDto,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get user alerts error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async updateAlertStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);

      const { alertId } = req.params;
      const { status } = req.body;

      const updateAlertStatusUseCase = this.container.resolve<UpdateAlertStatusUseCase>(ServiceTokens.UPDATE_ALERT_STATUS_USE_CASE);
      
      const result = await updateAlertStatusUseCase.execute({
        alertId,
        userId,
        status: status as AlertStatus
      });

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: result.error
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const alertDto = AlertMapper.toResponseDto(result.value!);

      res.status(200).json({
        success: true,
        data: alertDto,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Update alert status error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async getLeadAlerts(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);

      const { leadId } = req.params;

      const alertRepository = this.container.resolve<any>(ServiceTokens.AlertRepository);
      const alerts = await alertRepository.findByLeadId(leadId);

      const alertsDto = AlertMapper.toResponseDtoArray(alerts);

      res.status(200).json({
        success: true,
        data: alertsDto,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get lead alerts error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}