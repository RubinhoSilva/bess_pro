import { Alert, AlertStatus } from '../../../domain/entities/Alert';
import { IAlertRepository } from '../../../domain/repositories/IAlertRepository';
import { UserId } from '../../../domain/value-objects/UserId';
import { Result } from '../../common/Result';

export interface GetUserAlertsQuery {
  userId: string;
  status?: AlertStatus;
  includeOverdue?: boolean;
  includeUpcoming?: boolean;
  minutesAhead?: number;
}

export class GetUserAlertsUseCase {
  constructor(private alertRepository: IAlertRepository) {}

  async execute(query: GetUserAlertsQuery): Promise<Result<Alert[]>> {
    try {
      const userId = UserId.create(query.userId);
      let alerts: Alert[] = [];

      if (query.includeUpcoming) {
        // Get upcoming alerts
        const upcomingAlerts = await this.alertRepository.findUpcomingAlerts(
          userId, 
          query.minutesAhead || 30
        );
        alerts = [...alerts, ...upcomingAlerts];
      } else if (query.includeOverdue) {
        // Get overdue alerts
        const overdueAlerts = await this.alertRepository.findOverdueAlerts(userId);
        alerts = [...alerts, ...overdueAlerts];
      } else if (query.status) {
        // Get alerts by status
        alerts = await this.alertRepository.findByUserIdAndStatus(userId, query.status);
      } else {
        // Get all user alerts
        alerts = await this.alertRepository.findByUserId(userId);
      }

      // Remove duplicates (in case alert appears in both upcoming and overdue)
      const uniqueAlerts = alerts.filter((alert, index, self) => 
        index === self.findIndex(a => a.getId() === alert.getId())
      );

      // Sort by alert time
      uniqueAlerts.sort((a, b) => a.getAlertTime().getTime() - b.getAlertTime().getTime());

      return Result.success(uniqueAlerts);
    } catch (error) {
      console.error('Error getting user alerts:', error);
      return Result.failure('Erro interno do servidor');
    }
  }
}