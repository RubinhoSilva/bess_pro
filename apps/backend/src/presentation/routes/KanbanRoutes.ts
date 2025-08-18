import { Router } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { KanbanController } from '../controllers/KanbanController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ServiceTokens } from '../../infrastructure/di/ServiceTokens';

export class KanbanRoutes {
  static create(container: Container): Router {
    const router = Router();
    const kanbanController = container.resolve<KanbanController>(ServiceTokens.KANBAN_CONTROLLER);
    const authMiddleware = container.resolve<AuthMiddleware>('AuthMiddleware');

    // Apply authentication to all routes
    router.use(authMiddleware.authenticate());

    // GET /api/v1/kanban/columns - Listar colunas do team
    router.get('/columns', kanbanController.getColumns.bind(kanbanController));

    // POST /api/v1/kanban/columns - Criar nova coluna
    router.post('/columns', kanbanController.createColumn.bind(kanbanController));

    // PUT /api/v1/kanban/columns/:id - Atualizar coluna
    router.put('/columns/:id', kanbanController.updateColumn.bind(kanbanController));

    // DELETE /api/v1/kanban/columns/:id - Remover coluna
    router.delete('/columns/:id', kanbanController.deleteColumn.bind(kanbanController));

    // POST /api/v1/kanban/columns/reorder - Reordenar colunas
    router.post('/columns/reorder', kanbanController.reorderColumns.bind(kanbanController));

    return router;
  }
}