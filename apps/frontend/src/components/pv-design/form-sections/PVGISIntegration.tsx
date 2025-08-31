import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Loader2, MapPin, Download, AlertCircle, BarChart3 } from 'lucide-react';
import MapSelector from './MapSelector';
import MonthlyIrradiationDisplay from './MonthlyIrradiationDisplay';
import PVGISRadiationComponents from './PVGISRadiationComponents';
import { fetchPVGISDataWithCache, isLocationInBrazil, formatMonthlyData, PVGISLocation } from '@/lib/pvgisService';
import { usePVGISComponents } from '@/hooks/usePVGISComponents';

interface PVGISIntegrationProps {
  onDataReceived: (data: {
    irradiacaoMensal: number[];
    latitude: number;
    longitude: number;
    cidade: string;
  }) => void;
  formData?: {
    orientacao?: number;
    inclinacao?: number;
  };
  onFormChange?: (field: string, value: number) => void;
}

const PVGISIntegration: React.FC<PVGISIntegrationProps> = ({ 
  onDataReceived, 
  formData, 
  onFormChange 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PVGISLocation | null>(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [irradiationData, setIrradiationData] = useState<{
    irradiacaoMensal: number[];
    latitude: number;
    longitude: number;
    cidade: string;
  } | null>(null);
  
  // Hook para componentes de radiação
  const { 
    data: componentsData, 
    isLoading: isLoadingComponents, 
    error: componentsError, 
    fetchComponents 
  } = usePVGISComponents();

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    setIsMapOpen(false);
    const selectedLoc = { latitude: location.lat, longitude: location.lng };
    setSelectedLocation(selectedLoc);
    
    // Preencher os campos de coordenadas manuais com a localização selecionada
    setManualLat(location.lat.toFixed(6));
    setManualLng(location.lng.toFixed(6));
    
    // Não buscar dados automaticamente - usuário deve clicar em "Buscar Dados"
  };

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Coordenadas inválidas: Por favor, insira coordenadas válidas.");
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error("Coordenadas fora de range: Latitude deve estar entre -90 e 90, longitude entre -180 e 180.");
      return;
    }

    const location = { latitude: lat, longitude: lng };
    setSelectedLocation(location);
    
    // Não buscar dados automaticamente - usuário deve clicar em "Buscar Dados"
  };

  const handleFetchData = async () => {
    if (!selectedLocation) {
      toast.error("Selecione uma localização antes de buscar os dados.");
      return;
    }

    await fetchIrradiationData(selectedLocation);
  };

  const fetchIrradiationData = async (location: PVGISLocation) => {
    if (!isLocationInBrazil(location)) {
      toast.error("Localização fora do Brasil: Por favor, selecione uma localização dentro do território brasileiro.");
      return;
    }

    setIsLoading(true);

    try {
      // Usar parâmetros de orientação e inclinação se disponíveis
      const parameters = formData ? {
        orientacao: formData.orientacao || 0,
        inclinacao: formData.inclinacao || 0
      } : undefined;
      
      console.log('🔧 Parâmetros PVGIS sendo enviados:', {
        location,
        parameters,
        formData: formData ? {
          orientacao: formData.orientacao,
          inclinacao: formData.inclinacao
        } : 'undefined'
      });
      
      const pvgisData = await fetchPVGISDataWithCache(location, parameters);
      
      const orientacaoText = parameters ? ` (${parameters.orientacao}°/${parameters.inclinacao}°)` : '';
      const formattedCity = `Lat: ${pvgisData.inputs.location.latitude.toFixed(4)}, Lon: ${pvgisData.inputs.location.longitude.toFixed(4)}${orientacaoText}`;
      
      const data = {
        irradiacaoMensal: pvgisData.outputs.monthly_radiation,
        latitude: pvgisData.inputs.location.latitude,
        longitude: pvgisData.inputs.location.longitude,
        cidade: formattedCity,
      };
      
      // Armazenar dados para exibição
      setIrradiationData(data);
      
      // Enviar dados para o componente pai
      onDataReceived(data);
      
      // Buscar componentes de radiação em paralelo
      fetchComponents(location).catch(error => {
        console.warn('Erro ao buscar componentes de radiação:', error);
        // Não exibir erro para o usuário, pois os dados básicos já foram carregados
      });

      toast.success(`Dados de irradiação solar importados do PVGIS para ${formattedCity}`, {
        duration: 4000,
        position: 'top-right',
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao obter dados PVGIS: ${message}`, {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card/50 border-border backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-foreground">Integração PVGIS</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Obtenha dados precisos de irradiação solar do PVGIS (Photovoltaic Geographical Information System) 
        da Comissão Europeia. Selecione a localização no mapa ou insira coordenadas manualmente.
      </p>

      <div className="space-y-4">
        {/* Seleção por mapa */}
        <div>
          <Label className="text-foreground mb-2 block">Seleção por Mapa</Label>
          <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Map className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Obtendo dados...' : 'Selecionar no Mapa'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
              <DialogHeader className="p-4 border-b flex-shrink-0">
                <DialogTitle>Selecione a Localização do Projeto</DialogTitle>
              </DialogHeader>
              <div className="flex-grow overflow-y-auto p-4">
                <MapSelector onSelect={handleLocationSelect} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Coordenadas manuais */}
        <div>
          <Label className="text-foreground mb-2 block">Coordenadas Manuais</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Latitude (ex: -23.5505)"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="bg-background border-border text-foreground"
                disabled={isLoading}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Longitude (ex: -46.6333)"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="bg-background border-border text-foreground"
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleManualCoordinates}
              disabled={!manualLat || !manualLng}
              className="bg-blue-600 hover:bg-blue-700"
              variant="outline"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Parâmetros de Orientação e Inclinação */}
        {onFormChange && (
          <div>
            <Label className="text-foreground mb-2 block">Parâmetros do Sistema Solar</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orientacao">Orientação (graus)</Label>
                <Input
                  id="orientacao"
                  type="number"
                  min="0"
                  max="360"
                  value={formData?.orientacao || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    // Garantir que orientação esteja entre 0 e 360
                    const clampedValue = Math.max(0, Math.min(360, value));
                    onFormChange('orientacao', clampedValue);
                  }}
                  placeholder="0 (Norte)"
                  className="bg-background border-border text-foreground"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">0°=Norte, 90°=Leste, 180°=Sul, 270°=Oeste</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inclinacao">Inclinação (graus)</Label>
                <Input
                  id="inclinacao"
                  type="number"
                  min="0"
                  max="90"
                  value={formData?.inclinacao || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    // Garantir que inclinação esteja entre 0 e 90
                    const clampedValue = Math.max(0, Math.min(90, value));
                    onFormChange('inclinacao', clampedValue);
                  }}
                  placeholder="0 (Horizontal)"
                  className="bg-background border-border text-foreground"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">0°=Horizontal, 90°=Vertical</p>
              </div>
            </div>
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                <strong>💡 Dica:</strong> A orientação e inclinação afetam a quantidade de radiação solar recebida. 
                Estes parâmetros serão utilizados nas consultas PVGIS para obter dados mais precisos.
              </p>
            </div>
          </div>
        )}

        {/* Localização selecionada */}
        {selectedLocation && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-foreground">Localização Selecionada</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Latitude: {selectedLocation.latitude.toFixed(4)}, 
              Longitude: {selectedLocation.longitude.toFixed(4)}
            </p>
          </div>
        )}

        {/* Botão Buscar Dados */}
        {selectedLocation && (
          <div className="mt-4">
            <Button 
              onClick={handleFetchData}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Obtendo dados PVGIS...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Buscar Dados PVGIS
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Clique para obter dados de irradiação solar com os parâmetros configurados
            </p>
          </div>
        )}

        {/* Aviso sobre precisão */}
        <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-300">
            <strong>Sobre o PVGIS:</strong> Os dados são baseados em imagens de satélite e modelos climatológicos 
            da base SARAH-2, cobrindo o período de 2005-2020. Precisão típica: ±4% para médias anuais.
          </div>
        </div>
      </div>

      {/* Exibir dados de irradiação quando disponíveis */}
      {irradiationData && (
        <div className="mt-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="components" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Componentes de Radiação
                {isLoadingComponents && (
                  <Loader2 className="h-3 w-3 animate-spin ml-1" />
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="mt-4">
              <MonthlyIrradiationDisplay
                irradiacaoMensal={irradiationData.irradiacaoMensal}
                location={{
                  latitude: irradiationData.latitude,
                  longitude: irradiationData.longitude,
                  cidade: irradiationData.cidade
                }}
              />
            </TabsContent>
            
            <TabsContent value="components" className="mt-4">
              {componentsData ? (
                <PVGISRadiationComponents 
                  data={componentsData} 
                  isLoading={isLoadingComponents}
                />
              ) : isLoadingComponents ? (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600 font-medium">Buscando componentes de radiação...</p>
                    <p className="text-sm text-gray-500 mt-1">Dados detalhados com radiação direta, difusa e refletida</p>
                  </div>
                </div>
              ) : componentsError ? (
                <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border-2 border-dashed border-red-200">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
                    <p className="text-red-700 font-medium">Erro ao carregar componentes</p>
                    <p className="text-sm text-red-600 mt-1">{componentsError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => selectedLocation && fetchComponents(selectedLocation)}
                      className="mt-3"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 font-medium">Componentes não carregados</p>
                    <p className="text-sm text-gray-500 mt-1">Clique em "Selecionar no Mapa" ou insira coordenadas para ver os componentes detalhados</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default PVGISIntegration;