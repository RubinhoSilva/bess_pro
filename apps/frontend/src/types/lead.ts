// Stages padrão do sistema
export enum DefaultLeadStage {
  LEAD_RECEBIDO = 'lead-recebido',
  PRE_QUALIFICACAO = 'pre-qualificacao',
  PROPOSTA_ENVIADA = 'proposta-enviada',
  DOCUMENTACAO_RECEBIDA = 'documentacao-recebida',
  PROJETO_APROVADO = 'projeto-aprovado',
  INSTALACAO_AGENDADA = 'instalacao-agendada',
  SISTEMA_ENTREGUE = 'sistema-entregue',
  CONVERTED = 'converted'
}

// Tipo flexível para suportar stages customizados
export type LeadStage = DefaultLeadStage | string;

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social-media',
  DIRECT_CONTACT = 'direct-contact',
  ADVERTISING = 'advertising',
  OTHER = 'other'
}

export enum ClientType {
  B2B = 'B2B',
  B2C = 'B2C'
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  stage: LeadStage;
  source: LeadSource;
  notes: string;
  colorHighlight: string;
  estimatedValue: number;
  expectedCloseDate: string | null;
  value?: number; // Valor do negócio em R$
  powerKwp?: number; // Potência do sistema em kWp
  clientType?: ClientType; // B2B ou B2C
  tags?: string[]; // Tags customizáveis
  userId: string;
  createdAt: string;
  updatedAt: string;
  hasProject: boolean;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  stage?: LeadStage;
  source?: LeadSource;
  notes?: string;
  colorHighlight?: string;
  estimatedValue?: number;
  expectedCloseDate?: string;
  value?: number;
  powerKwp?: number;
  clientType?: ClientType;
  tags?: string[];
}

export interface UpdateLeadRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  stage?: LeadStage;
  source?: LeadSource;
  notes?: string;
  colorHighlight?: string;
  estimatedValue?: number;
  expectedCloseDate?: string;
  value?: number;
  powerKwp?: number;
  clientType?: ClientType;
  tags?: string[];
}

export interface GetLeadsQuery {
  stage?: LeadStage;
  source?: LeadSource;
  searchTerm?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'estimatedValue' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export const LEAD_STAGE_LABELS: Record<DefaultLeadStage, string> = {
  [DefaultLeadStage.LEAD_RECEBIDO]: 'Lead Recebido',
  [DefaultLeadStage.PRE_QUALIFICACAO]: 'Pré-qualificação',
  [DefaultLeadStage.PROPOSTA_ENVIADA]: 'Proposta Enviada',
  [DefaultLeadStage.DOCUMENTACAO_RECEBIDA]: 'Documentação Recebida',
  [DefaultLeadStage.PROJETO_APROVADO]: 'Projeto Aprovado',
  [DefaultLeadStage.INSTALACAO_AGENDADA]: 'Instalação Agendada',
  [DefaultLeadStage.SISTEMA_ENTREGUE]: 'Sistema Entregue',
  [DefaultLeadStage.CONVERTED]: 'Convertido em Cliente',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  [LeadSource.WEBSITE]: 'Website',
  [LeadSource.REFERRAL]: 'Indicação',
  [LeadSource.SOCIAL_MEDIA]: 'Redes Sociais',
  [LeadSource.DIRECT_CONTACT]: 'Contato Direto',
  [LeadSource.ADVERTISING]: 'Publicidade',
  [LeadSource.OTHER]: 'Outros',
};

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  [ClientType.B2B]: 'Empresa (B2B)',
  [ClientType.B2C]: 'Pessoa Física (B2C)',
};