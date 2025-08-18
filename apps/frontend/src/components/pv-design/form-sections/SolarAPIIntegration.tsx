import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Satellite, 
  Download, 
  MapPin, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Sun,
  Zap
} from 'lucide-react';
import { googleSolarAPI, type GoogleSolarRequest } from '@/lib/googleSolarAPI';
import { getPVGISAPI } from '@/services/PVGISAPI';

interface SolarAPIIntegrationProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

interface APIData {
  source: 'google' | 'pvgis';
  location: { latitude: number; longitude: number };
  irradiacaoMensal: number[];
  orientacaoOtima?: { azimute: number; inclinacao: number };
  potencialSolar?: number;
  qualidade?: string;
  perdas?: any;
  timestamp: number;
}

const SolarAPIIntegration: React.FC<SolarAPIIntegrationProps> = ({
  formData,
  onFormChange
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<APIData | null>(null);
  const [googleApiKey, setGoogleApiKey] = useState('');

  const getCurrentLocation = () => {
    return {
      latitude: formData.latitude || -23.5505,
      longitude: formData.longitude || -46.6333
    };
  };

  const fetchGoogleSolarData = async () => {
    // Usar dados simulados se não tiver API key configurada
    const useSimulation = !googleSolarAPI.isAvailable();
    
    if (!useSimulation && !googleApiKey.trim()) {
      toast({
        variant: "destructive",
        title: "API Key necessária",
        description: "Insira sua API Key do Google Solar para continuar."
      });
      return;
    }

    setIsLoading(true);
    try {
      const location = getCurrentLocation();
      
      // Usar dados simulados ou reais dependendo da disponibilidade
      const solarData = useSimulation 
        ? await googleSolarAPI.generateMockData(location.latitude, location.longitude)
        : await googleSolarAPI.getSolarPotential({
            location,
            requiredQuality: 'HIGH',
            radiusMeters: 100
          });

      const formattedData = googleSolarAPI.formatSolarDataForBESS(solarData);
      
      // Converter para formato esperado pelo sistema
      const monthlyIrradiation = Array.from({ length: 12 }, (_, i) => {
        // Simular dados mensais baseados no potencial solar anual
        const baseSunshine = formattedData.solarPotential.maxSunshineHoursPerYear / 365;
        const seasonalVariation = Math.sin((i + 3) * Math.PI / 6) * 0.3; // Variação sazonal
        return Math.max(3, baseSunshine / 24 * (1 + seasonalVariation) * 5); // Conversão aproximada para kWh/m²/dia
      });

      const data: APIData = {
        source: 'google',
        location,
        irradiacaoMensal: monthlyIrradiation,
        orientacaoOtima: {
          azimute: formattedData.configurations[0]?.roofSegments[0]?.azimuth || 180,
          inclinacao: formattedData.configurations[0]?.roofSegments[0]?.tilt || 30
        },
        potencialSolar: formattedData.configurations[0]?.annualEnergyKwh || 0,
        qualidade: formattedData.solarPotential.maxSunshineHoursPerYear > 2200 ? 'excellent' : 
                  formattedData.solarPotential.maxSunshineHoursPerYear > 1800 ? 'good' : 'fair',
        perdas: {
          sombreamento: 5,
          sujeira: 3,
          total: 15
        },
        timestamp: Date.now()
      };

      setApiData(data);
      
      toast({
        title: useSimulation ? "Dados simulados obtidos!" : "Dados Google Solar obtidos!",
        description: `Irradiação média: ${(monthlyIrradiation.reduce((a, b) => a + b, 0) / 12).toFixed(2)} kWh/m²/dia`
      });

    } catch (error) {
      console.error('Erro Google Solar:', error);
      toast({
        variant: "destructive",
        title: "Erro Google Solar API",
        description: "Não foi possível obter dados. Verifique a API key e localização."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPVGISData = async () => {
    setIsLoading(true);
    try {
      const location = getCurrentLocation();
      const pvgisAPI = getPVGISAPI();
      
      const systemSizeKw = ((formData.numeroModulos || 20) * (formData.potenciaModulo || 550)) / 1000;
      
      const [pvEstimation, optimalInclination] = await Promise.all([
        pvgisAPI.getPVEstimation({
          location,
          peakpower: systemSizeKw,
          angle: formData.inclinacao || 30,
          aspect: formData.azimute || 180
        }),
        pvgisAPI.getOptimalInclination(location)
      ]);

      const systemFormat = pvgisAPI.convertToSystemFormat(pvEstimation);

      const data: APIData = {
        source: 'pvgis',
        location,
        irradiacaoMensal: systemFormat.irradiacaoMensal,
        orientacaoOtima: {
          azimute: 180,
          inclinacao: optimalInclination.optimalInclination
        },
        potencialSolar: systemFormat.producaoEstimada.anual,
        qualidade: systemFormat.irradiacaoAnual > 1800 ? 'excellent' : systemFormat.irradiacaoAnual > 1500 ? 'good' : 'fair',
        perdas: systemFormat.perdas,
        timestamp: Date.now()
      };

      setApiData(data);
      
      toast({
        title: "Dados PVGIS obtidos!",
        description: `Produção estimada: ${systemFormat.producaoEstimada.anual.toLocaleString('pt-BR')} kWh/ano`
      });

    } catch (error) {
      console.error('Erro PVGIS:', error);
      toast({
        variant: "destructive",
        title: "Erro PVGIS API",
        description: "Não foi possível obter dados PVGIS para esta localização."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyAPIData = () => {
    if (!apiData) return;

    // Aplicar dados de irradiação
    onFormChange('irradiacaoMensal', apiData.irradiacaoMensal);
    
    // Aplicar orientação ótima se disponível
    if (apiData.orientacaoOtima) {
      onFormChange('azimute', apiData.orientacaoOtima.azimute);
      onFormChange('inclinacao', apiData.orientacaoOtima.inclinacao);
    }

    // Aplicar perdas se disponível
    if (apiData.perdas) {
      if (apiData.perdas.sombreamento !== undefined) {
        onFormChange('perdaSombreamento', apiData.perdas.sombreamento);
      }
      if (apiData.perdas.sujeira !== undefined) {
        onFormChange('perdaSujeira', apiData.perdas.sujeira);
      }
    }

    toast({
      title: "Dados aplicados!",
      description: `Dados ${apiData.source === 'google' ? 'Google Solar' : 'PVGIS'} foram aplicados ao formulário.`
    });
  };

  const formatNumber = (value: number, decimals = 2) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const getQualityBadgeVariant = (quality?: string) => {
    switch (quality) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      default: return 'destructive';
    }
  };

  const getQualityText = (quality?: string) => {
    switch (quality) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'fair': return 'Regular';
      default: return 'Ruim';
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Satellite className="w-5 h-5 text-blue-400" />
          Integração APIs de Irradiação Solar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controles das APIs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Google Solar API */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-500" />
              <h4 className="font-semibold">Google Solar API</h4>
            </div>
            
            {googleSolarAPI.isAvailable() ? (
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder="Inserir Google Solar API Key"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  API Key não configurada. Será usado dados simulados para demonstração.
                </p>
              </div>
            )}
            
            <Button
              onClick={fetchGoogleSolarData}
              disabled={isLoading || (!googleSolarAPI.isAvailable() && !googleApiKey.trim() && false)} // Permitir sempre para simulação
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Satellite className="w-4 h-4 mr-2" />
              )}
              {googleSolarAPI.isAvailable() || googleApiKey.trim() ? 'Obter Dados Google Solar' : 'Obter Dados Simulados (Demo)'}
            </Button>
          </div>

          {/* PVGIS API */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              <h4 className="font-semibold">PVGIS API</h4>
            </div>
            
            <div className="text-sm text-muted-foreground mb-4">
              Base de dados europeia gratuita com dados meteorológicos históricos.
            </div>
            
            <Button
              onClick={fetchPVGISData}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Obter Dados PVGIS
            </Button>
          </div>
        </div>

        {/* Localização Atual */}
        <div className="p-4 bg-accent/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">Localização Atual</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Lat: {formatNumber(getCurrentLocation().latitude, 4)}°, 
            Lng: {formatNumber(getCurrentLocation().longitude, 4)}°
          </div>
        </div>

        {/* Resultados da API */}
        <AnimatePresence>
          {apiData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Dados Obtidos ({apiData.source === 'google' ? 'Google Solar' : 'PVGIS'})
                </h4>
                <Badge variant={getQualityBadgeVariant(apiData.qualidade)}>
                  {getQualityText(apiData.qualidade)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-2">Irradiação Solar Mensal</h5>
                  <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
                    {apiData.irradiacaoMensal.map((value, index) => (
                      <div key={index} className="flex justify-between">
                        <span>Mês {index + 1}:</span>
                        <span>{formatNumber(value)} kWh/m²/dia</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Parâmetros Ótimos</h5>
                  <div className="text-sm space-y-1">
                    {apiData.orientacaoOtima && (
                      <>
                        <div className="flex justify-between">
                          <span>Azimute:</span>
                          <span>{apiData.orientacaoOtima.azimute}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Inclinação:</span>
                          <span>{apiData.orientacaoOtima.inclinacao}°</span>
                        </div>
                      </>
                    )}
                    {apiData.potencialSolar && (
                      <div className="flex justify-between">
                        <span>Produção Est.:</span>
                        <span>{formatNumber(apiData.potencialSolar)} kWh/ano</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Obtido em:</span>
                      <span>{new Date(apiData.timestamp).toLocaleTimeString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={applyAPIData}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Aplicar Dados ao Formulário
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informações sobre as APIs */}
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" />
            <div>
              <strong>Google Solar API:</strong> Requer API key paga. Fornece dados precisos de irradiação 
              baseados em imagens de satélite e análise 3D de telhados.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <div>
              <strong>PVGIS:</strong> Gratuito. Base de dados do Centro Comum de Investigação da UE 
              com dados meteorológicos históricos confiáveis.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SolarAPIIntegration;