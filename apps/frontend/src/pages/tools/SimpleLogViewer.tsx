import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Trash2 } from 'lucide-react';

export default function SimpleLogViewer() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logEntry]);
  };

  const simulateCalculation = async () => {
    setIsRunning(true);
    setLogs([]);
    
    const steps = [
      '🌞 Iniciando análise de irradiação solar...',
      '📊 Média Anual: 5.02 kWh/m²/dia calculada',
      '📈 Máximo: 6.34 kWh/m²/dia em Novembro',
      '📉 Mínimo: 3.23 kWh/m²/dia em Junho',
      '🔄 Variação sazonal: 62% (Muito Alta)',
      '⚡ Calculando sistema fotovoltaico...',
      '🧮 Número de módulos: 10 unidades (540W cada)',
      '📐 Área necessária: 21 m²',
      '🏠 Cobertura do consumo: 112%',
      '💰 Iniciando análise financeira...',
      '💎 VPL: R$ 16.230 (Projeto viável)',
      '📈 TIR: 18.7% (Acima da taxa mínima)',
      '⏰ Payback: 7.2 anos',
      '✅ Cálculos concluídos com sucesso!'
    ];

    for (const [index, step] of steps.entries()) {
      setCurrentStep(step);
      addLog(step);
      
      // Delay entre passos
      if (index < steps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
    
    setIsRunning(false);
    setCurrentStep('Finalizado');
  };

  const clearLogs = () => {
    setLogs([]);
    setCurrentStep('');
  };

  const stopCalculation = () => {
    setIsRunning(false);
    setCurrentStep('Interrompido');
    addLog('❌ Cálculo interrompido pelo usuário');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Console de Cálculos ao Vivo
        </h1>
        <p className="text-gray-600">
          Acompanhe os cálculos sendo executados em tempo real
        </p>
      </div>

      {/* Controles */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Controles</CardTitle>
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? 'Executando' : 'Parado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={simulateCalculation}
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
          </div>

          {currentStep && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">
                {isRunning ? '⏳ ' : '✅ '}{currentStep}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Console de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💻 Console ao Vivo
            <Badge variant="outline">
              {logs.length} operações
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="h-96 p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg overflow-y-auto"
          >
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Pressione "Iniciar Cálculos" para ver os logs...
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-green-300">
                    {log}
                  </div>
                ))}
                {isRunning && (
                  <div className="text-yellow-400 animate-pulse">
                    ⏳ Executando...
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}