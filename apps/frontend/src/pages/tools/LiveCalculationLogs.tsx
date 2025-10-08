import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Download, Trash2, Settings } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'calculation' | 'result' | 'error' | 'formula' | 'context';
  category: string;
  message: string;
  data?: any;
  formula?: string;
  description?: string;
  units?: string;
  variables?: Record<string, any>;
  references?: string[];
}

export default function LiveCalculationLogs() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [sessionId, setSessionId] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto scroll para o final quando novos logs chegam
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (type: string, category: string) => {
    if (type === 'error') return '❌';
    if (type === 'result') return '✅';
    if (type === 'formula') return '🧮';
    if (type === 'context') return '📋';
    
    switch (category.toLowerCase()) {
      case 'irradiação': case 'irradiation': return '🌞';
      case 'solar': return '☀️';
      case 'financeiro': case 'financial': return '💰';
      case 'sistema': case 'system': return '⚡';
      case 'vpl': return '💎';
      case 'tir': return '📈';
      case 'payback': return '💱';
      default: return 'ℹ️';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour12: false
    });
  };

  const simulateRealTimeCalculation = async () => {
    setIsRunning(true);
    setLogs([]);
    setProgress(0);
    
    const newSessionId = `live-calc-${Date.now()}`;
    setSessionId(newSessionId);

    try {
      // Simular etapas de cálculo com delay
      const steps = [
        { step: 'Iniciando análise...', delay: 500 },
        { step: 'Processando dados PVGIS...', delay: 800 },
        { step: 'Analisando irradiação solar...', delay: 1200 },
        { step: 'Calculando geração mensal...', delay: 1000 },
        { step: 'Dimensionando sistema...', delay: 900 },
        { step: 'Executando análise financeira...', delay: 1500 },
        { step: 'Calculando VPL e TIR...', delay: 800 },
        { step: 'Finalizando relatório...', delay: 600 }
      ];

      // Executar cada etapa com delay
      for (let i = 0; i < steps.length; i++) {
        const { step, delay } = steps[i];
        
        setCurrentStep(step);
        setProgress((i / steps.length) * 100);

        // Simular logs da etapa atual
        await simulateStepLogs(step, i + 1, newSessionId);
        
        if (i < steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Executar cálculo real no final
      await executeRealCalculation(newSessionId);
      
      setCurrentStep('Concluído!');
      setProgress(100);
      
      toast({
        title: "Cálculos concluídos!",
        description: `${logs.length} operações executadas com sucesso.`,
      });

    } catch (error) {
      addLog({
        id: `error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'error',
        category: 'Sistema',
        message: 'Erro ao executar cálculos',
        data: { error: error instanceof Error ? error.message : String(error) }
      });
      
      toast({
        title: "Erro no cálculo",
        description: "Ocorreu um erro durante a execução.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const simulateStepLogs = async (step: string, stepNumber: number, sessionId: string) => {
    const baseTime = Date.now();
    
    switch (stepNumber) {
      case 1:
        addLog({
          id: `${sessionId}-1`,
          timestamp: new Date(baseTime).toISOString(),
          type: 'info',
          category: 'Sistema',
          message: 'Iniciando demonstração de cálculos detalhados',
          data: { sessionId, timestamp: new Date().toISOString() }
        });
        break;

      case 2:
        await new Promise(resolve => setTimeout(resolve, 200));
        addLog({
          id: `${sessionId}-2`,
          timestamp: new Date(baseTime + 200).toISOString(),
          type: 'context',
          category: 'PVGIS',
          message: 'Processando dados de irradiação do PVGIS',
          description: 'Obtendo dados mensais de irradiação solar para as coordenadas especificadas',
          data: { latitude: -23.5505, longitude: -46.6333 }
        });
        break;

      case 3:
        await new Promise(resolve => setTimeout(resolve, 300));
        addLog({
          id: `${sessionId}-3a`,
          timestamp: new Date(baseTime + 300).toISOString(),
          type: 'formula',
          category: 'Irradiação',
          message: 'Média Anual de Irradiação',
          formula: 'H_média = Σ(H_mensal) / 12',
          variables: {
            H_mensal: [6.05, 6.14, 5.7, 4.76, 3.64, 3.23, 3.6, 4.31, 4.83, 5.39, 6.34, 6.26],
            soma_total: 60.25,
            numero_meses: 12
          },
          data: { result: 5.02 },
          units: 'kWh/m²/dia',
          references: ['PVGIS - Photovoltaic Geographical Information System']
        });

        await new Promise(resolve => setTimeout(resolve, 400));
        addLog({
          id: `${sessionId}-3b`,
          timestamp: new Date(baseTime + 700).toISOString(),
          type: 'formula',
          category: 'Irradiação',
          message: 'Identificação de Extremos',
          formula: 'H_max = max(H_mensal), H_min = min(H_mensal)',
          data: { 
            maximo: { valor: 6.34, mes: 'Novembro' },
            minimo: { valor: 3.23, mes: 'Junho' }
          }
        });

        await new Promise(resolve => setTimeout(resolve, 300));
        addLog({
          id: `${sessionId}-3c`,
          timestamp: new Date(baseTime + 1000).toISOString(),
          type: 'formula',
          category: 'Irradiação',
          message: 'Variação Sazonal',
          formula: 'Var_% = ((H_max - H_min) / H_min) × 100',
          variables: { H_max: 6.34, H_min: 3.23, diferenca_absoluta: 3.11 },
          data: { percentual: 96.3, classificacao: 'Muito Alta' }
        });
        break;

      case 4:
        await new Promise(resolve => setTimeout(resolve, 200));
        addLog({
          id: `${sessionId}-4a`,
          timestamp: new Date(baseTime + 200).toISOString(),
          type: 'formula',
          category: 'Solar',
          message: 'Eficiência líquida do sistema',
          formula: 'η_sistema = (η_nominal / 100) × (1 - P_perdas / 100)',
          variables: { η_nominal: 20, P_perdas: 14 },
          data: { result: 0.172 },
          units: 'decimal (0-1)'
        });

        await new Promise(resolve => setTimeout(resolve, 400));
        addLog({
          id: `${sessionId}-4b`,
          timestamp: new Date(baseTime + 600).toISOString(),
          type: 'formula',
          category: 'Solar',
          message: 'Geração mensal - Janeiro',
          formula: 'E_mensal = P_nominal × H_solar × η_sistema × f_lat × dias_mês',
          variables: { P_nominal: 5.4, H_solar: 6.05, η_sistema: 0.172, f_lat: 0.906, dias_mês: 31 },
          data: { result: 168.7 },
          units: 'kWh'
        });
        break;

      case 5:
        await new Promise(resolve => setTimeout(resolve, 300));
        addLog({
          id: `${sessionId}-5a`,
          timestamp: new Date(baseTime + 300).toISOString(),
          type: 'formula',
          category: 'Sistema',
          message: 'Número de Módulos Necessários',
          formula: 'N_módulos = TETO(P_sistema / P_módulo)',
          variables: { P_sistema_W: 5400, P_modulo_W: 540 },
          data: { result: 10 },
          units: 'unidades'
        });

        await new Promise(resolve => setTimeout(resolve, 400));
        addLog({
          id: `${sessionId}-5b`,
          timestamp: new Date(baseTime + 700).toISOString(),
          type: 'formula',
          category: 'Sistema',
          message: 'Área Necessária para Instalação',
          formula: 'A_total = N_módulos × A_módulo',
          variables: { N_modulos: 10, A_modulo_m2: 2.1 },
          data: { result: 21 },
          units: 'm²'
        });
        break;

      case 6:
        await new Promise(resolve => setTimeout(resolve, 400));
        addLog({
          id: `${sessionId}-6`,
          timestamp: new Date(baseTime + 400).toISOString(),
          type: 'context',
          category: 'Financeiro',
          message: 'Iniciando análise financeira completa',
          description: 'Análise de viabilidade econômica considerando VPL, TIR, Payback e LCOE'
        });
        break;

      case 7:
        await new Promise(resolve => setTimeout(resolve, 300));
        addLog({
          id: `${sessionId}-7a`,
          timestamp: new Date(baseTime + 300).toISOString(),
          type: 'formula',
          category: 'VPL',
          message: 'Valor Presente Líquido final',
          formula: 'VPL = -I₀ + Σ(FC_t / (1+r)^t)',
          variables: { I0: 32000, r: 0.1, somaVP: 48230 },
          data: { result: 16230 },
          units: 'R$'
        });

        await new Promise(resolve => setTimeout(resolve, 500));
        addLog({
          id: `${sessionId}-7b`,
          timestamp: new Date(baseTime + 800).toISOString(),
          type: 'formula',
          category: 'TIR',
          message: 'Taxa Interna de Retorno calculada',
          formula: 'TIR encontrada por Newton-Raphson',
          data: { tir: 18.7, iteracoes: 5 },
          units: '%'
        });
        break;

      case 8:
        await new Promise(resolve => setTimeout(resolve, 200));
        addLog({
          id: `${sessionId}-8`,
          timestamp: new Date(baseTime + 200).toISOString(),
          type: 'result',
          category: 'Sistema',
          message: 'Cálculos detalhados concluídos com sucesso',
          data: { 
            totalLogs: logs.length + 15,
            vpl: 16230,
            tir: 18.7,
            payback: 7.2,
            geracaoAnual: 7234
          }
        });
        break;
    }
  };

  const executeRealCalculation = async (sessionId: string) => {
    // Aqui você pode fazer a chamada real da API se quiser
    // const response = await apiClient.post('/calculations/detailed-calculation', params);
    // Processar resposta e adicionar logs reais
  };

  const addLog = (log: LogEntry) => {
    setLogs(prev => [...prev, log]);
  };

  const clearLogs = () => {
    setLogs([]);
    setCurrentStep('');
    setProgress(0);
  };

  const exportLogs = () => {
    const logData = {
      sessionId,
      timestamp: new Date().toISOString(),
      logs,
      summary: {
        totalOperations: logs.length,
        operationsByType: logs.reduce((acc, log) => {
          acc[log.type] = (acc[log.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-calculation-logs-${sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Logs exportados!",
      description: "Os logs foram salvos em arquivo JSON.",
    });
  };

  const stopCalculation = () => {
    setIsRunning(false);
    setCurrentStep('Interrompido');
    addLog({
      id: `stop-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      category: 'Sistema',
      message: 'Cálculo interrompido pelo usuário'
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Console de Cálculos ao Vivo
        </h1>
        <p className="text-gray-600">
          Acompanhe os cálculos sendo executados em tempo real com logs detalhados
        </p>
      </div>

      {/* Controles */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Controles de Execução
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isRunning ? "default" : "secondary"}>
                {isRunning ? 'Executando' : 'Parado'}
              </Badge>
              {sessionId && (
                <Badge variant="outline">
                  Sessão: {sessionId.split('-').pop()}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={simulateRealTimeCalculation}
              disabled={isRunning}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Iniciar Cálculos
            </Button>
            
            <Button
              variant="destructive"
              onClick={stopCalculation}
              disabled={!isRunning}
              className="gap-2"
            >
              <Square className="w-4 h-4" />
              Parar
            </Button>

            <Button
              variant="outline"
              onClick={clearLogs}
              disabled={isRunning}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>

            <Button
              variant="outline"
              onClick={exportLogs}
              disabled={logs.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>

          {/* Barra de Progresso */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Console de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💻 Console de Logs ao Vivo
            <Badge variant="outline">
              {logs.length} operações
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96" ref={scrollRef}>
            <div className="p-4 space-y-2 font-mono text-sm bg-gray-950 text-green-400">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  Pressione "Iniciar Cálculos" para ver os logs em tempo real...
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border-l-2 border-green-600 pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-400">[{formatTimestamp(log.timestamp)}]</span>
                      <span className="text-yellow-400">{getLogIcon(log.type, log.category)}</span>
                      <span className="text-white font-semibold">{log.category}</span>
                      <Badge variant={log.type === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                        {log.type}
                      </Badge>
                    </div>
                    
                    <div className="text-green-300 mb-2">
                      {log.message}
                    </div>

                    {log.description && (
                      <div className="text-gray-400 text-xs mb-1">
                        📋 {log.description}
                      </div>
                    )}

                    {log.formula && (
                      <div className="text-cyan-400 text-xs mb-1">
                        🧮 {log.formula}
                      </div>
                    )}

                    {log.variables && (
                      <div className="text-purple-400 text-xs mb-1">
                        📊 {JSON.stringify(log.variables, null, 2)}
                      </div>
                    )}

                    {log.units && (
                      <div className="text-orange-400 text-xs mb-1">
                        📏 {log.units}
                      </div>
                    )}

                    {log.data && (
                      <div className="text-emerald-400 text-xs mb-2">
                        💾 {JSON.stringify(log.data, null, 2)}
                      </div>
                    )}

                    {log.references && log.references.length > 0 && (
                      <div className="text-blue-300 text-xs">
                        📚 {log.references.join(', ')}
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {isRunning && (
                <div className="text-yellow-400 animate-pulse">
                  ⏳ {currentStep}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}