import { Alert, AlertType, AlertStatus } from '../../../../domain/entities/Alert';
import { AlertDocument } from '../schemas/AlertSchema';
import { Types } from 'mongoose';

export class AlertDbMapper {
  static toDomain(doc: AlertDocument): Alert {
    return Alert.create({
      id: doc._id.toString(),
      leadId: doc.leadId.toString(),
      userId: doc.userId.toString(),
      type: doc.type as AlertType,
      title: doc.title,
      message: doc.message,
      alertTime: doc.alertTime,
      status: doc.status as AlertStatus,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toDbDocument(alert: Alert): Partial<AlertDocument> {
    const alertId = alert.getId();
    const leadId = alert.getLeadId();
    const userId = alert.getUserId().getValue();
    
    return {
      _id: Types.ObjectId.isValid(alertId) ? new Types.ObjectId(alertId) : new Types.ObjectId(),
      leadId: Types.ObjectId.isValid(leadId) ? new Types.ObjectId(leadId) : new Types.ObjectId(),
      userId: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : new Types.ObjectId(),
      type: alert.getType(),
      title: alert.getTitle(),
      message: alert.getMessage(),
      alertTime: alert.getAlertTime(),
      status: alert.getStatus(),
    };
  }

  static toDbUpdate(alert: Alert): Partial<AlertDocument> {
    return {
      type: alert.getType(),
      title: alert.getTitle(),
      message: alert.getMessage(),
      alertTime: alert.getAlertTime(),
      status: alert.getStatus(),
      updatedAt: new Date(),
    };
  }

  static toDbInsert(alert: Alert): Omit<AlertDocument, '_id' | 'createdAt' | 'updatedAt'> {
    const leadId = alert.getLeadId();
    const userId = alert.getUserId().getValue();
    
    return {
      leadId: Types.ObjectId.isValid(leadId) ? new Types.ObjectId(leadId) : new Types.ObjectId(),
      userId: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : new Types.ObjectId(),
      type: alert.getType(),
      title: alert.getTitle(),
      message: alert.getMessage(),
      alertTime: alert.getAlertTime(),
      status: alert.getStatus(),
    } as Omit<AlertDocument, '_id' | 'createdAt' | 'updatedAt'>;
  }
}