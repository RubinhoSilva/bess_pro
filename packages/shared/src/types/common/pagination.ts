import { Inverter } from '../inverter';
import { SolarModule } from '../module';
import { Manufacturer } from '../manufacturer';

export interface PaginatedInverters {
  inverters: Inverter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginatedModules {
  modules: SolarModule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginatedManufacturers {
  manufacturers: Manufacturer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}