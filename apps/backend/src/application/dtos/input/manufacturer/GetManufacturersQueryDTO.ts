import { IsOptional, IsString, IsEnum, IsNumberString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ManufacturerType } from '@/domain/entities/Manufacturer';

export class GetManufacturersQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page deve ser um número inteiro' })
  @Min(1, { message: 'Page deve ser maior que 0' })
  @Max(1000, { message: 'Page deve ser menor que 1000' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit deve ser um número inteiro' })
  @Min(1, { message: 'Limit deve ser maior que 0' })
  @Max(100, { message: 'Limit deve ser menor que 100' })
  limit?: number;

  @IsOptional()
  @IsEnum(ManufacturerType, {
    message: 'Type deve ser: SOLAR_MODULE, INVERTER ou BOTH'
  })
  type?: ManufacturerType;

  @IsOptional()
  @IsString({ message: 'Search deve ser uma string' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'SortBy deve ser uma string' })
  @IsEnum(['name', 'type', 'country', 'createdAt', 'updatedAt'], {
    message: 'SortBy deve ser: name, type, country, createdAt ou updatedAt'
  })
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'], {
    message: 'SortOrder deve ser: asc ou desc'
  })
  sortOrder?: 'asc' | 'desc';
}

