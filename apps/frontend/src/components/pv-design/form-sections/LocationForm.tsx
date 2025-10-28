import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import PVGISIntegration from './PVGISIntegration';
import { ILocationData } from '@/store/pv-dimensioning-store';

interface LocationFormProps {
  locationData: ILocationData | null;
  onFormChange: (field: string, value: any) => void;
}

const LocationForm: React.FC<LocationFormProps> = ({ locationData, onFormChange }) => {
  // Garantir que locationData nunca seja nulo
  const safeLocationData = locationData || {};
  
  // TODO: REFACTOR Verificar para tipar melhor os dados recebidos do PVGIS e enviados
  const handlePVGISData = (data: {
    irradiacaoMensal: number[];
    latitude: number;
    longitude: number;
    cidade: string;
    pvgisResponseData?: any;
    fonteDados?: string;
  }) => {
    onFormChange('irradiacaoMensal', data.irradiacaoMensal);
    onFormChange('latitude', data.latitude);
    onFormChange('longitude', data.longitude);
    onFormChange('cidade', data.cidade);
    // Salvar dados completos da resposta PVGIS para restauração
    if (data.pvgisResponseData) {
      onFormChange('pvgisResponseData', data.pvgisResponseData);
    }
    // Salvar fonte de dados utilizada (pvgis ou nasa)
    if (data.fonteDados) {
      onFormChange('fonteDados', data.fonteDados);
    }
    
  };

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="w-5 h-5 text-green-400" />
          Localização e Irradiação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PVGISIntegration
          onDataReceived={handlePVGISData}
          onFormChange={onFormChange}
          formData={safeLocationData}
        />
      </CardContent>
    </Card>
  );
};

export default LocationForm;