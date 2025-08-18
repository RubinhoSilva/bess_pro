import { IProposalTemplateRepository } from '../../../domain/repositories/IProposalTemplateRepository';
import { ProposalTemplate } from '../../../domain/entities/ProposalTemplate';

export interface CreateProposalTemplateCommand {
  name: string;
  description?: string;
  category: 'PV' | 'BESS' | 'HYBRID' | 'GENERAL';
  structure: any[];
  variables: any[];
  styling: any;
  createdBy: string;
  teamId?: string;
}

export class CreateProposalTemplateUseCase {
  constructor(
    private proposalTemplateRepository: IProposalTemplateRepository
  ) {}

  async execute(command: CreateProposalTemplateCommand): Promise<ProposalTemplate> {
    // Validate required fields
    if (!command.name?.trim()) {
      throw new Error('Template name is required');
    }

    if (!command.structure?.length) {
      throw new Error('Template must have at least one section');
    }

    // Create template
    const template = await this.proposalTemplateRepository.create({
      name: command.name.trim(),
      description: command.description?.trim(),
      category: command.category,
      isDefault: false,
      structure: command.structure,
      variables: command.variables || [],
      styling: command.styling,
      createdBy: command.createdBy,
      teamId: command.teamId
    });

    return template;
  }
}