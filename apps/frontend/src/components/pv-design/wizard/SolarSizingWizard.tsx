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
import { useGrupoBFinancialCalculation } from '@/hooks/financial-calculation-hooks';
import { useGrupoAFinancialCalculation } from '@/hooks/financial-calculation-hooks';

// Utilitários
import { convertToGrupoBInput } from '@/lib/financial-utils';

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
  selectMetadataState
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

  // Hooks para cálculos financeiros especializados
  const grupoBCalculation = useGrupoBFinancialCalculation();
  const grupoACalculation = useGrupoAFinancialCalculation();

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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!customerData?.dimensioningName?.trim() && !!customerData?.customer;
      case 2:
        return (energyData?.energyBills?.length || 0) > 0 &&
          energyData?.energyBills?.some((bill: any) => bill.consumoMensal.some((consumo: number) => consumo > 0)) || false;
      case 3:
        // Validação mais rigorosa: deve ter coordenadas E dados de irradiação PVGIS
        const hasCoordinates = !!locationData?.location?.latitude && !!locationData?.location?.longitude;
        const hasValidIrradiation = locationData?.irradiacaoMensal?.length === 12 &&
          locationData.irradiacaoMensal.some((value: number) => value > 0);
        
        return hasCoordinates && hasValidIrradiation;
      case 4:
        // Log detalhado para debug da validação do passo 4
        const hasModule = !!systemData?.selectedModuleId;
        const hasInverter = !!(systemData?.selectedInverters && systemData.selectedInverters.length > 0);
        const hasValidPotencia = (systemData?.potenciaModulo || 0) > 0;
        const hasValidEficiencia = (systemData?.eficienciaSistema || 0) > 0;
        
        console.log('[SolarSizingWizard] validateStep passo 4:', {
          hasModule,
          hasInverter,
          hasValidPotencia,
          hasValidEficiencia,
          selectedModuleId: systemData?.selectedModuleId,
          selectedInverters: systemData?.selectedInverters,
          potenciaModulo: systemData?.potenciaModulo,
          eficienciaSistema: systemData?.eficienciaSistema,
          moduloSelecionado: systemData?.moduloSelecionado
        });
        
        return !!(hasModule && hasInverter && hasValidPotencia && hasValidEficiencia);
      case 5:
        // Águas de telhado é opcional, sempre válido
        return true;
      case 6:
        return totalInvestment > 0;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(navigationState.currentStep)) {
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
      try {
        await saveDimensioning();
      } catch (error: any) {
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
    }

    if (navigationState.currentStep === 6) {
      // Calculate results before going to step 7
      await handleCalculate();
    } else {
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
      // Validation
      if (!locationData?.irradiacaoMensal || locationData.irradiacaoMensal.length !== 12) {
        throw new Error("Dados de irradiação mensal são obrigatórios.");
      }

      const somaIrradiacao = locationData.irradiacaoMensal.reduce((a: number, b: number) => a + b, 0);
      const irradiacaoMediaAnual = somaIrradiacao / 12;

      if (irradiacaoMediaAnual <= 0 || !systemData?.potenciaModulo || systemData.potenciaModulo <= 0) {
        throw new Error("Potência do módulo e irradiação devem ser maiores que zero.");
      }

      const totalConsumoMensal = energyData?.energyBills?.reduce((acc: number[], bill: any) => {
        bill.consumoMensal.forEach((consumo: number, index: number) => {
          const valorAnterior = acc[index] || 0;
          acc[index] = valorAnterior + consumo;
        });
        return acc;
      }, Array(12).fill(0)) || Array(12).fill(0);

      // Calculate system sizing using our new detailed method
      const consumoTotalAnual = totalConsumoMensal.reduce((a: number, b: number) => a + b, 0);

      // Determinar potência desejada baseada no modo selecionado
      let potenciaDesejadaKwp: number;

      if (systemData?.numeroModulos && systemData.numeroModulos > 0) {
        // Modo: número de módulos fixo
        potenciaDesejadaKwp = (systemData.numeroModulos * systemData.potenciaModulo) / 1000;
      } else {
        // Modo: dimensionamento automático baseado no consumo
        const consumoMedioDiario = consumoTotalAnual / 365;
        const eficienciaDecimal = (systemData?.eficienciaSistema || 85) / 100;
        const irradiacaoEfetiva = irradiacaoMediaAnual * eficienciaDecimal;
        potenciaDesejadaKwp = consumoMedioDiario / irradiacaoEfetiva;
      }

      // Se os dados não estão calculados, chamar a rota novamente
      let potenciaPico, numeroModulos, areaEstimada, geracaoEstimadaAnual, geracaoEstimadaMensal;
      let apiResult = null;

      // Verificar se há dados das águas de telhado para usar nos cálculos
      const hasAguasTelhado = roofData?.aguasTelhado &&
        roofData.aguasTelhado.length > 0 &&
        roofData.aguasTelhado.some((agua: any) => agua.geracaoAnual > 0);

      if (hasAguasTelhado) {
        // Usar dados das águas de telhado para cálculos financeiros
        const totalModulosAguas = roofData.aguasTelhado.reduce((total: number, agua: any) => total + agua.numeroModulos, 0);
        const totalGeracaoAguas = roofData.aguasTelhado.reduce((total: number, agua: any) => total + (agua.geracaoAnual || 0), 0);
        const totalAreaAguas = roofData.aguasTelhado.reduce((total: number, agua: any) => total + (agua.areaCalculada || 0), 0);

        // Sobrescrever variáveis com dados das águas de telhado
        numeroModulos = totalModulosAguas;
        geracaoEstimadaAnual = totalGeracaoAguas;
        areaEstimada = totalAreaAguas;
        potenciaPico = (numeroModulos * (systemData?.potenciaModulo || 550)) / 1000;
        geracaoEstimadaMensal = Array(12).fill(geracaoEstimadaAnual / 12);
      }

      // Calcular perdas totais do sistema
      const perdasSistema = (systemData?.perdaSombreamento || 3) +
        (systemData?.perdaMismatch || 2) +
        (systemData?.perdaCabeamento || 2) +
        (systemData?.perdaSujeira || 5) +
        (systemData?.perdaInversor || 3) +
        (systemData?.perdaOutras || 0);

      // Se não há águas de telhado, chamar API para calcular dados
      if (!hasAguasTelhado) {
        try {
          const response = await fetch('http://localhost:8010/api/v1/solar-analysis/calculate-advanced-modules', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token')}`
            },
            body: JSON.stringify({
              lat: locationData?.location?.latitude || -23.7621,
              lon: locationData?.location?.longitude || -53.3116,
              tilt: locationData?.inclinacao || 23,
              azimuth: locationData?.azimute || 180,
              modelo_decomposicao: "louche",
              modelo_transposicao: "perez",
              consumo_anual_kwh: consumoTotalAnual || 6000,
              modulo: selectedModuleFull ? (() => {
                return {
                  fabricante: selectedModuleFull.manufacturer,
                  modelo: selectedModuleFull.model,
                  potencia_nominal_w: selectedModuleFull.nominalPower,
                  largura_mm: selectedModuleFull.dimensions?.widthMm,
                  altura_mm: selectedModuleFull.dimensions?.heightMm,
                  peso_kg: selectedModuleFull.dimensions?.weightKg,
                  vmpp: selectedModuleFull.specifications?.vmpp,
                  impp: selectedModuleFull.specifications?.impp,
                  voc_stc: selectedModuleFull.specifications?.voc,
                  isc_stc: selectedModuleFull.specifications?.isc,
                  eficiencia: selectedModuleFull.specifications?.efficiency,
                  alpha_sc: selectedModuleFull.parameters?.advanced?.alphaSc || selectedModuleFull.parameters?.temperature?.tempCoeffPmax,
                  beta_oc: selectedModuleFull.parameters?.advanced?.betaOc || selectedModuleFull.parameters?.temperature?.tempCoeffVoc,
                  gamma_r: selectedModuleFull.parameters?.advanced?.gammaR || selectedModuleFull.parameters?.temperature?.tempCoeffIsc,
                  cells_in_series: selectedModuleFull.specifications?.numberOfCells,
                  a_ref: selectedModuleFull.parameters?.diode?.aRef,
                  il_ref: selectedModuleFull.parameters?.diode?.iLRef,
                  io_ref: selectedModuleFull.parameters?.diode?.iORef,
                  rs: selectedModuleFull.parameters?.diode?.rS,
                  rsh_ref: selectedModuleFull.parameters?.diode?.rShRef,
                  material: selectedModuleFull.parameters?.spectral?.material,
                  technology: selectedModuleFull.specifications?.technology,
                  a0: selectedModuleFull.parameters?.sapm?.a0,
                  a1: selectedModuleFull.parameters?.sapm?.a1,
                  a2: selectedModuleFull.parameters?.sapm?.a2,
                  a3: selectedModuleFull.parameters?.sapm?.a3,
                  a4: selectedModuleFull.parameters?.sapm?.a4,
                  b0: selectedModuleFull.parameters?.sapm?.b0,
                  b1: selectedModuleFull.parameters?.sapm?.b1,
                  b2: selectedModuleFull.parameters?.sapm?.b2,
                  b3: selectedModuleFull.parameters?.sapm?.b3,
                  b4: selectedModuleFull.parameters?.sapm?.b4,
                  b5: 0,
                  dtc: 0
                };
              })() : null,
              inversor: systemData?.selectedInverters?.[0] ? (() => {
                const inv = systemData.selectedInverters[0].inverter;
                return {
                  fabricante: inv.manufacturer.name,
                  modelo: inv.model,
                  potencia_saida_ca_w: inv.power.ratedACPower,
                  tipo_rede: inv.electrical.gridType
                };
              })() : null,
              perdas_sistema: perdasSistema,
              fator_seguranca: 1.1
            })
          });

          apiResult = await response.json();

          if (apiResult.success && apiResult.data) {
            potenciaPico = apiResult.data.potencia_total_kw;
            numeroModulos = apiResult.data.num_modulos;
            areaEstimada = apiResult.data.area_necessaria_m2;
            geracaoEstimadaAnual = apiResult.data.energia_total_anual_kwh;
            geracaoEstimadaMensal = Array(12).fill(geracaoEstimadaAnual / 12);
          } else {
            throw new Error('API retornou erro');
          }
        } catch (error) {
          console.error('Erro ao chamar API de dimensionamento solar:', error);
        }
      }

      // Cálculos financeiros especializados por grupo tarifário
      let financialResults: any;

      try {
        const calculatedData = {
          investimentoInicial: totalInvestment,
          geracaoMensal: geracaoEstimadaMensal || Array(12).fill(0),
          consumoMensal: totalConsumoMensal || Array(12).fill(0)
        };
        
        financialResults = await grupoBCalculation.mutateAsync(convertToGrupoBInput(currentDimensioning, calculatedData));

        // Armazenar resultado no calculationResults
        updateResultsData({
          calculationResults: {
            ...resultsData?.calculationResults,
            financialResults: financialResults
          }
        });

      } catch (error) {
        console.error('[Financial] Erro no cálculo financeiro:', error);
        toast({
          title: "Erro no cálculo financeiro",
          description: "Não foi possível calcular os indicadores financeiros. Verifique os dados e tente novamente.",
          variant: "destructive"
        });
      }

      // Financial calculations completed - re-enable button
      usePVDimensioningStore.setState({ isCalculating: false });

      let results: any = {
        formData: currentDimensioning,
        potenciaPico,
        numeroModulos,
        areaEstimada,
        geracaoEstimadaAnual,
        geracaoEstimadaMensal,
        consumoTotalAnual,
        totalInvestment,
        advancedSolar: {
          irradiacaoMensal: locationData?.irradiacaoMensal || Array(12).fill(4.5),
          irradiacaoInclinada: locationData?.irradiacaoMensal || Array(12).fill(4.5),
          fatorTemperatura: Array(12).fill(1.0),
          perdas: apiResult?.data?.perdas_detalhadas || {
            temperatura: Array(12).fill(8),
            sombreamento: Array(12).fill(3),
            mismatch: Array(12).fill(2),
            cabeamento: Array(12).fill(2),
            sujeira: Array(12).fill(5),
            inversor: Array(12).fill(3),
            outras: Array(12).fill(0),
            total: Array(12).fill(22)
          },
          performance: {
            prMedio: apiResult?.data?.pr_medio || 85,
            yieldEspecifico: apiResult?.data?.yield_especifico || (geracaoEstimadaAnual / potenciaPico),
            fatorCapacidade: apiResult?.data?.fator_capacidade || ((geracaoEstimadaAnual / (potenciaPico * 8760)) * 100)
          },
          geracaoEstimada: {
            mensal: geracaoEstimadaMensal || Array(12).fill(geracaoEstimadaAnual / 12),
            anual: geracaoEstimadaAnual,
            diarioMedio: apiResult?.data?.energia_diaria_media || (geracaoEstimadaAnual / 365)
          }
        },
        advancedFinancial: null,
        fluxoCaixa: [],
        selectedInverters: systemData?.selectedInverters || [],
        selectedModule: systemData?.selectedModuleId
      };

      // Adicionar outros dados financeiros
      Object.assign(results, financialResults);

      // Mapear economia_anual_media para economiaAnualEstimada para compatibilidade
      if (financialResults?.economiaAnualMedia) {
        results.economiaAnualEstimada = financialResults.economiaAnualMedia;
      }

      // Cálculos adicionais do resumo do wizard
      const economiaAnualWizard = ((financialResults as any)?.economiaAnual || 0);
      const economiaMensalWizard = economiaAnualWizard / 12;
      const custoKwpWizard = totalInvestment / (potenciaPico || 1);
      const geracaoMensalWizard = (geracaoEstimadaAnual || 0) / 12;

      updateResultsData({ calculationResults: results });
      goToStep(7);

      if (onComplete) {
        onComplete(results);
      }

      toast({
        title: "Cálculo concluído!",
        description: "Resultados disponíveis na tela de resultados. Verifique o console do navegador (F12) para logs detalhados."
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no cálculo",
        description: error.message || "Ocorreu um erro inesperado. Verifique os dados e tente novamente."
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
                            <div className="text-lg font-semibold text-blue-600">{agua.numeroModulos}</div>
                            <div className="text-xs text-gray-500">Módulos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600">
                              {((agua.numeroModulos * (systemData?.potenciaModulo || 550)) / 1000).toFixed(2)} kWp
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
              formData={currentDimensioning}
              onFormChange={handleFormChange}
              totalInvestment={totalInvestment}
            />
            <PaymentConditionsForm
              formData={currentDimensioning}
              onFormChange={handleFormChange}
            />
          </div>
        );

      case 'results':
        return resultsData?.calculationResults ? (
          <PVResultsDashboard
            results={resultsData.calculationResults as any}
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

            {/* Loading indicator durante cálculo financeiro */}
            {(grupoBCalculation.isPending || grupoACalculation.isPending) && (
              <div className="flex items-center gap-2 text-sm text-blue-600 order-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Calculando análise financeira...</span>
              </div>
            )}

            <Button
              onClick={handleNext}
              disabled={!validateStep(navigationState.currentStep) || isSaving || loadingState.isCalculating || grupoBCalculation.isPending || grupoACalculation.isPending}
              className="w-full sm:w-auto order-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              {loadingState.isCalculating || grupoBCalculation.isPending || grupoACalculation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {grupoBCalculation.isPending || grupoACalculation.isPending ? 'Calculando análise financeira...' : 'Calculando...'}
                </div>
              ) : isSaving ? (
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
