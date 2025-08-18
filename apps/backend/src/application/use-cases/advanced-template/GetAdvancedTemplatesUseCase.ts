import { Result } from '../../common/Result';
import { AdvancedProposalTemplate } from '../../../domain/entities/AdvancedProposalTemplate';
import { IAdvancedProposalTemplateRepository } from '../../../domain/repositories/IAdvancedProposalTemplateRepository';

export interface GetAdvancedTemplatesRequest {
  teamId: string;
  page?: number;
  limit?: number;
  category?: string;
  isActive?: boolean;
  isDefault?: boolean;
  createdBy?: string;
  search?: string;
}

export interface GetAdvancedTemplatesResponse {
  templates: AdvancedProposalTemplate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    categories: string[];
    creators: string[];
  };
}

export class GetAdvancedTemplatesUseCase {
  constructor(
    private templateRepository: IAdvancedProposalTemplateRepository
  ) {}

  async execute(request: GetAdvancedTemplatesRequest): Promise<Result<GetAdvancedTemplatesResponse>> {
    try {
      const page = request.page || 1;
      const limit = Math.min(request.limit || 20, 100); // Max 100 templates per page

      let templates: AdvancedProposalTemplate[];
      let total: number;
      let totalPages: number;

      // If search is provided, use search functionality
      if (request.search && request.search.trim()) {
        templates = await this.templateRepository.search(request.search.trim(), request.teamId);
        total = templates.length;
        totalPages = Math.ceil(total / limit);
        
        // Apply pagination to search results
        const startIndex = (page - 1) * limit;
        templates = templates.slice(startIndex, startIndex + limit);
      } else {
        // Use paginated query with filters
        const result = await this.templateRepository.findWithPagination(
          request.teamId,
          page,
          limit,
          {
            category: request.category,
            isActive: request.isActive,
            isDefault: request.isDefault,
            createdBy: request.createdBy
          }
        );

        templates = result.templates;
        total = result.total;
        totalPages = result.totalPages;
      }

      // Get additional filter data
      const allTemplates = await this.templateRepository.findByTeamId(request.teamId);
      const categories = [...new Set(allTemplates.map(t => t.category))];
      const creators = [...new Set(allTemplates.map(t => t.createdBy))];

      const response: GetAdvancedTemplatesResponse = {
        templates,
        pagination: {
          total,
          page,
          limit,
          totalPages
        },
        filters: {
          categories,
          creators
        }
      };

      return Result.success(response);

    } catch (error: any) {
      return Result.failure(`Erro ao buscar templates: ${error.message}`);
    }
  }
}