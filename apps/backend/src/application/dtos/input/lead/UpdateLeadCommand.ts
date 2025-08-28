import { LeadStage, LeadSource, ClientType } from '@/domain/entities/Lead';

export interface UpdateLeadCommand {
  leadId: string;
  userId: string;
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
  expectedCloseDate?: Date;
  value?: number; // Valor do negócio em R$
  powerKwp?: number; // Potência do sistema em kWp
  clientType?: ClientType; // B2B ou B2C
  tags?: string[]; // Tags customizáveis
}