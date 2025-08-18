import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Package, MapPinned, Globe } from 'lucide-react';
import GeoMapViewer from '@/components/map/GeoMapViewer';
import { useToast } from '@/components/ui/use-toast';

const GeoMapPage = () => {
    const { user } = useNewAuth();
    const { toast } = useToast();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [apiKey, setApiKey] = useState(null);
    const [show3DModel, setShow3DModel] = useState(false);

    useEffect(() => {
        const fetchProjectsAndKey = async () => {
            if (!user) return;
            setLoading(true);
            
            const projectsPromise = supabase
                .from('solar_projects')
                .select('id, project_name, address, coordinates, solar_api_data')
                .eq('user_id', user.id);

            const apiKeyPromise = supabase
                .from('google_api_keys')
                .select('api_key')
                .eq('user_id', user.id)
                .single();

            const [projectsResult, apiKeyResult] = await Promise.all([projectsPromise, apiKeyPromise]);

            if (projectsResult.error) {
                console.error("Error fetching projects:", projectsResult.error);
                toast({ variant: 'destructive', title: 'Erro ao buscar projetos' });
            } else {
                setProjects(projectsResult.data);
            }

            if (apiKeyResult.error && apiKeyResult.error.code !== 'PGRST116') { // Ignore 'single row not found'
                console.error("Error fetching API key:", apiKeyResult.error);
                toast({ variant: 'destructive', title: 'Erro ao buscar chave de API' });
            } else {
                setApiKey(apiKeyResult.data?.api_key);
            }

            setLoading(false);
        };
        fetchProjectsAndKey();
    }, [user, toast]);

    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setShow3DModel(false); // Reset 3D view when changing project
    };

    const handleToggle3D = () => {
        if (!selectedProject?.solar_api_data?.model_path) {
            toast({
                variant: 'destructive',
                title: 'Modelo 3D não encontrado',
                description: 'Este projeto não possui um modelo 3D associado para visualização.'
            });
            return;
        }
        setShow3DModel(prev => !prev);
    };

    return (
        <div className="min-h-screen w-full bg-slate-900 flex flex-col">
            <Header />
            <main className="flex-grow pt-16 flex">
                <div className="w-1/4 bg-slate-800/50 p-4 border-r border-slate-700 overflow-y-auto flex flex-col">
                    <h2 className="text-xl font-bold text-white mb-4">Projetos Georreferenciados</h2>
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                        </div>
                    ) : (
                        <div className="space-y-3 flex-grow">
                            {projects.length > 0 ? (
                                projects.map(project => (
                                    <Card
                                        key={project.id}
                                        className={`cursor-pointer transition-all ${selectedProject?.id === project.id ? 'bg-blue-900/50 border-blue-500' : 'bg-slate-800 border-slate-700'}`}
                                        onClick={() => handleSelectProject(project)}
                                    >
                                        <CardHeader className="p-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Package className="w-4 h-4 text-orange-400" />
                                                {project.project_name}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-slate-400 text-sm">Nenhum projeto com análise Google Solar encontrado. Crie um na aba de Dimensionamento FV.</p>
                            )}
                        </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <Button 
                            onClick={handleToggle3D} 
                            disabled={!selectedProject || !apiKey}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500"
                        >
                            <Globe className="w-4 h-4 mr-2" />
                            {show3DModel ? 'Ocultar Modelo 3D' : 'Visualizar no Google Maps'}
                        </Button>
                        {!apiKey && <p className="text-xs text-yellow-400 mt-2">Chave de API do Google não configurada.</p>}
                    </div>
                </div>
                <div className="w-3/4 flex-grow relative">
                    <GeoMapViewer project={selectedProject} apiKey={apiKey} show3DModel={show3DModel} />
                </div>
            </main>
        </div>
    );
};

export default GeoMapPage;