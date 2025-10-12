import { InverterFilters } from '@bess-pro/shared';

/**
 * Get Inverters Query - Alinhado com @bess-pro/shared
 * 
 * Este DTO estende o tipo compartilhado para adicionar campos específicos
 * do backend como userId para controle de acesso.
 */
export interface GetInvertersQuery extends InverterFilters {
  /** ID do usuário para filtrar equipamentos acessíveis */
  userId?: string;
  
  /** Campos de paginação */
  page?: number;
  pageSize?: number;
  
  /** Ordenação */
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  /** Propriedades adicionais para compatibilidade */
  search?: string; // Alias para searchTerm
  fabricante?: string; // Alias para manufacturer
  tipoRede?: string; // Alias para gridType
  potenciaMin?: number; // Alias para minPower
  potenciaMax?: number; // Alias para maxPower
  moduleReferencePower?: number; // Para cálculo de módulos suportados
}