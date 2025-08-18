import { IsOptional, IsString, IsEnum, IsNumberString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationQueryDTO {
  @IsOptional()
  @IsNumberString({}, { message: 'Limit deve ser um número' })
  @Transform(({ value }) => {
    const num = parseInt(value);
    if (isNaN(num)) return undefined;
    return Math.min(Math.max(num, 1), 100); // Entre 1 e 100
  })
  limit?: string;

  @IsOptional()
  @IsString({ message: 'Cursor deve ser uma string' })
  cursor?: string;

  @IsOptional()
  @IsString({ message: 'SortBy deve ser uma string' })
  @IsEnum(['alertDate', 'priority', 'title', 'createdAt', 'updatedAt'], {
    message: 'SortBy deve ser: alertDate, priority, title, createdAt ou updatedAt'
  })
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'], {
    message: 'SortOrder deve ser: asc ou desc'
  })
  sortOrder?: 'asc' | 'desc';
}

export class OffsetPaginationQueryDTO {
  @IsOptional()
  @IsNumberString({}, { message: 'Page deve ser um número' })
  @Transform(({ value }) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) return 1;
    return Math.min(num, 1000); // Máximo 1000 páginas
  })
  page?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Limit deve ser um número' })
  @Transform(({ value }) => {
    const num = parseInt(value);
    if (isNaN(num)) return undefined;
    return Math.min(Math.max(num, 1), 100); // Entre 1 e 100
  })
  limit?: string;

  @IsOptional()
  @IsString({ message: 'SortBy deve ser uma string' })
  @IsEnum(['alertDate', 'priority', 'title', 'createdAt', 'updatedAt'], {
    message: 'SortBy deve ser: alertDate, priority, title, createdAt ou updatedAt'
  })
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'], {
    message: 'SortOrder deve ser: asc ou desc'
  })
  sortOrder?: 'asc' | 'desc';
}

export class ClientAlertFiltersDTO {
  @IsOptional()
  @IsString({ message: 'ClientId deve ser uma string' })
  clientId?: string;

  @IsOptional()
  @IsEnum(['follow_up', 'task', 'reminder', 'deadline'], {
    message: 'AlertType deve ser: follow_up, task, reminder ou deadline'
  })
  alertType?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'], {
    message: 'Priority deve ser: low, medium, high ou urgent'
  })
  priority?: string;

  @IsOptional()
  @IsEnum(['pending', 'completed', 'cancelled'], {
    message: 'Status deve ser: pending, completed ou cancelled'
  })
  status?: string;

  @IsOptional()
  @IsString({ message: 'DateFrom deve ser uma data ISO válida' })
  @Transform(({ value }) => {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  })
  dateFrom?: string;

  @IsOptional()
  @IsString({ message: 'DateTo deve ser uma data ISO válida' })
  @Transform(({ value }) => {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  })
  dateTo?: string;

  @IsOptional()
  @IsEnum(['true', 'false'], {
    message: 'IsOverdue deve ser: true ou false'
  })
  @Transform(({ value }) => value === 'true')
  isOverdue?: boolean;
}