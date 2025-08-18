import React, { useState } from 'react';
import { 
  Sun, Zap, Calculator, TrendingUp, MapPin, 
  AlertCircle, CheckCircle, Info, Settings,
  Download, RefreshCw, Eye, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useSolarAnalysis, 
  useSolarPotential, 
  useSolarRecommendations,
  SolarAnalysisRequest,
  SolarAnalysisResult
} from '@/hooks/solar-analysis-hooks';

interface SolarAnalysisPanelProps {
  latitude?: number;
  longitude?: number;
  onAnalysisComplete?: (result: SolarAnalysisResult) => void;
  showImagery?: boolean;
  defaultValues?: {
    monthlyBill?: number;
    panelWattage?: number;
    systemEfficiency?: number;
  };
}

export const SolarAnalysisPanel: React.FC<SolarAnalysisPanelProps> = ({
  latitude: initialLatitude,
  longitude: initialLongitude,
  onAnalysisComplete,
  showImagery = false,
  defaultValues = {}
}) => {
  const [coordinates, setCoordinates] = useState({
    latitude: initialLatitude || '',
    longitude: initialLongitude || ''
  });
  
  const [analysisParams, setAnalysisParams] = useState({
    monthlyBill: defaultValues.monthlyBill || 200,
    panelWattage: defaultValues.panelWattage || 550,
    systemEfficiency: defaultValues.systemEfficiency || 0.85,
    includeImagery: showImagery
  });

  // Hooks
  const solarAnalysis = useSolarAnalysis();
  const solarPotential = useSolarPotential(
    coordinates.latitude ? Number(coordinates.latitude) : undefined,
    coordinates.longitude ? Number(coordinates.longitude) : undefined
  );
  const solarRecommendations = useSolarRecommendations(
    coordinates.latitude ? Number(coordinates.latitude) : undefined,
    coordinates.longitude ? Number(coordinates.longitude) : undefined
  );

  const handleAnalyze = async () => {
    const lat = Number(coordinates.latitude);
    const lng = Number(coordinates.longitude);

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      alert('Por favor, insira coordenadas válidas');
      return;
    }

    const request: SolarAnalysisRequest = {
      latitude: lat,
      longitude: lng,
      monthlyEnergyBill: analysisParams.monthlyBill,
      panelWattage: analysisParams.panelWattage,
      systemEfficiency: analysisParams.systemEfficiency,
      includeImageryData: analysisParams.includeImagery
    };

    try {
      const result = await solarAnalysis.mutateAsync(request);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (error) {
      console.error('Erro na análise solar:', error);
    }
  };

  const getViabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplexityBadge = (complexity: 'LOW' | 'MEDIUM' | 'HIGH') => {
    const variants = {
      LOW: 'default',
      MEDIUM: 'secondary',
      HIGH: 'destructive'
    } as const;
    
    const labels = {
      LOW: 'Baixa',
      MEDIUM: 'Média',
      HIGH: 'Alta'
    };

    return (
      <Badge variant={variants[complexity]}>
        {labels[complexity]}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-6 h-6 text-yellow-500" />
            Análise de Potencial Solar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Coordinates Input */}
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="-23.5505"
                value={coordinates.latitude}
                onChange={(e) => setCoordinates(prev => ({ ...prev, latitude: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="-46.6333"
                value={coordinates.longitude}
                onChange={(e) => setCoordinates(prev => ({ ...prev, longitude: e.target.value }))}
              />
            </div>
            
            {/* Monthly Bill */}
            <div>
              <Label htmlFor="monthlyBill">Conta Mensal (R$)</Label>
              <Input
                id="monthlyBill"
                type="number"
                value={analysisParams.monthlyBill}
                onChange={(e) => setAnalysisParams(prev => ({ 
                  ...prev, 
                  monthlyBill: Number(e.target.value) 
                }))}
              />
            </div>

            {/* Analyze Button */}
            <div className="flex items-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={solarAnalysis.isPending}
                className="w-full"
              >
                {solarAnalysis.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Analisar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Solar Potential */}
      {solarPotential.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Potencial Solar Rápido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {solarPotential.data.solarPotential.viabilityScore}%
                </div>
                <div className="text-sm text-gray-500">Score de Viabilidade</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {solarPotential.data.solarPotential.maxPanelsCount}
                </div>
                <div className="text-sm text-gray-500">Painéis Máximos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(solarPotential.data.solarPotential.maxAreaMeters2)}m²
                </div>
                <div className="text-sm text-gray-500">Área Disponível</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(solarPotential.data.solarPotential.estimatedGeneration / 1000)}
                </div>
                <div className="text-sm text-gray-500">MWh/ano Estimado</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis Results */}
      {solarAnalysis.data && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="technical">Técnico</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Score de Viabilidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Viabilidade Geral</span>
                      <span className={`font-bold ${getViabilityColor(solarAnalysis.data.analysis.viabilityScore)}`}>
                        {solarAnalysis.data.analysis.viabilityScore}%
                      </span>
                    </div>
                    <Progress value={solarAnalysis.data.analysis.viabilityScore} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Complexidade do Telhado</span>
                      {getComplexityBadge(solarAnalysis.data.analysis.roofComplexity)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="w-5 h-5" />
                    Configuração Ótima
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Inclinação Ótima</span>
                      <span className="font-mono">{solarAnalysis.data.analysis.optimalTilt}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Azimute Ótimo</span>
                      <span className="font-mono">{solarAnalysis.data.analysis.optimalAzimuth}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Geração Anual</span>
                      <span className="font-mono">
                        {Math.round(solarAnalysis.data.analysis.annualGeneration / 1000)} MWh
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Projeção Financeira
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(solarAnalysis.data.analysis.savings.annual)}
                    </div>
                    <div className="text-sm text-gray-500">Economia Anual</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(solarAnalysis.data.analysis.savings.monthly)}
                    </div>
                    <div className="text-sm text-gray-500">Economia Mensal</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-purple-600">
                      {solarAnalysis.data.analysis.savings.paybackYears} anos
                    </div>
                    <div className="text-sm text-gray-500">Payback</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Dados Técnicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Área Máxima Disponível</Label>
                    <div className="font-mono text-lg">
                      {solarAnalysis.data.buildingInsights.solarPotential?.maxArrayAreaMeters2?.toFixed(1)}m²
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Máximo de Painéis</Label>
                    <div className="font-mono text-lg">
                      {solarAnalysis.data.buildingInsights.solarPotential?.maxArrayPanelsCount}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Horas de Sol/Ano</Label>
                    <div className="font-mono text-lg">
                      {solarAnalysis.data.buildingInsights.solarPotential?.maxSunshineHoursPerYear}h
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Qualidade da Imagem</Label>
                    <Badge variant={solarAnalysis.data.metadata.imageQuality === 'HIGH' ? 'default' : 'secondary'}>
                      {solarAnalysis.data.metadata.imageQuality}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {solarAnalysis.data.analysis.recommendations.map((recommendation, index) => (
                    <Alert key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {recommendation}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Error States */}
      {solarAnalysis.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro na análise solar: {solarAnalysis.error?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading States */}
      {(solarPotential.isLoading || solarRecommendations.isLoading) && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Carregando dados solares...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};