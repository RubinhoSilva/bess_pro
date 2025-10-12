/**
 * Delete Manufacturer Command - Mantido para compatibilidade
 * @deprecated Use DeleteManufacturerRequest from shared types instead
 */
export interface DeleteManufacturerCommand {
  /** ID do usuário proprietário */
  userId: string;
  
  /** ID do fabricante a ser deletado */
  id: string;
}