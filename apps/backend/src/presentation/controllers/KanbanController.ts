import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';
import { GetKanbanColumnsUseCase } from '../../application/use-cases/kanban/GetKanbanColumnsUseCase';
import { CreateKanbanColumnUseCase } from '../../application/use-cases/kanban/CreateKanbanColumnUseCase';
import { UpdateKanbanColumnUseCase } from '../../application/use-cases/kanban/UpdateKanbanColumnUseCase';
import { ReorderKanbanColumnsUseCase } from '../../application/use-cases/kanban/ReorderKanbanColumnsUseCase';
import { IKanbanColumnRepository } from '../../domain/repositories/IKanbanColumnRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITeamRepository } from '../../domain/repositories/ITeamRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { BaseController } from './BaseController';
import { Team } from '../../domain/entities/Team';
import { KanbanColumnSeederService } from '../../domain/services/KanbanColumnSeederService';

export class KanbanController extends BaseController {
  constructor(
    private getKanbanColumnsUseCase: GetKanbanColumnsUseCase,
    private createKanbanColumnUseCase: CreateKanbanColumnUseCase,
    private updateKanbanColumnUseCase: UpdateKanbanColumnUseCase,
    private reorderKanbanColumnsUseCase: ReorderKanbanColumnsUseCase,
    private kanbanColumnRepository: IKanbanColumnRepository,
    private userRepository: IUserRepository,
    private teamRepository: ITeamRepository,
    private kanbanColumnSeederService: KanbanColumnSeederService
  ) {
    super();
  }

  private async getUserTeamId(userId: string): Promise<string | null> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return null;
      }

      // Se o usuário já tem um team, retorna
      const existingTeamId = user.getTeamId();
      if (existingTeamId) {
        return existingTeamId;
      }

      // Se não tem team, cria um automaticamente (para usuários existentes)
      console.log('Usuário sem team, criando automaticamente...');
      const userName = user.getName().getValue();
      const userEmail = user.getEmail().getValue();
      const userCompany = user.getCompany();
      
      const teamName = userCompany || `${userName}'s Team`;
      const team = Team.create({
        name: teamName,
        description: `Team de ${userName}`,
        ownerId: userId,
        ownerEmail: userEmail,
        planType: 'basic',
        maxUsers: 10,
        isActive: true
      });

      const savedTeam = await this.teamRepository.save(team);

      // Associar usuário ao team criado
      user.changeTeam(savedTeam.getId());
      user.changeRole('team_owner'); // Garantir que seja owner
      await this.userRepository.update(user);

      // Criar colunas Kanban padrão para o team
      const defaultColumns = await this.kanbanColumnSeederService.createDefaultColumnsForTeam(savedTeam.getId());
      for (const columnData of defaultColumns) {
        const column = {
          teamId: columnData.teamId,
          name: columnData.name,
          key: columnData.key,
          position: columnData.position,
          isDefault: columnData.isDefault,
          isActive: columnData.isActive,
        };
        await this.kanbanColumnRepository.save(column);
      }

      return savedTeam.getId();
    } catch (error) {
      console.error('Error getting user team:', error);
      return null;
    }
  }

  async getColumns(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const teamId = await this.getUserTeamId(userId);
      if (!teamId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_TEAM', message: 'Usuário não possui team associado' }
        });
      }

      const columns = await this.getKanbanColumnsUseCase.execute(teamId);
      
      return res.json({
        success: true,
        data: columns,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting kanban columns:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }
      });
    }
  }

  async createColumn(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const teamId = await this.getUserTeamId(userId);
      if (!teamId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_TEAM', message: 'Usuário não possui team associado' }
        });
      }

      const { name, key, position, color } = req.body;

      if (!name || !key) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Nome e chave são obrigatórios' }
        });
      }

      const column = await this.createKanbanColumnUseCase.execute(teamId, {
        name,
        key,
        position,
        color,
      });
      
      return res.status(201).json({
        success: true,
        data: column,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating kanban column:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }
      });
    }
  }

  async updateColumn(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { name, position, color, isActive } = req.body;

      const column = await this.updateKanbanColumnUseCase.execute(id, {
        name,
        position,
        color,
        isActive,
      });
      
      if (!column) {
        return res.status(404).json({
          success: false,
          error: { code: 'COLUMN_NOT_FOUND', message: 'Coluna não encontrada' }
        });
      }

      return res.json({
        success: true,
        data: column,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating kanban column:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }
      });
    }
  }

  async deleteColumn(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const success = await this.kanbanColumnRepository.delete(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: { code: 'COLUMN_NOT_FOUND', message: 'Coluna não encontrada' }
        });
      }

      return res.json({
        success: true,
        message: 'Coluna removida com sucesso',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error deleting kanban column:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }
      });
    }
  }

  async reorderColumns(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const teamId = await this.getUserTeamId(userId);
      if (!teamId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_TEAM', message: 'Usuário não possui team associado' }
        });
      }

      const { columns } = req.body;

      if (!Array.isArray(columns)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATA', message: 'Dados de reordenação inválidos' }
        });
      }

      const success = await this.reorderKanbanColumnsUseCase.execute(teamId, { columns });
      
      return res.json({
        success,
        message: success ? 'Colunas reordenadas com sucesso' : 'Erro ao reordenar colunas',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error reordering kanban columns:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }
      });
    }
  }
}