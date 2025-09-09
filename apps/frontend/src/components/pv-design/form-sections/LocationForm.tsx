import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import PVGISIntegration from './PVGISIntegration';

interface LocationFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

const LocationForm: React.FC<LocationFormProps> = ({ formData, onFormChange }) => {
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
          formData={formData}
          onFormChange={onFormChange}
        />
      </CardContent>
    </Card>
  );
};

export default LocationForm;