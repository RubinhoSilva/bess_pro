import { ClientAlert, AlertStatus, AlertType, AlertPriority } from '../entities/ClientAlert';
import { ISoftDeleteRepository } from './base/ISoftDeleteRepository';
import { PaginationRequest, PaginationResponse, OffsetPaginationRequest, OffsetPaginationResponse } from '../../shared/interfaces/Pagination';

export interface ClientAlertFilters {
  clientId?: string;
  userId?: string;
  alertType?: AlertType;
  priority?: AlertPriority;
  status?: AlertStatus;
  dateFrom?: Date;
  dateTo?: Date;
  isOverdue?: boolean;
}

export interface IClientAlertRepository extends ISoftDeleteRepository<ClientAlert> {
  // Métodos específicos para alertas
  save(entity: ClientAlert): Promise<ClientAlert>;
  updateAlert(id: string, updateData: any): Promise<ClientAlert | null>;
  deleteAlert(id: string): Promise<boolean>;
  
  // Métodos legados (mantidos para compatibilidade)
  findByClientId(clientId: string): Promise<ClientAlert[]>;
  findByUserId(userId: string): Promise<ClientAlert[]>;
  findByFilters(filters: ClientAlertFilters): Promise<ClientAlert[]>;
  findDueAlerts(userId: string): Promise<ClientAlert[]>;
  findOverdueAlerts(userId: string): Promise<ClientAlert[]>;
  findUpcomingAlerts(userId: string, days: number): Promise<ClientAlert[]>;
  
  // Métodos para estatísticas e performance
  getDashboardStats(userId: string): Promise<any>;
  getPerformanceMetrics(): Promise<any>;

  // Novos métodos com paginação
  findWithPagination(
    filters: ClientAlertFilters,
    pagination: PaginationRequest
  ): Promise<PaginationResponse<ClientAlert>>;

  findWithOffsetPagination(
    filters: ClientAlertFilters,
    pagination: OffsetPaginationRequest
  ): Promise<OffsetPaginationResponse<ClientAlert>>;

  findByClientIdWithPagination(
    clientId: string,
    pagination: PaginationRequest
  ): Promise<PaginationResponse<ClientAlert>>;

  findDashboardAlertsWithPagination(
    userId: string,
    pagination: PaginationRequest
  ): Promise<{
    dueAlerts: PaginationResponse<ClientAlert>;
    overdueAlerts: PaginationResponse<ClientAlert>;
    upcomingAlerts: PaginationResponse<ClientAlert>;
  }>;
}