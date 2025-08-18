import { Result } from '../../common/Result';
import { IUseCase } from '../../common/IUseCase';
import { LeadInteraction } from '@/domain/entities/LeadInteraction';
import { LeadInteractionRepository } from '@/domain/repositories/LeadInteractionRepository';

export interface UpdateLeadInteractionDTO {
  id: string;
  title?: string;
  description?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export class UpdateLeadInteractionUseCase implements IUseCase<UpdateLeadInteractionDTO, Result<LeadInteraction>> {
  constructor(
    private leadInteractionRepository: LeadInteractionRepository
  ) {}

  async execute(dto: UpdateLeadInteractionDTO): Promise<Result<LeadInteraction>> {
    try {
      const interaction = await this.leadInteractionRepository.findById(dto.id);
      if (!interaction) {
        return Result.failure('Lead interaction not found');
      }

      if (dto.title) {
        interaction.updateDescription(dto.title);
      }

      if (dto.description) {
        interaction.updateDescription(dto.description);
      }

      if (dto.metadata) {
        interaction.updateMetadata(dto.metadata);
      }

      if (dto.completedAt) {
        interaction.markAsCompleted();
      }

      await this.leadInteractionRepository.update(interaction);

      return Result.success(interaction);
    } catch (error) {
      return Result.failure(`Failed to update lead interaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}