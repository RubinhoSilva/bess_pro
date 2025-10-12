import { SolarModule as SharedSolarModule, PaginatedModules } from '@bess-pro/shared';

export type SolarModuleResponseDto = SharedSolarModule;

export interface SolarModuleListResponseDto {
  modules: SolarModuleResponseDto[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface SolarModuleListResponseDto {
  modules: SolarModuleResponseDto[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}