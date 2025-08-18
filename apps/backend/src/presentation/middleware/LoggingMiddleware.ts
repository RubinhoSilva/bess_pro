import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

export class LoggingMiddleware {
  static configure() {
    // Custom token for user ID
    morgan.token('user-id', (req: any) => {
      return req.user?.userId || 'anonymous';
    });

    // Custom token for request duration
    morgan.token('response-time-ms', (req: any, res) => {
      const startTime = req.startTime || Date.now();
      return `${Date.now() - startTime}ms`;
    });

    const format = process.env.NODE_ENV === 'production'
      ? 'combined'
      : ':method :url :status :response-time-ms - :user-id';

    return morgan(format, {
      stream: {
        write: (message: string) => {
          console.log(message.trim());
        },
      },
    });
  }

  static addStartTime() {
    return (req: any, res: Response, next: NextFunction) => {
      req.startTime = Date.now();
      next();
    };
  }
}
