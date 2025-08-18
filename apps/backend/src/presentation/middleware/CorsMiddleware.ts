import cors from 'cors';
import { AppConfig } from '../../infrastructure/config/AppConfig';

export class CorsMiddleware {
  static configure(config: AppConfig) {
    return cors({
      origin: config.app.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      optionsSuccessStatus: 200,
    });
  }
}