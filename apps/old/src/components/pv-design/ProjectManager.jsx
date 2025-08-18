import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, FolderOpen, Trash2, Search, Loader2 } from 'lucide-react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { v4 as uuidv4 } from 'uuid';
import { useProject } from '@/contexts/ProjectContext';

const ProjectManager = ({ projectType }) => {
    const { toast } = useToast();
    const { user, supabase } = useNewAuth();
    const { currentProject, loadProject, updateProject } = useProject();
    const [projects, setProjects] = useState([]);
    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isLoadOpen, setIsLoadOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (user && supabase) {
            setIsReady(true);
        } else {
            setIsReady(false);
        }
    }, [user, supabase]);

    const fetchProjects = async () => {
        if (!isReady) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, project_name, saved_at, project_data, address, lead_id')
                .eq('user_id', user.id)
                .eq('project_type', projectType)
                .order('saved_at', { ascending: false });

            if (error) throw error;
            
            setProjects(data.map(p => ({
                id: p.id,
                projectName: p.project_name,
                savedAt: p.saved_at,
                address: p.address,
                lead_id: p.lead_id,
                ...p.project_data
            })));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar projetos', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isLoadOpen && isReady) {
            fetchProjects();
        }
    }, [isLoadOpen, isReady, user, projectType, supabase]);

    useEffect(() => {
        setProjectName(currentProject.projectName || '');
    }, [currentProject.projectName, isSaveOpen]);

    const handleSave = async () => {
        if (!projectName.trim()) {
            toast({ variant: 'destructive', title: 'Erro', description: 'O nome do projeto é obrigatório.' });
            return;
        }
        if (!isReady) {
            toast({ variant: 'destructive', title: 'Usuário ou Supabase não disponível' });
            return;
        }
        setIsLoading(true);

        const projectId = currentProject.id || uuidv4();

        const projectDataToSave = {
            ...currentProject,
            projectName: projectName.trim(),
            savedAt: new Date().toISOString(),
        };
        delete projectDataToSave.id;

        const projectPayload = {
            id: projectId,
            project_name: projectName.trim(),
            project_data: projectDataToSave,
            saved_at: new Date().toISOString(),
            user_id: user.id,
            project_type: projectType,
            address: currentProject.address || null,
            lead_id: currentProject.lead_id || null,
        };

        const { data, error } = await supabase
            .from('projects')
            .upsert(projectPayload, { onConflict: 'id' })
            .select()
            .single();

        setIsLoading(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar na nuvem', description: error.message });
        } else {
            toast({ title: 'Projeto salvo na nuvem!', description: `O projeto "${projectName}" foi salvo.` });
            setIsSaveOpen(false);
            const fullProjectData = { ...data.project_data, id: data.id, projectName: data.project_name, address: data.address, lead_id: data.lead_id };
            loadProject(fullProjectData);
        }
    };

    const handleLoad = (project) => {
        loadProject(project);
        toast({ title: 'Projeto carregado!', description: `Você está editando "${project.projectName}".` });
        setIsLoadOpen(false);
    };

    const handleDelete = async (projectId, projectName) => {
        if (!isReady) {
            toast({ variant: 'destructive', title: 'Usuário ou Supabase não disponível' });
            return;
        }
        setIsLoading(true);
        const { error } = await supabase
            .from('projects')
            .delete()
            .match({ id: projectId, user_id: user.id });
        
        setIsLoading(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir da nuvem', description: error.message });
        } else {
            setProjects(projects.filter(p => p.id !== projectId));
            toast({ title: 'Projeto excluído!', description: `O projeto "${projectName}" foi removido.` });
        }
    };

    const filteredProjects = useMemo(() => {
        if (!searchTerm) return projects;
        return projects.filter(p =>
            p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.savedAt && new Date(p.savedAt).toLocaleDateString('pt-BR').includes(searchTerm))
        );
    }, [searchTerm, projects]);

    return (
        <>
            <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="text-white border-purple-500 hover:bg-purple-500/20 hover:text-white" disabled={!isReady}>
                        <Save className="w-4 h-4 mr-2" /> Salvar Projeto
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Salvar Projeto</DialogTitle>
                        <DialogDescription>
                            {isReady ? 'Seu projeto será salvo na nuvem.' : 'Conecte o Supabase para salvar na nuvem.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="project-name">Nome do Projeto / Cliente</Label>
                        <Input
                            id="project-name"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="mt-2 bg-slate-700 border-slate-600"
                            placeholder="Ex: Supermercado Sol"
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700" disabled={isLoading || !isReady}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLoadOpen} onOpenChange={setIsLoadOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="text-white border-cyan-500 hover:bg-cyan-500/20 hover:text-white" disabled={!isReady}>
                        <FolderOpen className="w-4 h-4 mr-2" /> Abrir Projeto
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Abrir Projeto</DialogTitle>
                        <DialogDescription>
                             {isReady ? 'Selecione um projeto salvo na nuvem.' : 'Conecte o Supabase para carregar projetos da nuvem.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Buscar por nome ou data..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-slate-700 border-slate-600"
                            />
                        </div>
                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                            {isLoading ? (
                                <div className="flex justify-center items-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                                </div>
                            ) : filteredProjects.length > 0 ? filteredProjects.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                                    <div>
                                        <p className="font-semibold">{p.projectName}</p>
                                        <p className="text-xs text-slate-400">
                                            Salvo em: {p.savedAt ? new Date(p.savedAt).toLocaleString('pt-BR') : 'Data não disponível'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" onClick={() => handleLoad(p)} disabled={isLoading || !isReady}>Carregar</Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(p.id, p.projectName)} disabled={isLoading || !isReady}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-slate-400 py-8">Nenhum projeto encontrado.</p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ProjectManager;