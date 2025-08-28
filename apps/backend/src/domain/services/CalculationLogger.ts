export interface CalculationLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'calculation' | 'result' | 'error' | 'formula' | 'context';
  category: string;
  message: string;
  data?: any;
  operation?: string;
  formula?: string;
  description?: string;
  units?: string;
  variables?: Record<string, any>;
  references?: string[];
}

export class CalculationLogger {
  private logs: CalculationLog[] = [];
  private logId = 0;
  private onLogCallback?: (log: CalculationLog) => void;

  constructor(private sessionId: string, onLogCallback?: (log: CalculationLog) => void) {
    this.onLogCallback = onLogCallback;
  }

  private emitLog(log: CalculationLog): void {
    if (this.onLogCallback) {
      this.onLogCallback(log);
    }
    
    // Emit to WebSocket for real-time streaming
    import('../../infrastructure/websocket/SocketManager').then(({ SocketManager }) => {
      SocketManager.getInstance().emitLog(log);
      
      // Also emit as raw console log for exact console replication
      const consoleMessage = this.formatLogForConsole(log);
      SocketManager.getInstance().emitRawConsoleLog(consoleMessage);
    }).catch(err => {
      console.error('Failed to emit log to WebSocket:', err);
    });
  }

  private formatLogForConsole(log: CalculationLog): string {
    const timestamp = log.timestamp.toISOString();
    const emoji = this.getEmoji(log.type, log.category);
    const prefix = `${emoji} [${timestamp}] ${log.category}`;
    
    let message = `${prefix}: ${log.message}`;
    
    if (log.description) {
      message += `\n    📋 Descrição: ${log.description}`;
    }
    
    if (log.formula) {
      message += `\n    🧮 Fórmula: ${log.formula}`;
    }
    
    if (log.variables) {
      message += `\n    📊 Variáveis: ${JSON.stringify(log.variables, null, 2)}`;
    }
    
    if (log.operation) {
      message += `\n    ⚙️ Operação: ${log.operation}`;
    }
    
    if (log.units) {
      message += `\n    📏 Unidades: ${log.units}`;
    }
    
    if (log.references && log.references.length > 0) {
      message += `\n    📚 Referências: ${log.references.join(', ')}`;
    }
    
    if (log.data) {
      message += `\n    💾 Resultado: ${JSON.stringify(log.data, null, 2)}`;
    }
    
    return message;
  }

  private generateLogId(): string {
    return `${this.sessionId}-${++this.logId}`;
  }

  info(category: string, message: string, data?: any): void {
    const log: CalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'info',
      category,
      message,
      data
    };
    this.logs.push(log);
    this.emitLog(log);
  }

  calculation(category: string, message: string, operation: string, data?: any): void {
    const log: CalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'calculation',
      category,
      message,
      operation,
      data
    };
    this.logs.push(log);
    this.emitLog(log);
  }

  result(category: string, message: string, data?: any): void {
    const log: CalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'result',
      category,
      message,
      data
    };
    this.logs.push(log);
    this.emitLog(log);
  }

  error(category: string, message: string, data?: any): void {
    const log: CalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'error',
      category,
      message,
      data
    };
    this.logs.push(log);
    this.emitLog(log);
  }

  formula(
    category: string, 
    message: string, 
    formula: string, 
    variables: Record<string, any>,
    result: any,
    options?: {
      description?: string;
      units?: string;
      references?: string[];
    }
  ): void {
    const log: CalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'formula',
      category,
      message,
      formula,
      variables,
      data: { result },
      description: options?.description,
      units: options?.units,
      references: options?.references
    };
    this.logs.push(log);
    this.emitLog(log);
  }

  context(category: string, message: string, data?: any, description?: string): void {
    const log: CalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'context',
      category,
      message,
      data,
      description
    };
    this.logs.push(log);
    this.emitLog(log);
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
      
      if (log.description) {
        message += `\n    📋 Descrição: ${log.description}`;
      }
      
      if (log.formula) {
        message += `\n    🧮 Fórmula: ${log.formula}`;
      }
      
      if (log.variables) {
        message += `\n    📊 Variáveis: ${JSON.stringify(log.variables, null, 2)}`;
      }
      
      if (log.operation) {
        message += `\n    ⚙️ Operação: ${log.operation}`;
      }
      
      if (log.units) {
        message += `\n    📏 Unidades: ${log.units}`;
      }
      
      if (log.references && log.references.length > 0) {
        message += `\n    📚 Referências: ${log.references.join(', ')}`;
      }
      
      if (log.data) {
        message += `\n    💾 Resultado: ${JSON.stringify(log.data, null, 2)}`;
      }
      
      return message;
    });
  }

  getDetailedReport(): string {
    const report = this.logs.map((log, index) => {
      const timestamp = log.timestamp.toISOString();
      const emoji = this.getEmoji(log.type, log.category);
      
      let section = `\n${index + 1}. ${emoji} [${log.category.toUpperCase()}] ${log.message}\n`;
      section += `   ⏰ Timestamp: ${timestamp}\n`;
      section += `   📋 Tipo: ${log.type}\n`;
      
      if (log.description) {
        section += `   📝 Descrição: ${log.description}\n`;
      }
      
      if (log.formula) {
        section += `   🧮 Fórmula Matemática: ${log.formula}\n`;
      }
      
      if (log.variables) {
        section += `   📊 Variáveis de Entrada:\n`;
        Object.entries(log.variables).forEach(([key, value]) => {
          section += `      • ${key}: ${JSON.stringify(value)}\n`;
        });
      }
      
      if (log.operation) {
        section += `   ⚙️ Operação Executada: ${log.operation}\n`;
      }
      
      if (log.units) {
        section += `   📏 Unidade de Medida: ${log.units}\n`;
      }
      
      if (log.data) {
        section += `   📈 Resultado Calculado: ${JSON.stringify(log.data, null, 2)}\n`;
      }
      
      if (log.references && log.references.length > 0) {
        section += `   📚 Referências Técnicas:\n`;
        log.references.forEach(ref => {
          section += `      • ${ref}\n`;
        });
      }
      
      section += `   ${'─'.repeat(80)}\n`;
      
      return section;
    });
    
    const header = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                           RELATÓRIO DETALHADO DE CÁLCULOS                   ║
║                                                                              ║
║ Sessão: ${this.sessionId}                                                     ║
║ Total de Operações: ${this.logs.length}                                       ║
║ Gerado em: ${new Date().toISOString()}                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

    return header + report.join('');
  }

  private getEmoji(type: string, category: string): string {
    if (type === 'error') return '❌';
    if (type === 'result') return '✅';
    if (type === 'formula') return '🧮';
    if (type === 'context') return '📋';
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
        case 'bess':
        case 'bateria': return '🔋';
        case 'payback': return '💱';
        case 'roi': return '📊';
        case 'vpl': return '💎';
        case 'tir': return '📈';
        default: return '🧮';
      }
    }
    return 'ℹ️';
  }
}