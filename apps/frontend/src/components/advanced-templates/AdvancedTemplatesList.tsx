import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, FileText, Eye, Edit3, Copy, Trash2, Download } from 'lucide-react';
import { useAdvancedTemplates, useDeleteAdvancedTemplate, useCloneAdvancedTemplate } from '../../hooks/advanced-templates-hooks';
import { AdvancedProposalTemplate } from '../../types/advanced-templates';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdvancedTemplatesListProps {
  onCreateTemplate: () => void;
  onEditTemplate: (template: AdvancedProposalTemplate) => void;
  onPreviewTemplate: (template: AdvancedProposalTemplate) => void;
  onGenerateProposal: (template: AdvancedProposalTemplate) => void;
}

export function AdvancedTemplatesList({
  onCreateTemplate,
  onEditTemplate,
  onPreviewTemplate,
  onGenerateProposal,
}: AdvancedTemplatesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<AdvancedProposalTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneName, setCloneName] = useState('');

  const limit = 12;

  // Queries
  const { 
    data: templatesData, 
    isLoading, 
    error 
  } = useAdvancedTemplates({
    page,
    limit,
    search: searchTerm || undefined,
    category: categoryFilter || undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
  });

  const deleteTemplateMutation = useDeleteAdvancedTemplate();
  const cloneTemplateMutation = useCloneAdvancedTemplate();

  // Computed values
  const templates = templatesData?.templates || [];
  const pagination = templatesData?.pagination;
  const filters = templatesData?.filters;

  const categoryOptions = useMemo(() => [
    { value: '', label: 'Todas as categorias' },
    { value: 'PV', label: 'Solar Fotovoltaico' },
    { value: 'BESS', label: 'Armazenamento' },
    { value: 'HYBRID', label: 'Sistema Híbrido' },
    { value: 'CUSTOM', label: 'Personalizado' },
  ], []);

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
  ];

  // Handlers
  const handleDelete = async () => {
    if (!selectedTemplate) return;
    
    try {
      await deleteTemplateMutation.mutateAsync({ 
        id: selectedTemplate.id,
        force: false 
      });
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClone = async () => {
    if (!selectedTemplate || !cloneName.trim()) return;
    
    try {
      await cloneTemplateMutation.mutateAsync({
        id: selectedTemplate.id,
        name: cloneName.trim()
      });
      setCloneDialogOpen(false);
      setSelectedTemplate(null);
      setCloneName('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getCategoryLabel = (category: string) => {
    return categoryOptions.find(opt => opt.value === category)?.label || category;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PV': return 'bg-yellow-100 text-yellow-800';
      case 'BESS': return 'bg-green-100 text-green-800';
      case 'HYBRID': return 'bg-purple-100 text-purple-800';
      case 'CUSTOM': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar templates</h3>
          <p className="mt-1 text-sm text-gray-500">
            Ocorreu um erro ao carregar os templates. Tente novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates Avançados</h1>
          <p className="text-gray-600">Gerencie templates de propostas personalizados</p>
        </div>
        <Button onClick={onCreateTemplate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum template encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || categoryFilter || statusFilter
              ? 'Tente ajustar os filtros ou criar um novo template.'
              : 'Comece criando seu primeiro template de proposta.'}
          </p>
          <div className="mt-6">
            <Button onClick={onCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Template
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900 line-clamp-1">
                      {template.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        •••
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPreviewTemplate(template)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditTemplate(template)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onGenerateProposal(template)}>
                        <Download className="h-4 w-4 mr-2" />
                        Gerar Proposta
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTemplate(template);
                          setCloneName(`Cópia de ${template.name}`);
                          setCloneDialogOpen(true);
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Clonar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTemplate(template);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryColor(template.category)}>
                      {getCategoryLabel(template.category)}
                    </Badge>
                    {template.isDefault && (
                      <Badge variant="outline">Padrão</Badge>
                    )}
                    {!template.isActive && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Seções:</span>
                      <span>{template.sections.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Variáveis:</span>
                      <span>{template.variables.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usado:</span>
                      <span>{template.usageCount}x</span>
                    </div>
                  </div>

                  {template.lastUsed && (
                    <p className="text-xs text-gray-500">
                      Último uso: {formatDistanceToNow(new Date(template.lastUsed), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <Button
                  key={pageNumber}
                  variant={page === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
          >
            Próximo
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{selectedTemplate?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clonar Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do novo template
              </label>
              <Input
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="Nome do template clonado"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCloneDialogOpen(false);
                  setCloneName('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleClone}
                disabled={!cloneName.trim() || cloneTemplateMutation.isPending}
              >
                {cloneTemplateMutation.isPending ? 'Clonando...' : 'Clonar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}