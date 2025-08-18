import { Result } from '../../common/Result';
import { IAdvancedProposalTemplateRepository } from '../../../domain/repositories/IAdvancedProposalTemplateRepository';

export interface DeleteAdvancedTemplateRequest {
  templateId: string;
  userId: string;
  teamId: string;
  force?: boolean; // Force delete even if it's a default template
}

export class DeleteAdvancedTemplateUseCase {
  constructor(
    private templateRepository: IAdvancedProposalTemplateRepository
  ) {}

  async execute(request: DeleteAdvancedTemplateRequest): Promise<Result<void>> {
    try {
      // Find the template
      const template = await this.templateRepository.findById(request.templateId);
      if (!template) {
        return Result.failure('Template não encontrado');
      }

      // Check permissions
      if (template.teamId !== request.teamId) {
        return Result.failure('Você não tem permissão para deletar este template');
      }

      // Check if it's a default template
      if (template.isDefault && !request.force) {
        return Result.failure('Não é possível deletar um template padrão. Use a opção force para forçar a deleção.');
      }

      // Check if template is being used (basic check)
      if (template.usageCount > 0 && !request.force) {
        return Result.failure('Este template foi usado para gerar propostas. Use a opção force para forçar a deleção.');
      }

      // Delete the template
      await this.templateRepository.delete(request.templateId);

      return Result.success(undefined);

    } catch (error: any) {
      return Result.failure(`Erro ao deletar template: ${error.message}`);
    }
  }
}