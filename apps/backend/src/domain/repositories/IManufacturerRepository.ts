import { Manufacturer, ManufacturerType } from "../entities/Manufacturer";

export interface ManufacturerFilters {
  type?: ManufacturerType;
  search?: string;
  teamId?: string;
}

export interface ManufacturerPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedManufacturersResult {
  manufacturers: Manufacturer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IManufacturerRepository {
  create(manufacturer: Manufacturer): Promise<Manufacturer>;
  findById(id: string): Promise<Manufacturer | null>;
  findByName(name: string, teamId?: string): Promise<Manufacturer | null>;
  findByType(type: ManufacturerType, teamId?: string): Promise<Manufacturer[]>;
  findAccessibleByTeam(teamId?: string): Promise<Manufacturer[]>;
  findDefaults(): Promise<Manufacturer[]>;
  findPaginated(
    filters: ManufacturerFilters,
    pagination: ManufacturerPaginationOptions
  ): Promise<PaginatedManufacturersResult>;
  update(id: string, manufacturer: Manufacturer): Promise<Manufacturer | null>;
  delete(id: string): Promise<boolean>;
  exists(name: string, excludeId?: string, teamId?: string): Promise<boolean>;
  hasEquipment(manufacturerId: string): Promise<boolean>;
}