import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Phone, 
  Mail, 
  Users, 
  MessageSquare, 
  FileText, 
  Clock, 
  CheckCircle,
  Edit,
  Trash2,
  Calendar
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interactionsApi } from '../../api/interactions';
import { LeadInteraction, InteractionType, InteractionDirection } from '../../types/interactions';
import { InteractionForm } from './InteractionForm';
import toast from 'react-hot-toast';

interface InteractionHistoryProps {
  leadId: string;
}

const getInteractionIcon = (type: InteractionType) => {
  switch (type) {
    case InteractionType.CALL: return Phone;
    case InteractionType.EMAIL: return Mail;
    case InteractionType.MEETING: return Users;
    case InteractionType.WHATSAPP: return MessageSquare;
    case InteractionType.PROPOSAL_SENT: return FileText;
    case InteractionType.FOLLOW_UP: return Clock;
    case InteractionType.NOTE: return FileText;
    case InteractionType.STAGE_CHANGE: return CheckCircle;
    default: return FileText;
  }
};

const getInteractionColor = (type: InteractionType) => {
  switch (type) {
    case InteractionType.CALL: return 'bg-blue-500';
    case InteractionType.EMAIL: return 'bg-purple-500';
    case InteractionType.MEETING: return 'bg-green-500';
    case InteractionType.WHATSAPP: return 'bg-emerald-500';
    case InteractionType.PROPOSAL_SENT: return 'bg-orange-500';
    case InteractionType.FOLLOW_UP: return 'bg-yellow-500';
    case InteractionType.NOTE: return 'bg-gray-500';
    case InteractionType.STAGE_CHANGE: return 'bg-indigo-500';
    default: return 'bg-gray-500';
  }
};

const getTypeLabel = (type: InteractionType) => {
  switch (type) {
    case InteractionType.CALL: return 'Ligação';
    case InteractionType.EMAIL: return 'E-mail';
    case InteractionType.MEETING: return 'Reunião';
    case InteractionType.WHATSAPP: return 'WhatsApp';
    case InteractionType.PROPOSAL_SENT: return 'Proposta Enviada';
    case InteractionType.FOLLOW_UP: return 'Follow-up';
    case InteractionType.NOTE: return 'Nota';
    case InteractionType.STAGE_CHANGE: return 'Mudança de Etapa';
    default: return type;
  }
};

const getDirectionLabel = (direction: InteractionDirection) => {
  switch (direction) {
    case InteractionDirection.INCOMING: return 'Recebido';
    case InteractionDirection.OUTGOING: return 'Enviado';
    case InteractionDirection.INTERNAL: return 'Interno';
    default: return direction;
  }
};

export const InteractionHistory: React.FC<InteractionHistoryProps> = ({ leadId }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<LeadInteraction | null>(null);
  const [deletingInteraction, setDeletingInteraction] = useState<LeadInteraction | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['interactions', leadId],
    queryFn: () => interactionsApi.getLeadInteractions(leadId),
  });

  const createMutation = useMutation({
    mutationFn: interactionsApi.createInteraction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions', leadId] });
      toast.success('Interação criada com sucesso!');
      setIsFormOpen(false);
    },
    onError: () => {
      toast.error('Erro ao criar interação');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => 
      interactionsApi.updateInteraction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions', leadId] });
      toast.success('Interação atualizada com sucesso!');
      setEditingInteraction(null);
      setIsFormOpen(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar interação');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: interactionsApi.deleteInteraction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions', leadId] });
      toast.success('Interação excluída com sucesso!');
      setDeletingInteraction(null);
      setIsDeleteAlertOpen(false);
    },
    onError: () => {
      toast.error('Erro ao excluir interação');
    }
  });

  const markCompletedMutation = useMutation({
    mutationFn: interactionsApi.markCompleted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions', leadId] });
      toast.success('Interação marcada como concluída!');
    },
    onError: () => {
      toast.error('Erro ao marcar interação como concluída');
    }
  });

  const handleCreate = () => {
    setEditingInteraction(null);
    setIsFormOpen(true);
  };

  const handleEdit = (interaction: LeadInteraction) => {
    setEditingInteraction(interaction);
    setIsFormOpen(true);
  };

  const handleDelete = (interaction: LeadInteraction) => {
    setDeletingInteraction(interaction);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deletingInteraction) {
      deleteMutation.mutate(deletingInteraction.id);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (editingInteraction) {
      updateMutation.mutate({ id: editingInteraction.id, data });
    } else {
      createMutation.mutate({ ...data, leadId });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Interações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Histórico de Interações</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Interação
          </Button>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma interação registrada ainda.</p>
              <Button onClick={handleCreate} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeira interação
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {interactions.map((interaction) => {
                  const Icon = getInteractionIcon(interaction.type);
                  const colorClass = getInteractionColor(interaction.type);
                  
                  return (
                    <motion.div
                      key={interaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{interaction.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(interaction.type)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getDirectionLabel(interaction.direction)}
                          </Badge>
                          {interaction.completedAt && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              Concluído
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">{interaction.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            {format(new Date(interaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                          {interaction.scheduledAt && !interaction.completedAt && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Agendado para {format(new Date(interaction.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {interaction.scheduledAt && !interaction.completedAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markCompletedMutation.mutate(interaction.id)}
                            disabled={markCompletedMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(interaction)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(interaction)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingInteraction ? 'Editar Interação' : 'Nova Interação'}
            </DialogTitle>
          </DialogHeader>
          <InteractionForm
            interaction={editingInteraction}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta interação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};