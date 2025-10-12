import { ManufacturerFilters } from '@bess-pro/shared';

/**
 * Get Manufacturers Query - Alinhado com @bess-pro/shared
 * 
 * Este DTO estende os filtros compartilhados para adicionar campos específicos
 * do backend como userId/teamId para controle de acesso e paginação.
 */
export interface GetManufacturersQuery extends ManufacturerFilters {
  /** ID do usuário proprietário */
  userId?: string;
  
  /** ID do time (opcional) */
  teamId?: string;
  
  /** Campo de busca geral (compatibilidade) */
  search?: string;
  
  /** Paginação */
  page?: number;
  pageSize?: number;
  
  /** Ordenação */
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}