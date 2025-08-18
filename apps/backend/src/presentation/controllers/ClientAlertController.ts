import { Request, Response } from 'express';
import { CreateClientAlertUseCase } from '../../application/use-cases/client-alerts/CreateClientAlertUseCase';
import { GetClientAlertsUseCase } from '../../application/use-cases/client-alerts/GetClientAlertsUseCase';
import { UpdateClientAlertUseCase } from '../../application/use-cases/client-alerts/UpdateClientAlertUseCase';
import { GetDashboardAlertsUseCase } from '../../application/use-cases/client-alerts/GetDashboardAlertsUseCase';
import { ClientAlertMapper } from '../../application/mappers/ClientAlertMapper';
import { CreateClientAlertDTO, UpdateClientAlertDTO } from '../../application/dtos/ClientAlertDTO';
import { PaginationQueryDTO, OffsetPaginationQueryDTO, ClientAlertFiltersDTO } from '../../application/dtos/PaginationDTO';
import { AlertType, AlertPriority, AlertStatus } from '../../domain/entities/ClientAlert';
import { AppError, ClientAlertError } from '../../shared/errors/AppError';
import { asyncErrorHandler } from '../middleware/error-handler.middleware';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

// Utility para acessar usuário de forma type-safe
function getUserFromRequest(req: Request): { id: string; role: string; email: string } | undefined {
  return (req as any).user;
}

export class ClientAlertController {
  constructor(
    private readonly createClientAlertUseCase: CreateClientAlertUseCase,
    private readonly getClientAlertsUseCase: GetClientAlertsUseCase,
    private readonly updateClientAlertUseCase: UpdateClientAlertUseCase,
    private readonly getDashboardAlertsUseCase: GetDashboardAlertsUseCase
  ) {}

  create = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized();
    }

    // DTO já foi validado pelo middleware de validação
    const dto = req.body as CreateClientAlertDTO;
    
    // Validação de negócio: data deve ser no futuro
    const alertDate = new Date(dto.alertDate);
    if (alertDate <= new Date()) {
      throw ClientAlertError.invalidDate();
    }

    const createRequest = ClientAlertMapper.fromCreateDTO(dto, userId);
    const { alert } = await this.createClientAlertUseCase.execute(createRequest);
    
    res.status(201).json({
      success: true,
      data: ClientAlertMapper.toDTO(alert),
      message: 'Alerta criado com sucesso'
    });
  });

  getAll = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized();
    }

    const { clientId, alertType, priority, status, dateFrom, dateTo, isOverdue } = req.query;

    const filters: any = {};
    if (clientId) filters.clientId = clientId as string;
    if (alertType) filters.alertType = alertType as AlertType;
    if (priority) filters.priority = priority as AlertPriority;
    if (status) filters.status = status as AlertStatus;
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);
    if (isOverdue === 'true') filters.isOverdue = true;

    const { alerts } = await this.getClientAlertsUseCase.execute({
      userId,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    });

    res.json({
      success: true,
      data: ClientAlertMapper.toDTOList(alerts),
      meta: {
        total: alerts.length,
        filters: filters
      }
    });
  });

  async getByClientId(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserFromRequest(req)?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { clientId } = req.params;
      
      const { alerts } = await this.getClientAlertsUseCase.execute({
        userId,
        filters: { clientId }
      });

      res.json(ClientAlertMapper.toDTOList(alerts));
    } catch (error) {
      console.error('Error getting client alerts by client ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  update = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized();
    }

    const { id } = req.params;
    if (!id) {
      throw AppError.badRequest('ID do alerta é obrigatório');
    }

    // DTO já foi validado pelo middleware
    const dto = req.body as UpdateClientAlertDTO;

    // Validação de negócio para data
    if (dto.alertDate) {
      const alertDate = new Date(dto.alertDate);
      if (alertDate <= new Date()) {
        throw ClientAlertError.invalidDate();
      }
    }

    const updateRequest = {
      alertId: id,
      userId,
      ...dto,
      alertDate: dto.alertDate ? new Date(dto.alertDate) : undefined,
      alertType: dto.alertType as AlertType | undefined,
      priority: dto.priority as AlertPriority | undefined,
      status: dto.status as AlertStatus | undefined
    };

    const { alert } = await this.updateClientAlertUseCase.execute(updateRequest);
    
    res.json({
      success: true,
      data: ClientAlertMapper.toDTO(alert),
      message: 'Alerta atualizado com sucesso'
    });
  });

  // Novo método com paginação cursor-based
  getAllPaginated = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized();
    }

    // Query já foi validada pelo middleware
    const paginationQuery = req.query as any as PaginationQueryDTO;
    const filtersQuery = req.query as any as ClientAlertFiltersDTO;

    // Converter query params para objetos de paginação
    const pagination = {
      limit: paginationQuery.limit ? parseInt(paginationQuery.limit) : undefined,
      cursor: paginationQuery.cursor,
      sortBy: paginationQuery.sortBy,
      sortOrder: paginationQuery.sortOrder
    };

    const filters = {
      userId, // Sempre filtrar pelo usuário atual
      clientId: filtersQuery.clientId,
      alertType: filtersQuery.alertType as AlertType,
      priority: filtersQuery.priority as AlertPriority,
      status: filtersQuery.status as AlertStatus,
      dateFrom: filtersQuery.dateFrom ? new Date(filtersQuery.dateFrom) : undefined,
      dateTo: filtersQuery.dateTo ? new Date(filtersQuery.dateTo) : undefined,
      isOverdue: filtersQuery.isOverdue
    };

    // Remover propriedades undefined
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const repository = this.getClientAlertsUseCase['clientAlertRepository'];
    const result = await repository.findWithPagination(filters, pagination);

    // Converter dados para DTO
    const response = {
      success: true,
      data: result.data.map(alert => ClientAlertMapper.toDTO(alert)),
      pagination: result.pagination
    };

    res.json(response);
  });

  // Método com paginação offset-based (para compatibilidade)
  getAllOffsetPaginated = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized();
    }

    const paginationQuery = req.query as any as OffsetPaginationQueryDTO;
    const filtersQuery = req.query as any as ClientAlertFiltersDTO;

    const pagination = {
      page: paginationQuery.page ? parseInt(paginationQuery.page) : 1,
      limit: paginationQuery.limit ? parseInt(paginationQuery.limit) : 20,
      sortBy: paginationQuery.sortBy,
      sortOrder: paginationQuery.sortOrder
    };

    const filters = {
      userId,
      clientId: filtersQuery.clientId,
      alertType: filtersQuery.alertType as AlertType,
      priority: filtersQuery.priority as AlertPriority,
      status: filtersQuery.status as AlertStatus,
      dateFrom: filtersQuery.dateFrom ? new Date(filtersQuery.dateFrom) : undefined,
      dateTo: filtersQuery.dateTo ? new Date(filtersQuery.dateTo) : undefined,
      isOverdue: filtersQuery.isOverdue
    };

    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const repository = this.getClientAlertsUseCase['clientAlertRepository'];
    const result = await repository.findWithOffsetPagination(filters, pagination);

    const response = {
      success: true,
      data: result.data.map(alert => ClientAlertMapper.toDTO(alert)),
      pagination: result.pagination
    };

    res.json(response);
  });

  getByClientIdPaginated = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized();
    }

    const { clientId } = req.params;
    if (!clientId) {
      throw AppError.badRequest('ClientId é obrigatório');
    }

    const paginationQuery = req.query as any as PaginationQueryDTO;
    
    const pagination = {
      limit: paginationQuery.limit ? parseInt(paginationQuery.limit) : undefined,
      cursor: paginationQuery.cursor,
      sortBy: paginationQuery.sortBy,
      sortOrder: paginationQuery.sortOrder
    };

    const repository = this.getClientAlertsUseCase['clientAlertRepository'];
    const result = await repository.findByClientIdWithPagination(clientId, pagination);

    const response = {
      success: true,
      data: result.data.map(alert => ClientAlertMapper.toDTO(alert)),
      pagination: result.pagination
    };

    res.json(response);
  });

  getDashboardAlertsPaginated = asyncErrorHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      throw AppError.unauthorized();
    }

    const paginationQuery = req.query as any as PaginationQueryDTO;
    
    const pagination = {
      limit: paginationQuery.limit ? parseInt(paginationQuery.limit) : undefined,
      cursor: paginationQuery.cursor,
      sortBy: paginationQuery.sortBy,
      sortOrder: paginationQuery.sortOrder
    };

    const repository = this.getClientAlertsUseCase['clientAlertRepository'];
    const result = await repository.findDashboardAlertsWithPagination(userId, pagination);

    const response = {
      success: true,
      data: {
        dueAlerts: {
          data: result.dueAlerts.data.map(alert => ClientAlertMapper.toDTO(alert)),
          pagination: result.dueAlerts.pagination
        },
        overdueAlerts: {
          data: result.overdueAlerts.data.map(alert => ClientAlertMapper.toDTO(alert)),
          pagination: result.overdueAlerts.pagination
        },
        upcomingAlerts: {
          data: result.upcomingAlerts.data.map(alert => ClientAlertMapper.toDTO(alert)),
          pagination: result.upcomingAlerts.pagination
        }
      }
    };

    res.json(response);
  });

  async getDashboardAlerts(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserFromRequest(req)?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { dueAlerts, overdueAlerts, upcomingAlerts } = await this.getDashboardAlertsUseCase.execute({ userId });

      res.json({
        dueAlerts: ClientAlertMapper.toDTOList(dueAlerts),
        overdueAlerts: ClientAlertMapper.toDTOList(overdueAlerts),
        upcomingAlerts: ClientAlertMapper.toDTOList(upcomingAlerts)
      });
    } catch (error) {
      console.error('Error getting dashboard alerts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}