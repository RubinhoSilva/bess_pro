import { ILeadRepository } from '../../../../domain/repositories/ILeadRepository';
import { Lead, LeadStage, LeadSource } from '../../../../domain/entities/Lead';
import { Email } from '../../../../domain/value-objects/Email';
import { UserId } from '../../../../domain/value-objects/UserId';
import { LeadModel, LeadDocument } from '../schemas/LeadSchema';
import { LeadDbMapper } from '../mappers/LeadDbMapper';
import { Types } from 'mongoose';

export class MongoLeadRepository implements ILeadRepository {
  async save(lead: Lead): Promise<Lead> {
    const leadDoc = LeadDbMapper.toDbInsert(lead);
    const createdDoc = await LeadModel.create(leadDoc);
    return LeadDbMapper.toDomain(createdDoc);
  }

  async findById(id: string): Promise<Lead | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const doc = await LeadModel.findOne({ _id: id, isDeleted: { $ne: true } });
    return doc ? LeadDbMapper.toDomain(doc) : null;
  }

  async findAll(): Promise<Lead[]> {
    const docs = await LeadModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    return docs.map(LeadDbMapper.toDomain);
  }

  async update(lead: Lead): Promise<Lead> {
    const leadId = lead.getId();
    const updateData = LeadDbMapper.toDbUpdate(lead);
    
    const updatedDoc = await LeadModel.findByIdAndUpdate(
      leadId,
      updateData,
      { new: true }
    );
    
    if (!updatedDoc) {
      throw new Error(`Lead with ID ${leadId} not found`);
    }
    
    return LeadDbMapper.toDomain(updatedDoc);
  }

  async delete(id: string): Promise<void> {
    // Default delete is now soft delete
    await this.softDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const count = await LeadModel.countDocuments({ _id: id, isDeleted: { $ne: true } });
    return count > 0;
  }

  async findByUserId(userId: UserId): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const docs = await LeadModel.find({ 
      userId: objectId, 
      isDeleted: { $ne: true } 
    }).sort({ createdAt: -1 });
    return docs.map(LeadDbMapper.toDomain);
  }

  async findByEmail(email: Email, userId: UserId): Promise<Lead | null> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const doc = await LeadModel.findOne({ 
      email: email.getValue(), 
      userId: objectId,
      isDeleted: { $ne: true }
    });
    
    return doc ? LeadDbMapper.toDomain(doc) : null;
  }

  async findByCompany(company: string, userId: UserId): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const docs = await LeadModel.find({ 
      company: new RegExp(company, 'i'), 
      userId: objectId,
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  async findCreatedBetween(userId: UserId, startDate: Date, endDate: Date): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const docs = await LeadModel.find({
      userId: objectId,
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  async searchByTerm(userId: UserId, searchTerm: string): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const regex = new RegExp(searchTerm, 'i');
    const docs = await LeadModel.find({
      userId: objectId,
      isDeleted: { $ne: true },
      $or: [
        { name: regex },
        { email: regex },
        { company: regex },
        { phone: regex }
      ]
    }).sort({ createdAt: -1 });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  async countByUserId(userId: UserId): Promise<number> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    return await LeadModel.countDocuments({ userId: objectId, isDeleted: { $ne: true } });
  }

  async findLeadsWithoutProject(userId: UserId): Promise<Lead[]> {
    // This would require a join with Project collection - for now return all leads
    return this.findByUserId(userId);
  }

  async findByRegion(userId: UserId, region: string): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const docs = await LeadModel.find({
      userId: objectId,
      address: new RegExp(region, 'i'),
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  async findByUserIdOrderedByDate(userId: UserId, ascending: boolean = false): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const sortOrder = ascending ? 1 : -1;
    const docs = await LeadModel.find({ userId: objectId, isDeleted: { $ne: true } }).sort({ createdAt: sortOrder });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  async findByStage(userId: UserId, stage: LeadStage): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const docs = await LeadModel.find({ 
      userId: objectId, 
      stage: stage,
      isDeleted: { $ne: true }
    }).sort({ updatedAt: -1 });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  async findBySource(userId: UserId, source: LeadSource): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const docs = await LeadModel.find({ 
      userId: objectId, 
      source: source,
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  async findByStages(userId: UserId, stages: LeadStage[]): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const docs = await LeadModel.find({ 
      userId: objectId, 
      stage: { $in: stages },
      isDeleted: { $ne: true }
    }).sort({ updatedAt: -1 });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  async countByStage(userId: UserId): Promise<Record<LeadStage, number>> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const pipeline = [
      { $match: { userId: objectId, isDeleted: { $ne: true } } },
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ];
    
    const results = await LeadModel.aggregate(pipeline);
    
    // Initialize all stages with 0
    const stageCount: Record<LeadStage, number> = {
      [LeadStage.LEAD_RECEBIDO]: 0,
      [LeadStage.PRE_QUALIFICACAO]: 0,
      [LeadStage.PROPOSTA_ENVIADA]: 0,
      [LeadStage.DOCUMENTACAO_RECEBIDA]: 0,
      [LeadStage.PROJETO_APROVADO]: 0,
      [LeadStage.INSTALACAO_AGENDADA]: 0,
      [LeadStage.SISTEMA_ENTREGUE]: 0,
      [LeadStage.CONVERTED]: 0
    };
    
    // Fill with actual counts
    results.forEach(result => {
      if (result._id in stageCount) {
        stageCount[result._id as LeadStage] = result.count;
      }
    });
    
    return stageCount;
  }

  async updateStage(leadId: string, stage: LeadStage): Promise<void> {
    const result = await LeadModel.findByIdAndUpdate(
      leadId,
      { stage, updatedAt: new Date() },
      { new: true }
    );
    
    if (!result) {
      throw new Error(`Lead with ID ${leadId} not found`);
    }
  }

  async updateColorHighlight(leadId: string, color: string): Promise<void> {
    const result = await LeadModel.findByIdAndUpdate(
      leadId,
      { colorHighlight: color, updatedAt: new Date() },
      { new: true }
    );
    
    if (!result) {
      throw new Error(`Lead with ID ${leadId} not found`);
    }
  }

  async findByEstimatedValueRange(userId: UserId, minValue: number, maxValue: number): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const docs = await LeadModel.find({
      userId: objectId,
      estimatedValue: { $gte: minValue, $lte: maxValue },
      isDeleted: { $ne: true }
    }).sort({ estimatedValue: -1 });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  async findByExpectedCloseDateRange(userId: UserId, startDate: Date, endDate: Date): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const docs = await LeadModel.find({
      userId: objectId,
      expectedCloseDate: { $gte: startDate, $lte: endDate },
      isDeleted: { $ne: true }
    }).sort({ expectedCloseDate: 1 });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  async findByUserIdOrderedByValue(userId: UserId, ascending: boolean = false): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const sortOrder = ascending ? 1 : -1;
    const docs = await LeadModel.find({ userId: objectId, isDeleted: { $ne: true } }).sort({ estimatedValue: sortOrder });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  async findByUserIdOrderedByUpdatedDate(userId: UserId, ascending: boolean = false): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const sortOrder = ascending ? 1 : -1;
    const docs = await LeadModel.find({ 
      userId: objectId,
      isDeleted: { $ne: true } 
    }).sort({ updatedAt: sortOrder });
    
    return docs.map(LeadDbMapper.toDomain);
  }

  // Soft Delete Operations
  async softDelete(id: string): Promise<void> {
    const result = await LeadModel.findByIdAndUpdate(
      id,
      { 
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!result) {
      throw new Error(`Lead with ID ${id} not found`);
    }
  }

  async restore(id: string): Promise<void> {
    const result = await LeadModel.findByIdAndUpdate(
      id,
      { 
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!result) {
      throw new Error(`Lead with ID ${id} not found`);
    }
  }

  async findByIdIncludingDeleted(id: string): Promise<Lead | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const doc = await LeadModel.findById(id);
    return doc ? LeadDbMapper.toDomain(doc) : null;
  }

  async findAllIncludingDeleted(): Promise<Lead[]> {
    const docs = await LeadModel.find().sort({ createdAt: -1 });
    return docs.map(LeadDbMapper.toDomain);
  }

  async findDeleted(): Promise<Lead[]> {
    const docs = await LeadModel.find({ isDeleted: true }).sort({ deletedAt: -1 });
    return docs.map(LeadDbMapper.toDomain);
  }

  async hardDelete(id: string): Promise<void> {
    const result = await LeadModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error(`Lead with ID ${id} not found`);
    }
  }

  async isDeleted(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const doc = await LeadModel.findById(id, 'isDeleted');
    return doc?.isDeleted || false;
  }

  // Lead-specific soft delete operations
  async findByUserIdIncludingDeleted(userId: UserId): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const docs = await LeadModel.find({ userId: objectId }).sort({ createdAt: -1 });
    return docs.map(LeadDbMapper.toDomain);
  }

  async findDeletedByUserId(userId: UserId): Promise<Lead[]> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    const docs = await LeadModel.find({ 
      userId: objectId, 
      isDeleted: true 
    }).sort({ deletedAt: -1 });
    return docs.map(LeadDbMapper.toDomain);
  }

  async countDeletedByUserId(userId: UserId): Promise<number> {
    const userIdValue = userId.getValue();
    const objectId = Types.ObjectId.isValid(userIdValue) 
      ? new Types.ObjectId(userIdValue) 
      : new Types.ObjectId();
    
    return await LeadModel.countDocuments({ 
      userId: objectId, 
      isDeleted: true 
    });
  }
}