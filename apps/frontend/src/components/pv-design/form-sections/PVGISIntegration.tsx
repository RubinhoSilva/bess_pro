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

interface PVGISIntegrationProps {
  onDataReceived: (data: {
    irradiacaoMensal: number[];
    latitude: number;
    longitude: number;
    cidade: string;
  }) => void;
}

const PVGISIntegration: React.FC<PVGISIntegrationProps> = ({ onDataReceived }) => {
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

  const handleLocationSelect = async (location: { lat: number; lng: number }) => {
    setIsMapOpen(false);
    const selectedLoc = { latitude: location.lat, longitude: location.lng };
    setSelectedLocation(selectedLoc);
    
    // Preencher os campos de coordenadas manuais com a localização selecionada
    setManualLat(location.lat.toFixed(6));
    setManualLng(location.lng.toFixed(6));
    
    await fetchIrradiationData(selectedLoc);
  };

  const handleManualCoordinates = async () => {
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
    await fetchIrradiationData(location);
  };

  const fetchIrradiationData = async (location: PVGISLocation) => {
    if (!isLocationInBrazil(location)) {
      toast.error("Localização fora do Brasil: Por favor, selecione uma localização dentro do território brasileiro.");
      return;
    }

    setIsLoading(true);

    try {
      const pvgisData = await fetchPVGISDataWithCache(location);
      
      const formattedCity = `Lat: ${pvgisData.inputs.location.latitude.toFixed(4)}, Lon: ${pvgisData.inputs.location.longitude.toFixed(4)}`;
      
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
              disabled={isLoading || !manualLat || !manualLng}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
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

        {/* Aviso sobre precisão */}
        <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-300">
            <strong>Sobre o PVGIS:</strong> Os dados são baseados em imagens de satélite e modelos climatológicos 
            da base SARAH-2, cobrindo o período de 2005-2020. Precisão típica: ±4% para médias anuais.
          </div>
        </div>
      </div>

      {/* Exibir dados de irradiação mensal quando disponíveis */}
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