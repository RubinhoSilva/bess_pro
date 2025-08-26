export interface BackendCalculationLog {
  calculationLogs?: string[];
  _rawLogs?: any[];
}

export class CalculationLogDisplayer {
  static displayBackendLogs(logs: BackendCalculationLog | any, source: string = 'Backend'): void {
    if (!logs) return;

    const backendLogs = logs.calculationLogs || [];
    const rawLogs = logs._rawLogs || [];

    if (backendLogs.length > 0) {
      console.log(`🚀 === LOGS DE CÁLCULO DO ${source.toUpperCase()} ===`);
      backendLogs.forEach((log: string, index: number) => {
        console.log(`${index + 1}. ${log}`);
      });
      console.log(`✅ === FIM DOS LOGS DO ${source.toUpperCase()} (${backendLogs.length} operações) ===`);
    }

    // Se houver logs brutos e estiver em desenvolvimento, exibir também
    if (rawLogs.length > 0 && import.meta.env.DEV) {
      console.log(`🔧 === LOGS DETALHADOS DO ${source.toUpperCase()} (DEV) ===`);
      rawLogs.forEach((log: any, index: number) => {
        console.log(`${index + 1}. [${log.type.toUpperCase()}] ${log.category}: ${log.message}`);
        if (log.operation) {
          console.log(`   ➤ Operação: ${log.operation}`);
        }
        if (log.data && Object.keys(log.data).length > 0) {
          console.log(`   ➤ Dados:`, log.data);
        }
      });
      console.log(`🔧 === FIM LOGS DETALHADOS (${rawLogs.length} registros) ===`);
    }
  }

  static mergeWithFrontendResults(frontendResults: any, backendLogs?: BackendCalculationLog): any {
    if (!backendLogs || !backendLogs.calculationLogs) {
      return frontendResults;
    }

    // Exibir logs do backend primeiro
    this.displayBackendLogs(backendLogs, 'Backend');

    // Retornar resultados com logs integrados
    return {
      ...frontendResults,
      backendLogs: backendLogs.calculationLogs,
      _backendRawLogs: backendLogs._rawLogs
    };
  }

  static logApiCall(endpoint: string, params: any, response: any): void {
    console.log(`🌐 === CHAMADA DE API ===`);
    console.log(`📍 Endpoint: ${endpoint}`);
    console.log(`📤 Parâmetros enviados:`, params);
    
    if (response.calculationLogs || response._rawLogs) {
      console.log(`📥 Resposta com logs do backend:`, {
        ...response,
        calculationLogs: `${response.calculationLogs?.length || 0} logs`,
        _rawLogs: `${response._rawLogs?.length || 0} logs detalhados`
      });
      
      // Exibir logs do backend
      this.displayBackendLogs(response, 'API Backend');
    } else {
      console.log(`📥 Resposta da API:`, response);
    }
    
    console.log(`🌐 === FIM CHAMADA DE API ===`);
  }
}