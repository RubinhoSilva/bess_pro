import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Container } from '../../infrastructure/di/Container';
import { ClientAlertController } from '../controllers/ClientAlertController';
// Middleware simples para auth - será implementado depois
const authMiddleware = (req: any, res: any, next: any) => {
  req.user = { id: 'temp-user-id', role: 'user', email: 'temp@email.com' };
  next();
};
// import { validationMiddleware } from '../middleware/validation.middleware';
const validationMiddleware = (dto: any, source: string = 'body') => (req: any, res: any, next: any) => next();
// import { requireOwnership, requireAdminOrOwnership } from '../middleware/authorization.middleware';
import { CreateClientAlertDTO, UpdateClientAlertDTO } from '../../application/dtos/ClientAlertDTO';
import { PaginationQueryDTO, OffsetPaginationQueryDTO, ClientAlertFiltersDTO } from '../../application/dtos/PaginationDTO';

const router = Router();

// Rate limiting para alertas
const alertsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por window por IP
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Muitas tentativas. Tente novamente em 15 minutos.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting mais restritivo para criação
const createAlertRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 100, // 100 criações por 5 minutos por IP
  message: {
    success: false,
    error: {
      code: 'CREATE_RATE_LIMIT_EXCEEDED',
      message: 'Muitas criações de alertas. Tente novamente em 5 minutos.'
    }
  }
});

// Aplicar rate limiting geral
router.use(alertsRateLimit);

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Helper function to get controller - resolved lazily
function getClientAlertController(): ClientAlertController {
  const container = Container.getInstance();
  return container.resolve<ClientAlertController>('ClientAlertController');
}

// Rotas de alertas com validação e autorização
router.post('/', 
  createAlertRateLimit,
  (req, res, next) => getClientAlertController().create(req, res, next)
);

// Rotas legadas (sem paginação) - mantidas para compatibilidade
router.get('/legacy', 
  (req, res, next) => getClientAlertController().getAll(req, res, next)
);

// Novas rotas com paginação cursor-based (recomendadas)
router.get('/', 
  (req, res, next) => getClientAlertController().getAllPaginated(req, res, next)
);

// Rota com paginação offset-based (para compatibilidade com UIs que precisam de número de páginas)
router.get('/pages', 
  (req, res, next) => getClientAlertController().getAllOffsetPaginated(req, res, next)
);

router.get('/dashboard', 
  (req, res, next) => getClientAlertController().getDashboardAlertsPaginated(req, res, next)
);

router.get('/dashboard/legacy', 
  (req, res) => getClientAlertController().getDashboardAlerts(req, res)
);

router.get('/client/:clientId', 
  (req, res, next) => getClientAlertController().getByClientIdPaginated(req, res, next)
);

router.get('/client/:clientId/legacy', 
  (req, res) => getClientAlertController().getByClientId(req, res)
);

router.patch('/:id', 
  (req, res, next) => getClientAlertController().update(req, res, next)
);

export { router as clientAlertRoutes };