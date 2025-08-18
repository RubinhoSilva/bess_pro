import { Result } from '../../common/Result';
import { IUseCase } from '../../common/IUseCase';
import { LeadInteractionRepository } from '@/domain/repositories/LeadInteractionRepository';

export interface DeleteLeadInteractionDTO {
  id: string;
}

export class DeleteLeadInteractionUseCase implements IUseCase<DeleteLeadInteractionDTO, Result<void>> {
  constructor(
    private leadInteractionRepository: LeadInteractionRepository
  ) {}

  async execute(dto: DeleteLeadInteractionDTO): Promise<Result<void>> {
    try {
      const interaction = await this.leadInteractionRepository.findById(dto.id);
      if (!interaction) {
        return Result.failure('Lead interaction not found');
      }

      await this.leadInteractionRepository.delete(dto.id);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(`Failed to delete lead interaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}