import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calculator, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Download,
  Eye,
  FileText,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CalculationLog {
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

interface CalculationResults {
  sessionId: string;
  timestamp: string;
  inputData: any;
  calculations: any;
  logs: {
    console: string[];
    detailed: string;
    summary: {
      totalOperations: number;
      operationsByType: Record<string, number>;
      operationsByCategory: Record<string, number>;
    };
  };
}

interface CalculationLogViewerProps {
  results: CalculationResults;
  onExportLogs?: () => void;
}

export function CalculationLogViewer({ results, onExportLogs }: CalculationLogViewerProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed' | 'console'>('summary');

  const getLogIcon = (type: string, category: string) => {
    if (type === 'error') return '❌';
    if (type === 'result') return '✅';
    if (type === 'formula') return '🧮';
    if (type === 'context') return '📋';
    
    switch (category.toLowerCase()) {
      case 'solar': return '☀️';
      case 'financeiro': case 'financial': return '💰';
      case 'vpl': return '💎';
      case 'tir': return '📈';
      case 'payback': return '💱';
      case 'lcoe': return '⚡';
      default: return 'ℹ️';
    }
  };

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Resumo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Logs Detalhados de Cálculo
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Sessão: {results.sessionId}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportLogs}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {results.logs.summary.totalOperations}
              </div>
              <div className="text-sm text-gray-600">Total de Operações</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {results.logs.summary.operationsByType.formula || 0}
              </div>
              <div className="text-sm text-gray-600">Fórmulas Aplicadas</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(results.logs.summary.operationsByCategory).length}
              </div>
              <div className="text-sm text-gray-600">Categorias</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {results.logs.summary.operationsByType.result || 0}
              </div>
              <div className="text-sm text-gray-600">Resultados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles de Visualização */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visualização dos Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'summary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('summary')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Resumo
              </Button>
              <Button
                variant={viewMode === 'detailed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('detailed')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Detalhado
              </Button>
              <Button
                variant={viewMode === 'console' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('console')}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Console
              </Button>
            </div>

            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar nos logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="formula">Fórmulas</SelectItem>
                  <SelectItem value="result">Resultados</SelectItem>
                  <SelectItem value="context">Contexto</SelectItem>
                  <SelectItem value="error">Erros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados dos Cálculos */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados Principais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Análise de Irradiação */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                🌞 Irradiação Solar
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Média Anual:</span>
                  <span className="font-medium">
                    {results.calculations.irradiation?.mediaAnual?.toFixed(2)} kWh/m²/dia
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Máximo:</span>
                  <span className="font-medium">
                    {results.calculations.irradiation?.maximo?.valor?.toFixed(2)} ({results.calculations.irradiation?.maximo?.mes})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mínimo:</span>
                  <span className="font-medium">
                    {results.calculations.irradiation?.minimo?.valor?.toFixed(2)} ({results.calculations.irradiation?.minimo?.mes})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Variação:</span>
                  <span className="font-medium">
                    {results.calculations.irradiation?.variacao?.percentual?.toFixed(0)}% ({results.calculations.irradiation?.variacao?.classificacao})
                  </span>
                </div>
              </div>
            </div>

            {/* Resumo do Sistema */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                ⚡ Sistema Fotovoltaico
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Potência Pico:</span>
                  <span className="font-medium">
                    {results.calculations.systemSummary?.potenciaPico?.valor?.toFixed(2)} kWp
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Módulos:</span>
                  <span className="font-medium">
                    {results.calculations.systemSummary?.modulos?.quantidade} unidades
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Área Necessária:</span>
                  <span className="font-medium">
                    {results.calculations.systemSummary?.areaNecessaria?.valor} m²
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cobertura:</span>
                  <span className="font-medium">
                    {results.calculations.systemSummary?.coberturaConsumo?.valor?.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Geração Solar */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                ☀️ Geração Estimada
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Geração Anual:</span>
                  <span className="font-medium">
                    {results.calculations.solar.annualGeneration?.toLocaleString('pt-BR')} kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Média Mensal:</span>
                  <span className="font-medium">
                    {results.calculations.solar.averageMonthlyGeneration?.toFixed(0)} kWh
                  </span>
                </div>
              </div>
            </div>

            {/* Resultados Financeiros */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                💰 Análise Financeira
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>VPL:</span>
                  <span className="font-medium">
                    R$ {results.calculations.financial.vpl?.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>TIR:</span>
                  <span className="font-medium">
                    {results.calculations.financial.tir?.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payback:</span>
                  <span className="font-medium">
                    {results.calculations.financial.payback?.toFixed(1)} anos
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>LCOE:</span>
                  <span className="font-medium">
                    R$ {results.calculations.financial.lcoe?.toFixed(4)}/kWh
                  </span>
                </div>
              </div>
            </div>

            {/* Economia */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                📊 Economia
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Economia Anual:</span>
                  <span className="font-medium">
                    R$ {results.calculations.financial.economiaAnual?.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Economia 25 Anos:</span>
                  <span className="font-medium">
                    R$ {results.calculations.financial.economiaAcumulada25Anos?.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização dos Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Cálculo</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {viewMode === 'console' && (
              <div className="space-y-2">
                {results.logs.console.map((log, index) => (
                  <div
                    key={index}
                    className="font-mono text-xs bg-gray-900 text-green-400 p-3 rounded whitespace-pre-wrap"
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'detailed' && (
              <div className="font-mono text-xs bg-gray-900 text-green-400 p-4 rounded whitespace-pre-wrap">
                {results.logs.detailed}
              </div>
            )}

            {viewMode === 'summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <h5 className="font-semibold">Por Tipo:</h5>
                    {Object.entries(results.logs.summary.operationsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <Badge variant="outline" className="capitalize">
                          {type}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-semibold">Por Categoria:</h5>
                    {Object.entries(results.logs.summary.operationsByCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <Badge variant="outline" className="capitalize">
                          {getLogIcon('info', category)} {category}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-center text-gray-600">
                  <p>Selecione 'Detalhado' ou 'Console' para ver os logs completos</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
