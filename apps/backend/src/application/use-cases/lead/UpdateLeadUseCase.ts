import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { UpdateLeadCommand } from "@/application/dtos/input/lead/UpdateLeadCommand";
import { LeadResponseDto } from "@/application/dtos/output/LeadResponseDto";
import { LeadMapper } from "@/application/mappers/LeadMapper";
import { ILeadRepository } from "@/domain/repositories";
import { UserId } from "@/domain/value-objects/UserId";
import { Email } from "@/domain/value-objects/Email";

export class UpdateLeadUseCase implements IUseCase<UpdateLeadCommand, Result<LeadResponseDto>> {
  constructor(private leadRepository: ILeadRepository) {}

  async execute(command: UpdateLeadCommand): Promise<Result<LeadResponseDto>> {
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

      // Verificar se email já existe (se alterado)
      if (command.email && command.email !== existingLead.getEmail().getValue()) {
        const email = Email.create(command.email);
        const leadWithEmail = await this.leadRepository.findByEmail(email, userId);
        if (leadWithEmail && leadWithEmail.getId() !== command.leadId) {
          return Result.failure('Já existe um lead com este email');
        }
      }

      // Atualizar campos
      if (command.name) existingLead.updateName(command.name);
      if (command.email) existingLead.updateEmail(command.email);
      if (command.phone !== undefined) existingLead.updatePhone(command.phone);
      if (command.company !== undefined) existingLead.updateCompany(command.company);
      if (command.address !== undefined) existingLead.updateAddress(command.address);
      if (command.stage) existingLead.updateStage(command.stage);
      if (command.source) existingLead.updateSource(command.source);
      if (command.notes !== undefined) existingLead.updateNotes(command.notes);
      if (command.colorHighlight !== undefined) existingLead.updateColorHighlight(command.colorHighlight);
      if (command.estimatedValue !== undefined) existingLead.updateEstimatedValue(command.estimatedValue);
      if (command.expectedCloseDate !== undefined) existingLead.updateExpectedCloseDate(command.expectedCloseDate);
      if (command.value !== undefined) existingLead.updateValue(command.value);
      if (command.powerKwp !== undefined) existingLead.updatePowerKwp(command.powerKwp);
      if (command.clientType) existingLead.updateClientType(command.clientType);
      if (command.tags !== undefined) existingLead.updateTags(command.tags);

      // Salvar
      const updatedLead = await this.leadRepository.update(existingLead);

      return Result.success(LeadMapper.toResponseDto(updatedLead));
    } catch (error: any) {
      return Result.failure(`Erro ao atualizar lead: ${error.message}`);
    }
  }
}