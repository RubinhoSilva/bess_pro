import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { PlusCircle, Edit, Trash2, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadForm from '@/components/crm/LeadForm';
import { Badge } from '@/components/ui/badge';

const CRMLeadsPage = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user, supabase } = useNewAuth();
    const [leads, setLeads] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [currentLead, setCurrentLead] = useState(null);
    const [deletingLead, setDeletingLead] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchLeads = useCallback(async () => {
        if (!user || !supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar leads', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [user, supabase, toast]);

    useEffect(() => {
        if(supabase && user) {
            fetchLeads();
        }
    }, [supabase, user, fetchLeads]);

    useEffect(() => {
        if (!isDialogOpen) {
            fetchLeads();
        }
    }, [isDialogOpen, fetchLeads]);

    const confirmDelete = async () => {
        if (!deletingLead) return;
        try {
            await supabase.from('alerts').delete().match({ lead_id: deletingLead.id });
            const { error } = await supabase.from('leads').delete().match({ id: deletingLead.id });
            if (error) throw error;
            toast({ title: 'Lead excluído com sucesso!' });
            fetchLeads();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir lead', description: error.message });
        } finally {
            setDeletingLead(null);
            setIsDeleteAlertOpen(false);
        }
    };

    const openLeadForm = (lead = null) => {
        setCurrentLead(lead);
        setIsDialogOpen(true);
    };
    
    const openDeleteDialog = (lead) => {
        setDeletingLead(lead);
        setIsDeleteAlertOpen(true);
    };

    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const stageLabels = {
        'lead-recebido': 'Lead Recebido',
        'pre-qualificacao': 'Pré-qualificação',
        'proposta-enviada': 'Proposta Enviada',
        'documentacao-recebida': 'Doc. Recebida',
        'projeto-aprovado': 'Projeto Aprovado',
        'instalacao-agendada': 'Instalação Agendada',
        'sistema-entregue': 'Sistema Entregue',
    };

    return (
        <div className="min-h-screen w-full bg-slate-900">
            <Header />
            <main className="pt-20">
                <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
                    >
                        <div>
                             <Button variant="ghost" onClick={() => navigate('/crm')} className="mb-2 -ml-4">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Funil
                            </Button>
                            <h1 className="text-4xl font-bold text-white">Lista de Leads</h1>
                            <p className="text-slate-300 mt-2">Visualize e gerencie todos os seus leads.</p>
                        </div>
                        <Button onClick={() => openLeadForm()} size="lg" className="mt-4 sm:mt-0 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white">
                            <PlusCircle className="w-5 h-5 mr-2" /> Adicionar Lead
                        </Button>
                    </motion.div>

                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-slate-800 border-slate-700"
                        />
                    </div>
                    
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                           <thead className="bg-slate-800">
                                <tr>
                                    <th className="p-4 font-semibold">Lead</th>
                                    <th className="p-4 font-semibold hidden md:table-cell">Contato</th>
                                    <th className="p-4 font-semibold hidden lg:table-cell">Etapa do Funil</th>
                                    <th className="p-4 font-semibold">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center p-8">
                                        <div className="flex justify-center items-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLeads.length > 0 ? filteredLeads.map(lead => (
                                <tr key={lead.id} className="border-t border-slate-700 hover:bg-slate-800/70">
                                    <td className="p-4">
                                        <p className="font-bold text-purple-300">{lead.name}</p>
                                        <p className="text-sm text-slate-400">{lead.company || 'Pessoa Física'}</p>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <p className="text-sm text-slate-300">{lead.email}</p>
                                        <p className="text-sm text-slate-400">{lead.phone}</p>
                                    </td>
                                    <td className="p-4 hidden lg:table-cell">
                                        <Badge variant="secondary">{stageLabels[lead.stage] || lead.stage}</Badge>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openLeadForm(lead)}><Edit className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400" onClick={() => openDeleteDialog(lead)}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </td>
                                </tr>
                             )) : (
                                <tr>
                                    <td colSpan="4" className="text-center p-8 text-slate-400">Nenhum lead encontrado.</td>
                                </tr>
                             )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{currentLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
                    </DialogHeader>
                    <LeadForm
                        lead={currentLead}
                        onClose={() => {
                            setIsDialogOpen(false);
                            setCurrentLead(null);
                        }}
                    />
                </DialogContent>
            </Dialog>
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o lead "{deletingLead?.name}" e todos os seus alertas.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default CRMLeadsPage;