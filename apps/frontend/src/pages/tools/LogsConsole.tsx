import React, { useState, useEffect, useRef } from 'react';
import { socketService } from '../../lib/socket';

export default function LogsConsole() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Conectar ao WebSocket ao montar o componente
    const socket = socketService.connect();
    
    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('Conectado ao servidor backend');
      socketService.joinCalculationLogs();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setConnectionStatus('Desconectado do servidor');
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setConnectionStatus('Erro na conexão com o servidor');
    });

    // Escutar logs em tempo real do backend
    socketService.onConsoleLog((logData) => {
      const timestamp = new Date(logData.timestamp).toLocaleTimeString('pt-BR', { hour12: false });
      const logMessage = `[${timestamp}] ${logData.message}`;
      setLogs(prev => [...prev, logMessage]);
      setCurrentStep(logData.message);
    });

    socketService.onCalculationLog((logData) => {
      const timestamp = new Date(logData.timestamp).toLocaleTimeString('pt-BR', { hour12: false });
      const emoji = getEmojiForLogType(logData.type, logData.category);
      const logMessage = `[${timestamp}] ${emoji} ${logData.category}: ${logData.message}`;
      setLogs(prev => [...prev, logMessage]);
      setCurrentStep(logData.message);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll para o final dos logs
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getEmojiForLogType = (type: string, category: string): string => {
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
  };

  const clearLogs = () => {
    setLogs([]);
    setCurrentStep('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🧮 Console de Cálculos ao Vivo
          </h1>
          <p className="text-xl text-gray-600">
            Acompanhe cada fórmula e resultado sendo calculado em tempo real
          </p>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Console em Tempo Real</h2>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {logs.length} logs
              </span>
            </div>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Status:</strong> {connectionStatus}
            </p>
            <p className="text-blue-600 text-xs mt-1">
              Este console mostra os logs reais do backend conforme os cálculos são executados.
              Acesse qualquer tela de cálculo (simulação, BESS, etc.) para ver os logs em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={clearLogs}
              className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 bg-gray-600 text-white hover:bg-gray-700"
            >
              🗑️ Limpar Logs
            </button>
            
            <button
              onClick={() => window.open('/simulation', '_blank')}
              className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              ⚡ Testar Simulação PV
            </button>

            <button
              onClick={() => window.open('/bess-simulation', '_blank')}
              className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
            >
              🔋 Testar BESS
            </button>
          </div>

          {currentStep && (
            <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
              <p className="text-green-800 font-medium">
                🔄 Último log: {currentStep}
              </p>
            </div>
          )}
        </div>

        {/* Console */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              💻 Console de Logs Detalhados
            </h2>
            <span className={`text-sm font-mono ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              Sistema: {isConnected ? 'Conectado' : 'Desconectado'} | WebSocket: {isConnected ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          
          <div className="h-96 overflow-y-auto bg-black text-green-400 font-mono text-sm p-4">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-12">
                <div className="text-2xl mb-2">🖥️</div>
                <p>Console pronto - Execute cálculos para ver logs em tempo real</p>
                <p className="text-xs mt-2">
                  {isConnected ? 
                    'Conectado ao backend - Acesse simulações para ver logs' : 
                    'Aguardando conexão com o servidor backend...'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`${
                      log.includes('🧮 Fórmula') ? 'text-cyan-400 font-semibold' :
                      log.includes('📊') ? 'text-yellow-300' :
                      log.includes('✅') ? 'text-green-300' :
                      log.includes('📈') || log.includes('📉') ? 'text-blue-300' :
                      log.includes('💰') || log.includes('💎') ? 'text-yellow-400' :
                      log.includes('🏷️') ? 'text-purple-400' :
                      'text-green-400'
                    }`}
                  >
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            🧮 Sistema de Logs Detalhados | Todas as fórmulas e cálculos são documentados em tempo real
          </p>
        </div>
      </div>
    </div>
  );
}