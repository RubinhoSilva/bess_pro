import { CreateManufacturerRequest } from '@bess-pro/shared';

/**
 * Create Manufacturer Request - Alinhado com @bess-pro/shared
 * 
 * Este DTO estende o tipo compartilhado para adicionar campos específicos
 * do backend como userId/teamId para controle de acesso.
 */
export interface CreateManufacturerRequestBackend extends CreateManufacturerRequest {
  /** ID do usuário proprietário */
  userId?: string;
  
  /** ID do time */
  teamId: string;
}