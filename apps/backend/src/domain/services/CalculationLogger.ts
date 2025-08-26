export interface CalculationLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'calculation' | 'result' | 'error';
  category: string;
  message: string;
  data?: any;
  operation?: string;
}

export class CalculationLogger {
  private logs: CalculationLog[] = [];
  private logId = 0;

  constructor(private sessionId: string) {}

  private generateLogId(): string {
    return `${this.sessionId}-${++this.logId}`;
  }

  info(category: string, message: string, data?: any): void {
    this.logs.push({
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'info',
      category,
      message,
      data
    });
  }

  calculation(category: string, message: string, operation: string, data?: any): void {
    this.logs.push({
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'calculation',
      category,
      message,
      operation,
      data
    });
  }

  result(category: string, message: string, data?: any): void {
    this.logs.push({
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'result',
      category,
      message,
      data
    });
  }

  error(category: string, message: string, data?: any): void {
    this.logs.push({
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'error',
      category,
      message,
      data
    });
  }

  getLogs(): CalculationLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogsForConsole(): string[] {
    return this.logs.map(log => {
      const timestamp = log.timestamp.toISOString();
      const emoji = this.getEmoji(log.type, log.category);
      const prefix = `${emoji} [${timestamp}] ${log.category}`;
      
      let message = `${prefix}: ${log.message}`;
      
      if (log.operation) {
        message += ` | Operação: ${log.operation}`;
      }
      
      if (log.data) {
        message += ` | Dados: ${JSON.stringify(log.data)}`;
      }
      
      return message;
    });
  }

  private getEmoji(type: string, category: string): string {
    if (type === 'error') return '❌';
    if (type === 'result') return '✅';
    if (type === 'calculation') {
      switch (category.toLowerCase()) {
        case 'irradiacao':
        case 'solar': return '☀️';
        case 'financeiro':
        case 'financial': return '💰';
        case 'modulos':
        case 'equipamentos': return '🔧';
        case 'area': return '📐';
        case 'potencia': return '⚡';
        default: return '🧮';
      }
    }
    return 'ℹ️';
  }
}