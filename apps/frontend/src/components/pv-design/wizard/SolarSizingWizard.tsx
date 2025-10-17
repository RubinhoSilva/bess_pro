import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, ChevronRight, Sun, User, Zap, MapPin, Settings, Calculator, CheckCircle, Home, Compass, Loader2 } from 'lucide-react';
import { useDimensioningOperations } from '@/hooks/dimensioning';
import { AdvancedSolarCalculator, SolarCalculationOptions } from '@/lib/solarCalculations';
import { AdvancedFinancialInput } from '@/types/financial';
import { apiClient } from '@/lib/api';
import { useCalculationLogger } from '@/hooks/useCalculationLogger';
import { BackendCalculationService, shouldUseBackendCalculations } from '@/lib/backendCalculations';
import { FrontendCalculationLogger } from '@/lib/calculationLogger';
import { PVDimensioningService } from '@/lib/pvDimensioning';
import { SystemCalculations } from '@/lib/systemCalculations';
import { useQuery } from '@tanstack/react-query';
import { moduleService } from '@/services/ModuleService';
import { useGrupoBFinancialCalculation } from '@/hooks/financial-calculation-hooks';
import { useGrupoAFinancialCalculation } from '@/hooks/financial-calculation-hooks';
import { convertToGrupoBInput, convertToGrupoAInput } from '@/lib/financial-utils';

// Import existing form components
import CustomerDataForm from '../form-sections/CustomerDataForm';
import ConsumptionForm from '../form-sections/ConsumptionForm';
import LocationForm from '../form-sections/LocationForm';
import SystemParametersForm from '../form-sections/SystemParametersForm';
import { WaterSelectionForm } from '../form-sections/WaterSelectionForm';
import FinancialForm from '../form-sections/FinancialForm';
import PaymentConditionsForm from '../form-sections/PaymentConditionsForm';
import { PVResultsDashboard } from '../results/PVResultsDashboard';

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
  const [currentStep, setCurrentStep] = useState(1);
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  const [dimensioningId, setDimensioningId] = useState<string | null>(null);
  const [currentDimensioning, setCurrentDimensioning] = useState<any>({
    dimensioningName: '',
    irradiacaoMensal: Array(12).fill(5.0),
    potenciaModulo: 550,
    eficienciaSistema: 85,
    numeroModulos: 0,
    custoEquipamento: 0,
    custoMateriais: 0,
    custoMaoDeObra: 0,
    bdi: 25,
    tarifaEnergiaB: null,
    custoFioB: null,
    selectedInverters: [],
    totalInverterPower: 0,
    totalMpptChannels: 0,
    aguasTelhado: [],
    energyBills: [{
      id: crypto.randomUUID(),
      name: 'Unidade Geradora',
      consumoMensal: Array(12).fill(500)
    }],
    grupoTarifario: 'B' as const,
  });

  const {
    saveAsync,
    isSaving
  } = useDimensioningOperations(dimensioningId || undefined);

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

  // Buscar módulo completo selecionado pelo ID
  const selectedModuleFull = useMemo(() => {
    const moduleId = currentDimensioning.moduloSelecionado || currentDimensioning.selectedModuleId;
    if (!moduleId || solarModules.length === 0) return undefined;
    return solarModules.find((m: any) => m.id === moduleId);
  }, [currentDimensioning.moduloSelecionado, currentDimensioning.selectedModuleId, solarModules]);

  // Calculate total investment
  const totalInvestment = useMemo(() => {
    const subtotal = (currentDimensioning.custoEquipamento || 0) +
      (currentDimensioning.custoMateriais || 0) +
      (currentDimensioning.custoMaoDeObra || 0);
    return subtotal * (1 + (currentDimensioning.bdi || 0) / 100);
  }, [currentDimensioning.custoEquipamento, currentDimensioning.custoMateriais, currentDimensioning.custoMaoDeObra, currentDimensioning.bdi]);

  const handleFormChange = (field: string, value: any) => {
    setCurrentDimensioning((prev: any) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!currentDimensioning.dimensioningName?.trim() && !!currentDimensioning.customer;
      case 2:
        return currentDimensioning.energyBills?.length > 0 &&
          currentDimensioning.energyBills.some((bill: any) => bill.consumoMensal.some((consumo: number) => consumo > 0));
      case 3:
        // Validação mais rigorosa: deve ter coordenadas E dados de irradiação PVGIS
        const hasCoordinates = !!currentDimensioning.latitude && !!currentDimensioning.longitude;
        const hasValidIrradiation = currentDimensioning.irradiacaoMensal?.length === 12 &&
          currentDimensioning.irradiacaoMensal.some((value: number) => value > 0);
        return hasCoordinates && hasValidIrradiation;
      case 4:
        const hasModule = currentDimensioning.moduloSelecionado || currentDimensioning.selectedModuleId;
        // Verificar tanto o formato novo (selectedInverters) quanto o legado (inversorSelecionado/inverters)
        const hasInverter = currentDimensioning.inversorSelecionado ||
          (currentDimensioning.selectedInverters && currentDimensioning.selectedInverters.length > 0);
        return !!(hasModule && hasInverter && currentDimensioning.potenciaModulo > 0 && currentDimensioning.eficienciaSistema > 0);
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
    if (!validateStep(currentStep)) {
      let description = "Por favor, preencha todos os campos obrigatórios antes de continuar.";

      if (currentStep === 3) {
        description = "É obrigatório selecionar uma localização e buscar os dados PVGIS antes de prosseguir.";
      } else if (currentStep === 4) {
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
    if (currentDimensioning.customer && currentDimensioning.dimensioningName?.trim()) {
      try {
        const result = await saveAsync(currentDimensioning);
        // Atualizar o ID se for um novo dimensionamento
        if (result?.data?.data?.id && !dimensioningId) {
          setDimensioningId(result.data.data.id);
        }
      } catch (error: any) {
        const debugSaveError = { error };

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

    if (currentStep === 6) {
      // Calculate results before going to step 7
      await handleCalculate();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = (stepNumber: number) => {
    // Allow going backwards to any completed step
    if (stepNumber < currentStep) {
      setCurrentStep(stepNumber);
      return;
    }

    // Allow staying on current step
    if (stepNumber === currentStep) {
      return;
    }

    // For moving forward, validate all intermediate steps
    if (stepNumber > currentStep) {
      // Check if all steps up to the target step can be validated
      for (let step = currentStep; step < stepNumber; step++) {
        if (!validateStep(step)) {
          toast({
            variant: "destructive",
            title: "Dados incompletos",
            description: `Por favor, complete o passo ${step} antes de continuar para o passo ${stepNumber}.`
          });
          return;
        }
      }

      // If validation passed, allow the jump
      setCurrentStep(stepNumber);
    }
  };

  const handleCalculate = async () => {
    setIsCalculating(true);

    try {
      // Validation

      if (!currentDimensioning.irradiacaoMensal || currentDimensioning.irradiacaoMensal.length !== 12) {
        throw new Error("Dados de irradiação mensal são obrigatórios.");
      }

      const somaIrradiacao = currentDimensioning.irradiacaoMensal.reduce((a: number, b: number) => a + b, 0);
      const irradiacaoMediaAnual = somaIrradiacao / 12;

      if (irradiacaoMediaAnual <= 0 || !currentDimensioning.potenciaModulo || currentDimensioning.potenciaModulo <= 0) {
        throw new Error("Potência do módulo e irradiação devem ser maiores que zero.");
      }

      const totalConsumoMensal = currentDimensioning.energyBills?.reduce((acc: number[], bill: any) => {
        bill.consumoMensal.forEach((consumo: number, index: number) => {
          const valorAnterior = acc[index] || 0;
          acc[index] = valorAnterior + consumo;

          const mes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][index];
        });
        return acc;
      }, Array(12).fill(0)) || Array(12).fill(0);

      // Calculate system sizing using our new detailed method
      const consumoTotalAnual = totalConsumoMensal.reduce((a: number, b: number) => a + b, 0);

      // Determinar potência desejada baseada no modo selecionado
      let potenciaDesejadaKwp: number;

      if (currentDimensioning.numeroModulos && currentDimensioning.numeroModulos > 0) {
        // Modo: número de módulos fixo
        potenciaDesejadaKwp = (currentDimensioning.numeroModulos * currentDimensioning.potenciaModulo) / 1000;
      } else {
        // Modo: dimensionamento automático baseado no consumo

        const consumoMedioDiario = consumoTotalAnual / 365;
        const eficienciaDecimal = (currentDimensioning.eficienciaSistema || 85) / 100;
        const irradiacaoEfetiva = irradiacaoMediaAnual * eficienciaDecimal;
        potenciaDesejadaKwp = consumoMedioDiario / irradiacaoEfetiva;

      }

      // Se os dados não estão calculados, chamar a rota novamente
      let potenciaPico, numeroModulos, areaEstimada, geracaoEstimadaAnual, geracaoEstimadaMensal;
      let apiResult = null;

      // Verificar se há dados das águas de telhado para usar nos cálculos
      const hasAguasTelhado = currentDimensioning.aguasTelhado &&
        currentDimensioning.aguasTelhado.length > 0 &&
        currentDimensioning.aguasTelhado.some((agua: any) => agua.geracaoAnual > 0);

      if (hasAguasTelhado) {
        // Usar dados das águas de telhado para cálculos financeiros
        const totalModulosAguas = currentDimensioning.aguasTelhado.reduce((total: number, agua: any) => total + agua.numeroModulos, 0);
        const totalGeracaoAguas = currentDimensioning.aguasTelhado.reduce((total: number, agua: any) => total + (agua.geracaoAnual || 0), 0);
        const totalAreaAguas = currentDimensioning.aguasTelhado.reduce((total: number, agua: any) => total + (agua.areaCalculada || 0), 0);

        const debugAguasData = {
          totalModulos: totalModulosAguas,
          totalGeracao: `${totalGeracaoAguas.toFixed(0)} kWh/ano`,
          totalArea: `${totalAreaAguas.toFixed(2)} m²`,
          numeroAguas: currentDimensioning.aguasTelhado.length
        };

        // Sobrescrever variáveis com dados das águas de telhado
        numeroModulos = totalModulosAguas;
        geracaoEstimadaAnual = totalGeracaoAguas;
        areaEstimada = totalAreaAguas;
        potenciaPico = (numeroModulos * (currentDimensioning.potenciaModulo || 550)) / 1000;
        geracaoEstimadaMensal = Array(12).fill(geracaoEstimadaAnual / 12);
      }

      // Calcular perdas totais do sistema
      const perdasSistema = (currentDimensioning.perdaSombreamento || 3) +
        (currentDimensioning.perdaMismatch || 2) +
        (currentDimensioning.perdaCabeamento || 2) +
        (currentDimensioning.perdaSujeira || 5) +
        (currentDimensioning.perdaInversor || 3) +
        (currentDimensioning.perdaOutras || 0);

      // Se não há águas de telhado, chamar API para calcular dados
      if (!hasAguasTelhado) {
        // Chamar a mesma rota que funciona no resumo: /api/v1/solar-analysis/calculate-advanced-modules

        try {
          //TODO REFACTOR: mover essa chamada para um serviço dedicado
          const response = await fetch('http://localhost:8010/api/v1/solar-analysis/calculate-advanced-modules', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token')}`
            },
            body: JSON.stringify({
              lat: currentDimensioning.latitude || -23.7621,
              lon: currentDimensioning.longitude || -53.3116,
              tilt: currentDimensioning.inclinacao || 23,
              azimuth: currentDimensioning.orientacao || 180,
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
                  // Coeficientes de temperatura Sandia
                  alpha_sc: selectedModuleFull.parameters?.advanced?.alphaSc || selectedModuleFull.parameters?.temperature?.tempCoeffPmax,
                  beta_oc: selectedModuleFull.parameters?.advanced?.betaOc || selectedModuleFull.parameters?.temperature?.tempCoeffVoc,
                  gamma_r: selectedModuleFull.parameters?.advanced?.gammaR || selectedModuleFull.parameters?.temperature?.tempCoeffIsc,
                  // Parâmetros do modelo de diodo único
                  cells_in_series: selectedModuleFull.specifications?.numberOfCells,
                  a_ref: selectedModuleFull.parameters?.diode?.aRef,
                  il_ref: selectedModuleFull.parameters?.diode?.iLRef,
                  io_ref: selectedModuleFull.parameters?.diode?.iORef,
                  rs: selectedModuleFull.parameters?.diode?.rS,
                  rsh_ref: selectedModuleFull.parameters?.diode?.rShRef,
                  // Parâmetros opcionais
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
                  b5: 0, // Not in the current structure
                  dtc: 0 // Not in the current structure
                };
              })() : null,
              inversor: currentDimensioning.selectedInverters?.[0] ? (() => {
                const inv = currentDimensioning.selectedInverters[0].inverter;
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
            // Usar os dados reais da API
            potenciaPico = apiResult.data.potencia_total_kw;
            numeroModulos = apiResult.data.num_modulos;
            areaEstimada = apiResult.data.area_necessaria_m2;
            geracaoEstimadaAnual = apiResult.data.energia_total_anual_kwh;
            geracaoEstimadaMensal = Array(12).fill(geracaoEstimadaAnual / 12); // TODO REFACTOR: usar valores mensais reais da API

          } else {
            throw new Error('API retornou erro');
          }
        } catch (error) {
          console.error('Erro ao chamar API de dimensionamento solar:', error);
        }
      } 

      // Financial calculations
      const tarifaB = currentDimensioning.tarifaEnergiaB || 0.8;
      const custoFioB = currentDimensioning.custoFioB || (tarifaB * 0.3);

      // Cálculos financeiros especializados por grupo tarifário
      let financialResults: any;

      try {
        if (currentDimensioning.grupoTarifario === 'B') {
          const calculatedData = {
            investimentoInicial: totalInvestment,
            geracaoMensal: geracaoEstimadaMensal || Array(12).fill(0),
            consumoMensal: totalConsumoMensal || Array(12).fill(0)
          };
          const input = convertToGrupoBInput(currentDimensioning, calculatedData);

          financialResults = await grupoBCalculation.mutateAsync(input);
        } else if (currentDimensioning.grupoTarifario === 'A') {
          const calculatedData = {
            investimentoInicial: totalInvestment,
            geracaoMensal: geracaoEstimadaMensal || Array(12).fill(0),
            consumoMensal: totalConsumoMensal || Array(12).fill(0)
          };

          const input = convertToGrupoAInput(currentDimensioning, calculatedData);
          financialResults = await grupoACalculation.mutateAsync(input);
        } else {
          throw new Error('Grupo tarifário não definido');
        }

        // Armazenar resultado no calculationResults
        setCalculationResults((prev: any) => ({
          ...prev,
          financialResultsGrupo: financialResults, // Novo campo
          grupoTarifario: currentDimensioning.grupoTarifario
        }));

      } catch (error) {
        console.error('[Financial] Erro no cálculo financeiro:', error);
        toast({
          title: "Erro no cálculo financeiro",
          description: "Não foi possível calcular os indicadores financeiros. Verifique os dados e tente novamente.",
          variant: "destructive"
        });
      }

      // Advanced financial analysis
      // Calcular custo fio B conforme Lei 14.300/2022
      const anoAtual = new Date().getFullYear();
      let percentualFioB = 0;
      if (anoAtual >= 2025 && anoAtual <= 2028) {
        percentualFioB = 0.15; // Período de transição gradual
      } else if (anoAtual >= 2029) {
        percentualFioB = 0.90; // Tarifa completa menos impostos
      }     

      // Financial calculations completed - re-enable button
      setIsCalculating(false);

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
          irradiacaoMensal: currentDimensioning.irradiacaoMensal || Array(12).fill(4.5),
          irradiacaoInclinada: currentDimensioning.irradiacaoMensal || Array(12).fill(4.5),
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
            prMedio: apiResult?.data?.pr_medio || 85, // Performance Ratio da API
            yieldEspecifico: apiResult?.data?.yield_especifico || (geracaoEstimadaAnual / potenciaPico), // kWh/kWp da API
            fatorCapacidade: apiResult?.data?.fator_capacidade || ((geracaoEstimadaAnual / (potenciaPico * 8760)) * 100) // % da API
          },
          geracaoEstimada: {
            mensal: geracaoEstimadaMensal || Array(12).fill(geracaoEstimadaAnual / 12),
            anual: geracaoEstimadaAnual,
            diarioMedio: apiResult?.data?.energia_diaria_media || (geracaoEstimadaAnual / 365)
          }
        },
        advancedFinancial: null,
        fluxoCaixa: [],
        selectedInverters: [],
        selectedModule: null
      };


      // Adicionar outros dados financeiros
      results.selectedInverters = currentDimensioning.selectedInverters || [];
      results.selectedModule = currentDimensioning.moduloSelecionado;
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

      setCalculationResults(results);
      setCurrentStep(7);

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
      setIsCalculating(false);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep - 1];

    switch (step.component) {
      case 'customer':
        return (
          <CustomerDataForm
            formData={currentDimensioning}
            onFormChange={handleFormChange}
            isLeadLocked={!!currentDimensioning.customer && !!currentDimensioning.customer.type && currentDimensioning.customer.type === 'lead'}
          />
        );

      case 'energy':
        return (
          <ConsumptionForm
            formData={currentDimensioning}
            onFormChange={handleFormChange}
          />
        );

      case 'location':
        return (
          <LocationForm
            formData={currentDimensioning}
            onFormChange={handleFormChange}
          />
        );

      case 'system':
        return (
          <div className="space-y-6">
            <SystemParametersForm
              formData={currentDimensioning}
              onFormChange={handleFormChange}
            />
          </div>
        );

      case 'roof':
        // Verificar se há dados calculados no sistema
        const hasSystemCalculated = (currentDimensioning.numeroModulosCalculado && currentDimensioning.numeroModulosCalculado > 0) ||
          (currentDimensioning.numeroModulos && currentDimensioning.numeroModulos > 0) ||
          ((currentDimensioning as any).potenciaPico && (currentDimensioning as any).potenciaPico > 0);

        return (
          <div className="space-y-6">
            {/* Configuração das Orientações com MPPT */}
            <WaterSelectionForm
              aguasTelhado={currentDimensioning.aguasTelhado || []}
              selectedInverters={currentDimensioning.selectedInverters || []}
              onAguasChange={(aguas) => handleFormChange('aguasTelhado', aguas)}
              latitude={currentDimensioning.latitude}
              longitude={currentDimensioning.longitude}
              potenciaModulo={currentDimensioning.potenciaModulo || 550}
              consumoAnualTotal={currentDimensioning.energyBills?.reduce((acc: number, bill: any) => {
                return acc + bill.consumoMensal.reduce((sum: number, consumo: number) => sum + consumo, 0);
              }, 0) || 0}
              fonteDados={currentDimensioning.fonteDados}
              perdaSombreamento={currentDimensioning.perdaSombreamento}
              perdaMismatch={currentDimensioning.perdaMismatch}
              perdaCabeamento={currentDimensioning.perdaCabeamento}
              perdaSujeira={currentDimensioning.perdaSujeira}
              perdaInversor={currentDimensioning.perdaInversor}
              perdaOutras={currentDimensioning.perdaOutras}
              selectedModule={selectedModuleFull}
            />
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            {/* Divisão por Orientações */}
            {currentDimensioning.aguasTelhado && currentDimensioning.aguasTelhado.length > 0 && (
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                    <Home className="w-5 h-5 text-green-500" />
                    Divisão por Orientações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentDimensioning.aguasTelhado.map((agua: any, index: number) => (
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
                              {((agua.numeroModulos * (currentDimensioning.potenciaModulo || 550)) / 1000).toFixed(2)} kWp
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
        return calculationResults ? (
          <PVResultsDashboard
            results={calculationResults}
            onBackToForm={() => setCurrentStep(5)}
            onNewCalculation={() => {
              setCalculationResults(null);
              setCurrentStep(1);
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
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const isAccessible = step.id <= currentStep || step.id === currentStep + 1;

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
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
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
        {currentStep < 7 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t dark:border-slate-700">
            <Button
              onClick={currentStep === 1 ? onBack : handlePrevious}
              variant="outline"
              disabled={isSaving}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Voltar' : 'Anterior'}
            </Button>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Passo {currentStep} de {steps.length}
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
              disabled={!validateStep(currentStep) || isSaving || isCalculating || grupoBCalculation.isPending || grupoACalculation.isPending}
              className="w-full sm:w-auto order-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              {isCalculating || grupoBCalculation.isPending || grupoACalculation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {grupoBCalculation.isPending || grupoACalculation.isPending ? 'Calculando análise financeira...' : 'Calculando...'}
                </div>
              ) : isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </div>
              ) : currentStep === 6 ? (
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
        {currentStep === 7 && calculationResults && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 border-t dark:border-slate-700">
            <Button
              onClick={() => setCurrentStep(6)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar para Orçamento
            </Button>

            <Button
              onClick={() => {
                setCalculationResults(null);
                setCurrentStep(1);
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
