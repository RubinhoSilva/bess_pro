import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { TeamUserController } from '../controllers/TeamUserController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class TeamUserRoutes {
  static create(container: Container): Router {
    const teamUserRoutes = Router();
    const teamUserController = new TeamUserController(container);
    const authMiddleware = container.resolve<AuthMiddleware>('AuthMiddleware');

    // Middleware de autenticação para todas as rotas
    teamUserRoutes.use(authMiddleware.authenticate());

    // Rotas para gerenciamento de usuários do team
    teamUserRoutes.get('/:teamId/users', teamUserController.getTeamUsers.bind(teamUserController));
    teamUserRoutes.post('/:teamId/users/invite', teamUserController.inviteUser.bind(teamUserController));
    teamUserRoutes.put('/:teamId/users/:userId/role', teamUserController.updateUserRole.bind(teamUserController));
    teamUserRoutes.delete('/:teamId/users/:userId', teamUserController.removeUserFromTeam.bind(teamUserController));

    return teamUserRoutes;
  }
}