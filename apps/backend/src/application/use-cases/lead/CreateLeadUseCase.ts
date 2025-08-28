import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { CreateLeadCommand } from "@/application/dtos/input/lead/CreateLeadCommand";
import { LeadResponseDto } from "@/application/dtos/output/LeadResponseDto";
import { LeadMapper } from "@/application/mappers/LeadMapper";
import { Lead } from "@/domain/entities/Lead";
import { ILeadRepository } from "@/domain/repositories";
import { Email } from "@/domain/value-objects/Email";
import { UserId } from "@/domain/value-objects/UserId";

export class CreateLeadUseCase implements IUseCase<CreateLeadCommand, Result<LeadResponseDto>> {
  constructor(private leadRepository: ILeadRepository) {}

  async execute(command: CreateLeadCommand): Promise<Result<LeadResponseDto>> {
    try {
      // Verificar se email já existe
      const userId = UserId.create(command.userId);
      const email = Email.create(command.email);
      const existingLead = await this.leadRepository.findByEmail(email, userId);

      if (existingLead) {
        return Result.failure('Já existe um lead com este email');
      }

      // Criar lead
      const lead = Lead.create({
        name: command.name,
        email: command.email,
        phone: command.phone,
        company: command.company,
        address: command.address,
        stage: command.stage,
        source: command.source,
        notes: command.notes,
        colorHighlight: command.colorHighlight,
        estimatedValue: command.estimatedValue,
        expectedCloseDate: command.expectedCloseDate,
        value: command.value,
        powerKwp: command.powerKwp,
        clientType: command.clientType,
        tags: command.tags,
        userId: command.userId,
      });

      // Salvar
      const savedLead = await this.leadRepository.save(lead);

      return Result.success(LeadMapper.toResponseDto(savedLead));
    } catch (error: any) {
      return Result.failure(`Erro ao criar lead: ${error.message}`);
    }
  }
}
