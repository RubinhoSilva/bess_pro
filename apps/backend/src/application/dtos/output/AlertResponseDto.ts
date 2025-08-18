import { AlertType, AlertStatus } from '../../../domain/entities/Alert';

export interface AlertResponseDto {
  id: string;
  leadId: string;
  userId: string;
  type: AlertType;
  title: string;
  message: string;
  alertTime: string; // ISO string format
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
  // Optional lead info for easier display
  leadName?: string;
  leadEmail?: string;
}