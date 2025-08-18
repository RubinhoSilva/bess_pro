import { Alert, AlertType, AlertStatus } from '../../../domain/entities/Alert';
import { IAlertRepository } from '../../../domain/repositories/IAlertRepository';
import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { UserId } from '../../../domain/value-objects/UserId';
import { Result } from '../../common/Result';

export interface CreateAlertCommand {
  leadId: string;
  userId: string;
  type: AlertType;
  title: string;
  message: string;
  alertTime: Date;
}

export class CreateAlertUseCase {
  constructor(
    private alertRepository: IAlertRepository,
    private leadRepository: ILeadRepository
  ) {}

  async execute(command: CreateAlertCommand): Promise<Result<Alert>> {
    try {
      // Validate that the lead exists
      const lead = await this.leadRepository.findById(command.leadId);
      if (!lead) {
        return Result.failure('Lead não encontrado');
      }

      // Validate that the user owns the lead
      const userId = UserId.create(command.userId);
      if (!lead.isOwnedBy(userId)) {
        return Result.failure('Usuário não tem permissão para criar alertas para este lead');
      }

      // Validate alert time is in the future
      if (command.alertTime <= new Date()) {
        return Result.failure('Data do alerta deve ser no futuro');
      }

      // Create the alert
      const alert = Alert.create({
        leadId: command.leadId,
        userId: command.userId,
        type: command.type,
        title: command.title,
        message: command.message,
        alertTime: command.alertTime,
        status: AlertStatus.ACTIVE
      });

      // Save the alert
      const savedAlert = await this.alertRepository.save(alert);

      return Result.success(savedAlert);
    } catch (error) {
      console.error('Error creating alert:', error);
      return Result.failure('Erro interno do servidor');
    }
  }
}