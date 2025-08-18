import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Map, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MapSelector from './MapSelector';
import { supabase } from '@/lib/customSupabaseClient';

const GoogleSolarAnalysis = ({ onFormChange, setFormData }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const handleLocationSelect = async (location) => {
        setIsMapOpen(false);
        setIsLoading(true);
        setSelectedLocation(location);

        try {
            const { data, error } = await supabase.functions.invoke('fetch-pvgis-data', {
                body: { lat: location.lat, lon: location.lng },
            });
            
            if (error) {
                throw new Error(error.message || 'Erro ao buscar dados do PVGIS');
            }
            
            const monthlyRadiation = data.outputs.monthly_radiation;
            
            setFormData(prev => ({
                ...prev,
                googleSolarData: {
                    latitude: data.inputs.location.latitude,
                    longitude: data.inputs.location.longitude,
                },
                irradiacaoMensal: monthlyRadiation,
            }));

            onFormChange('cidade', `Lat: ${data.inputs.location.latitude.toFixed(4)}, Lon: ${data.inputs.location.longitude.toFixed(4)}`);

            toast({
                title: 'Sucesso!',
                description: 'Dados de irradiação importados com sucesso do PVGIS.',
            });

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro na Busca Automática",
                description: `Não foi possível obter os dados do PVGIS. ${error.message}`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-slate-800 border-slate-700">
            <p className="text-sm text-slate-300 mb-4">
                Selecione a localização exata do projeto no mapa para buscar automaticamente os dados de irradiação solar do PVGIS.
            </p>
            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Map className="mr-2 h-4 w-4" />}
                        {isLoading ? 'Buscando dados...' : 'Selecionar Localização no Mapa'}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Selecione a Localização do Projeto</DialogTitle>
                    </DialogHeader>
                    <div className="flex-grow">
                        <MapSelector onSelect={handleLocationSelect} />
                    </div>
                </DialogContent>
            </Dialog>
             {selectedLocation && (
                <div className="mt-4 text-xs text-slate-400">
                    <p>Localização selecionada:</p>
                    <p>Latitude: {selectedLocation.lat.toFixed(4)}, Longitude: {selectedLocation.lng.toFixed(4)}</p>
                </div>
            )}
        </div>
    );
};

export default GoogleSolarAnalysis;