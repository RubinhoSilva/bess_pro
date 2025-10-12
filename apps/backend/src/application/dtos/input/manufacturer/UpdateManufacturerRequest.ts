import { UpdateManufacturerRequest } from '@bess-pro/shared';

/**
 * Update Manufacturer Request - Alinhado com @bess-pro/shared
 * 
 * Este DTO estende o tipo compartilhado para adicionar campos específicos
 * do backend como userId/teamId para controle de acesso.
 */
export interface UpdateManufacturerRequestBackend extends UpdateManufacturerRequest {
  /** ID do usuário proprietário */
  userId?: string;
  
  /** ID do time (opcional) */
  teamId?: string;
}

/**
 * Update Manufacturer Command - Mantido para compatibilidade
 * @deprecated Use UpdateManufacturerRequestBackend instead
 */
export interface UpdateManufacturerCommand {
  id: string;
  userId?: string;
  teamId?: string;
  name?: string;
  type?: 'SOLAR_MODULE' | 'INVERTER' | 'BOTH';
  description?: string;
  website?: string;
  contact?: {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
  };
  business?: {
    foundedYear?: number;
    headquarters?: string;
    employeeCount?: number;
    revenue?: number;
  };
  certifications?: string[];
  metadata?: {
    logoUrl?: string;
    imageUrl?: string;
    specialties?: string[];
    markets?: string[];
    qualityStandards?: string[];
  };
  status?: 'active' | 'inactive';
  isDefault?: boolean;
}