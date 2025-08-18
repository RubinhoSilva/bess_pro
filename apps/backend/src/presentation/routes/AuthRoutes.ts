import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { Container } from '../../infrastructure/di/Container';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';

export class AuthRoutes {
  static create(container: Container): Router {
    const router = Router();
    const authController = new AuthController(container);
    const authMiddleware = new AuthMiddleware(container);

    // Public routes
    router.post('/register',
      // RateLimitMiddleware.auth(), // Temporarily disabled for development
      ValidationMiddleware.validateRegister(),
      ValidationMiddleware.handleValidationErrors(),
      authController.register.bind(authController)
    );

    router.post('/login',
      // RateLimitMiddleware.auth(), // Temporarily disabled for development
      ValidationMiddleware.validateLogin(),
      ValidationMiddleware.handleValidationErrors(),
      authController.login.bind(authController)
    );

    router.post('/refresh-token',
      // RateLimitMiddleware.auth(), // Temporarily disabled for development
      authController.refreshToken.bind(authController)
    );

    // Setup password routes (public)
    router.get('/validate-invite-token',
      authController.validateInviteToken.bind(authController)
    );

    router.post('/setup-password',
      authController.setupPassword.bind(authController)
    );

    // Password reset routes (public)
    router.post('/forgot-password',
      authController.forgotPassword.bind(authController)
    );

    router.get('/validate-reset-token',
      authController.validateResetToken.bind(authController)
    );

    router.post('/reset-password',
      authController.resetPassword.bind(authController)
    );

    // Protected routes
    router.post('/logout',
      authMiddleware.authenticate(),
      authController.logout.bind(authController)
    );

    router.get('/me',
      authMiddleware.authenticate(),
      authController.me.bind(authController)
    );

    return router;
  }
}
