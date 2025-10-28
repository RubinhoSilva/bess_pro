/**
 * Company Profile Validation types
 */

export interface CompanyProfileValidation {
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
  isActive?: string;
}

export interface CompanyProfileValidationError {
  field: string;
  message: string;
}