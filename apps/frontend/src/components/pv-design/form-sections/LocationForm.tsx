import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Search, Loader2, Satellite, Map } from 'lucide-react';
import PVGISIntegration from './PVGISIntegration';
import MapSelector from './MapSelector';

interface LocationFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

// Dados básicos de irradiação por estado (valores médios anuais em kWh/m²/dia)
const BRAZIL_IRRADIATION_DATA: { [key: string]: number[] } = {
  'AC': [4.8, 4.9, 5.0, 4.8, 4.6, 4.4, 4.5, 4.7, 4.9, 5.1, 5.0, 4.9], // Acre
  'AL': [5.8, 5.9, 5.7, 5.4, 5.0, 4.8, 4.9, 5.2, 5.5, 5.8, 5.9, 5.8], // Alagoas
  'AP': [4.9, 5.0, 5.1, 4.9, 4.7, 4.5, 4.6, 4.8, 5.0, 5.2, 5.1, 5.0], // Amapá
  'AM': [4.7, 4.8, 4.9, 4.7, 4.5, 4.3, 4.4, 4.6, 4.8, 5.0, 4.9, 4.8], // Amazonas
  'BA': [5.9, 6.0, 5.8, 5.5, 5.1, 4.9, 5.0, 5.3, 5.6, 5.9, 6.0, 5.9], // Bahia
  'CE': [6.2, 6.3, 6.1, 5.8, 5.4, 5.2, 5.3, 5.6, 5.9, 6.2, 6.3, 6.2], // Ceará
  'DF': [5.5, 5.6, 5.4, 5.1, 4.7, 4.5, 4.6, 4.9, 5.2, 5.5, 5.6, 5.5], // Distrito Federal
  'ES': [5.4, 5.5, 5.3, 5.0, 4.6, 4.4, 4.5, 4.8, 5.1, 5.4, 5.5, 5.4], // Espírito Santo
  'GO': [5.7, 5.8, 5.6, 5.3, 4.9, 4.7, 4.8, 5.1, 5.4, 5.7, 5.8, 5.7], // Goiás
  'MA': [5.9, 6.0, 5.8, 5.5, 5.1, 4.9, 5.0, 5.3, 5.6, 5.9, 6.0, 5.9], // Maranhão
  'MT': [5.6, 5.7, 5.5, 5.2, 4.8, 4.6, 4.7, 5.0, 5.3, 5.6, 5.7, 5.6], // Mato Grosso
  'MS': [5.8, 5.9, 5.7, 5.4, 5.0, 4.8, 4.9, 5.2, 5.5, 5.8, 5.9, 5.8], // Mato Grosso do Sul
  'MG': [5.3, 5.4, 5.2, 4.9, 4.5, 4.3, 4.4, 4.7, 5.0, 5.3, 5.4, 5.3], // Minas Gerais
  'PA': [5.0, 5.1, 5.2, 5.0, 4.8, 4.6, 4.7, 4.9, 5.1, 5.3, 5.2, 5.1], // Pará
  'PB': [6.1, 6.2, 6.0, 5.7, 5.3, 5.1, 5.2, 5.5, 5.8, 6.1, 6.2, 6.1], // Paraíba
  'PR': [4.8, 4.9, 4.7, 4.4, 4.0, 3.8, 3.9, 4.2, 4.5, 4.8, 4.9, 4.8], // Paraná
  'PE': [6.0, 6.1, 5.9, 5.6, 5.2, 5.0, 5.1, 5.4, 5.7, 6.0, 6.1, 6.0], // Pernambuco
  'PI': [6.0, 6.1, 5.9, 5.6, 5.2, 5.0, 5.1, 5.4, 5.7, 6.0, 6.1, 6.0], // Piauí
  'RJ': [5.2, 5.3, 5.1, 4.8, 4.4, 4.2, 4.3, 4.6, 4.9, 5.2, 5.3, 5.2], // Rio de Janeiro
  'RN': [6.2, 6.3, 6.1, 5.8, 5.4, 5.2, 5.3, 5.6, 5.9, 6.2, 6.3, 6.2], // Rio Grande do Norte
  'RS': [4.6, 4.7, 4.5, 4.2, 3.8, 3.6, 3.7, 4.0, 4.3, 4.6, 4.7, 4.6], // Rio Grande do Sul
  'RO': [4.9, 5.0, 5.1, 4.9, 4.7, 4.5, 4.6, 4.8, 5.0, 5.2, 5.1, 5.0], // Rondônia
  'RR': [5.1, 5.2, 5.3, 5.1, 4.9, 4.7, 4.8, 5.0, 5.2, 5.4, 5.3, 5.2], // Roraima
  'SC': [4.7, 4.8, 4.6, 4.3, 3.9, 3.7, 3.8, 4.1, 4.4, 4.7, 4.8, 4.7], // Santa Catarina
  'SP': [5.0, 5.1, 4.9, 4.6, 4.2, 4.0, 4.1, 4.4, 4.7, 5.0, 5.1, 5.0], // São Paulo
  'SE': [5.9, 6.0, 5.8, 5.5, 5.1, 4.9, 5.0, 5.3, 5.6, 5.9, 6.0, 5.9], // Sergipe
  'TO': [5.8, 5.9, 5.7, 5.4, 5.0, 4.8, 4.9, 5.2, 5.5, 5.8, 5.9, 5.8], // Tocantins
};

const BRAZIL_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
];

const LocationForm: React.FC<LocationFormProps> = ({ formData, onFormChange }) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [analysisType, setAnalysisType] = useState<'standard' | 'pvgis'>('standard');
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);

  const handleStateChange = (stateCode: string) => {
    onFormChange('estado', stateCode);
    
    // Atualizar dados de irradiação baseado no estado
    if (BRAZIL_IRRADIATION_DATA[stateCode]) {
      onFormChange('irradiacaoMensal', BRAZIL_IRRADIATION_DATA[stateCode]);
    }
  };

  const handleAddressSearch = async () => {
    if (!formData.endereco) return;
    
    setIsLoadingLocation(true);
    try {
      // Simulação de busca de endereço (em produção, usar API de geocoding)
      setTimeout(() => {
        // Auto-detect do estado baseado no endereço seria implementado aqui
        setIsLoadingLocation(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      setIsLoadingLocation(false);
    }
  };

  const handlePVGISData = (data: {
    irradiacaoMensal: number[];
    latitude: number;
    longitude: number;
    cidade: string;
  }) => {
    onFormChange('irradiacaoMensal', data.irradiacaoMensal);
    onFormChange('latitude', data.latitude);
    onFormChange('longitude', data.longitude);
    onFormChange('cidade', data.cidade);
  };

  const handleMapLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    onFormChange('latitude', location.lat);
    onFormChange('longitude', location.lng);
    
    if (location.address) {
      // Tentar extrair cidade e estado do endereço
      const addressParts = location.address.split(',');
      if (addressParts.length > 1) {
        const cidade = addressParts[0].trim();
        onFormChange('cidade', cidade);
      }
      onFormChange('endereco', location.address);
    }
    
    setIsMapDialogOpen(false);
    
    // Buscar dados de irradiação baseado na localização (implementar depois)
    // Por enquanto, tentar detectar o estado baseado na coordenada
    detectStateFromCoordinates(location.lat, location.lng);
  };

  const detectStateFromCoordinates = (lat: number, lng: number) => {
    // Detecção básica por região - em produção usaria API de geocoding reverso
    // ou dados mais precisos
    if (lat >= -5 && lat <= 5 && lng >= -74 && lng <= -48) {
      handleStateChange('AM'); // Norte
    } else if (lat >= -15 && lat <= -5 && lng >= -65 && lng <= -35) {
      handleStateChange('GO'); // Centro-Oeste aproximado
    } else if (lat >= -25 && lat <= -15 && lng >= -55 && lng <= -35) {
      handleStateChange('SP'); // Sudeste aproximado
    } else if (lat >= -35 && lat <= -25 && lng >= -60 && lng <= -40) {
      handleStateChange('RS'); // Sul aproximado
    } else if (lat >= -10 && lat <= 0 && lng >= -50 && lng <= -30) {
      handleStateChange('BA'); // Nordeste aproximado
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="w-5 h-5 text-green-400" /> 
          Localização e Irradiação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor de tipo de análise */}
        <div className="space-y-2">
          <Label className="text-foreground">Tipo de Análise</Label>
          <Select 
            value={analysisType} 
            onValueChange={(value: 'standard' | 'pvgis') => setAnalysisType(value)}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Selecione o tipo de análise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Análise Padrão (por Estado)
                </div>
              </SelectItem>
              <SelectItem value="pvgis">
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4" />
                  PVGIS - Dados Precisos (Recomendado)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {analysisType === 'pvgis' ? (
          <PVGISIntegration 
            onDataReceived={handlePVGISData}
            formData={formData}
            onFormChange={onFormChange}
          />
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="endereco" className="text-foreground">Endereço</Label>
              <div className="flex gap-2">
                <Input
                  id="endereco"
                  type="text"
                  placeholder="Rua, número, bairro, cidade"
                  value={formData.endereco || ''}
                  onChange={(e) => onFormChange('endereco', e.target.value)}
                  className="flex-1 bg-background border-border text-foreground"
                />
                <Button 
                  variant="outline" 
                  onClick={handleAddressSearch}
                  disabled={isLoadingLocation || !formData.endereco}
                  className="border-border text-foreground hover:bg-accent"
                >
                  {isLoadingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Estado</Label>
                <Select 
                  onValueChange={handleStateChange} 
                  value={formData.estado || ''}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {BRAZIL_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade" className="text-foreground">Cidade</Label>
                <Input
                  id="cidade"
                  type="text"
                  placeholder="Nome da cidade"
                  value={formData.cidade || ''}
                  onChange={(e) => onFormChange('cidade', e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-foreground">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="Ex: -23.550520"
                    value={formData.latitude || ''}
                    onChange={(e) => onFormChange('latitude', parseFloat(e.target.value) || null)}
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-foreground">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="Ex: -46.633308"
                    value={formData.longitude || ''}
                    onChange={(e) => onFormChange('longitude', parseFloat(e.target.value) || null)}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              {/* Botão para abrir seletor de mapa */}
              <div className="flex justify-center">
                <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="border-green-400 text-green-400 hover:bg-green-400/10"
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Selecionar no Mapa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-4 flex-shrink-0">
                      <DialogTitle>Selecionar Localização no Mapa</DialogTitle>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto px-6 pb-6">
                      <MapSelector
                        onSelect={handleMapLocationSelect}
                        initialPosition={
                          formData.latitude && formData.longitude 
                            ? { lat: formData.latitude, lng: formData.longitude }
                            : undefined
                        }
                        height="calc(70vh - 120px)"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Informações da localização selecionada */}
              {formData.latitude && formData.longitude && (
                <div className="p-3 bg-green-900/20 border border-green-400/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      Coordenadas Definidas
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 font-mono">
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </div>
                </div>
              )}
            </div>

            {/* Dados de Irradiação Solar */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-foreground">Irradiação Solar Mensal (kWh/m²/dia)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {monthNames.map((month, index) => (
                  <div key={index} className="space-y-1">
                    <Label htmlFor={`irr-${index}`} className="text-xs text-gray-400">
                      {month}
                    </Label>
                    <Input
                      id={`irr-${index}`}
                      type="number"
                      step="0.1"
                      value={formData.irradiacaoMensal?.[index] || ''}
                      onChange={(e) => {
                        const newValues = [...(formData.irradiacaoMensal || Array(12).fill(0))];
                        newValues[index] = parseFloat(e.target.value) || 0;
                        onFormChange('irradiacaoMensal', newValues);
                      }}
                      className="text-sm bg-background border-border text-foreground"
                      placeholder="0.0"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Os valores são preenchidos automaticamente baseado no estado selecionado. 
                Você pode ajustar conforme dados específicos da localização.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationForm;