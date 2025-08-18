import { Result } from '../../common/Result';
import { IUseCase } from '../../common/IUseCase';
import { LeadInteraction, InteractionType, InteractionDirection } from '@/domain/entities/LeadInteraction';
import { LeadInteractionRepository } from '@/domain/repositories/LeadInteractionRepository';

export interface CreateLeadInteractionDTO {
  leadId: string;
  userId: string;
  type: InteractionType;
  direction: InteractionDirection;
  title: string;
  description: string;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export class CreateLeadInteractionUseCase implements IUseCase<CreateLeadInteractionDTO, Result<LeadInteraction>> {
  constructor(
    private leadInteractionRepository: LeadInteractionRepository
  ) {}

  async execute(dto: CreateLeadInteractionDTO): Promise<Result<LeadInteraction>> {
    try {
      const interaction = LeadInteraction.create({
        leadId: dto.leadId,
        userId: dto.userId,
        type: dto.type,
        direction: dto.direction,
        title: dto.title,
        description: dto.description,
        scheduledAt: dto.scheduledAt,
        metadata: dto.metadata
      });

      await this.leadInteractionRepository.save(interaction);

      return Result.success(interaction);
    } catch (error) {
      return Result.failure(`Failed to create lead interaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}