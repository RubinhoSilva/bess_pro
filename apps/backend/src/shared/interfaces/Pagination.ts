export interface PaginationRequest {
  limit?: number;
  cursor?: string; // ID do último item da página anterior
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
    totalCount?: number; // Opcional, pode ser custoso calcular
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export interface OffsetPaginationRequest {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OffsetPaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

// Classe utilitária para paginação
export class PaginationUtils {
  static readonly DEFAULT_LIMIT = 20;
  static readonly MAX_LIMIT = 100;
  static readonly MIN_LIMIT = 1;

  static validateLimit(limit?: number): number {
    if (!limit) return this.DEFAULT_LIMIT;
    
    if (limit < this.MIN_LIMIT) return this.MIN_LIMIT;
    if (limit > this.MAX_LIMIT) return this.MAX_LIMIT;
    
    return Math.floor(limit);
  }

  static validatePage(page?: number): number {
    if (!page || page < 1) return 1;
    return Math.floor(page);
  }

  static validateSortOrder(sortOrder?: string): 'asc' | 'desc' {
    return sortOrder === 'desc' ? 'desc' : 'asc';
  }

  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static calculateTotalPages(totalCount: number, limit: number): number {
    return Math.ceil(totalCount / limit);
  }

  // Para cursor-based pagination
  static buildMongoSort(sortBy: string, sortOrder: 'asc' | 'desc'): Record<string, 1 | -1> {
    const direction = sortOrder === 'asc' ? 1 : -1;
    return {
      [sortBy]: direction,
      _id: direction // Sempre incluir _id como tie-breaker
    };
  }

  // Construir filtro de cursor para MongoDB
  static buildCursorFilter(
    cursor: string, 
    sortBy: string, 
    sortOrder: 'asc' | 'desc',
    cursorValue: any
  ): Record<string, any> {
    const operator = sortOrder === 'asc' ? '$gt' : '$lt';
    
    return {
      $or: [
        { [sortBy]: { [operator]: cursorValue } },
        { 
          [sortBy]: cursorValue,
          _id: { [operator]: cursor }
        }
      ]
    };
  }

  // Extrair cursor de um documento
  static extractCursor(doc: any, sortBy: string): string {
    return doc._id.toString();
  }

  // Extrair valor do campo de ordenação
  static extractSortValue(doc: any, sortBy: string): any {
    return doc[sortBy];
  }
}

// Interface para repositórios com paginação
export interface IPaginatableRepository<T> {
  findWithPagination(
    filters: Record<string, any>,
    pagination: PaginationRequest
  ): Promise<PaginationResponse<T>>;

  findWithOffsetPagination(
    filters: Record<string, any>,
    pagination: OffsetPaginationRequest
  ): Promise<OffsetPaginationResponse<T>>;
}

// DTO para validação de paginação
export interface PaginationQueryDTO {
  limit?: string;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: string;
}

// Tipos para diferentes estratégias de paginação
export type PaginationStrategy = 'cursor' | 'offset';

export interface PaginationConfig {
  strategy: PaginationStrategy;
  defaultLimit: number;
  maxLimit: number;
  defaultSortBy: string;
  defaultSortOrder: 'asc' | 'desc';
}