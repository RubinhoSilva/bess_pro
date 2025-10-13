import { UpdateManufacturerRequest } from '@bess-pro/shared';

/**
 * Update Manufacturer Request - Alinhado com @bess-pro/shared
 * 
 * Este DTO estende o tipo compartilhado para adicionar campos específicos
 * do backend como userId/teamId para controle de acesso.
 */
export interface UpdateManufacturerRequestBackend extends UpdateManufacturerRequest {
  /** ID do fabricante a ser atualizado */
  id: string;
}