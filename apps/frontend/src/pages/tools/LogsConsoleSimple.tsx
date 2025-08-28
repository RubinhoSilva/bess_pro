import React, { useState } from 'react';

export default function LogsConsoleSimple() {
  const [logs, setLogs] = useState<string[]>([]);

  const clearLogs = () => {
    setLogs([]);
  };

  const addTestLog = () => {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const logEntry = `[${timestamp}] 🧮 Teste de log - Sistema funcionando`;
    setLogs(prev => [...prev, logEntry]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🧮 Console de Cálculos (Versão Simples)
          </h1>
          <p className="text-xl text-gray-600">
            Teste básico do console de logs
          </p>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Controles de Teste</h2>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {logs.length} logs
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={addTestLog}
              className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              ➕ Adicionar Log de Teste
            </button>

            <button
              onClick={clearLogs}
              className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 bg-gray-600 text-white hover:bg-gray-700"
            >
              🗑️ Limpar Logs
            </button>
          </div>
        </div>

        {/* Console */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              💻 Console de Logs Simples
            </h2>
            <span className="text-green-400 text-sm font-mono">
              Sistema: Funcionando
            </span>
          </div>
          
          <div className="h-96 overflow-y-auto bg-black text-green-400 font-mono text-sm p-4">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-12">
                <div className="text-2xl mb-2">🖥️</div>
                <p>Console de teste - Clique em "Adicionar Log de Teste" para testar</p>
                <p className="text-xs mt-2">Versão simplificada para diagnóstico</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-green-400">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            🧮 Console de Logs - Versão de Teste
          </p>
        </div>
      </div>
    </div>
  );
}