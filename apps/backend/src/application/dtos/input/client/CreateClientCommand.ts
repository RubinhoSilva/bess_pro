export interface CreateClientCommand {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status?: string;
  clientType?: string;
  notes?: string;
  tags?: string[];
  totalProjectsValue?: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
}