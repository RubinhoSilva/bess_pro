import { Alert, AlertStatus } from '../../../../domain/entities/Alert';
import { IAlertRepository } from '../../../../domain/repositories/IAlertRepository';
import { UserId } from '../../../../domain/value-objects/UserId';
import { AlertModel } from '../schemas/AlertSchema';
import { AlertDbMapper } from '../mappers/AlertDbMapper';
import { Types } from 'mongoose';

export class MongoAlertRepository implements IAlertRepository {
  async save(alert: Alert): Promise<Alert> {
    const alertDoc = AlertDbMapper.toDbInsert(alert);
    const createdDoc = await AlertModel.create(alertDoc);
    return AlertDbMapper.toDomain(createdDoc);
  }

  async findById(id: string): Promise<Alert | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const doc = await AlertModel.findById(id);
    return doc ? AlertDbMapper.toDomain(doc) : null;
  }

  async findByUserId(userId: UserId): Promise<Alert[]> {
    const userObjectId = new Types.ObjectId(userId.getValue());
    const docs = await AlertModel.find({ userId: userObjectId })
      .sort({ alertTime: 1 });
    
    return docs.map(doc => AlertDbMapper.toDomain(doc));
  }

  async findByLeadId(leadId: string): Promise<Alert[]> {
    if (!Types.ObjectId.isValid(leadId)) {
      return [];
    }

    const leadObjectId = new Types.ObjectId(leadId);
    const docs = await AlertModel.find({ leadId: leadObjectId })
      .sort({ alertTime: 1 });
    
    return docs.map(doc => AlertDbMapper.toDomain(doc));
  }

  async findByUserIdAndStatus(userId: UserId, status: AlertStatus): Promise<Alert[]> {
    const userObjectId = new Types.ObjectId(userId.getValue());
    const docs = await AlertModel.find({ 
      userId: userObjectId, 
      status: status 
    }).sort({ alertTime: 1 });
    
    return docs.map(doc => AlertDbMapper.toDomain(doc));
  }

  async findUpcomingAlerts(userId: UserId, minutesAhead: number = 30): Promise<Alert[]> {
    const userObjectId = new Types.ObjectId(userId.getValue());
    const now = new Date();
    const upcomingTime = new Date(now.getTime() + (minutesAhead * 60 * 1000));

    const docs = await AlertModel.find({
      userId: userObjectId,
      status: AlertStatus.ACTIVE,
      alertTime: { $gte: now, $lte: upcomingTime }
    }).sort({ alertTime: 1 });
    
    return docs.map(doc => AlertDbMapper.toDomain(doc));
  }

  async findOverdueAlerts(userId: UserId): Promise<Alert[]> {
    const userObjectId = new Types.ObjectId(userId.getValue());
    const now = new Date();

    const docs = await AlertModel.find({
      userId: userObjectId,
      status: AlertStatus.ACTIVE,
      alertTime: { $lt: now }
    }).sort({ alertTime: 1 });
    
    return docs.map(doc => AlertDbMapper.toDomain(doc));
  }

  async update(alert: Alert): Promise<Alert> {
    const id = alert.getId();
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('ID de alerta inválido');
    }

    const updateData = AlertDbMapper.toDbUpdate(alert);
    const updatedDoc = await AlertModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      throw new Error('Alerta não encontrado para atualização');
    }

    return AlertDbMapper.toDomain(updatedDoc);
  }

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('ID de alerta inválido');
    }

    const result = await AlertModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Alerta não encontrado para exclusão');
    }
  }
}