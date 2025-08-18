import { IClientAlertRepository, ClientAlertFilters } from '../../../domain/repositories/IClientAlertRepository';
import { ClientAlert } from '../../../domain/entities/ClientAlert';

export interface GetClientAlertsRequest {
  userId: string;
  filters?: ClientAlertFilters;
}

export interface GetClientAlertsResponse {
  alerts: ClientAlert[];
}

export class GetClientAlertsUseCase {
  constructor(
    private readonly clientAlertRepository: IClientAlertRepository
  ) {}

  async execute(request: GetClientAlertsRequest): Promise<GetClientAlertsResponse> {
    let alerts: ClientAlert[];

    if (request.filters) {
      // Garantir que o userId esteja sempre nos filtros para segurança
      const filters = { ...request.filters, userId: request.userId };
      alerts = await this.clientAlertRepository.findByFilters(filters);
    } else {
      alerts = await this.clientAlertRepository.findByUserId(request.userId);
    }

    return { alerts };
  }
}