// React & Next.js
import React, { useMemo, useCallback } from 'react';

// Bibliotecas externas
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Sun, User, Zap, MapPin, Settings, Calculator, CheckCircle, Home, Compass, Loader2 } from 'lucide-react';

// Componentes internos
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import CustomerDataForm from '../form-sections/CustomerDataForm';
import ConsumptionForm from '../form-sections/ConsumptionForm';
import LocationForm from '../form-sections/LocationForm';
import SystemParametersForm from '../form-sections/SystemParametersForm';
import { WaterSelectionForm } from '../form-sections/WaterSelectionForm';
import FinancialForm from '../form-sections/FinancialForm';
import PaymentConditionsForm from '../form-sections/PaymentConditionsForm';
import { PVResultsDashboard } from '../results/PVResultsDashboard';

// Hooks
import { useDimensioningOperations } from '@/hooks/dimensioning';

// Serviços
import { moduleService } from '@/services/ModuleService';

// Store & Seletores
import { usePVDimensioningStore } from '@/store/pv-dimensioning-store';
import {
  selectNavigationState,
  selectCustomerData,
  selectEnergyData,
  selectLocationData,
  selectSystemData,
  selectRoofData,
  selectRoofDataCompleteWithModule,
  selectBudgetData,
  selectResultsData,
  selectLoadingState,
  selectMetadataState,
  selectAggregatedRoofData
} from '@/store/selectors/pv-dimensioning-selectors';

interface SolarSizingWizardProps {
  onComplete?: (results: any) => void;
  onBack?: () => void;
}

const steps = [
  {
    id: 1,
    title: 'Dados do Cliente',
    description: 'Informações do cliente e projeto',
    icon: User,
    component: 'customer'
  },
  {
    id: 2,
    title: 'Conta de Energia',
    description: 'Consumo mensal e contas de energia',
    icon: Zap,
    component: 'energy'
  },
  {
    id: 3,
    title: 'Localização e Irradiação',
    description: 'Endereço, coordenadas e dados solares',
    icon: MapPin,
    component: 'location'
  },
  {
    id: 4,
    title: 'Parâmetros do Sistema',
    description: 'Configurações e equipamentos',
    icon: Settings,
    component: 'system'
  },
  {
    id: 5,
    title: 'Orientações',
    description: 'Configuração das orientações',
    icon: Home,
    component: 'roof'
  },
  {
    id: 6,
    title: 'Orçamento',
    description: 'Custos e condições financeiras',
    icon: Calculator,
    component: 'summary'
  },
  {
    id: 7,
    title: 'Resultados',
    description: 'Cálculos e análises finais',
    icon: CheckCircle,
    component: 'results'
  }
];

const SolarSizingWizard: React.FC<SolarSizingWizardProps> = ({ onComplete, onBack }) => {
  const { toast } = useToast();
  
  // Usar store Zustand com seletores otimizados
  const navigationState = usePVDimensioningStore(selectNavigationState);
  const customerData = usePVDimensioningStore(selectCustomerData);
  const energyData = usePVDimensioningStore(selectEnergyData);
  const locationData = usePVDimensioningStore(selectLocationData);
  const systemData = usePVDimensioningStore(selectSystemData);
  const roofData = usePVDimensioningStore(selectRoofData);
  const budgetData = usePVDimensioningStore(selectBudgetData);
  const resultsData = usePVDimensioningStore(selectResultsData);
  const loadingState = usePVDimensioningStore(selectLoadingState);
  const metadataState = usePVDimensioningStore(selectMetadataState);
  const aggregatedRoofData = usePVDimensioningStore(selectAggregatedRoofData);
  
  // Ações do store
  const {
    goToStep,
    nextStep,
    previousStep,
    updateCustomerData,
    updateEnergyData,
    updateLocationData,
    updateSystemData,
    updateRoofData,
    updateBudgetData,
    updateResultsData,
    validateCurrentStep,
    saveDimensioning,
    calculateSystem,
    calculateFinancials
  } = usePVDimensioningStore();
  
  const {
    saveAsync,
    isSaving
  } = useDimensioningOperations(metadataState.dimensioningId || undefined);
  
  // Combinar dados para compatibilidade com código existente
  const currentDimensioning = useMemo(() => ({
    dimensioningName: customerData?.dimensioningName || '',
    customer: customerData?.customer,
    // Campos do CustomerDataForm que agora estão no customerData
    grupoTarifario: customerData?.grupoTarifario || 'B',
    subgrupoTarifario: customerData?.subgrupoTarifario || '',
    concessionaria: customerData?.concessionaria || '',
    tipoRede: customerData?.tipoRede || '',
    tensaoRede: customerData?.tensaoRede || '',
    tipoTelhado: customerData?.tipoTelhado || '',
    fatorSimultaneidade: customerData?.fatorSimultaneidade || 100,
    tarifaEnergiaB: customerData?.tarifaEnergiaB || 0,
    custoFioB: customerData?.custoFioB || 0,
    tarifaEnergiaPontaA: customerData?.tarifaEnergiaPontaA || 0,
    tarifaEnergiaForaPontaA: customerData?.tarifaEnergiaForaPontaA || 0,
    tePontaA: customerData?.tePontaA || 0,
    teForaPontaA: customerData?.teForaPontaA || 0,
    // Dados de localização
    irradiacaoMensal: locationData?.irradiacaoMensal || Array(12).fill(5.0),
    latitude: locationData?.location?.latitude,
    longitude: locationData?.location?.longitude,
    endereco: locationData?.location?.address,
    cidade: locationData?.location?.cidade,
    estado: locationData?.location?.estado,
    fonteDados: locationData?.fonteDados,
    inclinacao: locationData?.inclinacao,
    orientacao: locationData?.azimute,
    considerarSombreamento: locationData?.considerarSombreamento,
    sombreamento: locationData?.sombreamento,
    // Dados do sistema
    potenciaModulo: systemData?.potenciaModulo || 550,
    eficienciaSistema: systemData?.eficienciaSistema || 85,
    numeroModulos: systemData?.numeroModulos || 0,
    selectedModuleId: systemData?.selectedModuleId,
    selectedInverters: systemData?.selectedInverters || [],
    perdaSombreamento: systemData?.perdaSombreamento,
    perdaMismatch: systemData?.perdaMismatch,
    perdaCabeamento: systemData?.perdaCabeamento,
    perdaSujeira: systemData?.perdaSujeira,
    perdaInversor: systemData?.perdaInversor,
    perdaOutras: systemData?.perdaOutras,
    // Campos do SystemParametersForm
    fabricanteModulo: systemData?.fabricanteModulo || '',
    moduloSelecionado: systemData?.moduloSelecionado || '',
    vidaUtil: systemData?.vidaUtil || 25,
    degradacaoAnual: systemData?.degradacaoAnual || 0.5,
    // Dados do telhado
    aguasTelhado: roofData?.aguasTelhado || [],
    // Dados de energia
    energyBills: energyData?.energyBills || [{
      id: crypto.randomUUID(),
      name: 'Unidade Geradora',
      consumoMensal: Array(12).fill(500)
    }],
    // Dados do orçamento
    custoEquipamento: budgetData?.custoEquipamento || 0,
    custoMateriais: budgetData?.custoMateriais || 0,
    custoMaoDeObra: budgetData?.custoMaoDeObra || 0,
    bdi: budgetData?.bdi || 25,
    paymentMethod: budgetData?.paymentMethod,
    cardInstallments: budgetData?.cardInstallments,
    cardInterest: budgetData?.cardInterest,
    financingInstallments: budgetData?.financingInstallments,
    financingInterest: budgetData?.financingInterest,
    // Campos do FinancialForm
    inflacaoEnergia: budgetData?.inflacaoEnergia || 5.0,
    taxaDesconto: budgetData?.taxaDesconto || 8.0,
    custoOperacao: budgetData?.custoOperacao || 1.0,
    valorResidual: budgetData?.valorResidual || 10.0,
    percentualFinanciado: budgetData?.percentualFinanciado || 0,
    taxaJuros: budgetData?.taxaJuros || 12.0,
    prazoFinanciamento: budgetData?.prazoFinanciamento || 5,
  }), [customerData, locationData, systemData, roofData, energyData, budgetData]);

  // Buscar módulos solares para obter dados completos
  const { data: solarModulesData } = useQuery({
    queryKey: ['modules'],
    queryFn: () => moduleService.getModules(),
    staleTime: 10 * 60 * 1000,
  });
  const solarModules = solarModulesData?.modules || [];
  const roofDataComplete = usePVDimensioningStore(selectRoofDataCompleteWithModule(solarModules));

  // Buscar módulo completo selecionado pelo ID
  const selectedModuleFull = useMemo(() => {
    const moduleId = systemData?.selectedModuleId;
    if (!moduleId || solarModules.length === 0) return undefined;
    return solarModules.find((m: any) => m.id === moduleId);
  }, [systemData?.selectedModuleId, solarModules]);

  // Calculate total investment
  const totalInvestment = useMemo(() => {
    const subtotal = (budgetData?.custoEquipamento || 0) +
      (budgetData?.custoMateriais || 0) +
      (budgetData?.custoMaoDeObra || 0);
    return subtotal * (1 + (budgetData?.bdi || 0) / 100);
  }, [budgetData?.custoEquipamento, budgetData?.custoMateriais, budgetData?.custoMaoDeObra, budgetData?.bdi]);

  const handleFormChange = (field: string, value: any) => {
    // Mapear campo para a atualização correta no store
    if (field === 'dimensioningName' || field === 'customer' ||
        field === 'grupoTarifario' || field === 'subgrupoTarifario' ||
        field === 'concessionaria' || field === 'tipoRede' ||
        field === 'tensaoRede' || field === 'tipoTelhado' ||
        field === 'fatorSimultaneidade' || field === 'tarifaEnergiaB' ||
        field === 'custoFioB' || field === 'tarifaEnergiaPontaA' ||
        field === 'tarifaEnergiaForaPontaA' || field === 'tePontaA' ||
        field === 'teForaPontaA') {
      updateCustomerData({ [field]: value });
    } else if (field === 'energyBills' || field === 'energyBillsA') {
      updateEnergyData({ [field]: value });
    } else if (field.includes('latitude') || field.includes('longitude') ||
               field.includes('endereco') || field.includes('cidade') || field.includes('estado')) {
      
      // Para campos de localização aninhados, criar estrutura correta
      updateLocationData({
        location: { [field]: value } as any
      });
      
    } else if (field.includes('irradiacao') || field.includes('fonteDados') ||
               field.includes('inclinacao') || field.includes('azimute')) {
      
      // Para outros campos de localização, passar diretamente
      updateLocationData({ [field]: value });
    } else if (field === 'aguasTelhado') {
      updateRoofData({ [field]: value });
    } else if (field.includes('custo') || field.includes('bdi') || field.includes('payment') ||
               field.includes('installments') || field.includes('interest') ||
               field === 'inflacaoEnergia' || field === 'taxaDesconto' ||
               field === 'custoOperacao' || field === 'valorResidual' ||
               field === 'percentualFinanciado' || field === 'taxaJuros' ||
               field === 'prazoFinanciamento') {
      updateBudgetData({ [field]: value });
    }
  };


  const handleNext = async () => {
    console.log('[SolarSizingWizard] handleNext chamado, passo atual:', navigationState.currentStep);
    
    // VALIDAÇÃO CENTRALIZADA: Usar apenas validateCurrentStep da store
    const isValid = validateCurrentStep();
    
    if (!isValid) {
      let description = "Por favor, preencha todos os campos obrigatórios antes de continuar.";

      if (navigationState.currentStep === 3) {
        description = "É obrigatório selecionar uma localização e buscar os dados PVGIS antes de prosseguir.";
      } else if (navigationState.currentStep === 4) {
        description = "É obrigatório selecionar um módulo solar e um inversor antes de prosseguir.";
      }

      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: description
      });
      return;
    }

    // Auto-save progress - bloquear avanço se falhar
    if (customerData?.customer && customerData?.dimensioningName?.trim()) {
      console.log('[SolarSizingWizard] Tentando salvar dimensioning...');
      try {
        await saveDimensioning();
        console.log('[SolarSizingWizard] Dimensioning salvo com sucesso');
      } catch (error: any) {
        console.error('[SolarSizingWizard] Erro ao salvar dimensioning:', error);
        let errorMessage = "Erro ao salvar o progresso.";

        if (error?.response?.status === 429) {
          errorMessage = "Muitas requisições. Aguarde um momento antes de continuar.";
        } else if (error?.response?.status === 401) {
          errorMessage = "Sessão expirada. Faça login novamente.";
        } else if (error?.response?.status === 500) {
          errorMessage = "Erro no servidor. Tente novamente.";
        }

        toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: `${errorMessage} Não é possível avançar sem salvar o progresso.`
        });

        // Bloquear navegação - não continuar
        return;
      }
    } else {
      console.log('[SolarSizingWizard] Pulando salvamento - dados do cliente incompletos');
    }

    console.log('[SolarSizingWizard] Verificando passo atual para decidir ação:', navigationState.currentStep);
    
    if (navigationState.currentStep === 6) {
      // Calculate results before going to step 7
      await handleCalculate();
    } else {
      console.log('[SolarSizingWizard] Chamando nextStep()');
      nextStep();
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleStepClick = (stepNumber: number) => {
    goToStep(stepNumber);
  };

  // Memoizar handleSystemFormChange para evitar recriação a cada render
  // CORREÇÃO DEFINITIVA: Suporte a batch update para prevenir múltiplos re-renders
  const handleSystemFormChange = useCallback((field: string, value: any) => {
    console.log('[SolarSizingWizard] handleSystemFormChange chamado', { field, value });
    if (field === 'moduleData') {
      // Batch update: atualizar múltiplos campos de uma vez (7 campos → 1 atualização)
      console.log('[SolarSizingWizard] handleSystemFormChange: batch update', value);
      
      // CORREÇÃO: Garantir que selectedModuleId seja definido corretamente
      const moduleData = {
        ...value,
        selectedModuleId: value.moduloSelecionado // Garantir que selectedModuleId seja atualizado
      };
      
      console.log('[SolarSizingWizard] handleSystemFormChange: moduleData corrigido', moduleData);
      updateSystemData(moduleData);
    } else {
      // Update individual de campo
      console.log('[SolarSizingWizard] handleSystemFormChange: individual update', { [field]: value });
      updateSystemData({ [field]: value });
    }
  }, [updateSystemData]);

  const handleCalculate = async () => {
    // Usar a ação do store para definir estado de cálculo
    const state = usePVDimensioningStore.getState();
    usePVDimensioningStore.setState({ isCalculating: true });

    try {
      // Verificar se há dados das águas de telhado já calculados usando o seletor
      if (!aggregatedRoofData.calculado) {
        throw new Error("É necessário calcular a geração nas orientações antes de prosseguir. Volte para a etapa de Orientações e clique em 'Atualizar Geração'.");
      }

      // Apenas marcar que foi calculado e ir para a tela de resultados
      updateResultsData({ calculationResults: { potenciaPico: aggregatedRoofData.potenciaPico } }); // Salvar potência calculada
      goToStep(7);

      if (onComplete) {
        onComplete({ calculated: true });
      }

      toast({
        title: "Resultados preparados!",
        description: "Todos os dados foram carregados das orientações configuradas."
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao preparar resultados",
        description: error.message || "Ocorreu um erro inesperado."
      });
    } finally {
      usePVDimensioningStore.setState({ isCalculating: false });
    }
  };

  const renderStepContent = () => {
    const step = steps[navigationState.currentStep - 1];

    switch (step.component) {
      case 'customer':
        return (
          <CustomerDataForm
            customerData={customerData}
            onFormChange={handleFormChange}
            isLeadLocked={!!customerData?.customer && (customerData.customer as any).type === 'lead'}
          />
        );

      case 'energy':
        return (
          <ConsumptionForm
            energyData={energyData}
            customerData={customerData}
            onFormChange={handleFormChange}
          />
        );

      case 'location':
        return (
          <LocationForm
            locationData={locationData}
            onFormChange={handleFormChange}
          />
        );

      case 'system':
        return (
          <div className="space-y-6">
            <SystemParametersForm
              systemData={systemData}
              onFormChange={handleSystemFormChange}
            />
          </div>
        );

      case 'roof':
        return (
          <div className="space-y-6">
            <WaterSelectionForm
              roofData={roofDataComplete}
              onRoofChange={(field, value) => handleFormChange(field, value)}
            />
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            {roofData?.aguasTelhado && roofData.aguasTelhado.length > 0 && (
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                    <Home className="w-5 h-5 text-green-500" />
                    Divisão por Orientações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {roofData.aguasTelhado.map((agua: any, index: number) => (
                      <div key={agua.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200">{agua.nome}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Compass className="w-4 h-4" />
                            <span>{agua.orientacao}° / {agua.inclinacao}°</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">{(agua.numeroModulos || 0) * (agua.numeroStrings || 1)}</div>
                            <div className="text-xs text-gray-500">Módulos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600">
                              {(((agua.numeroModulos || 0) * (agua.numeroStrings || 1) * (systemData?.potenciaModulo || 550)) / 1000).toFixed(2)} kWp
                            </div>
                            <div className="text-xs text-gray-500">Potência</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              {agua.geracaoAnual ? Math.round(agua.geracaoAnual).toLocaleString() : '—'} kWh/ano
                            </div>
                            <div className="text-xs text-gray-500">Geração</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-orange-600">
                              {agua.areaCalculada ? agua.areaCalculada.toFixed(1) : '—'} m²
                            </div>
                            <div className="text-xs text-gray-500">Área</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <FinancialForm
              budgetData={budgetData}
              onFormChange={handleFormChange}
              totalInvestment={totalInvestment}
            />
            <PaymentConditionsForm
              budgetData={budgetData}
              onFormChange={handleFormChange}
            />
          </div>
        );

      case 'results':
        return resultsData?.calculationResults ? (
          <PVResultsDashboard
            onBackToForm={() => goToStep(5)}
            onNewCalculation={() => {
              updateResultsData({ calculationResults: undefined });
              goToStep(1);
            }}
          />
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Preparando resultados...</p>
          </div>
        );

      default:
        return <div>Step não implementado</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl shadow-lg">
              <Sun className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Dimensionamento Fotovoltaico
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
            {currentDimensioning.dimensioningName || currentDimensioning.customer?.name || 'Complete o dimensionamento em 6 passos'}
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6">
            {steps.map((step, index) => {
              const isActive = step.id === navigationState.currentStep;
              const isCompleted = step.id < navigationState.currentStep;
              const isAccessible = step.id <= navigationState.currentStep || step.id === navigationState.currentStep + 1;

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isAccessible}
                  className={`
                    flex flex-col items-center p-3 sm:p-4 rounded-lg transition-all duration-300 min-w-[100px] sm:min-w-[120px]
                    ${isActive
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : isCompleted
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                        : isAccessible
                          ? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  <step.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-center leading-tight">
                    {step.title}
                  </span>
                  <span className="text-xs opacity-75 text-center mt-1 hidden sm:block">
                    {step.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(navigationState.currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={navigationState.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {navigationState.currentStep < 7 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t dark:border-slate-700">
            <Button
              onClick={navigationState.currentStep === 1 ? onBack : handlePrevious}
              variant="outline"
              disabled={isSaving}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {navigationState.currentStep === 1 ? 'Voltar' : 'Anterior'}
            </Button>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Passo {navigationState.currentStep} de {steps.length}
              </span>
            </div>

            <Button
              onClick={handleNext}
              disabled={!navigationState.canAdvance || isSaving || loadingState.isCalculating}
              className="w-full sm:w-auto order-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </div>
              ) : navigationState.currentStep === 6 ? (
                <>
                  Calcular Resultados
                  <Calculator className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Results Navigation */}
        {navigationState.currentStep === 7 && resultsData?.calculationResults && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 border-t dark:border-slate-700">
            <Button
              onClick={() => goToStep(6)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar para Orçamento
            </Button>

            <Button
              onClick={() => {
                updateResultsData({ calculationResults: undefined });
                goToStep(1);
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Novo Dimensionamento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolarSizingWizard;
