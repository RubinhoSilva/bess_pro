/**
 * Company Profile Request types
 */

export interface CreateCompanyProfileRequest {
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
  // teamId é obtido do token JWT, não do body da requisição
}

export interface UpdateCompanyProfileRequest {
  companyName?: string;
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
}

export interface UploadCompanyLogoRequest {
  file: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: any;
  };
  companyProfileId: string;
}

export interface DeleteCompanyLogoRequest {
  companyProfileId: string;
}