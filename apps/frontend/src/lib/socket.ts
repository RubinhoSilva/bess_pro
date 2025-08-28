import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Socket {
    if (!this.socket || !this.isConnected) {
      // Usa a mesma lógica do api.ts para detectar ambiente
      const isProduction = import.meta.env.PROD || 
                           import.meta.env.MODE === 'production' || 
                           window.location.hostname !== 'localhost';
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
        (isProduction ? 'https://api.besspro.vizad.com.br' : 'http://localhost:8010');
      
      console.log('🔌 Tentando conectar ao WebSocket:', API_BASE_URL);
      
      this.socket = io(API_BASE_URL, {
        transports: ['polling', 'websocket'], // polling primeiro para melhor compatibilidade
        timeout: 30000, // Aumentado para 30 segundos
        retries: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        forceNew: true,
        autoConnect: true,
        path: '/socket.io/',
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