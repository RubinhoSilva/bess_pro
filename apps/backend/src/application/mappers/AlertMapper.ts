import { Alert } from '../../domain/entities/Alert';
import { AlertResponseDto } from '../dtos/output/AlertResponseDto';

export class AlertMapper {
  static toResponseDto(alert: Alert): AlertResponseDto {
    return {
      id: alert.getId(),
      leadId: alert.getLeadId(),
      userId: alert.getUserId().getValue(),
      type: alert.getType(),
      title: alert.getTitle(),
      message: alert.getMessage(),
      alertTime: alert.getAlertTime().toISOString(),
      status: alert.getStatus(),
      createdAt: alert.getCreatedAt().toISOString(),
      updatedAt: alert.getUpdatedAt().toISOString(),
    };
  }

  static toResponseDtoArray(alerts: Alert[]): AlertResponseDto[] {
    return alerts.map(alert => this.toResponseDto(alert));
  }
}