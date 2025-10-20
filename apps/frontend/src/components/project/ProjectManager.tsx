import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, FolderOpen, Trash2, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/auth-hooks';
import { usePVDimensioningStore } from '@/store/pv-dimensioning-store';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/project-hooks';
import { ProjectType } from '@/types/project';

interface ProjectManagerProps {
  projectType: ProjectType;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ projectType }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  // Usar o método loadDimensioning que existe na store
  const { projectName: currentProjectName, loadDimensioning } = usePVDimensioningStore();
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // API hooks
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects({ 
    projectType: projectType 
  });
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const projects = projectsData?.projects || [];

  useEffect(() => {
    setProjectName(currentProjectName || '');
  }, [currentProjectName, isSaveOpen]);

  const handleSave = async () => {
    if (!projectName.trim()) {
      toast({ 
        variant: "destructive", 
        title: 'Erro', 
        description: 'O nome do projeto é obrigatório.' 
      });
      return;
    }

    if (!user) {
      toast({ 
        variant: "destructive", 
        title: 'Erro de autenticação', 
        description: 'Você precisa estar logado para salvar projetos.' 
      });
      return;
    }

    try {
      const projectData = {
        projectName: projectName.trim(),
        projectType: projectType,
        projectData: {
          // Obter dados da nova estrutura
          customer: usePVDimensioningStore.getState().customer?.customer,
          energyBills: usePVDimensioningStore.getState().energy?.energyBills,
          energyBillsA: usePVDimensioningStore.getState().energy?.energyBillsA,
          location: usePVDimensioningStore.getState().location?.location,
          irradiacaoMensal: usePVDimensioningStore.getState().location?.irradiacaoMensal,
          selectedModuleId: usePVDimensioningStore.getState().system?.selectedModuleId,
          selectedInverters: usePVDimensioningStore.getState().system?.selectedInverters,
          potenciaModulo: usePVDimensioningStore.getState().system?.potenciaModulo,
          numeroModulos: usePVDimensioningStore.getState().system?.numeroModulos,
          eficienciaSistema: usePVDimensioningStore.getState().system?.eficienciaSistema,
          custoEquipamento: usePVDimensioningStore.getState().budget?.custoEquipamento,
          custoMateriais: usePVDimensioningStore.getState().budget?.custoMateriais,
          custoMaoDeObra: usePVDimensioningStore.getState().budget?.custoMaoDeObra,
          bdi: usePVDimensioningStore.getState().budget?.bdi,
          paymentMethod: usePVDimensioningStore.getState().budget?.paymentMethod,
          cardInstallments: usePVDimensioningStore.getState().budget?.cardInstallments,
          cardInterest: usePVDimensioningStore.getState().budget?.cardInterest,
          financingInstallments: usePVDimensioningStore.getState().budget?.financingInstallments,
          financingInterest: usePVDimensioningStore.getState().budget?.financingInterest,
        },
        // Adicione outros campos conforme necessário
      };

      // Se há um ID no projeto atual, atualiza; senão, cria novo
      if (usePVDimensioningStore.getState().projectId) {
        await updateProjectMutation.mutateAsync({
          id: usePVDimensioningStore.getState().projectId || '',
          data: projectData
        });
      } else {
        await createProjectMutation.mutateAsync(projectData);
      }

      toast({ 
        title: 'Projeto salvo!', 
        description: `O projeto "${projectName}" foi salvo com sucesso.` 
      });
      setIsSaveOpen(false);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: 'Erro ao salvar projeto', 
        description: error.message || 'Ocorreu um erro inesperado.' 
      });
    }
  };

  const handleLoad = async (project: any) => {
    try {
      await loadDimensioning(project.id);
      
      toast({
        title: 'Projeto carregado!',
        description: `Você está editando "${project.name}".`
      });
      setIsLoadOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: 'Erro ao carregar projeto',
        description: error.message || 'Ocorreu um erro inesperado.'
      });
    }
    
    toast({ 
      title: 'Projeto carregado!', 
      description: `Você está editando "${project.name}".` 
    });
    setIsLoadOpen(false);
  };

  const handleDelete = async (projectId: string, projectName: string) => {
    if (!user) {
      toast({ 
        variant: "destructive", 
        title: 'Erro de autenticação' 
      });
      return;
    }

    try {
      await deleteProjectMutation.mutateAsync(projectId);
      toast({ 
        title: 'Projeto excluído!', 
        description: `O projeto "${projectName}" foi removido.` 
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: 'Erro ao excluir projeto', 
        description: error.message || 'Ocorreu um erro inesperado.' 
      });
    }
  };

  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    return projects.filter((p: any) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.createdAt && new Date(p.createdAt).toLocaleDateString('pt-BR').includes(searchTerm))
    );
  }, [searchTerm, projects]);

  const isReady = !!user;
  const isLoading = createProjectMutation.isPending || 
                   updateProjectMutation.isPending || 
                   deleteProjectMutation.isPending;

  return (
    <>
      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="text-foreground border-purple-500 hover:bg-purple-500/20 hover:text-foreground" 
            disabled={!isReady}
          >
            <Save className="w-4 h-4 mr-2" /> Salvar Projeto
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Salvar Projeto</DialogTitle>
            <DialogDescription>
              {isReady ? 'Seu projeto será salvo.' : 'Você precisa estar logado para salvar projetos.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="project-name">Nome do Projeto / Cliente</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-2 bg-background border-border"
              placeholder="Ex: Supermercado Sol"
            />
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSave} 
              className="bg-purple-600 hover:bg-purple-700 text-white" 
              disabled={isLoading || !isReady}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoadOpen} onOpenChange={setIsLoadOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="text-foreground border-cyan-500 hover:bg-cyan-500/20 hover:text-foreground" 
            disabled={!isReady}
          >
            <FolderOpen className="w-4 h-4 mr-2" /> Abrir Projeto
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-background border-border text-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle>Abrir Projeto</DialogTitle>
            <DialogDescription>
              {isReady ? 'Selecione um projeto salvo.' : 'Você precisa estar logado para carregar projetos.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {isLoadingProjects ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                </div>
              ) : filteredProjects.length > 0 ? filteredProjects.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      Salvo em: {p.createdAt ? new Date(p.createdAt).toLocaleString('pt-BR') : 'Data não disponível'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleLoad(p)} 
                      disabled={isLoading || !isReady}
                    >
                      Carregar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(p.id, p.name)} 
                      disabled={isLoading || !isReady}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )) : (
                <p className="text-center text-slate-400 py-8">Nenhum projeto encontrado.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};