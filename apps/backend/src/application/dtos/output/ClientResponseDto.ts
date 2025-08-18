import { ClientStatus, ClientType } from "../../../domain/entities/Client";

export interface ClientResponseDto {
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