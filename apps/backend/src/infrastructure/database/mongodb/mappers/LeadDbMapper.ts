import { Lead, LeadStage, LeadSource, ClientType } from '../../../../domain/entities/Lead';
import { LeadDocument } from '../schemas/LeadSchema';
import { Types } from 'mongoose';

export class LeadDbMapper {
  static toDomain(doc: LeadDocument): Lead {
    return Lead.create({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      company: doc.company,
      address: doc.address,
      stage: doc.stage as LeadStage,
      source: doc.source as LeadSource,
      notes: doc.notes,
      colorHighlight: doc.colorHighlight,
      estimatedValue: doc.estimatedValue,
      expectedCloseDate: doc.expectedCloseDate,
      value: doc.value,
      powerKwp: doc.powerKwp,
      clientType: doc.clientType as ClientType,
      tags: doc.tags,
      userId: doc.userId.toString(),
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toDbDocument(lead: Lead): Partial<LeadDocument> {
    const leadId = lead.getId();
    const userId = lead.getUserId().getValue();
    
    return {
      _id: Types.ObjectId.isValid(leadId) ? new Types.ObjectId(leadId) : new Types.ObjectId(),
      name: lead.getName().getValue(),
      email: lead.getEmail().getValue(),
      phone: lead.getPhone(),
      company: lead.getCompany(),
      address: lead.getAddress(),
      stage: lead.getStage(),
      source: lead.getSource(),
      notes: lead.getNotes(),
      colorHighlight: lead.getColorHighlight(),
      estimatedValue: lead.getEstimatedValue(),
      expectedCloseDate: lead.getExpectedCloseDate() || undefined,
      value: lead.getValue(),
      powerKwp: lead.getPowerKwp(),
      clientType: lead.getClientType(),
      tags: lead.getTags(),
      userId: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : new Types.ObjectId(),
      isDeleted: lead.isDeleted(),
      deletedAt: lead.getDeletedAt() || undefined,
      createdAt: lead.getCreatedAt(),
      updatedAt: lead.getUpdatedAt(),
    };
  }

  static toDbUpdate(lead: Lead): Partial<LeadDocument> {
    return {
      name: lead.getName().getValue(),
      email: lead.getEmail().getValue(),
      phone: lead.getPhone(),
      company: lead.getCompany(),
      address: lead.getAddress(),
      stage: lead.getStage(),
      source: lead.getSource(),
      notes: lead.getNotes(),
      colorHighlight: lead.getColorHighlight(),
      estimatedValue: lead.getEstimatedValue(),
      expectedCloseDate: lead.getExpectedCloseDate() || undefined,
      value: lead.getValue(),
      powerKwp: lead.getPowerKwp(),
      clientType: lead.getClientType(),
      tags: lead.getTags(),
      isDeleted: lead.isDeleted(),
      deletedAt: lead.getDeletedAt() || undefined,
      updatedAt: lead.getUpdatedAt(),
    };
  }

  static toDbInsert(lead: Lead): Omit<LeadDocument, '_id' | 'createdAt' | 'updatedAt'> {
    const userId = lead.getUserId().getValue();
    
    return {
      name: lead.getName().getValue(),
      email: lead.getEmail().getValue(),
      phone: lead.getPhone(),
      company: lead.getCompany(),
      address: lead.getAddress(),
      stage: lead.getStage(),
      source: lead.getSource(),
      notes: lead.getNotes(),
      colorHighlight: lead.getColorHighlight(),
      estimatedValue: lead.getEstimatedValue(),
      expectedCloseDate: lead.getExpectedCloseDate() || undefined,
      value: lead.getValue(),
      powerKwp: lead.getPowerKwp(),
      clientType: lead.getClientType(),
      tags: lead.getTags(),
      userId: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : new Types.ObjectId(),
      isDeleted: lead.isDeleted(),
      deletedAt: lead.getDeletedAt() || undefined,
    } as Omit<LeadDocument, '_id' | 'createdAt' | 'updatedAt'>;
  }
}