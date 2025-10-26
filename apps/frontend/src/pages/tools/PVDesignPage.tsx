// React/Next.js imports
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

// External libraries
import { motion, AnimatePresence } from 'framer-motion';
import { shallow } from 'zustand/shallow';
import { ArrowLeft, Sun } from 'lucide-react';

// Internal components
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/components/ui/use-toast';
import SolarSizingWizard from '../../components/pv-design/wizard/SolarSizingWizard';
import { PVResultsDashboard } from '../../components/pv-design/results/PVResultsDashboard';

// Hooks
import { usePVDimensioningNavigation } from '@/hooks/usePVDimensioningNavigation';

// Store and selectors
import { usePVDimensioningStore } from '@/store/pv-dimensioning-store';

// Services and utilities
import { apiClient } from '@/lib/api';

type ViewType = 'wizard' | 'results';

function PVDesignPageContent() {
  const [currentView, setCurrentView] = useState<ViewType>('wizard');
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routerLocation = useLocation();
  
  // Hook de navegação do dimensionamento
  const { resetWizard } = usePVDimensioningNavigation();
  
  const { toast } = useToast();

  // Carregar dados do projeto quando houver projectId na URL
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    
    if (projectId) {
      loadProjectData(projectId);
    } else {
      // Limpa o dimensionamento quando acessar diretamente sem parâmetros
      resetWizard();
    }
  }, [searchParams, resetWizard]);

  // Carregar lead pré-selecionado quando vem do CRM
  useEffect(() => {
    const selectedLead = routerLocation.state?.selectedLead;
    
    if (selectedLead) {
      // Marcar que é um carregamento explícito
      sessionStorage.setItem('continueDimensioning', 'true');
      
      // Atualiza a store com os dados do lead
      const { updateCustomerData } = usePVDimensioningStore.getState();
      updateCustomerData({ customer: selectedLead });
      
      toast({
        title: "Lead selecionado!",
        description: `Dimensionamento iniciado para ${selectedLead.name}`,
      });
    }
  }, [routerLocation.state, toast]);

  // CORREÇÃO: Adicionar listener para antes de descarregar a página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const state = usePVDimensioningStore.getState();
      if (state.isDirty && !state.dimensioningId) {
        // Criar backup automático antes de sair
        state.createBackup();
        
        // Mostrar aviso ao usuário
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // CORREÇÃO: Adicionar listener para mudança de rota (versão compatível)
  useEffect(() => {
    const handleRouteChange = () => {
      const state = usePVDimensioningStore.getState();
      if (state.isDirty && !state.dimensioningId) {
        // Criar backup antes de mudar de rota
        state.createBackup();
      }
    };

    // Listener para popstate (botão voltar do navegador)
    const handlePopState = (event: PopStateEvent) => {
      const state = usePVDimensioningStore.getState();
      if (state.isDirty && !state.dimensioningId) {
        // Criar backup
        state.createBackup();
        
        // Mostrar confirmação
        if (!window.confirm('Você tem alterações não salvas. Deseja realmente sair?')) {
          // Prevenir navegação
          window.history.pushState(null, '', window.location.pathname);
          event.preventDefault();
        }
      }
    };

    window.addEventListener('beforeunload', handleRouteChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleRouteChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const loadProjectData = async (projectId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.projects.get(projectId);
      const project = response.data?.data || response.data;
      
      if (project.projectData?.dimensioningName) {
        // CORREÇÃO: Limpar backup local antes de carregar novo projeto
        localStorage.removeItem('pv-dimensioning-backup');
        
        // Atualiza a store com os dados carregados
        await usePVDimensioningStore.getState().loadDimensioning(projectId);
        
        toast({
          title: "Dimensionamento carregado",
          description: `"${project.projectData.dimensioningName}" foi carregado com sucesso.`
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar projeto",
        description: "Não foi possível carregar os dados do dimensionamento."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProject = () => {
    // CORREÇÃO: Limpar estado completamente ao iniciar novo projeto
    const { resetWizard, createBackup } = usePVDimensioningStore.getState();
    
    // Criar backup do estado atual antes de limpar
    createBackup();
    
    // Resetar wizard
    resetWizard();
    
    setCalculationResults(null);
    setCurrentView('wizard');
    
    toast({
      title: "Novo dimensionamento",
      description: "Um novo dimensionamento foi iniciado."
    });
  };

  const handleWizardComplete = (results: any) => {
    setCalculationResults(results);
    setCurrentView('results');
  };

  const handleBackToWizard = () => {
    // CORREÇÃO: Validar se há dados para preservar ao voltar
    const state = usePVDimensioningStore.getState();
    if (state.isDirty) {
      state.createBackup();
    }
    
    setCurrentView('wizard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 transition-colors">
      {/* Navigation */}
      <div className="p-4 flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="text-gray-700 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dimensionamento...</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {currentView === 'wizard' && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <SolarSizingWizard 
                onComplete={handleWizardComplete}
                onBack={handleBackToWizard}
              />
            </motion.div>
          )}

          {currentView === 'results' && calculationResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <PVResultsDashboard
                onBackToWizard={handleBackToWizard}
                onNewCalculation={handleNewProject}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default function PVDesignPage() {
  return <PVDesignPageContent />;
}

