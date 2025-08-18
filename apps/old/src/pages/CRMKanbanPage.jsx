import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { PlusCircle, List, Loader2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadForm from '@/components/crm/LeadForm';
import LeadAlertForm from '@/components/crm/LeadAlertForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import KanbanColumn from '@/components/crm/KanbanColumn';
import KanbanCard from '@/components/crm/KanbanCard';

const initialColumnOrder = [
    'lead-recebido',
    'pre-qualificacao',
    'proposta-enviada',
    'documentacao-recebida',
    'projeto-aprovado',
    'instalacao-agendada',
    'sistema-entregue',
];

const columnTitles = {
    'lead-recebido': 'Lead Recebido',
    'pre-qualificacao': 'Pré-qualificação',
    'proposta-enviada': 'Proposta Enviada',
    'documentacao-recebida': 'Documentação Recebida',
    'projeto-aprovado': 'Projeto Aprovado',
    'instalacao-agendada': 'Instalação Agendada',
    'sistema-entregue': 'Sistema Entregue',
};

const CRMKanbanPage = () => {
    const { user, supabase } = useNewAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [columns, setColumns] = useState(null);
    const [activeLead, setActiveLead] = useState(null);
    const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
    const [isAlertFormOpen, setIsAlertFormOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [alertLead, setAlertLead] = useState(null);
    const [deletingLead, setDeletingLead] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchLeads = useCallback(async () => {
        if (!user || !supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('leads').select('*');
            if (error) throw error;

            const newColumns = initialColumnOrder.reduce((acc, columnId) => {
                acc[columnId] = { id: columnId, title: columnTitles[columnId], leads: [] };
                return acc;
            }, {});

            data.forEach(lead => {
                if (newColumns[lead.stage]) {
                    newColumns[lead.stage].leads.push(lead);
                } else {
                    newColumns[initialColumnOrder[0]].leads.push(lead);
                }
            });
            setColumns(newColumns);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar leads', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [user, supabase, toast]);

    useEffect(() => {
        if (supabase && user) {
            fetchLeads();
        }
    }, [supabase, user, fetchLeads]);

    useEffect(() => {
        if (!isLeadFormOpen && !isAlertFormOpen) {
            fetchLeads();
        }
    }, [isLeadFormOpen, isAlertFormOpen, fetchLeads]);

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: {
            distance: 10,
        },
    }), useSensor(KeyboardSensor));

    const findContainer = (id) => {
        if (!columns) return null;
        if (id in columns) {
            return id;
        }
        return Object.keys(columns).find((key) => columns[key].leads.some(lead => lead.id === id));
    };

    const handleDragStart = (event) => {
        const { active } = event;
        const container = findContainer(active.id);
        if (!container || !columns[container]) return;
        const lead = columns[container].leads.find(l => l.id === active.id);
        setActiveLead(lead);
    };
    
    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over || !columns) return;
    
        const activeId = active.id;
        const overId = over.id;
    
        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);
    
        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }
    
        setColumns((prev) => {
            const activeItems = prev[activeContainer].leads;
            const overItems = prev[overContainer].leads;
    
            const activeIndex = activeItems.findIndex(item => item.id === activeId);
            const overIndex = overItems.findIndex(item => item.id === overId);
    
            let newIndex;
            if (overId in prev) {
                newIndex = overItems.length;
            } else {
                newIndex = overIndex;
            }

            const newActiveItems = [...activeItems];
            const [movedItem] = newActiveItems.splice(activeIndex, 1);
            
            const newOverItems = [...overItems];
            newOverItems.splice(newIndex, 0, movedItem);

            return {
                ...prev,
                [activeContainer]: {
                    ...prev[activeContainer],
                    leads: newActiveItems
                },
                [overContainer]: {
                    ...prev[overContainer],
                    leads: newOverItems
                },
            };
        });
    };
    
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveLead(null);
        if (!over) return;
    
        const activeContainer = findContainer(active.id);
        let overContainer = findContainer(over.id);

        if (!overContainer) {
          const overCard = Object.values(columns).flatMap(c => c.leads).find(l => l.id === over.id);
          if (overCard) {
            overContainer = overCard.stage;
          }
        }
    
        if (!activeContainer || !overContainer) return;

        if (activeContainer === overContainer) {
          // Reorder within the same column if necessary
          return;
        }
    
        try {
            const { error } = await supabase.from('leads').update({ stage: overContainer }).eq('id', active.id);
            if (error) throw error;
            toast({ title: 'Lead movido com sucesso!' });
            fetchLeads();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao mover lead', description: error.message });
            fetchLeads(); 
        }
    };
    
    const openLeadForm = (lead = null) => { setEditingLead(lead); setIsLeadFormOpen(true); };
    const openAlertForm = (lead) => { setAlertLead(lead); setIsAlertFormOpen(true); };
    const openDeleteDialog = (lead) => { setDeletingLead(lead); setIsDeleteAlertOpen(true); };

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

    const handleColorChange = async (leadId, color) => {
        try {
            const { error } = await supabase.from('leads').update({ color_highlight: color }).eq('id', leadId);
            if (error) throw error;
            toast({ title: 'Cor do lead atualizada!' });
            fetchLeads();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao atualizar cor', description: error.message });
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="min-h-screen w-full bg-slate-900 overflow-x-auto">
                <Header />
                <main className="pt-20">
                    <div className="p-4 sm:p-6 lg:p-8">
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-4xl font-bold text-white">Funil de Vendas</h1>
                                <p className="text-slate-300 mt-2">Gerencie seus leads arrastando os cards entre as etapas.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => navigate('/crm')}><BarChart3 className="w-4 h-4 mr-2" /> Ver Dashboard</Button>
                                <Button variant="outline" onClick={() => navigate('/crm/leads')}><List className="w-4 h-4 mr-2" /> Ver em Lista</Button>
                                <Button onClick={() => openLeadForm()} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Novo Lead
                                </Button>
                            </div>
                        </motion.div>
                        {loading ? (
                            <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>
                        ) : (
                            <div className="flex gap-4 pb-4">
                                {columns && initialColumnOrder.map(columnId => (
                                    <KanbanColumn key={columnId} column={columns[columnId]} onEditLead={openLeadForm} onDeleteLead={openDeleteDialog} onOpenAlert={openAlertForm} onColorChange={handleColorChange} />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
                <DragOverlay>
                    {activeLead ? <KanbanCard lead={activeLead} isOverlay /> : null}
                </DragOverlay>
                <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
                    <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[600px]">
                        <DialogHeader><DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle></DialogHeader>
                        <LeadForm lead={editingLead} onClose={() => { setIsLeadFormOpen(false); setEditingLead(null); }} />
                    </DialogContent>
                </Dialog>
                <Dialog open={isAlertFormOpen} onOpenChange={setIsAlertFormOpen}>
                    <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[500px]">
                        <DialogHeader><DialogTitle>Criar Alerta</DialogTitle></DialogHeader>
                        <LeadAlertForm lead={alertLead} onClose={() => { setIsAlertFormOpen(false); setAlertLead(null); }} />
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
        </DndContext>
    );
};

export default CRMKanbanPage;