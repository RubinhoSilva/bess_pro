import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { UpdateLeadStageCommand } from "@/application/dtos/input/lead/UpdateLeadStageCommand";
import { LeadResponseDto } from "@/application/dtos/output/LeadResponseDto";
import { LeadMapper } from "@/application/mappers/LeadMapper";
import { ILeadRepository } from "@/domain/repositories";
import { UserId } from "@/domain/value-objects/UserId";

export class UpdateLeadStageUseCase implements IUseCase<UpdateLeadStageCommand, Result<LeadResponseDto>> {
  constructor(private leadRepository: ILeadRepository) {}

  async execute(command: UpdateLeadStageCommand): Promise<Result<LeadResponseDto>> {
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

      // Atualizar estágio
      existingLead.updateStage(command.stage);
      const updatedLead = await this.leadRepository.update(existingLead);

      return Result.success(LeadMapper.toResponseDto(updatedLead));
    } catch (error: any) {
      return Result.failure(`Erro ao atualizar estágio do lead: ${error.message}`);
    }
  }
}