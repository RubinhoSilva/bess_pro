import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

export interface SocketConfig {
  cors: {
    origin: string[];
    methods: string[];
  };
  path: string;
}

export class SocketIOServer {
  private io: Server;

  constructor(httpServer: HttpServer, config: SocketConfig) {
    this.io = new Server(httpServer, {
      cors: config.cors,
      path: config.path,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join user to their room
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined their room`);
      });

      // Join project room
      socket.on('join-project-room', (projectId: string) => {
        socket.join(`project:${projectId}`);
        console.log(`Socket ${socket.id} joined project ${projectId}`);
      });

      // Handle project updates
      socket.on('project-update', (data) => {
        socket.to(`project:${data.projectId}`).emit('project-updated', data);
      });

      // Handle model 3D updates
      socket.on('model-3d-update', (data) => {
        socket.to(`project:${data.projectId}`).emit('model-3d-updated', data);
      });

      // Handle area updates
      socket.on('area-update', (data) => {
        socket.to(`project:${data.projectId}`).emit('area-updated', data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Notify user about something
  notifyUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Notify project participants
  notifyProject(projectId: string, event: string, data: any): void {
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  getIO(): Server {
    return this.io;
  }
}