/**
 * Company Profile Response types
 */

export interface CompanyProfileResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyProfileListResponse {
  companyProfiles: CompanyProfileResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UploadCompanyLogoResponse {
  logoUrl: string;
  logoPath: string;
}