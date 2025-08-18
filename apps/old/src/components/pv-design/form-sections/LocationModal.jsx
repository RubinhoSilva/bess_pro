import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import MapSelector from '@/components/pv-design/form-sections/MapSelector';
import { Loader2, MapPin } from 'lucide-react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { v4 as uuidv4 } from 'uuid';

const LocationModal = ({ project, isOpen, onClose, onConfirm }) => {
    const { toast } = useToast();
    const { user } = useNewAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);

    const handleConfirm = async () => {
        if (!selectedPosition) {
            toast({ variant: 'destructive', title: 'Localização não selecionada', description: 'Por favor, selecione um ponto no mapa.' });
            return;
        }

        setIsLoading(true);
        try {
            const { lat, lng } = selectedPosition;
            const { data: pvgisData, error: pvgisError } = await supabase.functions.invoke('fetch-pvgis-data', {
                body: { lat, lon: lng },
            });

            if (pvgisError) throw pvgisError;

            const updatedProjectData = {
                ...project,
                location: {
                    latitude: pvgisData.inputs.location.latitude,
                    longitude: pvgisData.inputs.location.longitude,
                    elevation: pvgisData.inputs.location.elevation,
                },
                irradiacaoMensal: pvgisData.outputs.monthly_radiation,
            };
            delete updatedProjectData.id;

            const updatedAddress = `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`;
            const projectId = project.id || uuidv4();

            const projectPayload = {
                id: projectId,
                user_id: user.id,
                project_name: project.projectName || "Novo Projeto 3D",
                address: updatedAddress,
                project_data: updatedProjectData,
                project_type: 'PV_DESIGN_3D',
                saved_at: new Date().toISOString(),
            };

            const { data: savedProject, error: saveError } = await supabase
                .from('projects')
                .upsert(projectPayload, { onConflict: 'id' })
                .select()
                .single();

            if (saveError) throw saveError;
            
            toast({
                title: 'Localização e Irradiação Salvas!',
                description: `Dados para ${updatedAddress} foram salvos no projeto.`,
            });
            onConfirm(savedProject);
            
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao processar localização',
                description: error.message || 'Não foi possível buscar ou salvar os dados.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Definir Localização do Projeto</DialogTitle>
                    <DialogDescription>
                        Selecione a localização exata no mapa para buscar dados de irradiação e salvar no projeto.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow">
                    <MapSelector onSelect={setSelectedPosition} />
                </div>
                <DialogFooter className="p-4 border-t flex justify-between items-center">
                    <div>
                        {selectedPosition && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <MapPin className="w-4 h-4 text-blue-400" />
                                <span>Lat: {selectedPosition.lat.toFixed(4)}, Lon: {selectedPosition.lng.toFixed(4)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleConfirm} disabled={!selectedPosition || isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirmar e Continuar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LocationModal;