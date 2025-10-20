import { SolarModule as SharedSolarModule, PaginatedModules } from '@bess-pro/shared';

export type SolarModuleResponseDto = SharedSolarModule;

export interface SolarModuleListResponseDto {
  modules: SolarModuleResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}