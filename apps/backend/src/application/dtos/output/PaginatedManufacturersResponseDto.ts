import { ManufacturerResponseDto } from './ManufacturerResponseDto';

export interface PaginatedManufacturersResponseDto {
  manufacturers: ManufacturerResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

