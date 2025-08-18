import { IClientAlertRepository } from '../../../domain/repositories/IClientAlertRepository';
import { ClientAlert, AlertType, AlertPriority, AlertStatus } from '../../../domain/entities/ClientAlert';
import { ClientAlertError, AppError } from '../../../shared/errors/AppError';

export interface UpdateClientAlertRequest {
  alertId: string;
  userId: string;
  title?: string;
  description?: string;
  alertDate?: Date;
  alertType?: AlertType;
  priority?: AlertPriority;
  status?: AlertStatus;
  isRecurring?: boolean;
  recurringPattern?: string;
}

export interface UpdateClientAlertResponse {
  alert: ClientAlert;
}

export class UpdateClientAlertUseCase {
  constructor(
    private readonly clientAlertRepository: IClientAlertRepository
  ) {}

  async execute(request: UpdateClientAlertRequest): Promise<UpdateClientAlertResponse> {
    const alert = await this.clientAlertRepository.findById(request.alertId);
    
    if (!alert) {
      throw ClientAlertError.alertNotFound();
    }

    // Verificar se o usuário é o dono do alerta
    if (alert.getUserId() !== request.userId) {
      throw AppError.forbidden('Você não tem permissão para atualizar este alerta');
    }

    // Atualizar campos se fornecidos
    if (request.title !== undefined) {
      alert.updateTitle(request.title);
    }

    if (request.description !== undefined) {
      alert.updateDescription(request.description);
    }

    if (request.alertDate !== undefined) {
      alert.updateAlertDate(request.alertDate);
    }

    if (request.alertType !== undefined) {
      alert.updateAlertType(request.alertType);
    }

    if (request.priority !== undefined) {
      alert.updatePriority(request.priority);
    }

    if (request.status !== undefined) {
      alert.updateStatus(request.status);
    }

    if (request.isRecurring !== undefined) {
      alert.updateRecurringSettings(request.isRecurring, request.recurringPattern);
    }

    await this.clientAlertRepository.updateAlert(alert.getId()!, alert);

    return { alert };
  }
}