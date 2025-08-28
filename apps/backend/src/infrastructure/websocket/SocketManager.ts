import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';

export class SocketManager {
  private static instance: SocketManager;
  private io: SocketServer | null = null;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public initialize(server: Server): void {
    this.io = new SocketServer(server, {
      cors: {
        origin: ["http://localhost:3003", "https://besspro.vizad.com.br"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`Cliente conectado ao console de logs: ${socket.id}`);
      
      socket.on('join-calculation-logs', () => {
        socket.join('calculation-logs');
        console.log(`Cliente ${socket.id} entrou na sala de logs de cálculos`);
      });

      socket.on('disconnect', () => {
        console.log(`Cliente desconectado do console de logs: ${socket.id}`);
      });
    });
  }

  public emitLog(logData: any): void {
    if (this.io) {
      this.io.to('calculation-logs').emit('calculation-log', {
        timestamp: new Date().toISOString(),
        ...logData
      });
    }
  }

  public emitRawConsoleLog(message: string, level: 'info' | 'error' | 'warn' | 'debug' = 'info'): void {
    if (this.io) {
      this.io.to('calculation-logs').emit('console-log', {
        timestamp: new Date().toISOString(),
        level,
        message,
        raw: true
      });
    }
  }
}