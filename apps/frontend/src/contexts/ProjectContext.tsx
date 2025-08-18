import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ProjectType, ProjectData, CreateProjectData } from '@/types/project';
import { useCreateProject, useUpdateProject } from '@/hooks/project-hooks';
import { useAuth } from '@/hooks/auth-hooks';
import toast from 'react-hot-toast';

interface ProjectContextType {
  currentProject: ProjectData;
  isProjectLoaded: boolean;
  projectId: string | null;
  projectName: string;
  projectType: ProjectType;
  leadId: string | null;
  address: string;
  
  // Actions
  loadProject: (projectData: any, source?: string) => void;
  updateProject: (updates: Partial<ProjectData>) => void;
  clearProject: () => void;
  saveProject: (name?: string) => Promise<void>;
  isProjectSaved: () => boolean;
  
  // State
  projectStateSource: string | null;
  isSaving: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const getInitialFormData = (): ProjectData => ({
  customer: undefined,
  location: undefined,
  energyBills: [{ 
    id: crypto.randomUUID(), 
    name: 'Conta Principal', 
    consumoMensal: Array(12).fill(500) 
  }],
  potenciaModulo: 0,
  numeroModulos: 0,
  eficienciaSistema: 80,
  selectedModuleId: '',
  
  inverters: [{ 
    id: crypto.randomUUID(), 
    selectedInverterId: '', 
    quantity: 1 
  }],
  totalInverterPower: 0,
  
  grupoTarifario: 'B',
  tarifaEnergiaB: 0.75,
  custoFioB: 0.05,
  tarifaEnergiaPontaA: 1.20,
  tarifaEnergiaForaPontaA: 0.60,
  demandaContratada: 100,
  tarifaDemanda: 30,
  
  custoEquipamento: 0,
  custoMateriais: 0,
  custoMaoDeObra: 0,
  bdi: 25,
  taxaDesconto: 8,
  inflacaoEnergia: 4.5,
  vidaUtil: 25,
  
  paymentMethod: 'vista',
  cardInstallments: 12,
  cardInterest: 1.99,
  financingInstallments: 60,
  financingInterest: 1.49,
  
  cableSizing: [],
  modelo3dUrl: '',
  googleSolarData: null,
  irradiacaoMensal: Array(12).fill(4.5),
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<ProjectData>(getInitialFormData());
  const [isProjectLoaded, setIsProjectLoaded] = useState(false);
  const [projectStateSource, setProjectStateSource] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>(ProjectType.PV);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  
  const { user } = useAuth();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();

  const loadProject = useCallback((projectData: any, source: string = 'manual') => {
    console.log('Loading project:', projectData);
    
    const fullProjectData = { ...getInitialFormData(), ...projectData.projectData };
    
    setCurrentProject(fullProjectData);
    setProjectId(projectData.id || null);
    setProjectName(projectData.projectName || '');
    setProjectType(projectData.projectType || ProjectType.PV);
    setLeadId(projectData.leadId || null);
    setAddress(projectData.address || '');
    setIsProjectLoaded(true);
    setProjectStateSource(source);
    
    toast.success(`Projeto "${projectData.projectName}" carregado com sucesso!`);
  }, []);

  const updateProject = useCallback((updates: Partial<ProjectData>) => {
    setCurrentProject(prev => ({ ...prev, ...updates }));
  }, []);

  const clearProject = useCallback(() => {
    setCurrentProject(getInitialFormData());
    setProjectId(null);
    setProjectName('');
    setProjectType(ProjectType.PV);
    setLeadId(null);
    setAddress('');
    setIsProjectLoaded(false);
    setProjectStateSource(null);
  }, []);

  const isProjectSaved = useCallback(() => {
    return !!projectId;
  }, [projectId]);

  const saveProject = useCallback(async (name?: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const nameToSave = name || projectName;
    if (!nameToSave.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }

    try {
      const projectData: CreateProjectData = {
        projectName: nameToSave.trim(),
        projectType,
        address,
        leadId: leadId || undefined,
        projectData: currentProject,
      };

      if (projectId) {
        // Update existing project
        await updateProjectMutation.mutateAsync({
          id: projectId,
          data: {
            projectName: nameToSave.trim(),
            address,
            projectData: currentProject,
          }
        });
        
        setProjectName(nameToSave.trim());
        toast.success('Projeto atualizado com sucesso!');
      } else {
        // Create new project
        const newProject = await createProjectMutation.mutateAsync(projectData);
        
        setProjectId(newProject.id);
        setProjectName(newProject.projectName);
        toast.success('Projeto salvo com sucesso!');
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(error.message || 'Erro ao salvar projeto');
    }
  }, [
    user, 
    projectName, 
    projectType, 
    address, 
    leadId, 
    currentProject, 
    projectId,
    createProjectMutation,
    updateProjectMutation
  ]);

  const contextValue: ProjectContextType = {
    currentProject,
    isProjectLoaded,
    projectId,
    projectName,
    projectType,
    leadId,
    address,
    
    loadProject,
    updateProject,
    clearProject,
    saveProject,
    isProjectSaved,
    
    projectStateSource,
    isSaving: createProjectMutation.isPending || updateProjectMutation.isPending,
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject deve ser usado dentro de um ProjectProvider');
  }
  return context;
}