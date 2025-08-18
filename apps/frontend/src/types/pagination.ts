// Tipos base para paginação
export interface PaginationRequest {
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
  previousCursor?: string;
  totalCount?: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface OffsetPaginationRequest {
  page: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OffsetPaginationResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Resposta paginada genérica
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationResponse;
}

export interface OffsetPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: OffsetPaginationResponse;
}

// Configurações de paginação para componentes
export interface PaginationConfig {
  initialLimit?: number;
  maxLimit?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  showTotalCount?: boolean;
  showPageNumbers?: boolean;
  strategy?: 'cursor' | 'offset';
}

// Estado local de paginação
export interface PaginationState {
  limit: number;
  cursor?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  loading: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount?: number;
}

export interface OffsetPaginationState {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  loading: boolean;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Parâmetros para filtros
export interface FilterParams {
  [key: string]: string | number | boolean | Date | undefined;
}

// Hook de paginação cursor-based
export interface UsePaginationOptions {
  initialLimit?: number;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  filters?: FilterParams;
  enabled?: boolean;
}

export interface UsePaginationResult<T> {
  data: T[];
  pagination: PaginationState;
  nextPage: () => void;
  previousPage: () => void;
  setLimit: (limit: number) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  refresh: () => void;
  isLoading: boolean;
  error: Error | null;
}

// Hook de paginação offset-based
export interface UseOffsetPaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  filters?: FilterParams;
  enabled?: boolean;
}

export interface UseOffsetPaginationResult<T> {
  data: T[];
  pagination: OffsetPaginationState;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setLimit: (limit: number) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  refresh: () => void;
  isLoading: boolean;
  error: Error | null;
}

// Constantes
export const PAGINATION_LIMITS = [10, 20, 50, 100] as const;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Utilitários
export class PaginationUtils {
  static buildQueryString(params: PaginationRequest & FilterParams): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  }

  static buildOffsetQueryString(params: OffsetPaginationRequest & FilterParams): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  }

  static validateLimit(limit?: number): number {
    if (!limit) return DEFAULT_LIMIT;
    return Math.min(Math.max(limit, 1), MAX_LIMIT);
  }

  static validatePage(page?: number): number {
    if (!page || page < 1) return 1;
    return Math.floor(page);
  }

  static calculatePageNumbers(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
    const pages: number[] = [];
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Ajustar início se estivermos próximos do final
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}

// Tipos para componentes de paginação
export interface PaginationControlsProps {
  pagination: PaginationState | OffsetPaginationState;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onLimitChange?: (limit: number) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  showLimitSelector?: boolean;
  showSorting?: boolean;
  className?: string;
}

export interface OffsetPaginationControlsProps extends PaginationControlsProps {
  pagination: OffsetPaginationState;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
}