import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  useProposalTemplates, 
  useDeleteTemplate, 
  useCloneTemplate,
  useCreateTemplate
} from '../../hooks/proposal-template-hooks';
import { ProposalTemplate } from '../../types/proposal';
import { 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  FileText, 
  Search,
  Filter,
  Star,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface TemplateManagerProps {
  onCreateNew: () => void;
  onEdit: (template: ProposalTemplate) => void;
  onSelect?: (template: ProposalTemplate) => void;
  selectionMode?: boolean;
  className?: string;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onCreateNew,
  onEdit,
  onSelect,
  selectionMode = false,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [templateToClone, setTemplateToClone] = useState<ProposalTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');

  const { data: templates = [], isLoading } = useProposalTemplates({ includeDefaults: true });
  const deleteTemplate = useDeleteTemplate();
  const cloneTemplate = useCloneTemplate();
  const createTemplate = useCreateTemplate();

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleCloneTemplate = (template: ProposalTemplate) => {
    setTemplateToClone(template);
    setNewTemplateName(`${template.name} (Cópia)`);
    setCloneDialogOpen(true);
  };

  const handleConfirmClone = async () => {
    if (!templateToClone || !newTemplateName.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    try {
      await cloneTemplate.mutateAsync({
        id: templateToClone.id!,
        newName: newTemplateName.trim()
      });
      
      setCloneDialogOpen(false);
      setTemplateToClone(null);
      setNewTemplateName('');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDeleteTemplate = async (template: ProposalTemplate) => {
    if (!template.id) return;

    if (window.confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) {
      try {
        await deleteTemplate.mutateAsync(template.id);
      } catch (error) {
        // Error is handled by the hook
      }
    }
  };

  const handleCreateDefaultTemplates = async () => {
    try {
      // Create a basic PV template
      const basicPVTemplate = {
        name: 'Template Básico PV',
        description: 'Template padrão para propostas de sistemas fotovoltaicos',
        category: 'PV' as const,
        isDefault: false,
        structure: [
          {
            id: crypto.randomUUID(),
            type: 'cover' as const,
            title: 'Capa',
            content: '<h1>{{projectName}}</h1>\n<h2>Proposta de Sistema Fotovoltaico</h2>\n<p>Cliente: {{clientName}}</p>\n<p>Data: {{date}}</p>',
            order: 1,
            isRequired: true,
            showInPreview: true
          },
          {
            id: crypto.randomUUID(),
            type: 'introduction' as const,
            title: 'Introdução',
            content: '<p>Prezado(a) {{clientName}},</p>\n<p>Apresentamos nossa proposta para instalação de sistema fotovoltaico para o projeto {{projectName}}.</p>',
            order: 2,
            isRequired: true,
            showInPreview: true
          },
          {
            id: crypto.randomUUID(),
            type: 'technical' as const,
            title: 'Especificações Técnicas',
            content: '<h3>Dados Técnicos</h3>\n<ul>\n<li>Potência do Sistema: {{systemPower}} kWp</li>\n<li>Geração Estimada: {{estimatedGeneration}} kWh/ano</li>\n<li>Módulos: {{moduleCount}} unidades</li>\n</ul>',
            order: 3,
            isRequired: false,
            showInPreview: true
          },
          {
            id: crypto.randomUUID(),
            type: 'financial' as const,
            title: 'Análise Financeira',
            content: '<h3>Investimento</h3>\n<p>Valor Total: {{totalInvestment}}</p>\n<p>Economia Anual: {{annualSavings}}</p>\n<p>Payback: {{payback}} anos</p>',
            order: 4,
            isRequired: false,
            showInPreview: true
          }
        ],
        variables: [
          { 
            id: crypto.randomUUID(),
            name: 'projectName', 
            displayName: 'Nome do Projeto', 
            type: 'text' as const, 
            defaultValue: '', 
            isRequired: true,
            category: 'project' as const
          },
          { 
            id: crypto.randomUUID(),
            name: 'clientName', 
            displayName: 'Nome do Cliente', 
            type: 'text' as const, 
            defaultValue: '', 
            isRequired: true,
            category: 'client' as const
          },
          { 
            id: crypto.randomUUID(),
            name: 'date', 
            displayName: 'Data', 
            type: 'date' as const, 
            defaultValue: new Date().toISOString(), 
            isRequired: true,
            category: 'project' as const
          },
          { 
            id: crypto.randomUUID(),
            name: 'systemPower', 
            displayName: 'Potência do Sistema (kWp)', 
            type: 'number' as const, 
            defaultValue: 0, 
            isRequired: true,
            category: 'calculation' as const
          },
          { 
            id: crypto.randomUUID(),
            name: 'estimatedGeneration', 
            displayName: 'Geração Estimada (kWh/ano)', 
            type: 'number' as const, 
            defaultValue: 0, 
            isRequired: true,
            category: 'calculation' as const
          },
          { 
            id: crypto.randomUUID(),
            name: 'moduleCount', 
            displayName: 'Quantidade de Módulos', 
            type: 'number' as const, 
            defaultValue: 0, 
            isRequired: true,
            category: 'calculation' as const
          },
          { 
            id: crypto.randomUUID(),
            name: 'totalInvestment', 
            displayName: 'Investimento Total', 
            type: 'currency' as const, 
            defaultValue: 0, 
            isRequired: true,
            category: 'calculation' as const
          },
          { 
            id: crypto.randomUUID(),
            name: 'annualSavings', 
            displayName: 'Economia Anual', 
            type: 'currency' as const, 
            defaultValue: 0, 
            isRequired: true,
            category: 'calculation' as const
          },
          { 
            id: crypto.randomUUID(),
            name: 'payback', 
            displayName: 'Payback (anos)', 
            type: 'number' as const, 
            defaultValue: 0, 
            isRequired: true,
            category: 'calculation' as const
          }
        ],
        styling: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          accentColor: '#3b82f6',
          fontFamily: 'Inter',
          fontSize: {
            title: 32,
            heading: 24,
            body: 14,
            small: 12
          },
          margins: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        }
      };

      await createTemplate.mutateAsync(basicPVTemplate);
      toast.success('Template padrão criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar template padrão');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PV':
        return 'bg-blue-100 text-blue-800';
      case 'BESS':
        return 'bg-green-100 text-green-800';
      case 'HYBRID':
        return 'bg-purple-100 text-purple-800';
      case 'GENERAL':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'PV':
        return 'Solar PV';
      case 'BESS':
        return 'Baterias';
      case 'HYBRID':
        return 'Híbrido';
      case 'GENERAL':
        return 'Geral';
      default:
        return category;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {selectionMode ? 'Selecionar Template' : 'Gerenciar Templates'}
          </h2>
          <p className="text-gray-600 mt-1">
            {selectionMode 
              ? 'Escolha um template para gerar sua proposta'
              : 'Crie e gerencie seus templates de proposta'
            }
          </p>
        </div>

        {!selectionMode && (
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="PV">Solar PV</SelectItem>
              <SelectItem value="BESS">Baterias</SelectItem>
              <SelectItem value="HYBRID">Híbrido</SelectItem>
              <SelectItem value="GENERAL">Geral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className={`hover:shadow-md transition-shadow ${
              selectionMode ? 'cursor-pointer hover:border-blue-500' : ''
            }`}
            onClick={selectionMode ? () => onSelect?.(template) : undefined}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {template.name}
                    {template.isDefault && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </CardTitle>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getCategoryColor(template.category)}>
                      {getCategoryLabel(template.category)}
                    </Badge>
                  </div>
                </div>

                {!selectionMode && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(template);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloneTemplate(template);
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    
                    {!template.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {template.description || 'Sem descrição'}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Seções:</span>
                  <span className="font-medium">{template.structure.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Variáveis:</span>
                  <span className="font-medium">{template.variables.length}</span>
                </div>
                
                {template.updatedAt && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {format(new Date(template.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>

              {selectionMode && (
                <Button 
                  className="w-full mt-4" 
                  size="sm"
                  onClick={() => onSelect?.(template)}
                >
                  Usar Template
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || categoryFilter !== 'all' 
              ? 'Nenhum template encontrado' 
              : 'Nenhum template disponível'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro template de proposta'
            }
          </p>
          {!selectionMode && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Template
              </Button>
              {(!searchTerm && categoryFilter === 'all') && (
                <Button 
                  variant="outline" 
                  onClick={handleCreateDefaultTemplates}
                  disabled={createTemplate.isPending}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {createTemplate.isPending ? 'Criando...' : 'Criar Template Padrão'}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clonar Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template Original:</label>
              <p className="text-sm text-gray-600">{templateToClone?.name}</p>
            </div>
            
            <div>
              <label htmlFor="clone-name" className="text-sm font-medium">
                Nome do Novo Template:
              </label>
              <Input
                id="clone-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Nome do template clonado..."
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCloneDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmClone}
                disabled={!newTemplateName.trim() || cloneTemplate.isPending}
              >
                {cloneTemplate.isPending ? 'Clonando...' : 'Clonar Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};