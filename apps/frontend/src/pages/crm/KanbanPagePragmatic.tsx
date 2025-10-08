import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Filter, UserPlus, Sun, Battery } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Components
import { CRMAdvancedFilters, CRMFilterState } from '../../components/crm/CRMAdvancedFilters';

// Pragmatic Drag and Drop
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

// Types
import { Lead, LeadStage } from '../../types/lead';
import { KanbanColumn } from '../../types/kanban';
import { useLeads } from '../../hooks/lead-hooks';
import { useConvertLeadToClient } from '../../hooks/client-hooks';
import { leadsApi } from '../../api/leads';
import { useKanbanColumns, useCreateKanbanColumn, useDeleteKanbanColumn, useUpdateKanbanColumn, useReorderKanbanColumns } from '../../hooks/kanban-hooks';

// Components
import { LeadForm } from '../../components/crm/LeadForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Função para converter stage do lead para key da coluna
const stageToColumnKey = (stage: string): string => {
  return stage.replace(/-/g, '_').toUpperCase();
};

// Função para converter key da coluna para stage do lead
const columnKeyToStage = (key: string): string => {
  return key.replace(/_/g, '-').toLowerCase();
};

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

const KanbanPagePragmatic: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, LeadStage>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showConvertedLeads, setShowConvertedLeads] = useState(false);
  const [filters, setFilters] = useState<CRMFilterState>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [defaultStage, setDefaultStage] = useState<string | null>(null);

  // Hooks
  const { data: leadsResponse, isLoading, refetch } = useLeads({ searchTerm });
  const allLeads = Array.isArray(leadsResponse) ? leadsResponse : (leadsResponse?.leads || []);

  // Aplicar filtros aos leads
  const filteredLeads = useMemo(() => {
    if (!filters.isActive) return allLeads;

    return allLeads.filter((lead: Lead) => {
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

      // Filtro por tags
      if (filters.tags.length > 0) {
        const leadTags = lead.tags || [];
        const hasMatchingTag = filters.tags.some(filterTag => 
          leadTags.includes(filterTag)
        );
        if (!hasMatchingTag) return false;
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
  const convertLeadToClientMutation = useConvertLeadToClient();
  
  // Kanban columns
  const { data: kanbanColumns = [], isLoading: columnsLoading } = useKanbanColumns();
  const createColumnMutation = useCreateKanbanColumn();
  const deleteColumnMutation = useDeleteKanbanColumn();
  const updateColumnMutation = useUpdateKanbanColumn();
  const reorderColumnsMutation = useReorderKanbanColumns();

  // Mapear colunas dinâmicas
  const columnsMap = useMemo(() => {
    const map: Record<string, KanbanColumn> = {};
    kanbanColumns.forEach(col => {
      map[col.key] = col;
    });
    return map;
  }, [kanbanColumns]);

  // Criar opções de stage baseadas nas colunas disponíveis
  const availableStages = useMemo(() => {
    return kanbanColumns.map(column => ({
      value: columnKeyToStage(column.key),
      label: column.name
    }));
  }, [kanbanColumns]);

  // Função para mover lead (definida antes do useEffect para evitar erro de hoisting)
  const handleLeadMove = useCallback(async (leadId: string, sourceStage: LeadStage, destStage: LeadStage) => {
    // Optimistic update usando estado separado
    setOptimisticUpdates(prev => ({
      ...prev,
      [leadId]: destStage
    }));

    // Backend update
    try {
      setIsUpdating(true);
      await leadsApi.updateLeadStage(leadId, destStage);
      const targetColumn = columnsMap[destStage];
      toast.success(`Lead movido para ${targetColumn?.name || destStage}`);
      
      // Limpar update otimista após sucesso
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[leadId];
        return newUpdates;
      });
      
      // Sync after a delay
      setTimeout(() => refetch(), 500);
      
    } catch (error) {
      toast.error('Erro ao mover lead');
      
      // Rollback - remover update otimista
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[leadId];
        return newUpdates;
      });
      
      refetch(); // Rollback
    } finally {
      setIsUpdating(false);
    }
  }, [refetch, columnsMap]);

  // Função para deletar coluna
  const handleDeleteColumn = useCallback(async (columnId: string) => {
    try {
      await deleteColumnMutation.mutateAsync(columnId);
    } catch (error) {
      // Error handled in mutation
    }
  }, [deleteColumnMutation]);

  // Função para reordenar colunas
  const handleReorderColumns = useCallback(async (newOrder: KanbanColumn[]) => {
    const reorderData = {
      columns: newOrder.map((col, index) => ({
        id: col.id,
        position: index,
      })),
    };

    try {
      await reorderColumnsMutation.mutateAsync(reorderData);
    } catch (error) {
      // Error handled in mutation
    }
  }, [reorderColumnsMutation]);

  // Função para criar nova coluna
  const handleCreateColumn = useCallback(async () => {
    if (!newColumnName.trim()) return;

    const columnKey = newColumnName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
    
    try {
      await createColumnMutation.mutateAsync({
        name: newColumnName.trim(),
        key: columnKey,
      });
      setNewColumnName('');
      setIsCreatingColumn(false);
    } catch (error) {
      // Error handled in mutation
    }
  }, [newColumnName, createColumnMutation]);

  // Monitor global para drag and drop
  useEffect(() => {
    return monitorForElements({
      onDrop({ location, source }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceData = source.data;
        const destData = destination.data;

        // Se for um lead sendo movido
        if (sourceData.leadId && destData.stage) {
          const leadId = sourceData.leadId as string;
          const sourceStage = sourceData.stage as LeadStage;
          const destStage = columnKeyToStage(destData.stage as string) as LeadStage;

          if (sourceStage === destStage) return;

          handleLeadMove(leadId, sourceStage, destStage);
        }
        
        // Se for uma coluna sendo reordenada
        if (sourceData.type === 'column' && sourceData.columnId && destData.type === 'column') {
          const draggedColumnId = sourceData.columnId as string;
          const targetColumnId = destData.columnId as string;
          
          if (draggedColumnId === targetColumnId) return;

          const draggedIndex = kanbanColumns.findIndex(col => col.id === draggedColumnId);
          const targetIndex = kanbanColumns.findIndex(col => col.id === targetColumnId);
          
          if (draggedIndex === -1 || targetIndex === -1) return;

          // Reordenar array localmente
          const reorderedColumns = [...kanbanColumns];
          const [draggedColumn] = reorderedColumns.splice(draggedIndex, 1);
          reorderedColumns.splice(targetIndex, 0, draggedColumn);

          handleReorderColumns(reorderedColumns);
        }
      },
    });
  }, [handleLeadMove, kanbanColumns, handleReorderColumns]);

  // Organizar leads por coluna usando useMemo para evitar re-renders desnecessários
  const leadsGroupedByColumn = useMemo(() => {
    if (!leads || !Array.isArray(leads) || kanbanColumns.length === 0) {
      return {};
    }

    const grouped: Record<string, Lead[]> = {};
    
    // Inicializar com colunas vazias
    kanbanColumns.forEach(column => {
      grouped[column.key] = [];
    });

    // Filtrar leads convertidos se necessário
    const filteredLeads = showConvertedLeads 
      ? leads 
      : leads.filter(lead => lead.stage !== 'converted');
    
    // Agrupar leads por coluna
    filteredLeads.forEach(lead => {
      if (lead && lead.stage) {
        // Aplicar updates otimistas se existirem
        const effectiveStage = optimisticUpdates[lead.id] || lead.stage;
        const columnKey = stageToColumnKey(effectiveStage);
        if (grouped[columnKey]) {
          grouped[columnKey].push(lead);
        }
      }
    });

    return grouped;
  }, [leads, optimisticUpdates, kanbanColumns, showConvertedLeads]);

  // Handlers
  const openLeadForm = (lead?: Lead, stageForNewLead?: string) => {
    setEditingLead(lead || null);
    setDefaultStage(stageForNewLead || null);
    setIsLeadFormOpen(true);
  };

  const openDeleteDialog = (lead: Lead) => {
    setDeletingLead(lead);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingLead) return;
    
    try {
      await leadsApi.deleteLead(deletingLead.id);
      toast.success('Lead excluído com sucesso!');
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir lead');
    } finally {
      setIsDeleteAlertOpen(false);
      setDeletingLead(null);
    }
  };

  const handleConvertToClient = (lead: Lead) => {
    convertLeadToClientMutation.mutate(lead.id);
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
    navigate('/dashboard/bess-analysis', { 
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

  // Funções para editar colunas
  const startEditingColumn = (column: KanbanColumn) => {
    setEditingColumnId(column.id);
    setEditingColumnName(column.name);
  };

  const cancelEditingColumn = () => {
    setEditingColumnId(null);
    setEditingColumnName('');
  };

  const saveColumnName = async (columnId: string) => {
    if (!editingColumnName.trim()) {
      cancelEditingColumn();
      return;
    }

    try {
      await updateColumnMutation.mutateAsync({
        id: columnId,
        data: { name: editingColumnName.trim() }
      });
      cancelEditingColumn();
    } catch (error) {
      cancelEditingColumn();
    }
  };

  // Lead Card Component
  const LeadCard: React.FC<{ lead: Lead }> = ({ lead }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
      const element = ref.current;
      if (!element) return;

      return draggable({
        element,
        getInitialData: () => ({ leadId: lead.id, stage: lead.stage }),
        onDragStart: () => {
          setIsDragging(true);
          setDraggedLead(lead);
        },
        onDrop: () => {
          setIsDragging(false);
          setDraggedLead(null);
        },
      });
    }, [lead.id, lead.stage]);

    return (
      <div
        ref={ref}
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 transition-all cursor-move select-none ${
          isDragging ? 'opacity-50 rotate-2 shadow-lg' : 'hover:shadow-md'
        }`}
        style={{
          borderLeft: lead.colorHighlight ? `4px solid ${lead.colorHighlight}` : undefined,
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm pointer-events-none">
            {lead.name}
          </h4>
          <div className="flex gap-1 pointer-events-auto">
            <button
              className="text-gray-400 dark:text-gray-500 hover:text-blue-600 p-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleConvertToClient(lead);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Converter para Cliente"
            >
              <UserPlus className="w-3 h-3" />
            </button>
            <button
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 p-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openLeadForm(lead);
              }}
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              className="text-gray-400 dark:text-gray-500 hover:text-orange-500 p-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCreatePVDimensioning(lead);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Criar Dimensionamento PV"
            >
              <Sun className="w-3 h-3" />
            </button>
            <button
              className="text-gray-400 dark:text-gray-500 hover:text-blue-500 p-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCreateBESSAnalysis(lead);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Criar Análise BESS"
            >
              <Battery className="w-3 h-3" />
            </button>
            <button
              className="text-gray-400 dark:text-gray-500 hover:text-red-600 p-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openDeleteDialog(lead);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        {lead.company && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 pointer-events-none">
            {lead.company}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
          <span>{lead.email}</span>
          {lead.estimatedValue > 0 && (
            <span className="font-medium text-green-600">
              {formatCurrency(lead.estimatedValue)}
            </span>
          )}
        </div>
        
        {lead.notes && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 pointer-events-none">
            {lead.notes}
          </p>
        )}
      </div>
    );
  };

  // Column Component
  const Column: React.FC<{ 
    column: KanbanColumn; 
    leads: Lead[]; 
    isDragging?: boolean;
  }> = ({ column, leads, isDragging = false }) => {
    const leadDropRef = useRef<HTMLDivElement>(null);
    const columnDragRef = useRef<HTMLDivElement>(null);
    const [isLeadOver, setIsLeadOver] = useState(false);

    // Drop target para leads (área de conteúdo)
    useEffect(() => {
      const element = leadDropRef.current;
      if (!element) return;

      return dropTargetForElements({
        element,
        getData: () => ({ stage: column.key }),
        onDragEnter: () => setIsLeadOver(true),
        onDragLeave: () => setIsLeadOver(false),
        onDrop: () => setIsLeadOver(false),
      });
    }, [column.key]);

    // Drop target para reordenação de colunas (header)
    useEffect(() => {
      const element = columnDragRef.current;
      if (!element) return;

      return dropTargetForElements({
        element,
        getData: () => ({ columnId: column.id, type: 'column' }),
        onDragEnter: () => {},
        onDragLeave: () => {},
        onDrop: () => {},
      });
    }, [column.id]);

    // Draggable para o header da coluna
    useEffect(() => {
      const element = columnDragRef.current;
      if (!element) return;

      return draggable({
        element,
        getInitialData: () => ({ columnId: column.id, type: 'column' }),
      });
    }, [column.id]);

    return (
      <div className={`flex-1 min-w-80 ${isDragging ? 'opacity-50' : ''}`}>
        {/* Header draggable */}
        <div 
          ref={columnDragRef}
          className="p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg cursor-move hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {editingColumnId === column.id ? (
                <Input
                  value={editingColumnName}
                  onChange={(e) => setEditingColumnName(e.target.value)}
                  onBlur={() => saveColumnName(column.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveColumnName(column.id);
                    if (e.key === 'Escape') cancelEditingColumn();
                  }}
                  className="h-6 text-sm font-semibold"
                  autoFocus
                />
              ) : (
                <h3 
                  className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600"
                  onClick={() => startEditingColumn(column)}
                >
                  {column.name}
                </h3>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">{leads.length} leads</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openLeadForm(undefined, columnKeyToStage(column.key))}
                className="p-2"
                title={`Criar lead em ${column.name}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteColumn(column.id)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content area - drop target para leads */}
        <div 
          ref={leadDropRef}
          className={`border-l border-r border-b border-gray-200 rounded-b-lg transition-all min-h-80 ${
            isLeadOver ? 'bg-blue-50' : 'bg-transparent'
          }`}
        >
          <div className="p-4 space-y-3">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add Column Component (botão final)
  const AddColumnButton: React.FC = () => {
    if (isCreatingColumn) {
      return (
        <div className="flex-1 min-w-80 max-w-80">
          {/* Header similar às outras colunas */}
          <div className="p-4 border border-gray-200 bg-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Nova Coluna</h3>
                <p className="text-sm text-gray-500">Criando...</p>
              </div>
            </div>
          </div>
          
          {/* Content area */}
          <div className="border-l border-r border-b border-gray-200 rounded-b-lg bg-blue-50 min-h-80">
            <div className="p-4 space-y-4">
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Nome da coluna..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateColumn();
                  if (e.key === 'Escape') {
                    setIsCreatingColumn(false);
                    setNewColumnName('');
                  }
                }}
                autoFocus
                className="bg-white"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleCreateColumn} 
                  disabled={!newColumnName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Criar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreatingColumn(false);
                    setNewColumnName('');
                  }}
                  className="bg-white"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-80 max-w-80">
        {/* Header opaco */}
        <div className="p-4 border border-gray-300 bg-gray-100 rounded-t-lg opacity-60">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Plus className="w-6 h-6 mx-auto mb-1 text-gray-500 dark:text-gray-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Adicionar Coluna</p>
            </div>
          </div>
        </div>
        
        {/* Content area - botão clicável */}
        <button
          onClick={() => setIsCreatingColumn(true)}
          className="w-full border-l border-r border-b border-gray-300 dark:border-gray-600 rounded-b-lg bg-gray-50 dark:bg-gray-800 opacity-60 hover:opacity-80 transition-all min-h-80 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <div className="text-center">
            <Plus className="w-12 h-12 mx-auto mb-3" />
            <span className="text-lg font-medium">Clique para criar</span>
          </div>
        </button>
      </div>
    );
  };

  if (isLoading || !leads) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros Avançados */}
      <CRMAdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM - Pipeline de Vendas</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie seus leads através do funil de vendas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openLeadForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowConvertedLeads(!showConvertedLeads)}
        >
          <Filter className="w-4 h-4 mr-2" />
          {showConvertedLeads ? 'Ocultar Convertidos' : 'Mostrar Convertidos'}
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {kanbanColumns.map((column) => (
          <Column 
            key={column.id} 
            column={column}
            leads={leadsGroupedByColumn[column.key] || []} 
          />
        ))}
        <AddColumnButton />
      </div>

      {/* Ghost card for dragging preview */}
      {draggedLead && (
        <div className="fixed pointer-events-none z-50 opacity-80" style={{ top: -1000 }}>
          <div className="bg-white rounded-lg p-4 shadow-lg border">
            <h4 className="font-medium text-gray-900 text-sm">{draggedLead.name}</h4>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Atualizando lead...</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLead ? 'Editar Lead' : 'Novo Lead'}
            </DialogTitle>
          </DialogHeader>
          <LeadForm
            lead={editingLead}
            availableStages={availableStages}
            defaultStage={defaultStage}
            onSubmit={async (data) => {
              try {
                if (editingLead) {
                  await leadsApi.updateLead(editingLead.id, data as any);
                  toast.success('Lead atualizado com sucesso!');
                } else {
                  await leadsApi.createLead(data as any);
                  toast.success('Lead criado com sucesso!');
                }
                setIsLeadFormOpen(false);
                setEditingLead(null);
                setDefaultStage(null);
                refetch();
              } catch (error) {
                toast.error('Erro ao salvar lead');
              }
            }}
            onCancel={() => {
              setIsLeadFormOpen(false);
              setEditingLead(null);
              setDefaultStage(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead "{deletingLead?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Column Manager */}
    </div>
  );
};

export default KanbanPagePragmatic;