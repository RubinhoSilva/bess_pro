import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Kanban, 
  List, 
  RefreshCw,
  Download,
  Settings,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '../../components/ui/button';
import { CRMAnalyticsDashboard } from '../../components/crm/CRMAnalyticsDashboard';
import { Lead, CreateLeadRequest, UpdateLeadRequest } from '../../types/lead';
import { leadsApi } from '../../lib/api/leads';
import { LeadForm } from '../../components/crm/LeadForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

const CRMDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await leadsApi.getLeads();
      setLeads(data);
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLead = async (leadData: CreateLeadRequest | UpdateLeadRequest) => {
    try {
      setIsSubmitting(true);
      await leadsApi.createLead(leadData as CreateLeadRequest);
      setIsDialogOpen(false);
      await fetchLeads(); // Recarregar leads
      toast.success('Lead criado com sucesso!');
    } catch (error: any) {
      
      // O interceptor do axios já mostra o toast para erros 409 (conflito)
      // Só mostrar toast genérico se não for um erro conhecido
      if (error.response?.status !== 409) {
        const message = error.response?.data?.error?.message || 'Erro ao criar lead. Tente novamente.';
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportReport = () => {
    // Criar relatório simples em CSV
    const csvHeaders = [
      'Nome',
      'Email',
      'Empresa', 
      'Estágio',
      'Valor Estimado',
      'Valor do Negócio',
      'Potência (kWp)',
      'Tipo de Cliente',
      'Data de Criação'
    ];

    const csvData = leads.map(lead => [
      lead.name,
      lead.email,
      lead.company || '',
      lead.stage,
      lead.estimatedValue || 0,
      lead.value || 0,
      lead.powerKwp || 0,
      lead.clientType || '',
      new Date(lead.createdAt).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-crm-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/services')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Dashboard CRM
            </h1>
            <p className="text-gray-500 mt-2">
              Análise completa do seu funil de vendas e performance comercial
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
          
          <Button
            variant="outline"
            onClick={fetchLeads}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            onClick={exportReport}
            disabled={loading || leads.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/crm/kanban')}
          >
            <Kanban className="mr-2 h-4 w-4" />
            Kanban
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/crm/leads')}
          >
            <List className="mr-2 h-4 w-4" />
            Lista
          </Button>
        </div>
      </motion.div>

      {/* Analytics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CRMAnalyticsDashboard 
          leads={leads} 
          isLoading={loading} 
        />
      </motion.div>


      {/* Modal de Novo Lead */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Lead</DialogTitle>
          </DialogHeader>
          <LeadForm
            onSubmit={handleCreateLead}
            onCancel={() => setIsDialogOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMDashboardPage;