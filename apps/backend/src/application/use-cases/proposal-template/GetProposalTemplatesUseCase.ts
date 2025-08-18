import { IProposalTemplateRepository } from '../../../domain/repositories/IProposalTemplateRepository';
import { ProposalTemplate } from '../../../domain/entities/ProposalTemplate';

export interface GetProposalTemplatesQuery {
  teamId?: string;
  category?: string;
  includeDefaults?: boolean;
}

export class GetProposalTemplatesUseCase {
  constructor(
    private proposalTemplateRepository: IProposalTemplateRepository
  ) {}

  async execute(query: GetProposalTemplatesQuery = {}): Promise<ProposalTemplate[]> {
    console.log('GetProposalTemplatesUseCase.execute called with query:', query);
    
    if (query.category) {
      console.log('Finding templates by category:', query.category, 'teamId:', query.teamId);
      const templates = await this.proposalTemplateRepository.findByCategory(
        query.category,
        query.teamId
      );
      console.log('Found templates by category:', templates.length);
      return templates;
    }

    if (query.teamId) {
      console.log('Finding templates by teamId:', query.teamId);
      const teamTemplates = await this.proposalTemplateRepository.findByTeamId(query.teamId);
      console.log('Found team templates:', teamTemplates.length);
      
      if (query.includeDefaults) {
        console.log('Including default templates');
        const defaultTemplates = await this.proposalTemplateRepository.findDefaultTemplates();
        console.log('Found default templates:', defaultTemplates.length);
        
        // Merge templates
        const allTemplates = [...teamTemplates, ...defaultTemplates];
        console.log('Total merged templates:', allTemplates.length);
        
        return allTemplates.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
        });
      }
      
      return teamTemplates;
    }

    console.log('No teamId provided, returning default templates only');
    const defaultTemplates = await this.proposalTemplateRepository.findDefaultTemplates();
    console.log('Found default templates (no teamId):', defaultTemplates.length);
    return defaultTemplates;
  }
}