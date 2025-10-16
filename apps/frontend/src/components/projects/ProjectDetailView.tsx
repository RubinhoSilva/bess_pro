import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Plus, 
  Sun, 
 
  MapPin, 
  Calendar,
  FileText,
  Zap,
  TrendingUp,
  Edit,
  Trash2,
  Copy,
  Settings,
  MoreVertical
} from 'lucide-react';
import { Project, PVDimensioning, ProjectType } from '@/types/project';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api';
import { ProjectBackupManager } from './ProjectBackupManager';

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  onUpdateProject?: (project: Project) => void;
  onDeletePVDimensioning?: (projectId: string, dimensioningId: string) => void;

}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onUpdateProject,
  onDeletePVDimensioning,

}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pv');
  const [dimensionings, setDimensionings] = useState<any[]>([]);
  const [isLoadingDimensionings, setIsLoadingDimensionings] = useState(false);

  // Função para carregar dimensionamentos relacionados ao projeto
  const loadDimensionings = async () => {
    setIsLoadingDimensionings(true);
    try {
      // Buscar todos os projetos que podem ser dimensionamentos deste projeto
      // Estratégia: buscar projetos que tenham o mesmo nome base ou que tenham
      // projectData indicando que são dimensionamentos
      const response = await apiClient.projects.list({
        searchTerm: project.projectName,
        pageSize: 50
      });

      const allProjects = response.data?.data?.projects || [];
      
      // Se os projetos não têm projectData, precisamos buscar os detalhes completos
      const projectsWithDetails = [];
      for (const proj of allProjects) {
        if (!proj.projectData) {
          try {
            const detailResponse = await apiClient.projects.get(proj.id);
            const fullProject = detailResponse.data?.data || detailResponse.data;
            projectsWithDetails.push(fullProject);
          } catch (error) {
            projectsWithDetails.push(proj); // Usar dados básicos se falhar
          }
        } else {
          projectsWithDetails.push(proj);
        }
      }
      
      // Filtrar projetos que são dimensionamentos
      // Incluir o projeto atual se ele próprio for um dimensionamento
      const projectDimensionings = projectsWithDetails.filter((p: any) => {
        const hasDimensioningData = !!p.projectData?.dimensioningName;
        const isRelatedProject = p.projectName.includes(project.projectName) || 
                                project.projectName.includes(p.projectName.replace(' (Cópia)', ''));
        
        // Se o projeto atual tem dados de dimensionamento, incluí-lo também
        if (p.id === project.id && hasDimensioningData) {
          return true;
        }
        
        // Para outros projetos, verificar se são relacionados e têm dados de dimensionamento
        return p.id !== project.id && hasDimensioningData && isRelatedProject;
      });

      setDimensionings(projectDimensionings);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dimensionamentos do projeto."
      });
    } finally {
      setIsLoadingDimensionings(false);
    }
  };

  // Carregar dimensionamentos quando o componente montar
  useEffect(() => {
    if (project.id) {
      loadDimensionings();
    }
  }, [project.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'calculated': case 'simulated': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string, type: 'pv') => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'calculated': return 'Calculado';
      case 'draft': return 'Rascunho';
      default: return status;
    }
  };

  const handleCreateNewPVDimensioning = () => {
    // Navegar para página de dimensionamento PV com o projeto selecionado
    navigate(`/dashboard/pv-design?projectId=${project.id}&new=true`);
  };



  const handleEditPVDimensioning = (dimensioning: any) => {
    // Navegar diretamente para o dimensionamento (que é um projeto)
    navigate(`/dashboard/pv-design?projectId=${dimensioning.id}`);
  };



  const handleDuplicatePV = async (dimensioning: any) => {
    try {
      // Usar a API para clonar o projeto/dimensionamento
      const response = await apiClient.projects.clone(dimensioning.id, `${dimensioning.projectData?.dimensioningName || dimensioning.projectName} (Cópia)`);
      
      // Recarregar a lista de dimensionamentos
      await loadDimensionings();

      toast({
        title: "Dimensionamento duplicado",
        description: "O dimensionamento foi copiado com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível duplicar o dimensionamento."
      });
    }
  };

  const handleDeleteDimensioning = async (dimensioning: any) => {
    try {
      await apiClient.projects.delete(dimensioning.id);
      
      // Recarregar a lista de dimensionamentos
      await loadDimensionings();

      toast({
        title: "Dimensionamento excluído",
        description: "O dimensionamento foi removido com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o dimensionamento."
      });
    }
  };



  const renderPVDimensionings = () => {
    if (isLoadingDimensionings) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dimensionamentos...</p>
        </div>
      );
    }

    if (!dimensionings || dimensionings.length === 0) {
      return (
        <div className="text-center py-12">
          <Sun className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum Dimensionamento PV</h3>
          <p className="text-muted-foreground mb-6">
            Crie seu primeiro dimensionamento fotovoltaico para este projeto.
          </p>
          <Button onClick={handleCreateNewPVDimensioning} className="gap-2">
            <Plus className="w-4 h-4" />
            Criar Dimensionamento PV
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Dimensionamentos PV ({dimensionings.length})
          </h3>
          <Button onClick={handleCreateNewPVDimensioning} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Dimensionamento
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimensionings.map((dimensioning) => (
            <motion.div
              key={dimensioning.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleEditPVDimensioning(dimensioning)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base font-medium">
                        {dimensioning.projectData?.dimensioningName || dimensioning.projectName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">
                          Dimensionamento
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPVDimensioning(dimensioning)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicatePV(dimensioning)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteDimensioning(dimensioning)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criado:</span>
                      <span>{formatDate(dimensioning.createdAt || dimensioning.savedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Atualizado:</span>
                      <span>{formatDate(dimensioning.updatedAt || dimensioning.savedAt)}</span>
                    </div>
                    {dimensioning.projectData?.numeroModulos && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Módulos:</span>
                        <span>{dimensioning.projectData.numeroModulos}</span>
                      </div>
                    )}
                    {dimensioning.projectData?.potenciaModulo && dimensioning.projectData?.numeroModulos && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Potência:</span>
                        <span>{((dimensioning.projectData.potenciaModulo * dimensioning.projectData.numeroModulos) / 1000).toFixed(1)} kWp</span>
                      </div>
                    )}
                    {dimensioning.results && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Potência:</span>
                        <span>{(dimensioning.results.potenciaPico || 0).toFixed(1)} kWp</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };



  const getProjectTypeColor = () => {
    switch (project.projectType) {
      case ProjectType.PV: return 'from-yellow-500 to-orange-500';

      case ProjectType.HYBRID: return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getProjectTypeIcon = () => {
    switch (project.projectType) {
      case ProjectType.PV: return <Sun className="w-6 h-6 text-white" />;

      case ProjectType.HYBRID: return <Zap className="w-6 h-6 text-white" />;
      default: return <FileText className="w-6 h-6 text-white" />;
    }
  };

  const getProjectTypeName = () => {
    switch (project.projectType) {
      case ProjectType.PV: return 'Fotovoltaico';

      case ProjectType.HYBRID: return 'Híbrido';
      default: return project.projectType;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-3 bg-gradient-to-r ${getProjectTypeColor()} rounded-xl shadow-lg`}>
              {getProjectTypeIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {project.projectName}
              </h1>
              <p className="text-muted-foreground">
                {getProjectTypeName()} • {project.address}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ProjectBackupManager 
            project={project} 
            onImportSuccess={() => {
              // Recarregar dados se necessário
            }}
          />
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dimensionamentos PV</p>
                <p className="text-2xl font-bold">{dimensionings.length}</p>
              </div>
              <Sun className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        

        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="text-sm font-medium">{formatDate(project.savedAt)}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Localização</p>
                <p className="text-sm font-medium">{project.hasLocation ? 'Definida' : 'Não definida'}</p>
              </div>
              <MapPin className={`w-8 h-8 ${project.hasLocation ? 'text-green-500' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for PV Dimensionings and BESS Analyses */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pv" className="gap-2">
            <Sun className="w-4 h-4" />
            Dimensionamentos PV
          </TabsTrigger>

        </TabsList>

        <TabsContent value="pv" className="mt-6">
          {renderPVDimensionings()}
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default ProjectDetailView;