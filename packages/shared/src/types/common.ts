// Tipos comuns foram movidos para arquivos específicos para evitar conflitos
// User -> user.types.ts
// Lead -> lead.types.ts

// Tipos base comuns que podem ser usados em toda a aplicação
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type Status = 'active' | 'inactive' | 'pending' | 'deleted';

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}
