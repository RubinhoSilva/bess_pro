import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { TeamController } from '../controllers/TeamController';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { superAdminMiddleware } from '../middleware/SuperAdminMiddleware';

export class TeamRoutes {
  static create(container: Container): Router {
    const teamRoutes = Router();
    const teamController = container.resolve<TeamController>(ServiceTokens.TEAM_CONTROLLER);
    const authMiddleware = container.resolve<AuthMiddleware>('AuthMiddleware');


    // Middleware de autenticação para todas as outras rotas
    teamRoutes.use(authMiddleware.authenticate());

    // Rotas (apenas para super admin)
    teamRoutes.post('/', superAdminMiddleware, teamController.createTeam.bind(teamController));
    teamRoutes.get('/', superAdminMiddleware, teamController.getTeams.bind(teamController));
    teamRoutes.put('/:teamId', superAdminMiddleware, teamController.updateTeam.bind(teamController));
    teamRoutes.patch('/:teamId/inactivate', superAdminMiddleware, teamController.inactivateTeam.bind(teamController));

    return teamRoutes;
  }
}