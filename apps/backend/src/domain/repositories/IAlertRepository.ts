import { Alert, AlertStatus } from '../entities/Alert';
import { UserId } from '../value-objects/UserId';

export interface IAlertRepository {
  save(alert: Alert): Promise<Alert>;
  findById(id: string): Promise<Alert | null>;
  findByUserId(userId: UserId): Promise<Alert[]>;
  findByLeadId(leadId: string): Promise<Alert[]>;
  findByUserIdAndStatus(userId: UserId, status: AlertStatus): Promise<Alert[]>;
  findUpcomingAlerts(userId: UserId, minutesAhead?: number): Promise<Alert[]>;
  findOverdueAlerts(userId: UserId): Promise<Alert[]>;
  update(alert: Alert): Promise<Alert>;
  delete(id: string): Promise<void>;
}