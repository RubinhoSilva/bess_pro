import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Socket {
    if (!this.socket || !this.isConnected) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
        (window.location.hostname === 'localhost' ? 'http://localhost:8010' : 'https://api.besspro.vizad.com.br');
      
      this.socket = io(API_BASE_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        retries: 3,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Conectado ao servidor WebSocket');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Desconectado do servidor WebSocket');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Erro na conexão WebSocket:', error);
        this.isConnected = false;
      });
    }

    return this.socket;
  }

  joinCalculationLogs(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-calculation-logs');
      console.log('📊 Entrando na sala de logs de cálculos');
    }
  }

  onCalculationLog(callback: (log: any) => void): void {
    if (this.socket) {
      this.socket.on('calculation-log', callback);
    }
  }

  onConsoleLog(callback: (log: any) => void): void {
    if (this.socket) {
      this.socket.on('console-log', callback);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

export const socketService = new SocketService();