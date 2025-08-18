import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, X, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MapSelector from '@/components/pv-design/form-sections/MapSelector';

const PvgisPanel = ({ project, onUpdateProject, onClose }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);

    const handleLocationSelect = async ({ lat, lng }) => {
        setIsMapOpen(false);
        setIsLoading(true);
        try {
            const { data: pvgisData, error: pvgisError } = await supabase.functions.invoke('fetch-pvgis-data', {
                body: { lat, lon: lng },
            });

            if (pvgisError) throw pvgisError;
            
            const updatedAddress = `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`;

            const updatedProjectData = {
                ...project,
                address: updatedAddress,
                project_data: {
                    ...(project?.project_data || {}),
                    location: {
                        latitude: pvgisData.inputs.location.latitude,
                        longitude: pvgisData.inputs.location.longitude,
                        elevation: pvgisData.inputs.location.elevation,
                    },
                    monthly_radiation: pvgisData.outputs.monthly_radiation,
                    monthly_temperature: pvgisData.outputs.monthly_temperature,
                }
            };
            
            onUpdateProject(updatedProjectData);

            toast({
                title: 'Dados importados com sucesso!',
                description: `Dados de irradiação para ${updatedAddress} foram carregados.`,
            });
            onClose();

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro na busca',
                description: error.message || 'Não foi possível buscar os dados do PVGIS.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute top-0 right-0 w-96 h-full bg-slate-900/80 backdrop-blur-sm border-l border-slate-700 p-4 flex flex-col z-20">
            <Card className="bg-transparent border-none shadow-none flex-grow flex flex-col">
                <CardHeader className="p-2 flex-row justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                        <Map className="w-5 h-5 text-green-400" />
                        Localização e Irradiação
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>
                <CardContent className="p-2 space-y-6 overflow-y-auto flex-grow">
                    <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h4 className="font-semibold text-white">Buscar Dados do PVGIS</h4>
                        <p className="text-sm text-slate-400">Selecione o local do projeto no mapa para buscar automaticamente os dados de irradiação solar.</p>
                        
                        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-green-600 hover:bg-green-700">
                                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Map className="w-4 h-4 mr-2" />}
                                    {isLoading ? 'Buscando...' : 'Abrir Mapa'}
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
                    </div>

                    {project?.project_data?.location && (
                        <div className="p-4 bg-slate-800 rounded-lg space-y-2">
                            <h5 className="font-semibold text-white">Localização Atual do Projeto</h5>
                            <p className="text-sm text-slate-300"><strong>Endereço:</strong> {project.address}</p>
                            <p className="text-sm text-slate-300"><strong>Latitude:</strong> {project.project_data.location.latitude.toFixed(4)}</p>
                            <p className="text-sm text-slate-300"><strong>Longitude:</strong> {project.project_data.location.longitude.toFixed(4)}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PvgisPanel;