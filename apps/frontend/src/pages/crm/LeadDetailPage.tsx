import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Building2, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { leadsApi } from '../../lib/api/leads';
import { LEAD_STAGE_LABELS, DefaultLeadStage } from '../../types/lead';
import { AlertManager } from '../../components/alerts/AlertManager';
import toast from 'react-hot-toast';

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.getLead(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-slate-700 rounded"></div>
                <div className="h-96 bg-slate-700 rounded"></div>
              </div>
              <div className="h-96 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Lead não encontrado</h2>
            <p className="text-slate-400 mb-6">O lead que você está procurando não existe ou foi removido.</p>
            <Button onClick={() => navigate('/dashboard/crm/leads')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Leads
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/crm/leads')}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold text-white">{lead.name}</h1>
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 border-0"
              >
                {LEAD_STAGE_LABELS[lead.stage as DefaultLeadStage] || lead.stage}
              </Badge>
            </div>
            <Button onClick={() => navigate(`/dashboard/crm/leads`)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Lead
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Lead Information */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Informações do Lead</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lead.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-400">E-mail</p>
                          <p className="text-white">{lead.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {lead.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-400">Telefone</p>
                          <p className="text-white">{lead.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {lead.company && (
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-400">Empresa</p>
                          <p className="text-white">{lead.company}</p>
                        </div>
                      </div>
                    )}
                    
                    {lead.address && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-400">Endereço</p>
                          <p className="text-white">{lead.address}</p>
                        </div>
                      </div>
                    )}
                    
                    {lead.estimatedValue && (
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-400">Valor Estimado</p>
                          <p className="text-white">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(lead.estimatedValue)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {lead.expectedCloseDate && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-400">Data Esperada de Fechamento</p>
                          <p className="text-white">
                            {format(new Date(lead.expectedCloseDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {lead.notes && (
                    <div className="mt-6">
                      <p className="text-sm text-slate-400 mb-2">Observações</p>
                      <p className="text-white bg-slate-700 p-3 rounded-lg whitespace-pre-wrap">
                        {lead.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alerts & Reminders */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Alertas & Lembretes</CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertManager leadId={id} showCreateButton={true} />
                </CardContent>
              </Card>

              {/* Interaction History */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Histórico de Interações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">Funcionalidade de histórico será implementada em breve.</p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-400">Criado em</p>
                      <p className="text-white">
                        {format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Última atualização</p>
                      <p className="text-white">
                        {format(new Date(lead.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Fonte</p>
                      <p className="text-white capitalize">{lead.source || 'Não informado'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.email && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => window.open(`mailto:${lead.email}`)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar E-mail
                    </Button>
                  )}
                  {lead.phone && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => window.open(`tel:${lead.phone}`)}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Fazer Ligação
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/dashboard/crm/kanban')}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Ver no Kanban
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}