import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sun, BarChart, FilePlus, Layers } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import { DimensioningProvider, useDimensioning } from '@/contexts/DimensioningContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import PVDesignForm from '../../components/pv-design/PVDesignForm';
import SolarSizingWizard from '../../components/pv-design/wizard/SolarSizingWizard';
import { PVResultsDashboard } from '../../components/pv-design/results/PVResultsDashboard';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

type ViewType = 'wizard' | 'form' | 'results';

// Componente interno que tem acesso ao DimensioningContext
function PVDesignPageContent() {
  const [currentView, setCurrentView] = useState<ViewType>('wizard');
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { currentProject } = useProject();
  const { loadDimensioning, updateDimensioning, forceCleanStart } = useDimensioning();
  const { toast } = useToast();

  // Carregar dados do projeto quando houver projectId na URL
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    
    if (projectId) {
      console.log('📂 Carregando projeto da URL:', projectId);
      loadProjectData(projectId);
    } else {
      console.log('✨ Acessando PV Design sem parâmetros - novo dimensionamento');
      // Força limpeza completa quando acessar diretamente sem parâmetros
      forceCleanStart();
    }
  }, [searchParams]);

  // Carregar lead pré-selecionado quando vem do CRM
  useEffect(() => {
    const selectedLead = location.state?.selectedLead;
    
    if (selectedLead) {
      console.log('📄 Lead pré-selecionado do CRM:', selectedLead.name);
      
      // Marcar que é um carregamento explícito
      sessionStorage.setItem('continueDimensioning', 'true');
      
      updateDimensioning({
        customer: selectedLead,
      });
      
      toast({
        title: "Lead selecionado!",
        description: `Dimensionamento iniciado para ${selectedLead.name}`,
      });
    }
  }, [location.state, updateDimensioning, toast]);

  const loadProjectData = async (projectId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.projects.get(projectId);
      const project = response.data?.data || response.data;
      
      if (project.projectData?.dimensioningName) {
        // Converter dados do projeto para o formato do dimensionamento
        const dimensioningData = {
          id: project.id,
          dimensioningName: project.projectData.dimensioningName,
          customer: project.projectData.customer,
          project: {
            id: project.id,
            name: project.projectName
          },
          projectName: project.projectName,
          
          // Dados de localização
          endereco: project.address,
          cidade: project.projectData.cidade,
          estado: project.projectData.estado,
          latitude: project.projectData.latitude,
          longitude: project.projectData.longitude,
          irradiacaoMensal: project.projectData.irradiacaoMensal || Array(12).fill(4.5),
          
          // Sistema fotovoltaico
          potenciaModulo: project.projectData.potenciaModulo || 550,
          numeroModulos: project.projectData.numeroModulos || 0,
          eficienciaSistema: project.projectData.eficienciaSistema || 85,
          selectedModuleId: project.projectData.selectedModuleId,
          
          // Inversores
          inverters: project.projectData.inverters || [{
            id: crypto.randomUUID(),
            selectedInverterId: '',
            quantity: 1
          }],
          totalInverterPower: project.projectData.totalInverterPower || 0,
          
          // Consumo energético
          energyBills: project.projectData.energyBills || [{
            id: crypto.randomUUID(),
            name: 'Conta Principal',
            consumoMensal: Array(12).fill(500)
          }],
          
          // Parâmetros tarifários
          grupoTarifario: project.projectData.grupoTarifario || 'B',
          tarifaEnergiaB: project.projectData.tarifaEnergiaB || 0.75,
          custoFioB: project.projectData.custoFioB || 0.30,
          tarifaEnergiaPontaA: project.projectData.tarifaEnergiaPontaA,
          tarifaEnergiaForaPontaA: project.projectData.tarifaEnergiaForaPontaA,
          demandaContratada: project.projectData.demandaContratada,
          tarifaDemanda: project.projectData.tarifaDemanda,
          
          // Custos e financeiro
          custoEquipamento: project.projectData.custoEquipamento || 0,
          custoMateriais: project.projectData.custoMateriais || 0,
          custoMaoDeObra: project.projectData.custoMaoDeObra || 0,
          bdi: project.projectData.bdi || 25,
          taxaDesconto: project.projectData.taxaDesconto || 8,
          inflacaoEnergia: project.projectData.inflacaoEnergia || 4.5,
          vidaUtil: project.projectData.vidaUtil || 25,
          
          // Condições de pagamento
          paymentMethod: project.projectData.paymentMethod || 'vista',
          cardInstallments: project.projectData.cardInstallments || 12,
          cardInterest: project.projectData.cardInterest || 1.99,
          financingInstallments: project.projectData.financingInstallments || 60,
          financingInterest: project.projectData.financingInterest || 1.49,
          
          // Dimensionamento de cabos
          cableSizing: project.projectData.cableSizing || [],
          
          // Dados adicionais
          modelo3dUrl: project.projectData.modelo3dUrl,
          googleSolarData: project.projectData.googleSolarData,
          mountingAreas: project.projectData.mountingAreas,
          measurements: project.projectData.measurements,
          
          // Required properties for DimensioningData interface
          aguasTelhado: project.projectData.aguasTelhado || [],
          selectedInverters: project.projectData.selectedInverters || [],
          totalMpptChannels: project.projectData.totalMpptChannels || 0,
          
          createdAt: project.createdAt || project.savedAt,
          updatedAt: project.updatedAt || project.savedAt
        };

        loadDimensioning(dimensioningData);
        
        toast({
          title: "Dimensionamento carregado",
          description: `"${dimensioningData.dimensioningName}" foi carregado com sucesso.`
        });
      }
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar projeto",
        description: "Não foi possível carregar os dados do dimensionamento."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculationComplete = (results: any) => {
    setCalculationResults(results);
    setCurrentView('results');
  };

  const handleBackToForm = () => {
    setCurrentView('form');
  };

  const handleNewProject = () => {
    // Reset calculation results and go back to wizard
    setCalculationResults(null);
    setCurrentView('wizard');
  };

  const handleWizardComplete = (results: any) => {
    setCalculationResults(results);
    setCurrentView('results');
  };

  const handleBackToWizard = () => {
    setCurrentView('wizard');
  };

  const handleSwitchToForm = () => {
    setCurrentView('form');
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
          {/* Switch between wizard and classic form */}
          {(currentView === 'wizard' || currentView === 'form') && (
            <Button 
              variant="outline" 
              onClick={currentView === 'wizard' ? handleSwitchToForm : handleBackToWizard}
              className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              {currentView === 'wizard' ? (
                <>
                  <Layers className="w-4 h-4 mr-2" />
                  Formulário Clássico
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Assistente por Passos
                </>
              )}
            </Button>
          )}
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

          {currentView === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.5 }}
            >
              <PVDesignForm 
                onCalculationComplete={handleCalculationComplete}
                onNewProject={handleNewProject}
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
                results={calculationResults}
                onBackToForm={handleBackToWizard}
                onNewCalculation={handleNewProject}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// Componente principal que envolve tudo no DimensioningProvider
export default function PVDesignPage() {
  return (
    <DimensioningProvider>
      <PVDesignPageContent />
    </DimensioningProvider>
  );
}

