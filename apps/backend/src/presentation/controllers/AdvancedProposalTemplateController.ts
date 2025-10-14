import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateAdvancedTemplateUseCase } from '../../application/use-cases/advanced-template/CreateAdvancedTemplateUseCase';
import { GetAdvancedTemplatesUseCase } from '../../application/use-cases/advanced-template/GetAdvancedTemplatesUseCase';
import { UpdateAdvancedTemplateUseCase } from '../../application/use-cases/advanced-template/UpdateAdvancedTemplateUseCase';
import { DeleteAdvancedTemplateUseCase } from '../../application/use-cases/advanced-template/DeleteAdvancedTemplateUseCase';
import { GenerateProposalFromTemplateUseCase } from '../../application/use-cases/advanced-template/GenerateProposalFromTemplateUseCase';
import { CloneAdvancedTemplateUseCase } from '../../application/use-cases/advanced-template/CloneAdvancedTemplateUseCase';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    teamId: string;
    email: string;
  };
}

export class AdvancedProposalTemplateController extends BaseController {
  constructor(
    private createAdvancedTemplateUseCase: CreateAdvancedTemplateUseCase,
    private getAdvancedTemplatesUseCase: GetAdvancedTemplatesUseCase,
    private updateAdvancedTemplateUseCase: UpdateAdvancedTemplateUseCase,
    private deleteAdvancedTemplateUseCase: DeleteAdvancedTemplateUseCase,
    private generateProposalFromTemplateUseCase: GenerateProposalFromTemplateUseCase,
    private cloneAdvancedTemplateUseCase: CloneAdvancedTemplateUseCase
  ) {
    super();
  }

  /**
   * POST /api/v1/advanced-templates
   * Create a new advanced proposal template
   */
  async createTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        this.unauthorized(res, 'Token de autenticação necessário');
        return;
      }

      const validationResult = this.validateCreateTemplate(req.body);
      if (!validationResult.success) {
        this.badRequest(res, `Dados inválidos: ${validationResult.errors?.join(', ') || 'Erro de validação'}`);
        return;
      }

      const result = await this.createAdvancedTemplateUseCase.execute({
        ...validationResult.data,
        createdBy: req.user.id,
        teamId: req.user.teamId
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      res.status(201).json({
        success: true,
        data: result.value,
        message: 'Template criado com sucesso'
      });

    } catch (error: any) {
      console.error('Erro ao criar template:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  /**
   * GET /api/v1/advanced-templates
   * Get paginated list of templates with filtering
   */
  async getTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        this.unauthorized(res, 'Token de autenticação necessário');
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const isDefault = req.query.isDefault === 'true' ? true : req.query.isDefault === 'false' ? false : undefined;
      const createdBy = req.query.createdBy as string;
      const search = req.query.search as string;

      const result = await this.getAdvancedTemplatesUseCase.execute({
        teamId: req.user.teamId,
        page,
        limit,
        category,
        isActive,
        isDefault,
        createdBy,
        search
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.value,
        message: 'Templates recuperados com sucesso'
      });

    } catch (error: any) {
      console.error('Erro ao buscar templates:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  /**
   * GET /api/v1/advanced-templates/:id
   * Get a specific template by ID
   */
  async getTemplateById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        this.unauthorized(res, 'Token de autenticação necessário');
        return;
      }

      const templateId = req.params.id;
      if (!templateId) {
        this.badRequest(res, 'ID do template é obrigatório');
        return;
      }

      // Use the get templates use case with specific filters
      const result = await this.getAdvancedTemplatesUseCase.execute({
        teamId: req.user.teamId,
        page: 1,
        limit: 1
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      const template = result.value!.templates.find(t => t.id === templateId);
      if (!template) {
        this.notFound(res, 'Template não encontrado');
        return;
      }

      res.status(200).json({
        success: true,
        data: template,
        message: 'Template encontrado'
      });

    } catch (error: any) {
      console.error('Erro ao buscar template:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  /**
   * PUT /api/v1/advanced-templates/:id
   * Update an existing template
   */
  async updateTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        this.unauthorized(res, 'Token de autenticação necessário');
        return;
      }

      const templateId = req.params.id;
      if (!templateId) {
        this.badRequest(res, 'ID do template é obrigatório');
        return;
      }

      const validationResult = this.validateUpdateTemplate(req.body);
      if (!validationResult.success) {
        this.badRequest(res, `Dados inválidos: ${validationResult.errors?.join(', ') || 'Erro de validação'}`);
        return;
      }

      const result = await this.updateAdvancedTemplateUseCase.execute({
        templateId,
        ...validationResult.data,
        userId: req.user.id,
        teamId: req.user.teamId
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      res.status(200).json({
        success: true,
        data: result.value,
        message: 'Template atualizado com sucesso'
      });

    } catch (error: any) {
      console.error('Erro ao atualizar template:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  /**
   * DELETE /api/v1/advanced-templates/:id
   * Delete a template
   */
  async deleteTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        this.unauthorized(res, 'Token de autenticação necessário');
        return;
      }

      const templateId = req.params.id;
      if (!templateId) {
        this.badRequest(res, 'ID do template é obrigatório');
        return;
      }

      const force = req.query.force === 'true';

      const result = await this.deleteAdvancedTemplateUseCase.execute({
        templateId,
        userId: req.user.id,
        teamId: req.user.teamId,
        force
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Template deletado com sucesso'
      });

    } catch (error: any) {
      console.error('Erro ao deletar template:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  /**
   * POST /api/v1/advanced-templates/:id/generate
   * Generate a proposal from a template
   */
  async generateProposal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        this.unauthorized(res, 'Token de autenticação necessário');
        return;
      }

      const templateId = req.params.id;
      if (!templateId) {
        this.badRequest(res, 'ID do template é obrigatório');
        return;
      }

      const validationResult = this.validateGenerateProposal(req.body);
      if (!validationResult.success) {
        this.badRequest(res, `Dados inválidos: ${validationResult.errors?.join(', ') || 'Erro de validação'}`);
        return;
      }

      const result = await this.generateProposalFromTemplateUseCase.execute({
        templateId,
        variables: validationResult.data.variables,
        projectData: validationResult.data.projectData,
        outputFormat: validationResult.data.outputFormat || 'html',
        userId: req.user.id,
        teamId: req.user.teamId
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      const proposal = result.value!;

      // Set appropriate content type based on output format
      if (proposal.metadata.outputFormat === 'pdf' && proposal.content.pdf) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="proposal-${templateId}.pdf"`);
        res.send(proposal.content.pdf);
      } else {
        res.status(200).json({
          success: true,
          data: {
            template: {
              id: proposal.template.id,
              name: proposal.template.name,
              category: proposal.template.category
            },
            metadata: proposal.metadata,
            content: {
              html: proposal.content.html
            }
          },
          message: 'Proposta gerada com sucesso'
        });
      }

    } catch (error: any) {
      console.error('Erro ao gerar proposta:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  /**
   * POST /api/v1/advanced-templates/:id/clone
   * Clone an existing template
   */
  async cloneTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        this.unauthorized(res, 'Token de autenticação necessário');
        return;
      }

      const templateId = req.params.id;
      const { name } = req.body;

      // Execute use case
      const result = await this.cloneAdvancedTemplateUseCase.execute({
        templateId,
        userId: req.user.id,
        teamId: req.user.teamId,
        newName: name
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      // Ensure we have the cloned template
      if (!result.value?.clonedTemplate) {
        this.internalServerError(res, 'Erro ao criar template clonado');
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          clonedTemplate: result.value.clonedTemplate,
          originalTemplate: result.value.originalTemplate
        },
        message: 'Template clonado com sucesso'
      });

    } catch (error: any) {
      console.error('Erro ao clonar template:', error);
      this.internalServerError(res, 'Erro interno do servidor');
    }
  }

  // Validation methods
  private validateCreateTemplate(body: any): { success: boolean; data?: any; errors?: string[] } {
    const errors: string[] = [];

    if (!body.name || typeof body.name !== 'string') {
      errors.push('Nome é obrigatório');
    }

    if (!body.description || typeof body.description !== 'string') {
      errors.push('Descrição é obrigatória');
    }

    if (!body.category || !['PV', 'BESS', 'HYBRID', 'CUSTOM'].includes(body.category)) {
      errors.push('Categoria deve ser PV, BESS, HYBRID ou CUSTOM');
    }

    if (!Array.isArray(body.sections)) {
      errors.push('Seções devem ser um array');
    }

    if (!Array.isArray(body.variables)) {
      errors.push('Variáveis devem ser um array');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        sections: body.sections,
        variables: body.variables,
        style: body.style,
        pdfSettings: body.pdfSettings,
        features: body.features,
        isDefault: body.isDefault || false
      },
      errors: []
    };
  }

  private validateUpdateTemplate(body: any): { success: boolean; data?: any; errors?: string[] } {
    const errors: string[] = [];

    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
      errors.push('Nome deve ser uma string não vazia');
    }

    if (body.category !== undefined && !['PV', 'BESS', 'HYBRID', 'CUSTOM'].includes(body.category)) {
      errors.push('Categoria deve ser PV, BESS, HYBRID ou CUSTOM');
    }

    if (body.sections !== undefined && !Array.isArray(body.sections)) {
      errors.push('Seções devem ser um array');
    }

    if (body.variables !== undefined && !Array.isArray(body.variables)) {
      errors.push('Variáveis devem ser um array');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        sections: body.sections,
        variables: body.variables,
        style: body.style,
        isDefault: body.isDefault,
        isActive: body.isActive,
        pdfSettings: body.pdfSettings,
        features: body.features
      },
      errors: []
    };
  }

  private validateGenerateProposal(body: any): { success: boolean; data?: any; errors?: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(body.variables)) {
      errors.push('Variáveis devem ser um array');
    }

    if (body.outputFormat && !['html', 'pdf'].includes(body.outputFormat)) {
      errors.push('Formato de saída deve ser html ou pdf');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      data: {
        variables: body.variables,
        projectData: body.projectData,
        outputFormat: body.outputFormat
      },
      errors: []
    };
  }
}