import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { DeleteLeadCommand } from "@/application/dtos/input/lead/DeleteLeadCommand";
import { ILeadRepository } from "@/domain/repositories";
import { UserId } from "@/domain/value-objects/UserId";

export class DeleteLeadUseCase implements IUseCase<DeleteLeadCommand, Result<void>> {
  constructor(private leadRepository: ILeadRepository) {}

  async execute(command: DeleteLeadCommand): Promise<Result<void>> {
    try {
      const userId = UserId.create(command.userId);
      
      // Buscar lead existente
      const existingLead = await this.leadRepository.findById(command.leadId);
      if (!existingLead) {
        return Result.failure('Lead não encontrado');
      }

      // Verificar se o lead pertence ao usuário
      if (!existingLead.isOwnedBy(userId)) {
        return Result.failure('Acesso negado ao lead');
      }

      // Deletar
      await this.leadRepository.delete(command.leadId);

      return Result.success(undefined);
    } catch (error: any) {
      return Result.failure(`Erro ao deletar lead: ${error.message}`);
    }
  }
}