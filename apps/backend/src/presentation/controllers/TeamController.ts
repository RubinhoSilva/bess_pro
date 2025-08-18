import { Request, Response } from 'express';
import { CreateTeamUseCase } from '../../application/use-cases/team/CreateTeamUseCase';
import { GetTeamsUseCase } from '../../application/use-cases/team/GetTeamsUseCase';
import { UpdateTeamUseCase } from '../../application/use-cases/team/UpdateTeamUseCase';
import { InactivateTeamUseCase } from '../../application/use-cases/team/InactivateTeamUseCase';

export class TeamController {
  constructor(
    private createTeamUseCase: CreateTeamUseCase,
    private getTeamsUseCase: GetTeamsUseCase,
    private updateTeamUseCase: UpdateTeamUseCase,
    private inactivateTeamUseCase: InactivateTeamUseCase
  ) {}

  async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, ownerEmail, planType, maxUsers } = req.body;

      if (!name || !ownerEmail) {
        res.status(400).json({
          success: false,
          message: 'Nome e ownerEmail são obrigatórios'
        });
        return;
      }

      const team = await this.createTeamUseCase.execute({
        name,
        description,
        ownerEmail,
        planType,
        maxUsers
      });

      res.status(201).json({
        success: true,
        data: team,
        message: 'Team criado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar team:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  async getTeams(req: Request, res: Response): Promise<void> {
    try {
      const { isActive, ownerId, planType } = req.query;
      
      const filters = {
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(ownerId && { ownerId: ownerId as string }),
        ...(planType && { planType: planType as string })
      };

      const teams = await this.getTeamsUseCase.execute(filters);

      res.json({
        success: true,
        data: teams
      });
    } catch (error) {
      console.error('Erro ao buscar teams:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const { teamId } = req.params;
      const { name, description, planType, maxUsers } = req.body;

      if (!teamId) {
        res.status(400).json({
          success: false,
          message: 'TeamId é obrigatório'
        });
        return;
      }

      const team = await this.updateTeamUseCase.execute(teamId, {
        name,
        description,
        planType,
        maxUsers
      });

      res.json({
        success: true,
        data: team,
        message: 'Team atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar team:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  async inactivateTeam(req: Request, res: Response): Promise<void> {
    try {
      const { teamId } = req.params;

      if (!teamId) {
        res.status(400).json({
          success: false,
          message: 'TeamId é obrigatório'
        });
        return;
      }

      const team = await this.inactivateTeamUseCase.execute(teamId);

      res.json({
        success: true,
        data: team,
        message: 'Team inativado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao inativar team:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }
}