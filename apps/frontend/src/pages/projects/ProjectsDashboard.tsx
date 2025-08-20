import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3,
  List,
  Sun, 
  Battery, 
  Zap,
  MapPin,
  Calendar,
  FileText,
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectType, ProjectSummary, Project, PVDimensioning, BESSAnalysis } from '@/types/project';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useProjects, useDeleteProject, useCloneProject, useProject, useCreateProject } from '@/hooks/project-hooks';
import ProjectDetailView from '@/components/projects/ProjectDetailView';
import ProjectForm from '@/components/projects/ProjectForm';
import { ProposalGenerator } from '@/components/proposal/ProposalGenerator';
import { useClients } from '@/hooks/client-hooks';
import { apiClient } from '@/lib/api';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

const ProjectsDashboard: React.FC = () => {
  const { toast } = useToast();
  
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [proposalProject, setProposalProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectSummary | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Hook para gerenciar projetos
  const { data: projectsData, isLoading, error } = useProjects({
    searchTerm: debouncedSearchTerm,
  });
  const deleteProjectMutation = useDeleteProject();
  const cloneProjectMutation = useCloneProject();
  const createProjectMutation = useCreateProject();
  
  const projects = projectsData?.projects || [];

  // Estatísticas dos projetos
  const getProjectStats = () => {
    const total = projects.length;
    const totalPVDimensionings = 0; // TODO: implementar quando API estiver pronta
    const totalBESSAnalyses = 0; // TODO: implementar quando API estiver pronta
    return {
      totalProjects: total,
      totalPVDimensionings,
      totalBESSAnalyses,
      avgAnalysesPerProject: 0
    };
  };
  
  const { data: clients = [] } = useClients();

  // Filtrar e agrupar projetos por ano/mês
  const filteredAndGroupedProjects = useMemo(() => {
    let filtered = projects;

    // Filtrar por tipo
    if (activeTab !== 'all') {
      filtered = filtered.filter(project => {
        switch (activeTab) {
          case 'pv': return project.projectType === ProjectType.PV;
          case 'bess': return project.projectType === ProjectType.BESS;
          case 'hybrid': return project.projectType === ProjectType.HYBRID;
          default: return true;
        }
      });
    }

    // Filtrar por termo de busca
    if (debouncedSearchTerm) {
      filtered = filtered.filter(project =>
        project.projectName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        project.address.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Agrupar por ano e mês
    const grouped = filtered.reduce((acc, project) => {
      const date = new Date(project.savedAt);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      const yearKey = year.toString();
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      const monthLabel = `${monthNames[month]} ${year}`;

      if (!acc[yearKey]) {
        acc[yearKey] = {
          year,
          months: {}
        };
      }

      if (!acc[yearKey].months[monthKey]) {
        acc[yearKey].months[monthKey] = {
          monthLabel,
          projects: []
        };
      }

      acc[yearKey].months[monthKey].projects.push(project);
      return acc;
    }, {} as Record<string, { year: number; months: Record<string, { monthLabel: string; projects: any[] }> }>);

    // Ordenar por ano (mais recente primeiro) e por mês (mais recente primeiro)
    const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
    
    return sortedYears.map(yearKey => ({
      ...grouped[yearKey],
      months: Object.keys(grouped[yearKey].months)
        .sort((a, b) => b.localeCompare(a))
        .map(monthKey => ({
          key: monthKey,
          ...grouped[yearKey].months[monthKey]
        }))
    }));
  }, [projects, activeTab, debouncedSearchTerm]);

  // Estatísticas
  const stats = useMemo(() => getProjectStats(), [getProjectStats]);

  // Handlers
  const handleOpenProject = async (projectId: string) => {
    try {
      // Buscar o projeto completo via API
      const response = await apiClient.projects.get(projectId);
      const project = response.data.data || response.data;
      
      if (project) {
        setSelectedProject(project);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar projeto",
        description: "Não foi possível carregar os detalhes do projeto."
      });
    }
  };

  const handleCreateProject = async (projectData: any) => {
    try {
      await createProjectMutation.mutateAsync(projectData);
      setIsCreateDialogOpen(false);
      toast({
        title: "Projeto criado",
        description: "O projeto foi criado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar projeto",
        description: "Não foi possível criar o projeto."
      });
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Projeto não encontrado para duplicação."
        });
        return;
      }

      toast({
        title: "Duplicando projeto...",
        description: "Aguarde enquanto criamos uma cópia do projeto."
      });

      await cloneProjectMutation.mutateAsync({
        id: projectId,
        newProjectName: `${project.projectName} (Cópia)`
      });

      toast({
        title: "Projeto duplicado!",
        description: `Cópia de "${project.projectName}" criada com sucesso.`
      });
      
    } catch (error) {
      console.error('Erro ao duplicar projeto:', error);
      toast({
        variant: "destructive",
        title: "Erro ao duplicar projeto",
        description: "Não foi possível criar uma cópia do projeto."
      });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      
      toast({
        title: "Projeto excluído",
        description: `"${projectToDelete.projectName}" foi excluído com sucesso.`
      });
      
      setProjectToDelete(null);
      setIsDeleteDialogOpen(false);
      
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir projeto",
        description: "Não foi possível excluir o projeto. Tente novamente."
      });
    }
  };

  const cancelDeleteProject = () => {
    setProjectToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeletePVDimensioning = async (projectId: string, dimensioningId: string) => {
    // TODO: implementar quando API estiver disponível
    console.log('Função de deletar dimensionamento PV será implementada em breve');
  };

  const handleDeleteBESSAnalysis = async (projectId: string, analysisId: string) => {
    // TODO: implementar quando API estiver disponível
    console.log('Função de deletar análise BESS será implementada em breve');
  };

  const handleGenerateProposal = async (projectId: string) => {
    try {
      // Buscar o projeto completo via API
      const response = await apiClient.projects.get(projectId);
      const project = response.data.data || response.data;
      
      if (project) {
        setProposalProject(project);
      }
    } catch (error) {
      console.error('Error loading project for proposal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do projeto.",
        variant: "destructive",
      });
    }
  };

  const getProjectTypeIcon = (type: ProjectType) => {
    switch (type) {
      case ProjectType.PV: return <Sun className="w-5 h-5 text-yellow-500" />;
      case ProjectType.BESS: return <Battery className="w-5 h-5 text-green-500" />;
      case ProjectType.HYBRID: return <Zap className="w-5 h-5 text-purple-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getProjectTypeName = (type: ProjectType) => {
    switch (type) {
      case ProjectType.PV: return 'Solar PV';
      case ProjectType.BESS: return 'BESS';
      case ProjectType.HYBRID: return 'Híbrido';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Se um projeto está selecionado, mostrar a visualização detalhada
  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onDeletePVDimensioning={handleDeletePVDimensioning}
        onDeleteBESSAnalysis={handleDeleteBESSAnalysis}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard de Projetos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os seus projetos de energia renovável
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Projeto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Projeto</DialogTitle>
                  <DialogDescription>
                    Configure as informações básicas do seu novo projeto
                  </DialogDescription>
                </DialogHeader>
                <ProjectForm
                  onSuccess={() => {
                    setIsCreateDialogOpen(false);
                    // Refresh projects data
                  }}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Projetos</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalProjects}</p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Dimensionamentos PV</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.totalPVDimensionings}</p>
                </div>
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                  <Sun className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Análises BESS</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.totalBESSAnalyses}</p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <Battery className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Média por Projeto</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.avgAnalysesPerProject.toFixed(1)}</p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos por nome ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pv">
                <Sun className="w-4 h-4 mr-1" />
                PV
              </TabsTrigger>
              <TabsTrigger value="bess">
                <Battery className="w-4 h-4 mr-1" />
                BESS
              </TabsTrigger>
              <TabsTrigger value="hybrid">
                <Zap className="w-4 h-4 mr-1" />
                Híbrido
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Projects Grid */}
        <div className="space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full mb-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-12 bg-muted rounded"></div>
                      <div className="h-12 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndGroupedProjects.length === 0 || 
              filteredAndGroupedProjects.every(year => year.months.every(month => month.projects.length === 0)) ? (
            <Card>
              <CardContent className="py-12 text-center">
                {debouncedSearchTerm ? (
                  <>
                    <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
                    <p className="text-muted-foreground">
                      Tente usar termos de busca diferentes ou criar um novo projeto.
                    </p>
                  </>
                ) : (
                  <>
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum projeto ainda</h3>
                    <p className="text-muted-foreground mb-6">
                      Comece criando seu primeiro projeto de energia renovável.
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Criar Primeiro Projeto
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              <AnimatePresence>
                {filteredAndGroupedProjects.map((yearGroup) => (
                  <motion.div
                    key={yearGroup.year}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Year Header */}
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 rounded-lg px-4 py-2">
                        <h2 className="text-2xl font-bold text-primary">{yearGroup.year}</h2>
                      </div>
                      <div className="flex-1 h-px bg-border"></div>
                      <Badge variant="outline" className="text-sm">
                        {yearGroup.months.reduce((total, month) => total + month.projects.length, 0)} projetos
                      </Badge>
                    </div>

                    {/* Months */}
                    {yearGroup.months.map((monthGroup) => (
                      <div key={monthGroup.key} className="space-y-4">
                        {/* Month Header */}
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">{monthGroup.monthLabel}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {monthGroup.projects.length} {monthGroup.projects.length === 1 ? 'projeto' : 'projetos'}
                          </Badge>
                        </div>

                        {/* Projects Grid for this month */}
                        <div className={
                          viewMode === 'grid' 
                            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                            : "space-y-4"
                        }>
                          {monthGroup.projects.map((project) => (
                            <motion.div
                              key={project.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                                <CardContent className="p-6">
                                  {/* Header */}
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-lg bg-muted">
                                        {getProjectTypeIcon(project.projectType)}
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                          {project.projectName}
                                        </h3>
                                        <Badge variant="secondary" className="text-xs mt-1">
                                          {getProjectTypeName(project.projectType)}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenProject(project.id)}>
                                          <Eye className="w-4 h-4 mr-2" />
                                          Visualizar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicateProject(project.id)}>
                                          <Copy className="w-4 h-4 mr-2" />
                                          Duplicar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleGenerateProposal(project.id)}>
                                          <FileText className="w-4 h-4 mr-2" />
                                          Gerar Proposta
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          className="text-red-600"
                                          onClick={() => handleDeleteProject(project.id)}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  {/* Location and Date */}
                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="w-4 h-4" />
                                      <span className="truncate">{project.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Calendar className="w-4 h-4" />
                                      <span>Criado em {formatDate(project.savedAt)}</span>
                                    </div>
                                  </div>

                                  {/* Analysis Stats */}
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                                      <div className="flex items-center justify-center gap-1 mb-1">
                                        <Sun className="w-4 h-4 text-yellow-500" />
                                        <span className="text-xs font-medium">PV</span>
                                      </div>
                                      <div className="text-2xl font-bold text-foreground">
                                        {project.totalPVDimensionings}
                                      </div>
                                      {project.lastPVStatus && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {project.lastPVStatus === 'approved' ? '✅ Aprovado' : 
                                           project.lastPVStatus === 'calculated' ? '📊 Calculado' : '📝 Rascunho'}
                                        </div>
                                      )}
                                    </div>

                                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                                      <div className="flex items-center justify-center gap-1 mb-1">
                                        <Battery className="w-4 h-4 text-green-500" />
                                        <span className="text-xs font-medium">BESS</span>
                                      </div>
                                      <div className="text-2xl font-bold text-foreground">
                                        {project.totalBESSAnalyses}
                                      </div>
                                      {project.lastBESSStatus && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {project.lastBESSStatus === 'approved' ? '✅ Aprovado' : 
                                           project.lastBESSStatus === 'simulated' ? '🔄 Simulado' : '📝 Rascunho'}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Button */}
                                  <Button 
                                    variant="outline" 
                                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                    onClick={() => handleOpenProject(project.id)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Abrir Projeto
                                  </Button>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Proposal Generator */}
      {proposalProject && (
        <ProposalGenerator
          project={proposalProject}
          client={(Array.isArray(clients) ? clients : []).find((c: any) => c.id === (proposalProject as any).clientId) || {
            id: 'default',
            name: 'Cliente não encontrado',
            email: '',
            status: 'active' as any,
            clientType: 'residential' as any,
            tags: [],
            totalProjectsValue: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }}
          onClose={() => setProposalProject(null)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Projeto"
        description={
          projectToDelete 
            ? `Tem certeza que deseja excluir o projeto "${projectToDelete.projectName}"? Esta ação não pode ser desfeita.`
            : "Tem certeza que deseja excluir este projeto?"
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteProject}
        onCancel={cancelDeleteProject}
        loading={deleteProjectMutation.isPending}
      />
    </div>
  );
};

export default ProjectsDashboard;