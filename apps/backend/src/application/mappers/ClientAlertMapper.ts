import { ClientAlert, AlertType, AlertPriority } from '../../domain/entities/ClientAlert';
import { ClientAlertDTO, CreateClientAlertDTO } from '../dtos/ClientAlertDTO';

export class ClientAlertMapper {
  static toDTO(alert: ClientAlert): ClientAlertDTO {
    return {
      id: alert.getId(),
      clientId: alert.getClientId(),
      title: alert.getTitle(),
      description: alert.getDescription(),
      alertDate: alert.getAlertDate().toISOString(),
      alertType: alert.getAlertType(),
      priority: alert.getPriority(),
      status: alert.getStatus(),
      isRecurring: alert.getIsRecurring(),
      recurringPattern: alert.getRecurringPattern(),
      isOverdue: alert.isOverdue(),
      isDue: alert.isDue(),
      createdAt: alert.getCreatedAt().toISOString(),
      updatedAt: alert.getUpdatedAt().toISOString()
    };
  }

  static toDTOList(alerts: ClientAlert[]): ClientAlertDTO[] {
    return alerts.map(alert => this.toDTO(alert));
  }

  static fromCreateDTO(dto: CreateClientAlertDTO, userId: string): {
    clientId: string;
    userId: string;
    title: string;
    description?: string;
    alertDate: Date;
    alertType: AlertType;
    priority: AlertPriority;
    isRecurring?: boolean;
    recurringPattern?: string;
  } {
    return {
      clientId: dto.clientId,
      userId,
      title: dto.title,
      description: dto.description,
      alertDate: new Date(dto.alertDate),
      alertType: dto.alertType as AlertType,
      priority: dto.priority as AlertPriority,
      isRecurring: dto.isRecurring,
      recurringPattern: dto.recurringPattern
    };
  }
}