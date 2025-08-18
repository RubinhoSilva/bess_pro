import { IClientAlertRepository } from '../../../domain/repositories/IClientAlertRepository';
import { ClientAlert, AlertType, AlertPriority, AlertStatus } from '../../../domain/entities/ClientAlert';

export interface CreateClientAlertRequest {
  clientId: string;
  userId: string;
  title: string;
  description?: string;
  alertDate: Date;
  alertType: AlertType;
  priority: AlertPriority;
  isRecurring?: boolean;
  recurringPattern?: string;
}

export interface CreateClientAlertResponse {
  alert: ClientAlert;
}

export class CreateClientAlertUseCase {
  constructor(
    private readonly clientAlertRepository: IClientAlertRepository
  ) {}

  async execute(request: CreateClientAlertRequest): Promise<CreateClientAlertResponse> {
    const alert = ClientAlert.create({
      clientId: request.clientId,
      userId: request.userId,
      title: request.title,
      description: request.description,
      alertDate: request.alertDate,
      alertType: request.alertType,
      priority: request.priority,
      status: AlertStatus.PENDING,
      isRecurring: request.isRecurring,
      recurringPattern: request.recurringPattern
    });

    await this.clientAlertRepository.save(alert);

    return { alert };
  }
}