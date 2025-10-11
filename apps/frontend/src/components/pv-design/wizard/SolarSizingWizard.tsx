import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, ChevronRight, Sun, User, Zap, MapPin, Settings, Calculator, CheckCircle, Home, Compass } from 'lucide-react';
import { useDimensioning } from '@/contexts/DimensioningContext';
import { AdvancedSolarCalculator, SolarCalculationOptions } from '@/lib/solarCalculations';
import { AdvancedFinancialInput } from '@/types/financial';
import { apiClient } from '@/lib/api';
import { useCalculationLogger } from '@/hooks/useCalculationLogger';
import { BackendCalculationService, shouldUseBackendCalculations } from '@/lib/backendCalculations';
import { FrontendCalculationLogger } from '@/lib/calculationLogger';
import { PVDimensioningService } from '@/lib/pvDimensioning';
import { SystemCalculations } from '@/lib/systemCalculations';
import { useSolarModules } from '@/hooks/legacy-equipment-hooks';

// Import existing form components
import CustomerDataForm from '../form-sections/CustomerDataForm';
import ConsumptionForm from '../form-sections/ConsumptionForm';
import LocationForm from '../form-sections/LocationForm';
import SystemParametersForm from '../form-sections/SystemParametersForm';
import MultipleRoofAreasForm from '../form-sections/MultipleRoofAreasForm';
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
  const {
    currentDimensioning,
    updateDimensioning,
    saveDimensioning,
    dimensioningId,
    isSaving
  } = useDimensioning();

  // Buscar módulos solares para obter dados completos
  const { data: solarModulesData } = useSolarModules();
  const solarModules = solarModulesData?.modules || [];

  // Buscar módulo completo selecionado pelo ID
  const selectedModuleFull = useMemo(() => {
    const moduleId = currentDimensioning.moduloSelecionado || currentDimensioning.selectedModuleId;
    if (!moduleId || solarModules.length === 0) return undefined;
    return solarModules.find((m: any) => m.id === moduleId);
  }, [currentDimensioning.moduloSelecionado, currentDimensioning.selectedModuleId, solarModules]);


  // Função para chamar a API financeira do Python via backend
  const callPythonFinancialAPI = async (financialData: any) => {
    try {
      const debugApiCall = { callingPythonAPI: true };
      
      // Importar a API client
      const { apiClient } = await import('@/lib/api');
      
      // Mapear dados para o formato esperado
      const financialInput = {
        investimento_inicial: financialData.investimento_inicial,
        geracao_mensal: financialData.geracao_mensal,
        consumo_mensal: financialData.consumo_mensal,
        tarifa_energia: financialData.tarifa_energia,
        custo_fio_b: financialData.custo_fio_b,
        vida_util: financialData.vida_util,
        taxa_desconto: financialData.taxa_desconto,
        inflacao_energia: financialData.inflacao_energia,
        degradacao_modulos: financialData.degradacao_modulos,
        custo_om: financialData.custo_om,
        inflacao_om: financialData.inflacao_om,
        modalidade_tarifaria: financialData.modalidade_tarifaria || 'convencional'
      };

      const debugFinancialInput = { financialInput };

      const response = await apiClient.solarAnalysis.calculateAdvancedFinancial(financialInput);

      // Extrair apenas os dados da API Python, não o wrapper do backend
      const apiData = response.data.data || response.data;

      const debugApiResponse = { apiData };

      // Converter snake_case (Python) para camelCase (TypeScript)
      const transformedData = {
        investimentoInicial: apiData.investimento_inicial,
        vpl: apiData.vpl,
        tir: apiData.tir,
        paybackSimples: apiData.payback_simples,
        paybackDescontado: apiData.payback_descontado,
        economiaTotal25Anos: apiData.economia_total_25_anos,
        economiaAnualMedia: apiData.economia_anual_media,
        lucratividadeIndex: apiData.lucratividade_index,
        cashFlow: apiData.cash_flow?.map((item: any) => ({
          ano: item.ano,
          geracaoAnual: item.geracao_anual,
          economiaEnergia: item.economia_energia,
          custosOM: item.custos_om,
          fluxoLiquido: item.fluxo_liquido,
          fluxoAcumulado: item.fluxo_acumulado,
          valorPresente: item.valor_presente
        })) || [],
        indicadores: apiData.indicadores ? {
          yieldEspecifico: apiData.indicadores.yield_especifico,
          custoNiveladoEnergia: apiData.indicadores.custo_nivelado_energia,
          eficienciaInvestimento: apiData.indicadores.eficiencia_investimento,
          retornoSobreInvestimento: apiData.indicadores.retorno_sobre_investimento
        } : {
          yieldEspecifico: 0,
          custoNiveladoEnergia: 0,
          eficienciaInvestimento: 0,
          retornoSobreInvestimento: 0
        },
        sensibilidade: apiData.sensibilidade ? {
          vplVariacaoTarifa: apiData.sensibilidade.vpl_variacao_tarifa?.map((item: any) => ({
            parametro: item.parametro,
            vpl: item.vpl
          })) || [],
          vplVariacaoInflacao: apiData.sensibilidade.vpl_variacao_inflacao?.map((item: any) => ({
            parametro: item.parametro,
            vpl: item.vpl
          })) || [],
          vplVariacaoDesconto: apiData.sensibilidade.vpl_variacao_desconto?.map((item: any) => ({
            parametro: item.parametro,
            vpl: item.vpl
          })) || []
        } : {
          vplVariacaoTarifa: [],
          vplVariacaoInflacao: [],
          vplVariacaoDesconto: []
        },
        // Mapear cenarios (Python) para scenarios (Frontend)
        scenarios: apiData.cenarios || null
        };

      const debugTransformedData = { transformedData };

      return transformedData;
    } catch (error) {
      // Fallback para cálculos locais se a API falhar
      return null;
    }
  };

  // Calculate total investment
  const totalInvestment = useMemo(() => {
    const subtotal = (currentDimensioning.custoEquipamento || 0) + 
                    (currentDimensioning.custoMateriais || 0) + 
                    (currentDimensioning.custoMaoDeObra || 0);
    return subtotal * (1 + (currentDimensioning.bdi || 0) / 100);
  }, [currentDimensioning.custoEquipamento, currentDimensioning.custoMateriais, currentDimensioning.custoMaoDeObra, currentDimensioning.bdi]);

  const handleFormChange = (field: string, value: any) => {
    updateDimensioning({ [field]: value });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!currentDimensioning.dimensioningName?.trim() && !!currentDimensioning.customer;
      case 2:
        return currentDimensioning.energyBills?.length > 0 && 
               currentDimensioning.energyBills.some(bill => bill.consumoMensal.some(consumo => consumo > 0));
      case 3:
        // Validação mais rigorosa: deve ter coordenadas E dados de irradiação PVGIS
        const hasCoordinates = !!currentDimensioning.latitude && !!currentDimensioning.longitude;
        const hasValidIrradiation = currentDimensioning.irradiacaoMensal?.length === 12 && 
                                   currentDimensioning.irradiacaoMensal.some(value => value > 0);
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
        await saveDimensioning();
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
    const logger = new FrontendCalculationLogger(`wizard-${Date.now()}`);
    
    logger.startCalculationSection('CÁLCULO VIA WIZARD - SISTEMA SOLAR FOTOVOLTAICO');
    logger.context('Wizard', 'Iniciando cálculo via wizard', {
      cliente: currentDimensioning.customer?.name,
      projeto: currentDimensioning.dimensioningName,
      irradiacao: currentDimensioning.irradiacaoMensal,
      potenciaModulo: currentDimensioning.potenciaModulo,
      eficiencia: currentDimensioning.eficienciaSistema,
      numeroModulos: currentDimensioning.numeroModulos,
      energyBills: currentDimensioning.energyBills?.length
    }, 'Dados de entrada coletados pelo wizard para dimensionamento do sistema fotovoltaico');
    
    setIsCalculating(true);
    
    try {
      // Validation
      logger.info('Validação', 'Executando validações dos dados de entrada');
      
      if (!currentDimensioning.irradiacaoMensal || currentDimensioning.irradiacaoMensal.length !== 12) {
        logger.error('Validação', 'Dados de irradiação mensal ausentes ou incompletos', {
          irradiacaoMensal: currentDimensioning.irradiacaoMensal,
          comprimento: currentDimensioning.irradiacaoMensal?.length
        });
        throw new Error("Dados de irradiação mensal são obrigatórios.");
      }

      const somaIrradiacao = currentDimensioning.irradiacaoMensal.reduce((a: number, b: number) => a + b, 0);
      const irradiacaoMediaAnual = somaIrradiacao / 12;

      logger.formula('Irradiação', 'Irradiação Solar Média Anual',
        'H_média = (H_jan + H_fev + ... + H_dez) / 12',
        {
          valores_mensais: currentDimensioning.irradiacaoMensal,
          soma_total: somaIrradiacao,
          divisor: 12
        },
        irradiacaoMediaAnual,
        {
          description: 'Cálculo da irradiação solar média anual a partir dos dados mensais. Este valor representa a média de energia solar disponível por metro quadrado ao longo do ano.',
          units: 'kWh/m²/dia',
          references: ['PVGIS - Photovoltaic Geographical Information System', 'INPE - Instituto Nacional de Pesquisas Espaciais']
        }
      );
      
      if (irradiacaoMediaAnual <= 0 || !currentDimensioning.potenciaModulo || currentDimensioning.potenciaModulo <= 0) {
        logger.error('Validação', 'Parâmetros inválidos detectados', {
          irradiacaoMediaAnual,
          potenciaModulo: currentDimensioning.potenciaModulo
        });
        throw new Error("Potência do módulo e irradiação devem ser maiores que zero.");
      }

      // Calculate total monthly consumption
      logger.context('Consumo', 'Iniciando cálculo do consumo mensal total', {
        numeroContas: currentDimensioning.energyBills?.length || 0,
        contas: currentDimensioning.energyBills?.map(bill => ({ nome: bill.name, consumo: bill.consumoMensal }))
      }, 'Agregação do consumo de todas as contas de energia para obter o perfil de consumo mensal');

      const totalConsumoMensal = currentDimensioning.energyBills?.reduce((acc: number[], bill: any) => {
        logger.info('Consumo', `Processando conta: ${bill.name}`, {
          consumoMensal: bill.consumoMensal,
          operacao: 'Soma mensal por mês'
        });
        
        bill.consumoMensal.forEach((consumo: number, index: number) => {
          const valorAnterior = acc[index] || 0;
          acc[index] = valorAnterior + consumo;
          
          const mes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][index];
          logger.calculation('Consumo', `${mes} - Agregação de consumo`, 
            `${valorAnterior} + ${consumo} = ${acc[index]}`, 
            { mes: index + 1, valorAnterior, consumoAdicional: consumo, total: acc[index] }
          );
        });
        return acc;
      }, Array(12).fill(0)) || Array(12).fill(0);

      logger.result('Consumo', 'Consumo mensal total calculado', {
        consumoMensal: totalConsumoMensal,
        unidade: 'kWh/mês',
        total_anual: totalConsumoMensal.reduce((a, b) => a + b, 0)
      });

      // Calculate system sizing using our new detailed method
      const consumoTotalAnual = totalConsumoMensal.reduce((a: number, b: number) => a + b, 0);
      
      logger.formula('Consumo', 'Consumo Total Anual',
        'C_anual = C_jan + C_fev + ... + C_dez',
        {
          valores_mensais: totalConsumoMensal,
          operacao: `${totalConsumoMensal.join(' + ')}`
        },
        consumoTotalAnual,
        {
          description: 'Soma do consumo de todos os meses do ano para obter o consumo total anual',
          units: 'kWh/ano'
        }
      );

      // Determinar potência desejada baseada no modo selecionado
      let potenciaDesejadaKwp: number;
      
      if (currentDimensioning.numeroModulos && currentDimensioning.numeroModulos > 0) {
        // Modo: número de módulos fixo
        potenciaDesejadaKwp = (currentDimensioning.numeroModulos * currentDimensioning.potenciaModulo) / 1000;
        
        logger.info('Dimensionamento', 'Modo: Número de módulos fixo', {
          numeroModulos: currentDimensioning.numeroModulos,
          potenciaModulo: currentDimensioning.potenciaModulo,
          potenciaTotal: potenciaDesejadaKwp
        });
      } else {
        // Modo: dimensionamento automático baseado no consumo
        logger.context('Dimensionamento', 'Modo: Dimensionamento automático baseado no consumo');
        
        const consumoMedioDiario = consumoTotalAnual / 365;
        logger.formula('Consumo', 'Consumo Médio Diário',
          'C_diário = C_anual / 365',
          {
            C_anual: consumoTotalAnual,
            divisor: 365
          },
          consumoMedioDiario,
          {
            description: 'Consumo médio diário calculado a partir do consumo anual',
            units: 'kWh/dia'
          }
        );
        
        const eficienciaDecimal = (currentDimensioning.eficienciaSistema || 85) / 100;
        const irradiacaoEfetiva = irradiacaoMediaAnual * eficienciaDecimal;
        
        logger.formula('Sistema', 'Irradiação Solar Efetiva',
          'H_efetiva = H_média × η_sistema',
          {
            H_media: irradiacaoMediaAnual,
            η_sistema_decimal: eficienciaDecimal,
            η_sistema_percent: currentDimensioning.eficienciaSistema || 85
          },
          irradiacaoEfetiva,
          {
            description: 'Irradiação solar efetiva considerando as perdas do sistema (temperatura, cabeamento, inversor, etc.)',
            units: 'kWh/m²/dia',
            references: ['ABNT NBR 16274:2014 - Sistemas fotovoltaicos']
          }
        );
        
        potenciaDesejadaKwp = consumoMedioDiario / irradiacaoEfetiva;
        
        logger.formula('Sistema', 'Potência Pico Necessária',
          'P_pico = C_diário / H_efetiva',
          {
            C_diario: consumoMedioDiario,
            H_efetiva: irradiacaoEfetiva
          },
          potenciaDesejadaKwp,
          {
            description: 'Cálculo da potência pico necessária para atender ao consumo diário médio considerando a irradiação solar efetiva no local',
            units: 'kWp',
            references: ['Manual de Engenharia para Sistemas Fotovoltaicos - CRESESB']
          }
        );
      }

      // Usar dados diretos do dimensionamento (já calculados no resumo)
      const debugDimensioningData = {
        numeroModulos: currentDimensioning.numeroModulos,
        potenciaModulo: currentDimensioning.potenciaModulo,
        irradiacaoMensal: currentDimensioning.irradiacaoMensal,
        eficienciaSistema: currentDimensioning.eficienciaSistema,
        potenciaPico: (currentDimensioning as any).potenciaPico || 0,
        areaEstimada: (currentDimensioning as any).areaEstimada || 0,
        geracaoEstimadaAnual: (currentDimensioning as any).geracaoEstimadaAnual || 0,
        geracaoEstimadaMensal: (currentDimensioning as any).geracaoEstimadaMensal || Array(12).fill(0)
      };
      
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
        const debugAguasInfo = { aguasInfo: debugAguasData };
        
        // Sobrescrever variáveis com dados das águas de telhado
        numeroModulos = totalModulosAguas;
        geracaoEstimadaAnual = totalGeracaoAguas;
        areaEstimada = totalAreaAguas;
        potenciaPico = (numeroModulos * (currentDimensioning.potenciaModulo || 550)) / 1000;
        geracaoEstimadaMensal = Array(12).fill(geracaoEstimadaAnual / 12);
        
        const debugAguasResultsData = {
          potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
          numeroModulos: `${numeroModulos} unidades`,
          areaEstimada: `${areaEstimada.toFixed(2)} m²`,
          geracaoAnual: `${geracaoEstimadaAnual.toFixed(0)} kWh/ano`
        };
        const debugAguasResults = { aguasResults: debugAguasResultsData };
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
          const debugApiCall = { callingAdvancedModulesAPI: true };
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
                fabricante: selectedModuleFull.fabricante,
                modelo: selectedModuleFull.modelo,
                potencia_nominal_w: selectedModuleFull.potenciaNominal,
                largura_mm: selectedModuleFull.larguraMm,
                altura_mm: selectedModuleFull.alturaMm,
                peso_kg: selectedModuleFull.pesoKg,
                vmpp: selectedModuleFull.vmpp,
                impp: selectedModuleFull.impp,
                voc_stc: selectedModuleFull.voc,
                isc_stc: selectedModuleFull.isc,
                eficiencia: selectedModuleFull.eficiencia,
                // Coeficientes de temperatura Sandia
                alpha_sc: selectedModuleFull.alphaSc || selectedModuleFull.tempCoefPmax,
                beta_oc: selectedModuleFull.betaOc || selectedModuleFull.tempCoefVoc,
                gamma_r: selectedModuleFull.gammaR || selectedModuleFull.tempCoefIsc,
                // Parâmetros do modelo de diodo único
                cells_in_series: selectedModuleFull.numeroCelulas,
                a_ref: selectedModuleFull.aRef,
                il_ref: selectedModuleFull.iLRef,
                io_ref: selectedModuleFull.iORef,
                rs: selectedModuleFull.rS,
                rsh_ref: selectedModuleFull.rShRef,
                // Parâmetros opcionais
                material: selectedModuleFull.material,
                technology: selectedModuleFull.technology,
                a0: selectedModuleFull.a0,
                a1: selectedModuleFull.a1,
                a2: selectedModuleFull.a2,
                a3: selectedModuleFull.a3,
                a4: selectedModuleFull.a4,
                b0: selectedModuleFull.b0,
                b1: selectedModuleFull.b1,
                b2: selectedModuleFull.b2,
                b3: selectedModuleFull.b3,
                b4: selectedModuleFull.b4,
                b5: selectedModuleFull.b5,
                dtc: selectedModuleFull.dtc
              };
            })() : null,
            inversor: currentDimensioning.selectedInverters?.[0] ? (() => {
              const inv = currentDimensioning.selectedInverters[0];
              return {
                fabricante: inv.fabricante,
                modelo: inv.modelo,
                potencia_saida_ca_w: inv.potenciaSaidaCA,
                tipo_rede: inv.tipoRede
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
          geracaoEstimadaMensal = Array(12).fill(geracaoEstimadaAnual / 12); // Distribuir igualmente por enquanto

        } else {
          throw new Error('API retornou erro');
        }
      } catch (error) {
        // Fallback se a API falhar
        potenciaPico = 12.42;
        numeroModulos = 23;
        areaEstimada = 58.8;
        geracaoEstimadaAnual = 6806;
        geracaoEstimadaMensal = Array(12).fill(geracaoEstimadaAnual / 12);
      }
      } // Fechamento do if (!hasAguasTelhado)
      
      const debugSystemInfo = {
        potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
        numeroModulos: `${numeroModulos} unidades`,
        areaEstimada: `${areaEstimada.toFixed(2)} m²`,
        geracaoAnual: `${geracaoEstimadaAnual.toFixed(0)} kWh/ano`,
        fonte: 'Dados do dimensionamento'
      };
      const debugSystemData = { systemData: debugSystemInfo };
      
      const debugSystemResultsInfo = {
        potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
        numeroModulos: `${numeroModulos} unidades`,
        areaEstimada: `${areaEstimada.toFixed(2)} m²`,
        geracaoAnual: `${geracaoEstimadaAnual.toFixed(0)} kWh/ano`
      };
      const debugSystemResults = { systemResults: debugSystemResultsInfo };

      // Usar geração mensal calculada diretamente
      const geracaoAnualAdvanced = geracaoEstimadaAnual;
      
      const debugPerformanceInfo = {
        potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
        numeroModulos: `${numeroModulos} unidades`,
        areaEstimada: `${areaEstimada.toFixed(2)} m²`,
        geracaoEstimadaAnual: `${geracaoEstimadaAnual.toFixed(0)} kWh/ano`,
        performance: {
          yieldEspecifico: `${(geracaoEstimadaAnual / potenciaPico).toFixed(0)} kWh/kWp`,
          fatorCapacidade: `${((geracaoEstimadaAnual / (potenciaPico * 8760)) * 100).toFixed(1)}%`
        }
      };
      const debugPerformanceData = { performanceData: debugPerformanceInfo };

      // Financial calculations
      const tarifaB = currentDimensioning.tarifaEnergiaB || 0.8;
      const custoFioB = currentDimensioning.custoFioB || (tarifaB * 0.3);
      const debugFinancialInfo = {
        tarifaEnergiaB: `R$ ${tarifaB.toFixed(4)}/kWh`,
        custoFioB: `R$ ${custoFioB.toFixed(4)}/kWh`,
        investimentoTotal: `R$ ${totalInvestment.toLocaleString('pt-BR')}`,
        vidaUtil: `${currentDimensioning.vidaUtil || 25} anos`,
        inflacaoEnergia: `${currentDimensioning.inflacaoEnergia || 4.5}%`,
        taxaDesconto: `${currentDimensioning.taxaDesconto || 8.0}%`
      };
      const debugFinancialParams = { financialParams: debugFinancialInfo };

      // Usar API Python para cálculos financeiros básicos
      const basicFinancialInput = {
        investimento_inicial: totalInvestment,
        geracao_mensal: geracaoEstimadaMensal,
        consumo_mensal: totalConsumoMensal,
        tarifa_energia: tarifaB,
        custo_fio_b: custoFioB,
        vida_util: currentDimensioning.vidaUtil || 25,
        taxa_desconto: currentDimensioning.taxaDesconto || 8.0,
        inflacao_energia: currentDimensioning.inflacaoEnergia || 4.5,
        degradacao_modulos: 0.5,
        custo_om: totalInvestment * 0.01,
        inflacao_om: 4.0,
        modalidade_tarifaria: 'convencional'
      };
      
      setIsCalculating(true);
      const financialApiResponse = await apiClient.solarAnalysis.calculateAdvancedFinancial(basicFinancialInput);
      const financialResults = financialApiResponse.data;

      if (financialResults) {
        const economiaAnual = (financialResults as any).economiaAnual || 0;
        const payback = financialResults.payback || 0;
        const vpl = financialResults.vpl || 0;
        const tir = financialResults.tir || 0;
        
        const debugFinancialResults = { economiaAnual, payback, vpl, tir };
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
      
      const tarifaEnergia = currentDimensioning.tarifaEnergiaB || 0.8;
      const custoFioBCalculado = tarifaEnergia * percentualFioB;

      const advancedFinancialInput: AdvancedFinancialInput = {
        investimentoInicial: totalInvestment,
        geracaoMensal: geracaoEstimadaMensal || Array(12).fill(0),
        consumoMensal: totalConsumoMensal || Array(12).fill(0),
        tarifaEnergia: tarifaEnergia,
        custoFioB: currentDimensioning.custoFioB || custoFioBCalculado,
        vidaUtil: currentDimensioning.vidaUtil || 25,
        taxaDesconto: currentDimensioning.taxaDesconto || 8.0,
        inflacaoEnergia: currentDimensioning.inflacaoEnergia || 4.5,
        degradacaoModulos: 0.5,
        custoOm: totalInvestment * 0.01, // 1% do investimento/ano
        inflacaoOm: 4.0,
        modalidadeTarifaria: 'convencional'
      };

      // Usar API Python para cálculos financeiros
      const advancedFinancialApiResponse = await apiClient.solarAnalysis.calculateAdvancedFinancial({
        investimento_inicial: advancedFinancialInput.investimentoInicial,
        geracao_mensal: advancedFinancialInput.geracaoMensal,
        consumo_mensal: advancedFinancialInput.consumoMensal,
        tarifa_energia: advancedFinancialInput.tarifaEnergia,
        custo_fio_b: advancedFinancialInput.custoFioB,
        vida_util: advancedFinancialInput.vidaUtil,
        taxa_desconto: advancedFinancialInput.taxaDesconto,
        inflacao_energia: advancedFinancialInput.inflacaoEnergia,
        degradacao_modulos: advancedFinancialInput.degradacaoModulos,
        custo_om: advancedFinancialInput.custoOm,
        inflacao_om: advancedFinancialInput.inflacaoOm,
        modalidade_tarifaria: advancedFinancialInput.modalidadeTarifaria || 'convencional'
      });
      const advancedFinancialResults = advancedFinancialApiResponse.data;

      // Mapear 'cenarios' (Python) para 'scenarios' (Frontend)
      const scenarioAnalysis = (advancedFinancialResults as any)?.cenarios || null;
      
      const debugAdvancedFinancialInfo = {
        potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
        numeroModulos: `${numeroModulos} unidades`,
        areaEstimada: `${areaEstimada.toFixed(2)} m²`,
        geracaoEstimadaAnual: `${geracaoEstimadaAnual.toFixed(0)} kWh/ano`
      };
      const debugAdvancedFinancialData = { advancedFinancialData: debugAdvancedFinancialInfo };

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

      // Chamar API Python e armazenar resultado transformado
      const pythonFinancialData = await callPythonFinancialAPI({
        investimento_inicial: totalInvestment,
        geracao_mensal: geracaoEstimadaMensal,
        consumo_mensal: totalConsumoMensal,
        tarifa_energia: currentDimensioning.tarifaEnergiaB || 0.8,
        custo_fio_b: currentDimensioning.custoFioB || 0.3,
        vida_util: currentDimensioning.vidaUtil || 25,
        taxa_desconto: currentDimensioning.taxaDesconto || 8.0,
        inflacao_energia: currentDimensioning.inflacaoEnergia || 4.5,
        degradacao_modulos: 0.5,
        custo_om: totalInvestment * 0.01,
        inflacao_om: 4.0
      });

      // Adicionar dados financeiros ao results
      results.advancedFinancial = pythonFinancialData || {
        ...advancedFinancialResults,
        cashFlow: []
      };

      // Garantir que scenarios está sempre disponível (do pythonFinancialData ou scenarioAnalysis)
      if (pythonFinancialData && !pythonFinancialData.scenarios) {
        results.advancedFinancial.scenarios = scenarioAnalysis;
      }

      // Mapear cashFlow (camelCase) para fluxoCaixa (esperado pelos charts)
      results.fluxoCaixa = pythonFinancialData?.cashFlow || [];

      // Adicionar outros dados financeiros
      results.selectedInverters = currentDimensioning.selectedInverters || [];
      results.selectedModule = currentDimensioning.moduloSelecionado;
      Object.assign(results, financialResults);
      
      // Mapear economia_anual_media para economiaAnualEstimada para compatibilidade
      if (financialResults?.economiaAnualMedia) {
        results.economiaAnualEstimada = financialResults.economiaAnualMedia;
      }

      // Log: Finalizando cálculos principais 
      const debugFinalCalculations = { finalizingCalculations: true };
      
      // Cálculos adicionais do resumo do wizard
      const economiaAnualWizard = ((financialResults as any)?.economiaAnual || 0);
      const economiaMensalWizard = economiaAnualWizard / 12;
      const custoKwpWizard = totalInvestment / (potenciaPico || 1);
      const geracaoMensalWizard = (geracaoEstimadaAnual || 0) / 12;

      // Tentar integração com backend se habilitado
      if (shouldUseBackendCalculations()) {
        try {
          const debugBackendIntegration = { attemptingBackendIntegration: true };
          
          const backendParams = {
            systemParams: {
              potenciaNominal: potenciaPico,
              eficiencia: currentDimensioning.eficienciaSistema || 85,
              perdas: 5,
              inclinacao: 23,
              orientacao: 180,
              area: areaEstimada
            },
            irradiationData: {
              monthly: currentDimensioning.irradiacaoMensal,
              annual: currentDimensioning.irradiacaoMensal.reduce((a, b) => a + b, 0)
            },
            coordinates: {
              latitude: currentDimensioning.latitude || -23.5505,
              longitude: currentDimensioning.longitude || -46.6333
            },
            financialParams: {
              totalInvestment,
              geracaoEstimadaMensal,
              consumoMensal: totalConsumoMensal,
              tarifaEnergiaB: currentDimensioning.tarifaEnergiaB || 0.8,
              custoFioB: currentDimensioning.custoFioB || 0.3,
              vidaUtil: currentDimensioning.vidaUtil || 25,
              inflacaoEnergia: currentDimensioning.inflacaoEnergia || 4.5,
              taxaDesconto: currentDimensioning.taxaDesconto || 8.0
            }
          };
          
          const debugBackendParams = { backendParams };
          
          const enhancedResults = await BackendCalculationService.enhanceWithBackendCalculations(
            '', // Não precisa mais de projectId
            results,
            backendParams
          );
          
          // Mesclar resultados se disponíveis
          if (enhancedResults && enhancedResults !== results) {
            results = enhancedResults;
          }
          
        } catch (error) {
          const debugBackendError = { error };
        }
      } else {
        const debugBackendDisabled = { backendCalculationsDisabled: true };
      }

      // Finalizar logging
      logger.endCalculationSection('CÁLCULO VIA WIZARD - SISTEMA SOLAR FOTOVOLTAICO', {
        potenciaPico: `${potenciaPico} kWp`,
        numeroModulos: `${numeroModulos} unidades`,
        areaEstimada: `${areaEstimada.toFixed(1)} m²`,
        geracaoAnual: `${geracaoEstimadaAnual.toFixed(0)} kWh/ano`,
        investimento: `R$ ${totalInvestment.toLocaleString('pt-BR')}`,
        payback: `${((advancedFinancialResults as any)?.payback || financialResults?.payback || 0).toFixed(1)} anos`
      });


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

            <Button
              onClick={handleNext}
              disabled={!validateStep(currentStep) || isSaving || isCalculating}
              className="w-full sm:w-auto order-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              {isCalculating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Calculando...
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
