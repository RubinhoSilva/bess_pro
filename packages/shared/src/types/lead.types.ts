export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  stage: LeadStage;
  priority: Priority;
  tags: string[];
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum LeadStage {
  RECEIVED = 'lead-recebido',
  QUALIFICATION = 'pre-qualificacao',
  PROPOSAL_SENT = 'proposta-enviada',
  DOCUMENTATION = 'documentacao-recebida',
  APPROVED = 'projeto-aprovado',
  INSTALLATION = 'instalacao-agendada',
  DELIVERED = 'sistema-entregue'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}
