import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { LeadResponseDto } from "@/application/dtos/output/LeadResponseDto";
import { LeadMapper } from "@/application/mappers/LeadMapper";
import { ILeadRepository } from "@/domain/repositories";
import { UserId } from "@/domain/value-objects/UserId";

interface GetLeadByIdQuery {
  leadId: string;
  userId: string;
}

export class GetLeadByIdUseCase implements IUseCase<GetLeadByIdQuery, Result<LeadResponseDto>> {
  constructor(private leadRepository: ILeadRepository) {}

  async execute(query: GetLeadByIdQuery): Promise<Result<LeadResponseDto>> {
    try {
      const userId = UserId.create(query.userId);
      
      // Buscar lead
      const lead = await this.leadRepository.findById(query.leadId);
      if (!lead) {
        return Result.failure('Lead não encontrado');
      }

      // Verificar se o lead pertence ao usuário
      if (!lead.isOwnedBy(userId)) {
        return Result.failure('Acesso negado ao lead');
      }

      return Result.success(LeadMapper.toResponseDto(lead));
    } catch (error: any) {
      return Result.failure(`Erro ao buscar lead: ${error.message}`);
    }
  }
}