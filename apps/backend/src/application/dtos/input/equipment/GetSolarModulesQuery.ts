import { ModuleFilters } from '@bess-pro/shared';

/**
 * Get Solar Modules Query - Alinhado com @bess-pro/shared
 * 
 * Este DTO estende o tipo compartilhado para adicionar campos específicos
 * do backend como userId para controle de acesso.
 */
export interface GetSolarModulesQuery extends ModuleFilters {
  /** ID do usuário para filtrar equipamentos acessíveis */
  userId: string;
  
  /** Campos de paginação */
  page?: number;
  pageSize?: number;
  
  /** Ordenação */
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  /** Propriedades adicionais para compatibilidade */
  search?: string; // Alias para searchTerm
  fabricante?: string; // Alias para manufacturer
  tipoCelula?: string; // Alias para cellType
  potenciaMin?: number; // Alias para minPower
  potenciaMax?: number; // Alias para maxPower
}

/**
 * Get Solar Modules Query Original - Mantido para compatibilidade
 * @deprecated Use GetSolarModulesQuery instead
 */
export interface GetSolarModulesQueryOriginal {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  fabricante?: string;
  tipoCelula?: string;
  potenciaMin?: number;
  potenciaMax?: number;
}