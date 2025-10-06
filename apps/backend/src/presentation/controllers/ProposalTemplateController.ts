import { Request, Response } from 'express';
import { CreateProposalTemplateUseCase } from '../../application/use-cases/proposal-template/CreateProposalTemplateUseCase';
import { GetProposalTemplatesUseCase } from '../../application/use-cases/proposal-template/GetProposalTemplatesUseCase';
import { UpdateProposalTemplateUseCase } from '../../application/use-cases/proposal-template/UpdateProposalTemplateUseCase';
import { GenerateProposalUseCase } from '../../application/use-cases/proposal-template/GenerateProposalUseCase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IProposalTemplateRepository } from '../../domain/repositories/IProposalTemplateRepository';
import { UserId } from '../../domain/value-objects/UserId';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export class ProposalTemplateController {
  constructor(
    private createProposalTemplateUseCase: CreateProposalTemplateUseCase,
    private getProposalTemplatesUseCase: GetProposalTemplatesUseCase,
    private updateProposalTemplateUseCase: UpdateProposalTemplateUseCase,
    private generateProposalUseCase: GenerateProposalUseCase,
    private userRepository: IUserRepository,
    private proposalTemplateRepository: IProposalTemplateRepository
  ) {}

  async createTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Buscar o usuário para obter o teamId
      const user = await this.userRepository.findById(userId);
      const teamId = user?.getTeamId() as string | undefined;

      console.log('ProposalTemplateController.createTemplate called', { userId, teamId, user: user ? { id: user.getId(), teamId: user.getTeamId() } : 'user not found' });

      const template = await this.createProposalTemplateUseCase.execute({
        ...req.body,
        createdBy: userId,
        teamId
      });

      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      console.log('ProposalTemplateController.getTemplates called', { userId });
      
      // Buscar o usuário para obter o teamId
      const user = await this.userRepository.findById(userId);
      const teamId = user?.getTeamId() as string | undefined;

      const { category, includeDefaults } = req.query;

      console.log('Query params:', { teamId, category, includeDefaults, user: user ? { id: user.getId(), teamId: user.getTeamId() } : 'user not found' });

      const templates = await this.getProposalTemplatesUseCase.execute({
        teamId,
        category: category as string,
        includeDefaults: includeDefaults === 'true'
      });

      console.log('Templates found:', templates.length);
      res.json(templates);
    } catch (error: any) {
      console.error('Error in getTemplates:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async getTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      
      // Buscar o usuário para obter o teamId
      const user = await this.userRepository.findById(userId);
      const teamId = user?.getTeamId() as string | undefined;
      
      // This should be implemented as a separate use case
      // For now, using the repository directly
      const template = await this.getProposalTemplatesUseCase.execute({ teamId });
      const foundTemplate = template.find(t => t.id === id);
      
      if (!foundTemplate) {
        res.status(404).json({ message: 'Template not found' });
        return;
      }

      res.json(foundTemplate);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const template = await this.updateProposalTemplateUseCase.execute({
        id,
        ...req.body
      });

      res.json(template);
    } catch (error: any) {
      if (error.message === 'Template not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  async deleteTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // This should be implemented as a separate use case
      // Implementation would go here
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async cloneTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!name) {
        res.status(400).json({ message: 'New template name is required' });
        return;
      }

      // Buscar o usuário para obter o teamId
      const user = await this.userRepository.findById(userId);
      const teamId = user?.getTeamId() as string | undefined;

      console.log('ProposalTemplateController.cloneTemplate called', { id, name, userId, teamId });

      // Usar o repositório para clonar o template
      const clonedTemplate = await this.proposalTemplateRepository.cloneTemplate(id, name, userId);
      
      console.log('Template cloned - checking teamId:', { clonedId: clonedTemplate.id, teamId: clonedTemplate.teamId, expectedTeamId: teamId });

      console.log('Template cloned successfully:', { originalId: id, newId: clonedTemplate.id, name });

      res.status(201).json(clonedTemplate);
    } catch (error: any) {
      console.error('Error cloning template:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async previewProposal(req: Request, res: Response): Promise<void> {
    try {
      // Lógica de preview - retorna os dados formatados sem gerar PDF
      const proposalData = {
        id: `preview_${Date.now()}`,
        customer: req.body.customer,
        technical: req.body.technical,
        financial: req.body.financial,
        services: req.body.services,
        totalServices: req.body.services?.reduce((sum: number, service: any) => sum + service.valor, 0) || 0,
        status: 'preview',
        createdAt: new Date().toISOString()
      };
      
      res.json({ data: proposalData });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async generateProposal(req: Request, res: Response): Promise<void> {
    try {
      const proposal = await this.generateProposalUseCase.execute(req.body);
      res.json(proposal);
    } catch (error: any) {
      console.error('Erro ao gerar proposta:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }
}