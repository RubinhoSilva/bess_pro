export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  POTENTIAL = 'potential',
  BLOCKED = 'blocked'
}

export enum ClientType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial'
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: ClientStatus;
  clientType: ClientType;
  notes?: string;
  tags: string[];
  totalProjectsValue: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status?: ClientStatus;
  clientType?: ClientType;
  notes?: string;
  tags?: string[];
  totalProjectsValue?: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status?: ClientStatus;
  clientType?: ClientType;
  notes?: string;
  tags?: string[];
  totalProjectsValue?: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
}

export interface ClientListResponse {
  clients: Client[];
  total: number;
  totalPages: number;
  currentPage: number;
}