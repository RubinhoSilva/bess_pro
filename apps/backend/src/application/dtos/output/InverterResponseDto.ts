import { Inverter as SharedInverter } from '@bess-pro/shared';

export type InverterResponseDto = SharedInverter;

export interface InverterListResponseDto {
  inverters: InverterResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}