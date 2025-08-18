import { IClientAlertRepository } from '../../../domain/repositories/IClientAlertRepository';
import { ClientAlert } from '../../../domain/entities/ClientAlert';

export interface GetDashboardAlertsRequest {
  userId: string;
}

export interface GetDashboardAlertsResponse {
  dueAlerts: ClientAlert[];
  overdueAlerts: ClientAlert[];
  upcomingAlerts: ClientAlert[];
}

export class GetDashboardAlertsUseCase {
  constructor(
    private readonly clientAlertRepository: IClientAlertRepository
  ) {}

  async execute(request: GetDashboardAlertsRequest): Promise<GetDashboardAlertsResponse> {
    const [dueAlerts, overdueAlerts, upcomingAlerts] = await Promise.all([
      this.clientAlertRepository.findDueAlerts(request.userId),
      this.clientAlertRepository.findOverdueAlerts(request.userId),
      this.clientAlertRepository.findUpcomingAlerts(request.userId, 7) // Próximos 7 dias
    ]);

    return {
      dueAlerts,
      overdueAlerts,
      upcomingAlerts
    };
  }
}