import { LeadInteraction } from '../entities/LeadInteraction';

export interface LeadInteractionRepository {
  save(interaction: LeadInteraction): Promise<void>;
  findById(id: string): Promise<LeadInteraction | null>;
  findByLeadId(leadId: string): Promise<LeadInteraction[]>;
  findByUserId(userId: string): Promise<LeadInteraction[]>;
  update(interaction: LeadInteraction): Promise<void>;
  delete(id: string): Promise<void>;
  findUpcoming(userId?: string): Promise<LeadInteraction[]>;
}