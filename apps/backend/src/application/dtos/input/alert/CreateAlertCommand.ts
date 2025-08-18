import { AlertType } from '../../../../domain/entities/Alert';

export interface CreateAlertCommand {
  leadId: string;
  type: AlertType;
  title: string;
  message: string;
  alertTime: Date;
}