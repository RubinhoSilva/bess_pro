import { Model, model } from 'mongoose';
import { LeadInteraction, InteractionType, InteractionDirection } from '@/domain/entities/LeadInteraction';
import { LeadInteractionRepository } from '@/domain/repositories/LeadInteractionRepository';
import { LeadInteractionDocument, LeadInteractionSchema } from '../schemas/LeadInteractionSchema';

export class MongoLeadInteractionRepository implements LeadInteractionRepository {
  private model: Model<LeadInteractionDocument>;

  constructor() {
    this.model = model<LeadInteractionDocument>('LeadInteraction', LeadInteractionSchema);
  }

  async save(interaction: LeadInteraction): Promise<void> {
    const document = new this.model({
      _id: interaction.getId(),
      leadId: interaction.getLeadId(),
      userId: interaction.getUserId(),
      type: interaction.getType(),
      direction: interaction.getDirection(),
      title: interaction.getTitle(),
      description: interaction.getDescription(),
      scheduledAt: interaction.getScheduledAt(),
      completedAt: interaction.getCompletedAt(),
      metadata: interaction.getMetadata(),
      createdAt: interaction.getCreatedAt(),
      updatedAt: interaction.getUpdatedAt()
    });

    await document.save();
  }

  async findById(id: string): Promise<LeadInteraction | null> {
    const document = await this.model.findById(id);
    if (!document) return null;

    return this.toDomain(document);
  }

  async findByLeadId(leadId: string): Promise<LeadInteraction[]> {
    const documents = await this.model
      .find({ leadId })
      .sort({ createdAt: -1 });

    return documents.map(doc => this.toDomain(doc));
  }

  async findByUserId(userId: string): Promise<LeadInteraction[]> {
    const documents = await this.model
      .find({ userId })
      .sort({ createdAt: -1 });

    return documents.map(doc => this.toDomain(doc));
  }

  async update(interaction: LeadInteraction): Promise<void> {
    await this.model.findByIdAndUpdate(interaction.getId(), {
      leadId: interaction.getLeadId(),
      userId: interaction.getUserId(),
      type: interaction.getType(),
      direction: interaction.getDirection(),
      title: interaction.getTitle(),
      description: interaction.getDescription(),
      scheduledAt: interaction.getScheduledAt(),
      completedAt: interaction.getCompletedAt(),
      metadata: interaction.getMetadata(),
      updatedAt: interaction.getUpdatedAt()
    });
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  async findUpcoming(userId?: string): Promise<LeadInteraction[]> {
    const filter: any = {
      scheduledAt: { $gte: new Date() },
      completedAt: { $exists: false }
    };

    if (userId) {
      filter.userId = userId;
    }

    const documents = await this.model
      .find(filter)
      .sort({ scheduledAt: 1 });

    return documents.map(doc => this.toDomain(doc));
  }

  private toDomain(document: LeadInteractionDocument): LeadInteraction {
    return LeadInteraction.fromProps({
      leadId: document.leadId,
      userId: document.userId,
      type: document.type as InteractionType,
      direction: document.direction as InteractionDirection,
      title: document.title,
      description: document.description,
      scheduledAt: document.scheduledAt,
      completedAt: document.completedAt,
      metadata: document.metadata,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    }, document._id?.toString() || document.id);
  }
}