export enum InteractionType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  WHATSAPP = 'whatsapp',
  PROPOSAL_SENT = 'proposal_sent',
  FOLLOW_UP = 'follow_up',
  NOTE = 'note',
  STAGE_CHANGE = 'stage_change'
}

export enum InteractionDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
  INTERNAL = 'internal'
}

export interface LeadInteraction {
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

export interface CreateLeadInteractionRequest {
  leadId: string;
  type: InteractionType;
  direction: InteractionDirection;
  title: string;
  description: string;
  scheduledAt?: string;
  metadata?: Record<string, any>;
}

export interface UpdateLeadInteractionRequest {
  title?: string;
  description?: string;
  scheduledAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}