// Frontend Calculation Logger - para mostrar cálculos no console do navegador

export interface FrontendCalculationLog {
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

export class FrontendCalculationLogger {
  private logs: FrontendCalculationLog[] = [];
  private logId = 0;

  constructor(private sessionId: string) {}

  private generateLogId(): string {
    return `${this.sessionId}-${++this.logId}`;
  }

  private emitLog(log: FrontendCalculationLog): void {
    this.logs.push(log);
    
    // Mostrar no console do navegador com cores e formatação
    const timestamp = log.timestamp.toLocaleTimeString('pt-BR', { hour12: false });
    const emoji = this.getEmoji(log.type, log.category);
    
    let consoleMessage = `${emoji} [${timestamp}] ${log.category}: ${log.message}`;
    
    // Adicionar dados extras se disponíveis
    if (log.description) {
      console.group(consoleMessage);
      console.info('📋 Descrição:', log.description);
    } else {
      console.log(consoleMessage);
    }
    
    if (log.formula) {
      console.info('🧮 Fórmula:', log.formula);
    }
    
    if (log.variables) {
      console.info('📊 Variáveis:', log.variables);
    }
    
    if (log.operation) {
      console.info('⚙️ Operação:', log.operation);
    }
    
    if (log.units) {
      console.info('📏 Unidades:', log.units);
    }
    
    if (log.references && log.references.length > 0) {
      console.info('📚 Referências:', log.references);
    }
    
    if (log.data) {
      console.info('💾 Resultado:', log.data);
    }
    
    if (log.description) {
      console.groupEnd();
    }
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
        case 'pvgis': return '🌍';
        case 'api': return '🔗';
        default: return '🧮';
      }
    }
    return 'ℹ️';
  }

  info(category: string, message: string, data?: any): void {
    const log: FrontendCalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'info',
      category,
      message,
      data
    };
    this.emitLog(log);
  }

  calculation(category: string, message: string, operation: string, data?: any): void {
    const log: FrontendCalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'calculation',
      category,
      message,
      operation,
      data
    };
    this.emitLog(log);
  }

  result(category: string, message: string, data?: any): void {
    const log: FrontendCalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'result',
      category,
      message,
      data
    };
    this.emitLog(log);
  }

  error(category: string, message: string, data?: any): void {
    const log: FrontendCalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'error',
      category,
      message,
      data
    };
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
    const log: FrontendCalculationLog = {
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
    this.emitLog(log);
  }

  context(category: string, message: string, data?: any, description?: string): void {
    const log: FrontendCalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'context',
      category,
      message,
      data,
      description
    };
    this.emitLog(log);
  }

  getLogs(): FrontendCalculationLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    console.clear();
    console.log('🗑️ [Frontend] Logs limpos');
  }

  // Método para logar início de seção de cálculos
  startCalculationSection(title: string): void {
    console.group(`🎯 [INÍCIO] ${title}`);
    console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
  }

  // Método para logar fim de seção de cálculos
  endCalculationSection(title: string, summary?: any): void {
    console.log(`⏰ Finalizado em: ${new Date().toLocaleString('pt-BR')}`);
    if (summary) {
      console.log('📊 Resumo:', summary);
    }
    console.groupEnd();
    console.log(`✅ [CONCLUÍDO] ${title}`);
  }

  // Método para logar chamadas de API
  apiCall(url: string, method: string, data?: any): void {
    this.info('API', `${method} ${url}`, data);
  }

  // Método para logar respostas de API
  apiResponse(url: string, status: number, data?: any): void {
    const category = status >= 200 && status < 300 ? 'API' : 'API-Error';
    const type = status >= 200 && status < 300 ? 'result' : 'error';
    
    const log: FrontendCalculationLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: type as any,
      category,
      message: `Resposta ${status} de ${url}`,
      data
    };
    this.emitLog(log);
  }
}