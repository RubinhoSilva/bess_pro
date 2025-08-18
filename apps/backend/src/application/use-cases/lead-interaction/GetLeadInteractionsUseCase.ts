import { Result } from '../../common/Result';
import { IUseCase } from '../../common/IUseCase';
import { LeadInteraction } from '@/domain/entities/LeadInteraction';
import { LeadInteractionRepository } from '@/domain/repositories/LeadInteractionRepository';

export interface GetLeadInteractionsDTO {
  leadId: string;
}

export class GetLeadInteractionsUseCase implements IUseCase<GetLeadInteractionsDTO, Result<LeadInteraction[]>> {
  constructor(
    private leadInteractionRepository: LeadInteractionRepository
  ) {}

  async execute(dto: GetLeadInteractionsDTO): Promise<Result<LeadInteraction[]>> {
    try {
      const interactions = await this.leadInteractionRepository.findByLeadId(dto.leadId);
      return Result.success(interactions);
    } catch (error) {
      return Result.failure(`Failed to get lead interactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}