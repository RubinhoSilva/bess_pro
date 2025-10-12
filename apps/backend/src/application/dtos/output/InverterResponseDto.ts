import { Inverter as SharedInverter } from '@bess-pro/shared';

export type InverterResponseDto = SharedInverter;

export interface InverterListResponseDto {
  inverters: InverterResponseDto[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}