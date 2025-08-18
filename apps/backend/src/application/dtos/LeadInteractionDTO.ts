import { InteractionType, InteractionDirection } from '@/domain/entities/LeadInteraction';

export interface LeadInteractionDTO {
  id: string;
  leadId: string;
  userId: string;
  type: InteractionType;
  direction: InteractionDirection;
  title: string;
  description: string;
  scheduledAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInteractionRequestDTO {
  leadId: string;
  type: InteractionType;
  direction: InteractionDirection;
  title: string;
  description: string;
  scheduledAt?: string;
  metadata?: Record<string, any>;
}

export interface UpdateLeadInteractionRequestDTO {
  title?: string;
  description?: string;
  scheduledAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}