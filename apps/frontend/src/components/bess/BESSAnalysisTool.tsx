import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, Zap, Sun, Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ErrorBoundary from '@/components/ui/error-boundary';
import SystemSelector from './SystemSelector';
import BESSSimulationForm from './BESSSimulationForm';
import BESSDashboard from './BESSDashboard';
import CustomerDataForm from '../pv-design/form-sections/CustomerDataForm';

interface BESSAnalysisToolProps {
  onComplete?: (results: any) => void;
  preSelectedLead?: any;
}

export interface BESSSystemConfiguration {
  solar: boolean;
  bess: boolean;
  diesel: boolean;
}

const BESSAnalysisTool: React.FC<BESSAnalysisToolProps> = ({ onComplete, preSelectedLead }) => {
  const [currentStep, setCurrentStep] = useState<'lead-selection' | 'selection' | 'simulation' | 'results'>(
    preSelectedLead ? 'selection' : 'lead-selection'
  );
  const [selectedLead, setSelectedLead] = useState<any>(preSelectedLead || null);
  const [systemConfig, setSystemConfig] = useState<BESSSystemConfiguration | null>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    customer: preSelectedLead || null,
    lead: preSelectedLead || null,
    dimensioningName: '',
    grupoTarifario: 'B',
    tarifaEnergiaB: 0.75,
    custoFioB: 0.30,
    concessionaria: '',
    tipoRede: 'monofasico',
    tensaoRede: '220',
    fatorSimultaneidade: 100,
    tipoTelhado: 'ceramico'
  });
  const { toast } = useToast();

  // Mostrar notificação quando lead é pré-selecionado
  useEffect(() => {
    if (preSelectedLead) {
      toast({
        title: "Lead selecionado!",
        description: `Análise BESS iniciada para ${preSelectedLead.name}`,
      });
    }
  }, [preSelectedLead, toast]);

  const handleSystemSelection = (config: BESSSystemConfiguration) => {
    setSystemConfig(config);
    setCurrentStep('simulation');
  };

  const handleSimulationComplete = (results: any) => {
    setSimulationResults(results);
    setCurrentStep('results');
    if (onComplete) {
      onComplete(results);
    }
  };

  const handleLeadSelection = (lead: any) => {
    setSelectedLead(lead);
    setFormData(prev => ({
      ...prev,
      customer: lead,
      lead: lead
    }));
    // Não avança automaticamente para o próximo passo
    // O usuário deve clicar no botão "Continuar" para avançar
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Se for um lead, também atualiza o selectedLead
    if ((field === 'lead' || field === 'customer') && value) {
      handleLeadSelection(value);
    }
  };

  const handleNewSimulation = () => {
    setCurrentStep('lead-selection');
    setSelectedLead(null);
    setSystemConfig(null);
    setSimulationResults(null);
  };

  const handleBackToForm = () => {
    setCurrentStep('simulation');
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'lead-selection':
        return 'Seleção do Lead';
      case 'selection':
        return 'Seleção do Sistema';
      case 'simulation':
        return 'Simulação BESS';
      case 'results':
        return 'Resultados da Análise';
      default:
        return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'lead-selection':
        return 'Selecione um lead para vinculação obrigatória da análise BESS';
      case 'selection':
        return 'Escolha os sistemas que compõem sua instalação';
      case 'simulation':
        return 'Configure os parâmetros para simulação';
      case 'results':
        return 'Análise completa do sistema híbrido';
      default:
        return '';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'lead-selection':
        return <Zap className="w-8 h-8 text-white" />;
      case 'selection':
        return <Zap className="w-8 h-8 text-white" />;
      case 'simulation':
        return <Battery className="w-8 h-8 text-white" />;
      case 'results':
        return <Sun className="w-8 h-8 text-white" />;
      default:
        return <Zap className="w-8 h-8 text-white" />;
    }
  };

  const getGradientColors = () => {
    switch (currentStep) {
      case 'lead-selection':
        return 'from-purple-500 to-pink-600';
      case 'selection':
        return 'from-blue-500 to-purple-600';
      case 'simulation':
        return 'from-green-500 to-blue-600';
      case 'results':
        return 'from-orange-500 to-red-600';
      default:
        return 'from-blue-500 to-purple-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-3 bg-gradient-to-r ${getGradientColors()} rounded-xl shadow-lg`}>
              {getStepIcon()}
            </div>
            <h1 className={`text-4xl sm:text-5xl font-bold bg-gradient-to-r ${getGradientColors()} bg-clip-text text-transparent`}>
              BESS Analysis Tool
            </h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {getStepTitle()}
            </h2>
            <p className="text-lg text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
              {getStepDescription()}
            </p>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center space-x-4">
            {['lead-selection', 'selection', 'simulation', 'results'].map((step, index) => {
              const isActive = step === currentStep;
              const isCompleted = 
                (step === 'lead-selection' && ['selection', 'simulation', 'results'].includes(currentStep)) ||
                (step === 'selection' && ['simulation', 'results'].includes(currentStep)) ||
                (step === 'simulation' && currentStep === 'results');
              
              return (
                <React.Fragment key={step}>
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-r ${getGradientColors()} text-white border-transparent` 
                      : isCompleted 
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white dark:bg-slate-800 text-gray-400 border-gray-300 dark:border-slate-600'
                    }
                  `}>
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  {index < 3 && (
                    <div className={`w-16 h-0.5 transition-all duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 'lead-selection' && (
            <motion.div
              key="lead-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <ErrorBoundary>
                <div className="max-w-2xl mx-auto">
                  <CustomerDataForm 
                    formData={formData} 
                    onFormChange={handleFormChange}
                    isLeadLocked={!!preSelectedLead}
                  />
                  {selectedLead && (
                    <div className="flex justify-center mt-8">
                      <Button
                        onClick={() => setCurrentStep('selection')}
                        size="lg"
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3"
                      >
                        Continuar para Seleção do Sistema
                      </Button>
                    </div>
                  )}
                </div>
              </ErrorBoundary>
            </motion.div>
          )}

          {currentStep === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <ErrorBoundary>
                <SystemSelector onSelectionComplete={handleSystemSelection} />
              </ErrorBoundary>
            </motion.div>
          )}

          {currentStep === 'simulation' && systemConfig && (
            <motion.div
              key="simulation"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <ErrorBoundary>
                <BESSSimulationForm
                  systemConfig={systemConfig}
                  onSimulationComplete={handleSimulationComplete}
                  onBack={() => setCurrentStep('selection')}
                  selectedLead={selectedLead}
                  isLeadLocked={!!preSelectedLead}
                />
              </ErrorBoundary>
            </motion.div>
          )}

          {currentStep === 'results' && simulationResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <ErrorBoundary>
                <BESSDashboard
                  results={simulationResults}
                  systemConfig={systemConfig!}
                  onNewSimulation={handleNewSimulation}
                  onBackToForm={handleBackToForm}
                />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Footer */}
        {currentStep !== 'selection' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-10"
          >
            <Button
              onClick={currentStep === 'results' ? handleNewSimulation : () => setCurrentStep('selection')}
              variant="outline"
              size="lg"
              className="px-8 py-4"
            >
              {currentStep === 'results' ? 'Nova Simulação' : 'Voltar à Seleção'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BESSAnalysisTool;