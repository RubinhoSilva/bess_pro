import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  MapPin, 
  Satellite, 
  Sun, 
  Zap, 
  BarChart3, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  Cloud,
  Thermometer
} from 'lucide-react';
import { getGoogleSolarAPI, type Location, type SolarPotentialResponse, type BuildingInsightsResponse } from '@/services/GoogleSolarAPI';
import { getPVGISAPI, type PVGISResponse, type PVGISHorizonResponse } from '@/services/PVGISAPI';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SolarLocationAnalyzerProps {
  onAnalysisComplete?: (data: any) => void;
  initialLocation?: Location;
}

interface AnalysisResults {
  location: Location;
  googleSolar?: {
    buildingInsights: BuildingInsightsResponse;
    solarPotential: SolarPotentialResponse;
    productionEstimates: any;
  };
  pvgis?: {
    pvEstimation: PVGISResponse;
    horizonProfile: PVGISHorizonResponse;
    optimalInclination: any;
    systemFormat: any;
  };
  combinedAnalysis?: {
    irradiacaoMensal: number[];
    producaoEstimada: number[];
    orientacaoOtima: { azimute: number; inclinacao: number };
    perdas: any;
    qualidade: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

const SolarLocationAnalyzer: React.FC<SolarLocationAnalyzerProps> = ({
  onAnalysisComplete,
  initialLocation
}) => {
  const { toast } = useToast();
  
  const [location, setLocation] = useState<Location>(
    initialLocation || { latitude: -23.5505, longitude: -46.6333 }
  );
  const [address, setAddress] = useState('');
  const [systemSize, setSystemSize] = useState(10); // kWp
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [activeTab, setActiveTab] = useState('input');
  const [googleApiKey, setGoogleApiKey] = useState('');

  const formatNumber = (value: number, decimals = 2) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const handleLocationChange = (field: 'latitude' | 'longitude', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setLocation(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const geocodeAddress = async () => {
    if (!address.trim()) return;

    try {
      // Usar geocoding simples para demonstração
      // Em produção, usar Google Geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setLocation({
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
          });
          toast({
            title: "Localização encontrada!",
            description: `Coordenadas: ${data[0].lat}, ${data[0].lon}`
          });
        } else {
          toast({
            variant: "destructive",
            title: "Endereço não encontrado",
            description: "Tente um endereço mais específico."
          });
        }
      }
    } catch (error) {
      console.error('Erro no geocoding:', error);
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: "Não foi possível buscar o endereço."
      });
    }
  };

  const runSolarAnalysis = async () => {
    setIsAnalyzing(true);
    setActiveTab('analysis');

    try {
      const analysisResults: AnalysisResults = {
        location
      };

      // Análise PVGIS (sempre disponível)
      toast({
        title: "Iniciando análise",
        description: "Obtendo dados PVGIS..."
      });

      const pvgisAPI = getPVGISAPI();
      
      const [pvEstimation, horizonProfile, optimalInclination] = await Promise.all([
        pvgisAPI.getPVEstimation({
          location,
          peakpower: systemSize,
          angle: 30,
          aspect: 180
        }),
        pvgisAPI.getHorizonProfile({ location }),
        pvgisAPI.getOptimalInclination(location)
      ]);

      const systemFormat = pvgisAPI.convertToSystemFormat(pvEstimation);

      analysisResults.pvgis = {
        pvEstimation,
        horizonProfile,
        optimalInclination,
        systemFormat
      };

      // Análise Google Solar (se API key disponível)
      if (googleApiKey) {
        toast({
          title: "Obtendo dados Google Solar",
          description: "Analisando potencial solar do edifício..."
        });

        try {
          const googleAPI = getGoogleSolarAPI(googleApiKey);
          
          const [buildingInsights, solarPotential] = await Promise.all([
            googleAPI.getBuildingInsights({
              location,
              requiredQuality: 'HIGH'
            }),
            googleAPI.getSolarPotential({
              location,
              radiusMeters: 50,
              panelCapacityWatts: 550
            })
          ]);

          const productionEstimates = googleAPI.calculateProductionEstimates(
            solarPotential, 
            systemSize
          );

          analysisResults.googleSolar = {
            buildingInsights,
            solarPotential,
            productionEstimates
          };
        } catch (error) {
          console.warn('Google Solar API não disponível:', error);
          toast({
            variant: "destructive",
            title: "Google Solar API",
            description: "Dados do Google Solar não disponíveis para esta localização."
          });
        }
      }

      // Análise combinada
      const irradiacaoMensal = analysisResults.pvgis.systemFormat.irradiacaoMensal;
      const producaoEstimada = analysisResults.pvgis.systemFormat.producaoEstimada.mensal;
      
      // Determinar orientação ótima
      const orientacaoOtima = {
        azimute: 180, // Sul
        inclinacao: analysisResults.pvgis.optimalInclination.optimalInclination
      };

      // Calcular perdas
      const perdas = {
        ...analysisResults.pvgis.systemFormat.perdas,
        sombreamento: pvgisAPI.calculateShadingLosses(horizonProfile, orientacaoOtima.inclinacao)
      };

      // Determinar qualidade do local
      const avgIrradiation = irradiacaoMensal.reduce((a: number, b: number) => a + b, 0) / 12;
      let qualidade: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
      
      if (avgIrradiation >= 6) qualidade = 'excellent';
      else if (avgIrradiation >= 5) qualidade = 'good';
      else if (avgIrradiation >= 4) qualidade = 'fair';

      analysisResults.combinedAnalysis = {
        irradiacaoMensal,
        producaoEstimada,
        orientacaoOtima,
        perdas,
        qualidade
      };

      setResults(analysisResults);

      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResults);
      }

      toast({
        title: "Análise concluída!",
        description: "Dados solares obtidos com sucesso."
      });

    } catch (error) {
      console.error('Erro na análise solar:', error);
      toast({
        variant: "destructive",
        title: "Erro na análise",
        description: "Não foi possível obter todos os dados solares."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityText = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'fair': return 'Regular';
      case 'poor': return 'Ruim';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg">
            <Satellite className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Análise Solar por Satélite
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Análise avançada usando Google Solar API e PVGIS para otimização de sistemas fotovoltaicos
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">Configuração</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuração de Localização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Buscar Endereço</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o endereço..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && geocodeAddress()}
                    />
                    <Button onClick={geocodeAddress} variant="outline">
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Latitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={location.latitude}
                      onChange={(e) => handleLocationChange('latitude', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={location.longitude}
                      onChange={(e) => handleLocationChange('longitude', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuração do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Sistema Fotovoltaico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Potência do Sistema (kWp)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={systemSize}
                    onChange={(e) => setSystemSize(parseFloat(e.target.value) || 10)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Google Solar API Key (Opcional)</Label>
                  <Input
                    type="password"
                    placeholder="Inserir API key para dados detalhados"
                    value={googleApiKey}
                    onChange={(e) => setGoogleApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sem API key, apenas dados PVGIS serão utilizados
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              onClick={runSolarAnalysis}
              disabled={isAnalyzing}
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-10 py-4 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Analisando...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Satellite className="w-6 h-6" />
                  Iniciar Análise Solar
                </div>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {isAnalyzing ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-yellow-500" />
                <h3 className="text-2xl font-bold mb-4">Analisando Local</h3>
                <p className="text-muted-foreground mb-6">
                  Obtendo dados de irradiação solar e potencial fotovoltaico...
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>🛰️ Acessando banco de dados PVGIS</p>
                  {googleApiKey && <p>🌍 Consultando Google Solar API</p>}
                  <p>📊 Calculando otimizações</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Sun className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-bold mb-4">Aguardando Análise</h3>
                <p className="text-muted-foreground">
                  Configure a localização e clique em "Iniciar Análise Solar"
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {results ? (
            <>
              {/* Resumo da Análise */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Resumo da Análise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {formatNumber(results.combinedAnalysis?.irradiacaoMensal.reduce((a, b) => a + b, 0)! / 12)}
                      </div>
                      <div className="text-sm text-muted-foreground">kWh/m²/dia médio</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {results.combinedAnalysis?.orientacaoOtima.inclinacao}°
                      </div>
                      <div className="text-sm text-muted-foreground">Inclinação ótima</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {formatNumber(results.combinedAnalysis?.producaoEstimada.reduce((a, b) => a + b, 0)! / 12)}
                      </div>
                      <div className="text-sm text-muted-foreground">kWh/mês estimado</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getQualityColor(results.combinedAnalysis?.qualidade!)}`}>
                        {getQualityText(results.combinedAnalysis?.qualidade!)}
                      </div>
                      <div className="text-sm text-muted-foreground">Potencial solar</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Irradiação Solar Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={results.combinedAnalysis?.irradiacaoMensal.map((value, index) => ({
                          mes: `${index + 1}`,
                          irradiacao: value
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${formatNumber(value)} kWh/m²/dia`, 'Irradiação']} />
                        <Bar dataKey="irradiacao" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Produção Estimada Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={results.combinedAnalysis?.producaoEstimada.map((value, index) => ({
                          mes: `${index + 1}`,
                          producao: value
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`${formatNumber(value)} kWh`, 'Produção']} />
                        <Line type="monotone" dataKey="producao" stroke="#10B981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Dados Técnicos */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados Técnicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Orientação Ótima</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Azimute:</span>
                          <span>{results.combinedAnalysis?.orientacaoOtima.azimute}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Inclinação:</span>
                          <span>{results.combinedAnalysis?.orientacaoOtima.inclinacao}°</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Perdas do Sistema (%)</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Angular:</span>
                          <span>{formatNumber(results.combinedAnalysis?.perdas.angular!)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Temperatura:</span>
                          <span>{formatNumber(results.combinedAnalysis?.perdas.temperatura!)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sombreamento:</span>
                          <span>{formatNumber(results.combinedAnalysis?.perdas.sombreamento!)}%</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>{formatNumber(results.combinedAnalysis?.perdas.total!)}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Localização</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Latitude:</span>
                          <span>{formatNumber(results.location.latitude, 4)}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Longitude:</span>
                          <span>{formatNumber(results.location.longitude, 4)}°</span>
                        </div>
                        {results.pvgis && (
                          <div className="flex justify-between">
                            <span>Elevação:</span>
                            <span>{results.pvgis.systemFormat.elevacao}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-bold mb-4">Nenhum Resultado</h3>
                <p className="text-muted-foreground">
                  Execute a análise solar para visualizar os resultados
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SolarLocationAnalyzer;