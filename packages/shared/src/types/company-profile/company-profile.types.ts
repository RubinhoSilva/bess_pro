/**
 * Core Company Profile types
 */

export interface CompanyProfile {
  id: string;
  companyName: string;
  tradingName?: string;
  taxId?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  logoPath?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isActive: boolean;
  teamId: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyProfileProps {
  id?: string;
  companyName: string;
  tradingName?: string;
  taxId?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  logoPath?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isActive?: boolean;
  teamId: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum CompanyProfileStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}