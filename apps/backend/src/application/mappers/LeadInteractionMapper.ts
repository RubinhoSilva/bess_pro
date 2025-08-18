import { LeadInteraction } from '@/domain/entities/LeadInteraction';
import { LeadInteractionDTO } from '../dtos/LeadInteractionDTO';

export class LeadInteractionMapper {
  public static toDTO(interaction: LeadInteraction): LeadInteractionDTO {
    return {
      id: interaction.getId()!,
      leadId: interaction.getLeadId(),
      userId: interaction.getUserId(),
      type: interaction.getType(),
      direction: interaction.getDirection(),
      title: interaction.getTitle(),
      description: interaction.getDescription(),
      scheduledAt: interaction.getScheduledAt()?.toISOString(),
      completedAt: interaction.getCompletedAt()?.toISOString(),
      metadata: interaction.getMetadata(),
      createdAt: interaction.getCreatedAt()!.toISOString(),
      updatedAt: interaction.getUpdatedAt()!.toISOString()
    };
  }

  public static toDTOList(interactions: LeadInteraction[]): LeadInteractionDTO[] {
    return interactions.map(interaction => this.toDTO(interaction));
  }
}