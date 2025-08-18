import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { AppConfig } from '../../infrastructure/config/AppConfig';
import { Container } from '../../infrastructure/di/Container';
import { ApiRoutes } from '../routes';
import { SocketIOServer } from '../../infrastructure/websockets/SocketIOServer';
import { createServer, Server as HttpServer } from 'http';
import { CorsMiddleware } from '../middleware/CorsMiddleware';
import { ErrorHandlerMiddleware } from '../middleware/ErrorHandlerMiddleware';
import { LoggingMiddleware } from '../middleware/LoggingMiddleware';
import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware';

export class ExpressServer {
  private app: Application;
  private httpServer: HttpServer;
  private socketServer?: SocketIOServer;

  constructor(
    private config: AppConfig,
    private container: Container
  ) {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupWebSockets();
  }

  private setupMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for development
      crossOriginEmbedderPolicy: false,
    }));

    // CORS
    this.app.use(CorsMiddleware.configure(this.config));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(LoggingMiddleware.addStartTime());
    this.app.use(LoggingMiddleware.configure());

    // Rate limiting
    this.app.use(RateLimitMiddleware.general());

    // Trust proxy (for rate limiting with reverse proxy)
    this.app.set('trust proxy', 1);
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api/v1', ApiRoutes.create(this.container));

    // Serve static files for uploads (if using local storage)
    if (this.config.storage.provider === 'local') {
      this.app.use('/uploads', express.static(this.config.storage.local!.uploadDir));
    }

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'BESS Pro API',
        version: process.env.npm_package_version || '1.0.0',
        docs: '/api/v1/docs',
        health: '/api/v1/health',
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(ErrorHandlerMiddleware.notFound());

    // Global error handler
    this.app.use(ErrorHandlerMiddleware.handle());
  }

  private setupWebSockets(): void {
    if (this.config.websockets.enabled) {
      this.socketServer = new SocketIOServer(this.httpServer, {
        cors: {
          origin: this.config.app.corsOrigin,
          methods: ['GET', 'POST'],
        },
        path: this.config.websockets.path,
      });

      console.log(`WebSockets enabled on path: ${this.config.websockets.path}`);
    }
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.config.app.port, () => {
        console.log(`🚀 Server running on port ${this.config.app.port}`);
        console.log(`📝 Environment: ${this.config.app.env}`);
        console.log(`🌐 API Base URL: http://localhost:${this.config.app.port}/api/v1`);
        console.log(`❤️  Health Check: http://localhost:${this.config.app.port}/api/v1/health`);
        
        if (this.config.websockets.enabled) {
          console.log(`🔌 WebSockets: http://localhost:${this.config.app.port}${this.config.websockets.path}`);
        }
        
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.close(() => {
        console.log('Server stopped');
        resolve();
      });
    });
  }

  getApp(): Application {
    return this.app;
  }

  getHttpServer(): HttpServer {
    return this.httpServer;
  }

  getSocketServer(): SocketIOServer | undefined {
    return this.socketServer;
  }
}