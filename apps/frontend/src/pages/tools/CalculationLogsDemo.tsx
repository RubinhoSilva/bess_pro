import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Download } from 'lucide-react';
import { CalculationLogViewer } from '@/components/calculation/CalculationLogViewer';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface CalculationParams {
  systemParams: {
    potenciaNominal: number;
    area: number;
    eficiencia: number;
    perdas: number;
    inclinacao: number;
    orientacao: number;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  irradiationData: {
    monthly: number[];
    annual: number;
  };
  financialParams: {
    investimentoInicial: number;
    tarifaEnergia: number;
    inflacaoEnergia: number;
    taxaDesconto: number;
    vidaUtil: number;
    custoOperacional: number;
    valorResidual: number;
  };
}

export default function CalculationLogsDemo() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const [params, setParams] = useState<CalculationParams>({
    systemParams: {
      potenciaNominal: 5.4, // kWp
      area: 30, // m²
      eficiencia: 20, // %
      perdas: 14, // %
      inclinacao: 23, // graus
      orientacao: 0 // graus (Norte)
    },
    coordinates: {
      latitude: -23.5505, // São Paulo
      longitude: -46.6333
    },
    irradiationData: {
      monthly: [4.5, 4.8, 4.2, 3.9, 3.2, 2.8, 3.1, 3.6, 4.1, 4.7, 5.2, 4.9], // kWh/m²/dia
      annual: 4.35
    },
    financialParams: {
      investimentoInicial: 32000, // R$
      tarifaEnergia: 0.85, // R$/kWh
      inflacaoEnergia: 5.5, // % ao ano
      taxaDesconto: 10.0, // % ao ano
      vidaUtil: 25, // anos
      custoOperacional: 200, // R$/ano
      valorResidual: 3200 // R$ (10% do investimento)
    }
  });

  const handleInputChange = (section: keyof CalculationParams, field: string, value: number) => {
    setParams(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const executeCalculation = async () => {
    setIsCalculating(true);
    try {
      const response = await apiClient.post('/calculations/detailed-calculation', params);
      setResults(response.data);
      
      toast({
        title: "Cálculo concluído!",
        description: `${response.data.logs.summary.totalOperations} operações executadas com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao executar cálculo:', error);
      toast({
        title: "Erro no cálculo",
        description: "Ocorreu um erro ao executar os cálculos detalhados.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const exportLogs = () => {
    if (!results) return;

    const logData = {
      sessionId: results.sessionId,
      timestamp: results.timestamp,
      detailedReport: results.logs.detailed,
      summary: results.logs.summary,
      calculations: results.calculations
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calculation-logs-${results.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Logs exportados!",
      description: "Os logs foram salvos em arquivo JSON.",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Demonstração de Logs Detalhados de Cálculo
        </h1>
        <p className="text-gray-600">
          Explore os cálculos fotovoltaicos e financeiros com logs detalhados, fórmulas e referências técnicas
        </p>
      </div>

      {/* Parâmetros de Entrada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sistema Solar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ☀️ Parâmetros do Sistema Solar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="potencia">Potência (kWp)</Label>
                <Input
                  id="potencia"
                  type="number"
                  step="0.1"
                  value={params.systemParams.potenciaNominal}
                  onChange={(e) => handleInputChange('systemParams', 'potenciaNominal', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="area">Área (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  value={params.systemParams.area}
                  onChange={(e) => handleInputChange('systemParams', 'area', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="eficiencia">Eficiência (%)</Label>
                <Input
                  id="eficiencia"
                  type="number"
                  step="0.1"
                  value={params.systemParams.eficiencia}
                  onChange={(e) => handleInputChange('systemParams', 'eficiencia', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="perdas">Perdas (%)</Label>
                <Input
                  id="perdas"
                  type="number"
                  step="0.1"
                  value={params.systemParams.perdas}
                  onChange={(e) => handleInputChange('systemParams', 'perdas', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="inclinacao">Inclinação (°)</Label>
                <Input
                  id="inclinacao"
                  type="number"
                  value={params.systemParams.inclinacao}
                  onChange={(e) => handleInputChange('systemParams', 'inclinacao', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="orientacao">Orientação (°)</Label>
                <Input
                  id="orientacao"
                  type="number"
                  value={params.systemParams.orientacao}
                  onChange={(e) => handleInputChange('systemParams', 'orientacao', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parâmetros Financeiros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 Parâmetros Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="investimento">Investimento Inicial (R$)</Label>
                <Input
                  id="investimento"
                  type="number"
                  value={params.financialParams.investimentoInicial}
                  onChange={(e) => handleInputChange('financialParams', 'investimentoInicial', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="tarifa">Tarifa de Energia (R$/kWh)</Label>
                <Input
                  id="tarifa"
                  type="number"
                  step="0.01"
                  value={params.financialParams.tarifaEnergia}
                  onChange={(e) => handleInputChange('financialParams', 'tarifaEnergia', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="inflacao">Inflação Energia (%/ano)</Label>
                <Input
                  id="inflacao"
                  type="number"
                  step="0.1"
                  value={params.financialParams.inflacaoEnergia}
                  onChange={(e) => handleInputChange('financialParams', 'inflacaoEnergia', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="desconto">Taxa de Desconto (%/ano)</Label>
                <Input
                  id="desconto"
                  type="number"
                  step="0.1"
                  value={params.financialParams.taxaDesconto}
                  onChange={(e) => handleInputChange('financialParams', 'taxaDesconto', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="vidautil">Vida Útil (anos)</Label>
                <Input
                  id="vidautil"
                  type="number"
                  value={params.financialParams.vidaUtil}
                  onChange={(e) => handleInputChange('financialParams', 'vidaUtil', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="operacional">Custo Operacional (R$/ano)</Label>
                <Input
                  id="operacional"
                  type="number"
                  value={params.financialParams.custoOperacional}
                  onChange={(e) => handleInputChange('financialParams', 'custoOperacional', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Localização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📍 Coordenadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0001"
                value={params.coordinates.latitude}
                onChange={(e) => handleInputChange('coordinates', 'latitude', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.0001"
                value={params.coordinates.longitude}
                onChange={(e) => handleInputChange('coordinates', 'longitude', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Execução */}
      <div className="text-center">
        <Button
          size="lg"
          onClick={executeCalculation}
          disabled={isCalculating}
          className="gap-2"
        >
          {isCalculating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          {isCalculating ? 'Calculando...' : 'Executar Cálculos Detalhados'}
        </Button>
      </div>

      {/* Visualização dos Resultados */}
      {results && (
        <CalculationLogViewer 
          results={results} 
          onExportLogs={exportLogs}
        />
      )}
    </div>
  );
}