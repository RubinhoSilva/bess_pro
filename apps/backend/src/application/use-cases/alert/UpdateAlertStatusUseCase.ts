import { Alert, AlertStatus } from '../../../domain/entities/Alert';
import { IAlertRepository } from '../../../domain/repositories/IAlertRepository';
import { UserId } from '../../../domain/value-objects/UserId';
import { Result } from '../../common/Result';

export interface UpdateAlertStatusCommand {
  alertId: string;
  userId: string;
  status: AlertStatus;
}

export class UpdateAlertStatusUseCase {
  constructor(private alertRepository: IAlertRepository) {}

  async execute(command: UpdateAlertStatusCommand): Promise<Result<Alert>> {
    try {
      // Find the alert
      const alert = await this.alertRepository.findById(command.alertId);
      if (!alert) {
        return Result.failure('Alerta não encontrado');
      }

      // Validate that the user owns the alert
      const userId = UserId.create(command.userId);
      if (!alert.getUserId().equals(userId)) {
        return Result.failure('Usuário não tem permissão para modificar este alerta');
      }

      // Update the alert status
      alert.updateStatus(command.status);

      // Save the updated alert
      const updatedAlert = await this.alertRepository.update(alert);

      return Result.success(updatedAlert);
    } catch (error) {
      console.error('Error updating alert status:', error);
      return Result.failure('Erro interno do servidor');
    }
  }
}