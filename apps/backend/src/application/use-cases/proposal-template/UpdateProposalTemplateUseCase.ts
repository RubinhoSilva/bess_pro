import { IProposalTemplateRepository } from '../../../domain/repositories/IProposalTemplateRepository';
import { ProposalTemplate } from '../../../domain/entities/ProposalTemplate';

export interface UpdateProposalTemplateCommand {
  id: string;
  name?: string;
  description?: string;
  structure?: any[];
  variables?: any[];
  styling?: any;
  isDefault?: boolean;
}

export class UpdateProposalTemplateUseCase {
  constructor(
    private proposalTemplateRepository: IProposalTemplateRepository
  ) {}

  async execute(command: UpdateProposalTemplateCommand): Promise<ProposalTemplate> {
    const existingTemplate = await this.proposalTemplateRepository.findById(command.id);
    if (!existingTemplate) {
      throw new Error('Template not found');
    }

    // Validate updates
    const updates: Partial<ProposalTemplate> = {};

    if (command.name !== undefined) {
      if (!command.name.trim()) {
        throw new Error('Template name cannot be empty');
      }
      updates.name = command.name.trim();
    }

    if (command.description !== undefined) {
      updates.description = command.description.trim() || undefined;
    }

    if (command.structure !== undefined) {
      if (!command.structure.length) {
        throw new Error('Template must have at least one section');
      }
      updates.structure = command.structure;
    }

    if (command.variables !== undefined) {
      updates.variables = command.variables;
    }

    if (command.styling !== undefined) {
      updates.styling = command.styling;
    }

    if (command.isDefault !== undefined) {
      updates.isDefault = command.isDefault;
    }

    const updatedTemplate = await this.proposalTemplateRepository.update(command.id, updates);

    // If setting as default, ensure no other templates in same category are default
    if (command.isDefault === true) {
      await this.proposalTemplateRepository.setAsDefault(command.id, existingTemplate.teamId);
    }

    return updatedTemplate;
  }
}