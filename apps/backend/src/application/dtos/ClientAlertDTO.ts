import { IsString, IsEnum, IsOptional, IsMongoId, MaxLength, IsBoolean, IsDateString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export interface ClientAlertDTO {
  id: string;
  clientId: string;
  title: string;
  description: string;
  alertDate: string; // ISO string
  alertType: string;
  priority: string;
  status: string;
  isRecurring: boolean;
  recurringPattern: string | null;
  isOverdue: boolean;
  isDue: boolean;
  createdAt: string;
  updatedAt: string;
}

export class CreateClientAlertDTO {
  @IsMongoId({ message: 'ID do cliente deve ser um MongoDB ObjectId válido' })
  clientId!: string;

  @IsString({ message: 'Título é obrigatório' })
  @MinLength(3, { message: 'Título deve ter pelo menos 3 caracteres' })
  @MaxLength(200, { message: 'Título deve ter no máximo 200 caracteres' })
  @Transform(({ value }) => value?.trim())
  title!: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(1000, { message: 'Descrição deve ter no máximo 1000 caracteres' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsDateString({}, { message: 'Data do alerta deve estar em formato ISO válido' })
  alertDate!: string;

  @IsEnum(['follow_up', 'task', 'reminder', 'deadline'], {
    message: 'Tipo de alerta deve ser: follow_up, task, reminder ou deadline'
  })
  alertType!: string;

  @IsEnum(['low', 'medium', 'high', 'urgent'], {
    message: 'Prioridade deve ser: low, medium, high ou urgent'
  })
  priority!: string;

  @IsOptional()
  @IsBoolean({ message: 'isRecurring deve ser um valor booleano' })
  isRecurring?: boolean;

  @IsOptional()
  @IsString({ message: 'Padrão de recorrência deve ser uma string' })
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'], {
    message: 'Padrão de recorrência deve ser: daily, weekly, monthly ou yearly'
  })
  recurringPattern?: string;
}

export class UpdateClientAlertDTO {
  @IsOptional()
  @IsString({ message: 'Título deve ser uma string' })
  @MinLength(3, { message: 'Título deve ter pelo menos 3 caracteres' })
  @MaxLength(200, { message: 'Título deve ter no máximo 200 caracteres' })
  @Transform(({ value }) => value?.trim())
  title?: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(1000, { message: 'Descrição deve ter no máximo 1000 caracteres' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data do alerta deve estar em formato ISO válido' })
  alertDate?: string;

  @IsOptional()
  @IsEnum(['follow_up', 'task', 'reminder', 'deadline'], {
    message: 'Tipo de alerta deve ser: follow_up, task, reminder ou deadline'
  })
  alertType?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'], {
    message: 'Prioridade deve ser: low, medium, high ou urgent'
  })
  priority?: string;

  @IsOptional()
  @IsEnum(['pending', 'completed', 'cancelled'], {
    message: 'Status deve ser: pending, completed ou cancelled'
  })
  status?: string;

  @IsOptional()
  @IsBoolean({ message: 'isRecurring deve ser um valor booleano' })
  isRecurring?: boolean;

  @IsOptional()
  @IsString({ message: 'Padrão de recorrência deve ser uma string' })
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'], {
    message: 'Padrão de recorrência deve ser: daily, weekly, monthly ou yearly'
  })
  recurringPattern?: string;
}