import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { GetLeadsQuery } from "@/application/dtos/input/lead/GetLeadsQuery";
import { LeadResponseDto } from "@/application/dtos/output/LeadResponseDto";
import { LeadMapper } from "@/application/mappers/LeadMapper";
import { ILeadRepository } from "@/domain/repositories";
import { UserId } from "@/domain/value-objects/UserId";

export class GetLeadsUseCase implements IUseCase<GetLeadsQuery, Result<LeadResponseDto[]>> {
  constructor(private leadRepository: ILeadRepository) {}

  async execute(query: GetLeadsQuery): Promise<Result<LeadResponseDto[]>> {
    try {
      const userId = UserId.create(query.userId);
      let leads;

      if (query.searchTerm) {
        leads = await this.leadRepository.searchByTerm(userId, query.searchTerm);
      } else if (query.stage) {
        leads = await this.leadRepository.findByStage(userId, query.stage);
      } else if (query.source) {
        leads = await this.leadRepository.findBySource(userId, query.source);
      } else {
        // Default sorting and filtering
        switch (query.sortBy) {
          case 'updatedAt':
            leads = await this.leadRepository.findByUserIdOrderedByUpdatedDate(userId, query.sortOrder === 'asc');
            break;
          case 'estimatedValue':
            leads = await this.leadRepository.findByUserIdOrderedByValue(userId, query.sortOrder === 'asc');
            break;
          case 'name':
          case 'createdAt':
          default:
            leads = await this.leadRepository.findByUserIdOrderedByDate(userId, query.sortOrder === 'asc');
            break;
        }
      }

      return Result.success(LeadMapper.toResponseDtoList(leads));
    } catch (error: any) {
      return Result.failure(`Erro ao buscar leads: ${error.message}`);
    }
  }
}