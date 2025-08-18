import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { FolderOpen, FilePlus, Search, Loader2, UserPlus } from 'lucide-react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { useProject } from '@/contexts/ProjectContext';

const ProjectLauncher = ({ onProjectSelected, onClose }) => {
    const { toast } = useToast();
    const { user, supabase } = useNewAuth();
    const { loadProject } = useProject();
    const [view, setView] = useState('main'); // 'main', 'load', 'new'
    const [projects, setProjects] = useState([]);
    const [leads, setLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchProjects = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, project_name, saved_at, project_data, address, lead_id')
                .eq('user_id', user.id)
                .eq('project_type', 'pv')
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

    const fetchLeads = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('leads').select('*').eq('user_id', user.id);
            if (error) throw error;
            setLeads(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar leads', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'load') fetchProjects();
        if (view === 'new') fetchLeads();
    }, [view, user]);

    const handleLoadProject = (project) => {
        loadProject(project);
        onProjectSelected();
    };

    const handleNewProjectFromLead = (lead) => {
        loadProject({
            lead_id: lead.id,
            projectName: `Projeto para ${lead.name}`,
            address: lead.address || '',
            customer: {
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                company: lead.company,
            }
        });
        onProjectSelected();
    };

    const filteredProjects = useMemo(() => {
        if (!searchTerm) return projects;
        return projects.filter(p => p.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, projects]);

    const filteredLeads = useMemo(() => {
        if (!searchTerm) return leads;
        return leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, leads]);

    const renderContent = () => {
        switch (view) {
            case 'load':
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Abrir Projeto Existente</DialogTitle>
                            <DialogDescription>Selecione um projeto salvo para continuar.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-slate-700 border-slate-600" />
                            </div>
                            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                                {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>
                                    : filteredProjects.length > 0 ? filteredProjects.map(p => (
                                        <div key={p.id} onClick={() => handleLoadProject(p)} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                                            <div>
                                                <p className="font-semibold">{p.projectName}</p>
                                                <p className="text-xs text-slate-400">Salvo em: {new Date(p.savedAt).toLocaleString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    )) : <p className="text-center text-slate-400 py-8">Nenhum projeto encontrado.</p>}
                            </div>
                        </div>
                        <Button variant="ghost" onClick={() => setView('main')}>Voltar</Button>
                    </>
                );
            case 'new':
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Projeto</DialogTitle>
                            <DialogDescription>Selecione um lead para iniciar um novo projeto.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input placeholder="Buscar por nome do lead..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-slate-700 border-slate-600" />
                            </div>
                            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                                {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-green-400" /></div>
                                    : filteredLeads.length > 0 ? filteredLeads.map(lead => (
                                        <div key={lead.id} onClick={() => handleNewProjectFromLead(lead)} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                                            <div>
                                                <p className="font-semibold">{lead.name}</p>
                                                <p className="text-xs text-slate-400">{lead.company || 'Pessoa Física'}</p>
                                            </div>
                                            <UserPlus className="w-5 h-5 text-green-400" />
                                        </div>
                                    )) : <p className="text-center text-slate-400 py-8">Nenhum lead encontrado.</p>}
                            </div>
                        </div>
                        <Button variant="ghost" onClick={() => setView('main')}>Voltar</Button>
                    </>
                );
            default:
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-center text-3xl">Dimensionamento FV</DialogTitle>
                            <DialogDescription className="text-center text-lg">Como você gostaria de começar?</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button onClick={() => { setView('new'); setSearchTerm(''); }} className="w-full h-32 text-xl flex-col gap-2 bg-gradient-to-br from-green-500 to-teal-500">
                                    <FilePlus className="w-8 h-8" />
                                    Novo Projeto
                                </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button onClick={() => { setView('load'); setSearchTerm(''); }} className="w-full h-32 text-xl flex-col gap-2 bg-gradient-to-br from-cyan-500 to-blue-500">
                                    <FolderOpen className="w-8 h-8" />
                                    Abrir Projeto
                                </Button>
                            </motion.div>
                        </div>
                    </>
                );
        }
    };

    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="bg-slate-800/80 border-slate-700 text-white backdrop-blur-md max-w-2xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};

export default ProjectLauncher;