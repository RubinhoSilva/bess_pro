import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Map, Loader2, MapPin, Download, AlertCircle } from 'lucide-react';
import MapSelector from './MapSelector';
import MonthlyIrradiationDisplay from './MonthlyIrradiationDisplay';
import { fetchPVGISDataWithCache, isLocationInBrazil, formatMonthlyData, PVGISLocation } from '@/lib/pvgisService';
import { api } from '@/lib/api';

interface PVGISIntegrationProps {
  onDataReceived: (data: {
    irradiacaoMensal: number[];
    latitude: number;
    longitude: number;
    cidade: string;
    pvgisResponseData?: any; // Dados completos da resposta PVGIS
  }) => void;
  formData?: {
    latitude?: number;
    longitude?: number;
    cidade?: string;
    irradiacaoMensal?: number[];
    pvgisResponseData?: any;
  };
}

const PVGISIntegration: React.FC<PVGISIntegrationProps> = ({
  onDataReceived,
  formData
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Initialize state from formData - each useState uses its own validation logic
  const [selectedLocation, setSelectedLocation] = useState<PVGISLocation | null>(() => {
    // Verificar se há dados válidos e completos para restaurar o estado
    const hasValidSavedData = formData?.latitude &&
                             formData?.longitude &&
                             formData?.irradiacaoMensal &&
                             formData?.irradiacaoMensal.length === 12 &&
                             formData?.irradiacaoMensal.some(value => value > 0);

    if (hasValidSavedData && formData.latitude !== undefined && formData.longitude !== undefined) {
      return { latitude: formData.latitude, longitude: formData.longitude };
    }
    return null;
  });

  const [manualLat, setManualLat] = useState(() => {
    const hasValidSavedData = formData?.latitude &&
                             formData?.longitude &&
                             formData?.irradiacaoMensal &&
                             formData?.irradiacaoMensal.length === 12 &&
                             formData?.irradiacaoMensal.some(value => value > 0);

    if (hasValidSavedData && formData.latitude !== undefined) {
      return formData.latitude.toString();
    }
    return '';
  });

  const [manualLng, setManualLng] = useState(() => {
    const hasValidSavedData = formData?.latitude &&
                             formData?.longitude &&
                             formData?.irradiacaoMensal &&
                             formData?.irradiacaoMensal.length === 12 &&
                             formData?.irradiacaoMensal.some(value => value > 0);

    if (hasValidSavedData && formData.longitude !== undefined) {
      return formData.longitude.toString();
    }
    return '';
  });

  const [irradiationData, setIrradiationData] = useState<{
    irradiacaoMensal: number[];
    latitude: number;
    longitude: number;
    cidade: string;
    mediaAnual?: number;
    maximo?: number;
    minimo?: number;
    variacaoSazonal?: number;
    configuracao?: any;
  } | null>(() => {
    const hasValidSavedData = formData?.latitude &&
                             formData?.longitude &&
                             formData?.irradiacaoMensal &&
                             formData?.irradiacaoMensal.length === 12 &&
                             formData?.irradiacaoMensal.some(value => value > 0);

    if (hasValidSavedData && formData.latitude !== undefined && formData.longitude !== undefined) {
      return {
        irradiacaoMensal: formData.irradiacaoMensal,
        latitude: formData.latitude,
        longitude: formData.longitude,
        cidade: formData.cidade || `Lat: ${formData.latitude.toFixed(4)}, Lon: ${formData.longitude.toFixed(4)}`,
        ...formData.pvgisResponseData
      };
    }
    return null;
  });
  

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
      console.log('🔧 Parâmetros PVGIS sendo enviados via backend:', {
        location,
        parameters: { tilt: 0, azimuth: 0 }
      });
      
      // Chamar o backend Node.js que se comunica com a API Python
      // Sempre usar 0° (horizontal) para buscar dados PVGIS diretos sem decomposição
      const response = await api.post('/solar-analysis/analyze-monthly-irradiation', {
        lat: location.latitude,
        lon: location.longitude,
        tilt: 0,
        azimuth: 0,
        modelo_decomposicao: 'louche'
      });

      console.log('✅ Resposta do backend recebida:', response.data);
      
      const formattedCity = `Lat: ${response.data.data.coordenadas.lat.toFixed(4)}, Lon: ${response.data.data.coordenadas.lon.toFixed(4)}`;
      
      const data = {
        irradiacaoMensal: response.data.data.irradiacaoMensal,
        latitude: response.data.data.coordenadas.lat,
        longitude: response.data.data.coordenadas.lon,
        cidade: formattedCity,
        // Dados adicionais da API Python
        mediaAnual: response.data.data.mediaAnual,
        maximo: response.data.data.maximo,
        minimo: response.data.data.minimo,
        variacaoSazonal: response.data.data.variacaoSazonal,
        configuracao: response.data.data.configuracao
      };
      
      // Armazenar dados para exibição
      setIrradiationData(data);
      
      // Enviar dados para o componente pai incluindo dados completos da resposta
      onDataReceived({
        irradiacaoMensal: data.irradiacaoMensal,
        latitude: data.latitude,
        longitude: data.longitude,
        cidade: data.cidade,
        pvgisResponseData: {
          mediaAnual: data.mediaAnual,
          maximo: data.maximo,
          minimo: data.minimo,
          variacaoSazonal: data.variacaoSazonal,
          configuracao: data.configuracao
        }
      });

      toast.success(`${response.data.data.message}`, {
        duration: 4000,
        position: 'top-right',
      });

    } catch (error: any) {
      console.error('❌ Erro ao obter dados via backend:', error);
      
      let message = 'Erro desconhecido ao obter dados PVGIS';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 500) {
        message = 'Serviço PVLIB temporariamente indisponível. Tente novamente.';
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(`Erro: ${message}`, {
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
        da Comissão Europeia. Os dados são coletados para superficie horizontal (0° inclinação, 0° orientação).
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
                <MapSelector
                  onSelect={handleLocationSelect}
                  initialPosition={selectedLocation ? {
                    lat: selectedLocation.latitude,
                    lng: selectedLocation.longitude
                  } : undefined}
                />
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
                  Obtendo dados PVGIS... (pode levar até 2 min)
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Buscar Dados PVGIS *
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              * <strong>Obrigatório:</strong> Clique para obter dados de irradiação solar com os parâmetros configurados<br/>
              <span className="text-amber-600">⏱️ A consulta pode levar até 2 minutos - aguarde!</span>
            </p>
          </div>
        )}

        {/* Aviso de dados obrigatórios */}
        {!irradiationData && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-700 font-medium">
                Dados PVGIS obrigatórios
              </p>
            </div>
            <p className="text-xs text-amber-600 mt-1">
              É necessário buscar os dados de irradiação solar antes de prosseguir para a próxima etapa.
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
          <MonthlyIrradiationDisplay
            irradiacaoMensal={irradiationData.irradiacaoMensal}
            location={{
              latitude: irradiationData.latitude,
              longitude: irradiationData.longitude,
              cidade: irradiationData.cidade
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PVGISIntegration;