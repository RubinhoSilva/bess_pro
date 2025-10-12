import { CreateInverterRequest } from '@bess-pro/shared';

/**
 * Create Inverter Request - Alinhado com @bess-pro/shared
 * 
 * Este DTO estende o tipo compartilhado para adicionar campos específicos
 * do backend como userId para controle de acesso.
 */
export interface CreateInverterRequestBackend extends CreateInverterRequest {
  /** ID do usuário proprietário do inversor */
  userId: string;
  
  /** Flag para indicar se é equipamento público */
  isPublic?: boolean;
}