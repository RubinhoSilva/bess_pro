import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusCircle, 
  Search, 
  Edit, 
  Trash2, 
  BarChart3, 
  Filter,
  ArrowUpDown,
  Eye,
  Sun,
  Battery
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Components
import { CRMAdvancedFilters, CRMFilterState } from '../../components/crm/CRMAdvancedFilters';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

import { Lead, LeadStage, DefaultLeadStage, LeadSource, LEAD_STAGE_LABELS, LEAD_SOURCE_LABELS, CreateLeadRequest, UpdateLeadRequest } from '../../types/lead';
import { leadsApi } from '../../lib/api/leads';
import { useAuth } from '../../hooks/auth-hooks';
import { toast } from 'react-hot-toast';
import { LeadForm } from '../../components/crm/LeadForm';

const initialFilters: CRMFilterState = {
  searchTerm: '',
  stages: [],
  sources: [],
  clientTypes: [],
  tags: [],
  dateRange: { start: null, end: null },
  valueRange: { min: 0, max: 1000000 },
  powerRange: { min: 0, max: 100 },
  hasNotes: null,
  hasDeadline: null,
  isActive: false
};

const LeadsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<LeadStage | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<LeadSource | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'estimatedValue' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<CRMFilterState>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aplicar filtros aos leads
  const filteredLeads = useMemo(() => {
    if (!filters.isActive) return allLeads;

    return allLeads.filter(lead => {
      // Filtro por texto
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const searchFields = [
          lead.name,
          lead.email,
          lead.company || '',
          lead.notes || ''
        ].join(' ').toLowerCase();
        
        if (!searchFields.includes(searchLower)) return false;
      }

      // Filtro por estágios
      if (filters.stages.length > 0 && !filters.stages.includes(lead.stage)) {
        return false;
      }

      // Filtro por fontes
      if (filters.sources.length > 0 && !filters.sources.includes(lead.source)) {
        return false;
      }

      // Filtro por tipo de cliente
      if (filters.clientTypes.length > 0) {
        if (!filters.clientTypes.includes(lead.clientType as 'B2B' | 'B2C')) {
          return false;
        }
      }

      // Filtro por data
      if (filters.dateRange.start || filters.dateRange.end) {
        const leadDate = new Date(lead.createdAt);
        if (filters.dateRange.start && leadDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && leadDate > filters.dateRange.end) return false;
      }

      // Filtro por valor
      const leadValue = lead.estimatedValue || lead.value || 0;
      if (leadValue < filters.valueRange.min || leadValue > filters.valueRange.max) {
        return false;
      }

      // Filtro por potência
      const leadPower = lead.powerKwp || 0;
      if (leadPower < filters.powerRange.min || leadPower > filters.powerRange.max) {
        return false;
      }

      // Filtro por notas
      if (filters.hasNotes !== null) {
        const hasNotes = !!(lead.notes && lead.notes.trim());
        if (filters.hasNotes !== hasNotes) return false;
      }

      // Filtro por deadline
      if (filters.hasDeadline !== null) {
        const hasDeadline = !!lead.expectedCloseDate;
        if (filters.hasDeadline !== hasDeadline) return false;
      }

      return true;
    });
  }, [allLeads, filters]);

  const leads = filteredLeads;

  useEffect(() => {
    fetchLeads();
  }, [selectedStage, selectedSource, sortBy, sortOrder]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        fetchLeads();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await leadsApi.getLeads({
        stage: selectedStage === 'all' ? undefined : selectedStage,
        source: selectedSource === 'all' ? undefined : selectedSource,
        searchTerm: searchTerm || undefined,
        sortBy,
        sortOrder,
      });
      setAllLeads(data);
    } catch (error) {
      toast.error('Erro ao buscar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDialogOpen(true);
  };

  const handleDelete = (lead: Lead) => {
    setDeletingLead(lead);
    setIsDeleteAlertOpen(true);
  };

  const handleCreatePVDimensioning = (lead: Lead) => {
    // Navegar para dimensionamento PV com lead pré-selecionado
    navigate('/dashboard/pv-design', { 
      state: { 
        selectedLead: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          type: 'lead'
        }
      }
    });
  };

  const handleCreateBESSAnalysis = (lead: Lead) => {
    // Navegar para análise BESS com lead pré-selecionado
    // navigate('/dashboard/bess-analysis', { 
    //   state: { 
    //     selectedLead: {
    //       id: lead.id,
    //       name: lead.name,
    //       email: lead.email,
    //       phone: lead.phone,
    //       company: lead.company,
    //       type: 'lead'
    //     }
    //   }
    // });
  };

  const confirmDelete = async () => {
    if (!deletingLead) return;
    
    try {
      await leadsApi.deleteLead(deletingLead.id);
      toast.success('Lead excluído com sucesso!');
      fetchLeads();
    } catch (error) {
      toast.error('Erro ao excluir lead');
    } finally {
      setDeletingLead(null);
      setIsDeleteAlertOpen(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedLead(null);
    setIsDialogOpen(true);
  };

  const handleLeadSubmit = async (data: CreateLeadRequest | UpdateLeadRequest) => {
    try {
      setIsSubmitting(true);
      
      if (selectedLead) {
        // Update existing lead
        await leadsApi.updateLead(selectedLead.id, data as UpdateLeadRequest);
        toast.success('Lead atualizado com sucesso!');
      } else {
        // Create new lead
        await leadsApi.createLead(data as CreateLeadRequest);
        toast.success('Lead criado com sucesso!');
      }
      
      setIsDialogOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      
      // O interceptor do axios já mostra o toast para erros 409 (conflito)
      // Só mostrar toast genérico se não for um erro conhecido
      if (error.response?.status !== 409) {
        const message = error.response?.data?.error?.message || 'Erro ao salvar lead';
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setIsDialogOpen(false);
    setSelectedLead(null);
  };

  const getStageColor = (stage: LeadStage): string => {
    const colors: Record<string, string> = {
      [DefaultLeadStage.LEAD_RECEBIDO]: 'bg-gray-100 text-gray-800',
      [DefaultLeadStage.PRE_QUALIFICACAO]: 'bg-blue-100 text-blue-800',
      [DefaultLeadStage.PROPOSTA_ENVIADA]: 'bg-yellow-100 text-yellow-800',
      [DefaultLeadStage.DOCUMENTACAO_RECEBIDA]: 'bg-orange-100 text-orange-800',
      [DefaultLeadStage.PROJETO_APROVADO]: 'bg-green-100 text-green-800',
      [DefaultLeadStage.INSTALACAO_AGENDADA]: 'bg-purple-100 text-purple-800',
      [DefaultLeadStage.SISTEMA_ENTREGUE]: 'bg-emerald-100 text-emerald-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Leads
          </h1>
          <p className="text-gray-500 mt-2">
            Gerencie seus leads e oportunidades de negócio
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/crm/kanban')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Ver Kanban
          </Button>
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </motion.div>

      {/* Filtros Avançados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CRMAdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />
      </motion.div>

      {/* Filtros Básicos (manter para compatibilidade) */}
      {!filters.isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, email ou empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedStage} onValueChange={(value) => setSelectedStage(value as LeadStage | 'all')}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estágios</SelectItem>
                    {Object.entries(LEAD_STAGE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSource} onValueChange={(value) => setSelectedSource(value as LeadSource | 'all')}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as fontes</SelectItem>
                    {Object.entries(LEAD_SOURCE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field as typeof sortBy);
                  setSortOrder(order as 'asc' | 'desc');
                }}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Mais recentes</SelectItem>
                    <SelectItem value="createdAt-asc">Mais antigos</SelectItem>
                    <SelectItem value="updatedAt-desc">Atualizados recentemente</SelectItem>
                    <SelectItem value="estimatedValue-desc">Maior valor</SelectItem>
                    <SelectItem value="estimatedValue-asc">Menor valor</SelectItem>
                    <SelectItem value="name-asc">Nome A-Z</SelectItem>
                    <SelectItem value="name-desc">Nome Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Leads Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              Leads ({leads.length})
              {filters.isActive && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  de {allLeads.length} total
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                Nenhum lead encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Lead</th>
                      <th className="text-left p-4 font-semibold hidden md:table-cell">Contato</th>
                      <th className="text-left p-4 font-semibold hidden lg:table-cell">Estágio</th>
                      <th className="text-left p-4 font-semibold hidden lg:table-cell">Valor Est.</th>
                      <th className="text-left p-4 font-semibold hidden xl:table-cell">Atualizado</th>
                      <th className="text-left p-4 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{lead.name}</p>
                            <p className="text-sm text-gray-500">{lead.company || 'Pessoa Física'}</p>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <div>
                            <p className="text-sm text-gray-900">{lead.email}</p>
                            <p className="text-sm text-gray-500">{lead.phone}</p>
                          </div>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStageColor(lead.stage)}`}>
                            {LEAD_STAGE_LABELS[lead.stage as DefaultLeadStage] || lead.stage}
                          </span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          {lead.estimatedValue > 0 ? formatCurrency(lead.estimatedValue) : '-'}
                        </td>
                        <td className="p-4 hidden xl:table-cell text-sm text-gray-500">
                          {formatDate(lead.updatedAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(lead)}
                              title="Editar lead"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-orange-500 hover:text-orange-400"
                              onClick={() => handleCreatePVDimensioning(lead)}
                              title="Criar Dimensionamento PV"
                            >
                              <Sun className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-500 hover:text-blue-400"
                              onClick={() => handleCreateBESSAnalysis(lead)}
                              title="Criar Análise BESS"
                            >
                              <Battery className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-400"
                              onClick={() => handleDelete(lead)}
                              title="Excluir lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Lead Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedLead ? 'Editar Lead' : 'Novo Lead'}
            </DialogTitle>
          </DialogHeader>
          <LeadForm
            lead={selectedLead}
            onSubmit={handleLeadSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o lead 
              "{deletingLead?.name}" e todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LeadsPage;