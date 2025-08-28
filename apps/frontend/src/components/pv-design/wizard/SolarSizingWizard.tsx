import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, ChevronRight, Sun, User, Zap, MapPin, Settings, Calculator, CheckCircle } from 'lucide-react';
import { useDimensioning } from '@/contexts/DimensioningContext';
import { calculateAdvancedFinancials } from '@/lib/financialCalculations';
import { AdvancedSolarCalculator, SolarCalculationOptions } from '@/lib/solarCalculations';
import { AdvancedFinancialAnalyzer, AdvancedFinancialInput } from '@/lib/advancedFinancialAnalysis';
import { useCalculationLogger } from '@/hooks/useCalculationLogger';
import { BackendCalculationService, shouldUseBackendCalculations } from '@/lib/backendCalculations';
import { FrontendCalculationLogger } from '@/lib/calculationLogger';
import { PVDimensioningService } from '@/lib/pvDimensioning';

// Import existing form components
import CustomerDataForm from '../form-sections/CustomerDataForm';
import ConsumptionForm from '../form-sections/ConsumptionForm';
import LocationForm from '../form-sections/LocationForm';
import SystemParametersForm from '../form-sections/SystemParametersForm';
import EquipmentSelectionForm from '../form-sections/EquipmentSelectionForm';
import SystemSummary from '../form-sections/SystemSummary';
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
    title: 'Resumo e Orçamento',
    description: 'Custos e condições financeiras',
    icon: Calculator,
    component: 'summary'
  },
  {
    id: 6,
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
        return !!currentDimensioning.latitude && !!currentDimensioning.longitude &&
               currentDimensioning.irradiacaoMensal?.length === 12;
      case 4:
        return currentDimensioning.potenciaModulo > 0 && currentDimensioning.eficienciaSistema > 0;
      case 5:
        return totalInvestment > 0;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios antes de continuar."
      });
      return;
    }

    // Auto-save progress
    if (currentDimensioning.customer && currentDimensioning.dimensioningName?.trim()) {
      try {
        await saveDimensioning();
      } catch (error) {
        console.log('Auto-save failed, but continuing...', error);
      }
    }

    if (currentStep === 5) {
      // Calculate results before going to step 6
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

      // Usar o novo método detalhado para calcular o resumo do sistema
      const resumoSistema = PVDimensioningService.calculateSystemSummary(
        potenciaDesejadaKwp,
        consumoTotalAnual,
        irradiacaoMediaAnual,
        currentDimensioning.eficienciaSistema || 85,
        logger
      );

      // Extrair valores para compatibilidade com o código existente
      const potenciaPico = resumoSistema.potenciaPico.valor;
      const numeroModulos = resumoSistema.numeroModulos.valor;
      const areaEstimada = resumoSistema.areaNecessaria.valor;
      const geracaoEstimadaAnual = resumoSistema.geracaoAnual.valor;
      
      const solarOptions: SolarCalculationOptions = {
        location: {
          latitude: currentDimensioning.latitude || -23.5505,
          longitude: currentDimensioning.longitude || -46.6333,
          state: currentDimensioning.estado || 'SP',
          city: currentDimensioning.cidade || 'São Paulo'
        },
        tilt: 23,
        azimuth: 180,
        considerarSombreamento: false,
        sombreamento: undefined,
        considerarSujeira: true,
        sujeira: 3
      };

      console.log('🔢 === CÁLCULOS SOLARES AVANÇADOS ===');
      console.log('📍 Parâmetros para cálculo solar:', {
        potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
        localizacao: solarOptions.location,
        irradiacaoMensal: (solarOptions as any).irradiationData,
        parametrosSistema: (solarOptions as any).systemParams
      });

      const advancedResults = AdvancedSolarCalculator.calculateDetailedSolar(
        potenciaPico,
        solarOptions
      );

      const geracaoEstimadaMensal = advancedResults.geracaoEstimada.mensal;
      const geracaoAnualAdvanced = advancedResults.geracaoEstimada.anual;

      console.log('☀️ === RESULTADOS DE GERAÇÃO ===');
      console.log('📊 Geração mensal calculada:');
      geracaoEstimadaMensal.forEach((geracao, index) => {
        const irradiacao = currentDimensioning.irradiacaoMensal[index];
        const eficiencia = (currentDimensioning.eficienciaSistema || 85) / 100;
        const diasMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][index];
        console.log(`   Mês ${index + 1}: ${potenciaPico.toFixed(2)} kWp × ${irradiacao} kWh/m²/dia × ${diasMes} dias × ${eficiencia} = ${geracao.toFixed(0)} kWh`);
      });
      console.log(`📈 Geração anual total: ${geracaoEstimadaMensal.map(g => g.toFixed(0)).join(' + ')} = ${geracaoAnualAdvanced.toFixed(0)} kWh/ano`);

      // Financial calculations
      console.log('🔢 === CÁLCULOS FINANCEIROS ===');
      const tarifaB = currentDimensioning.tarifaEnergiaB || 0.8;
      const custoFioB = currentDimensioning.custoFioB || (tarifaB * 0.3);
      console.log('💰 Parâmetros tarifários:', {
        tarifaEnergiaB: `R$ ${tarifaB.toFixed(4)}/kWh`,
        custoFioB: `R$ ${custoFioB.toFixed(4)}/kWh`,
        investimentoTotal: `R$ ${totalInvestment.toLocaleString('pt-BR')}`,
        vidaUtil: `${currentDimensioning.vidaUtil || 25} anos`,
        inflacaoEnergia: `${currentDimensioning.inflacaoEnergia || 4.5}%`,
        taxaDesconto: `${currentDimensioning.taxaDesconto || 8.0}%`
      });

      const financialResults = calculateAdvancedFinancials({
        totalInvestment,
        geracaoEstimadaMensal,
        consumoMensal: totalConsumoMensal,
        tarifaEnergiaB: tarifaB,
        custoFioB: custoFioB,
        vidaUtil: currentDimensioning.vidaUtil || 25,
        inflacaoEnergia: currentDimensioning.inflacaoEnergia || 4.5,
        taxaDesconto: currentDimensioning.taxaDesconto || 8.0,
      });

      console.log('💵 === RESULTADOS FINANCEIROS BÁSICOS ===');
      if (financialResults) {
        const economiaAnual = (financialResults as any).economiaAnual || 0;
        const payback = financialResults.payback || 0;
        const vpl = financialResults.vpl || 0;
        const tir = financialResults.tir || 0;
        
        console.log(`💰 Economia anual: R$ ${economiaAnual.toLocaleString('pt-BR')} = (Geração - Injeção) × Tarifa`);
        console.log(`⏱️ Payback simples: ${payback.toFixed(1)} anos = R$ ${totalInvestment.toLocaleString('pt-BR')} ÷ R$ ${economiaAnual.toLocaleString('pt-BR')}/ano`);
        console.log(`📊 VPL (25 anos): R$ ${vpl.toLocaleString('pt-BR')}`);
        console.log(`📈 TIR: ${(tir * 100).toFixed(2)}%`);
      }

      // Advanced financial analysis
      const advancedFinancialInput: AdvancedFinancialInput = {
        investimentoInicial: totalInvestment,
        geracaoMensal: geracaoEstimadaMensal,
        consumoMensal: totalConsumoMensal,
        tarifaEnergia: currentDimensioning.tarifaEnergiaB || 0.8,
        custoFioB: currentDimensioning.custoFioB || (currentDimensioning.tarifaEnergiaB || 0.8) * 0.3,
        vidaUtil: currentDimensioning.vidaUtil || 25,
        taxaDesconto: currentDimensioning.taxaDesconto || 8.0,
        inflacaoEnergia: currentDimensioning.inflacaoEnergia || 4.5,
        degradacaoModulos: 0.5,
        custoOM: totalInvestment * 0.01,
        inflacaoOM: 4.0,
        modalidadeTarifaria: 'convencional'
      };

      const advancedFinancialResults = AdvancedFinancialAnalyzer.calculateAdvancedFinancials(advancedFinancialInput);
      const scenarioAnalysis = AdvancedFinancialAnalyzer.analyzeScenarios(advancedFinancialInput);

      let results = {
        formData: currentDimensioning,
        potenciaPico,
        numeroModulos,
        areaEstimada,
        geracaoEstimadaAnual, // Do resumo do sistema
        geracaoEstimadaMensal,
        consumoTotalAnual,
        totalInvestment,
        advancedSolar: {
          irradiacaoMensal: advancedResults.irradiacaoMensal,
          irradiacaoInclinada: advancedResults.irradiacaoInclinada,
          fatorTemperatura: advancedResults.fatorTemperatura,
          perdas: advancedResults.perdas,
          performance: advancedResults.performance,
          geracaoEstimada: advancedResults.geracaoEstimada
        },
        advancedFinancial: {
          ...advancedFinancialResults,
          scenarios: scenarioAnalysis
        },
        ...financialResults,
      };

      // Log: Finalizando cálculos principais 
      console.log('✅ === CÁLCULOS FINALIZADOS ===');
      console.log('🎯 === RESULTADOS FINAIS DO DIMENSIONAMENTO ===');
      console.log(`⚡ Potência pico: ${(potenciaPico || 0).toFixed(2)} kWp`);
      console.log(`🔧 Número de módulos: ${numeroModulos || 0} unidades`);
      console.log(`📐 Área estimada: ${(areaEstimada || 0).toFixed(2)} m²`);
      console.log(`☀️ Geração anual: ${(geracaoEstimadaAnual || 0).toFixed(0)} kWh/ano`);
      console.log(`💰 Investimento total: R$ ${(totalInvestment || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
      console.log(`⏱️ Payback: ${((advancedFinancialResults as any)?.payback || financialResults?.payback || 0).toFixed(1)} anos`);
      console.log(`📊 VPL: R$ ${(advancedFinancialResults?.vpl || financialResults?.vpl || 0).toLocaleString('pt-BR')}`);
      console.log(`📈 TIR: ${((advancedFinancialResults?.tir || financialResults?.tir || 0) * 100).toFixed(2)}%`);
      console.log(`💵 Economia anual: R$ ${((financialResults as any)?.economiaAnual || 0).toLocaleString('pt-BR')}`);
      
      // Cálculos adicionais do resumo do wizard
      const economiaAnualWizard = ((financialResults as any)?.economiaAnual || 0);
      const economiaMensalWizard = economiaAnualWizard / 12;
      const custoKwpWizard = totalInvestment / (potenciaPico || 1);
      const geracaoMensalWizard = (geracaoEstimadaAnual || 0) / 12;
      
      console.log('📊 === ANÁLISES COMPLEMENTARES DO WIZARD ===');
      console.log(`📅 Economia mensal: R$ ${economiaMensalWizard.toLocaleString('pt-BR')} (economia anual ÷ 12)`);
      console.log(`💡 Custo por kWp instalado: R$ ${custoKwpWizard.toLocaleString('pt-BR')}/kWp (investimento ÷ potência)`);
      console.log(`⚡ Geração média mensal: ${geracaoMensalWizard.toFixed(0)} kWh/mês (geração anual ÷ 12)`);
      console.log(`🏠 Economia por m² de área: R$ ${(areaEstimada > 0 ? economiaAnualWizard / areaEstimada : 0).toFixed(2)}/m²/ano`);
      
      console.log('📋 Resumo completo dos dados de entrada:', {
        cliente: currentDimensioning.customer?.name,
        projeto: currentDimensioning.dimensioningName,
        endereco: currentDimensioning.endereco,
        coordenadas: {
          latitude: currentDimensioning.latitude,
          longitude: currentDimensioning.longitude
        },
        irradiacaoMensal: currentDimensioning.irradiacaoMensal,
        consumoMensal: totalConsumoMensal,
        parametrosSistema: {
          potenciaModulo: currentDimensioning.potenciaModulo,
          eficiencia: currentDimensioning.eficienciaSistema,
          numeroModulos: currentDimensioning.numeroModulos
        },
        custos: {
          equipamento: currentDimensioning.custoEquipamento,
          materiais: currentDimensioning.custoMateriais,
          maoDeObra: currentDimensioning.custoMaoDeObra,
          bdi: currentDimensioning.bdi
        }
      });
      
      // Tentar integração com backend se habilitado
      if (shouldUseBackendCalculations()) {
        try {
          console.log('🌐 === INTEGRAÇÃO COM BACKEND (SEM PROJETO) ===');
          
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
          
          console.log('📤 Enviando para backend (standalone):', backendParams);
          
          const enhancedResults = await BackendCalculationService.enhanceWithBackendCalculations(
            '', // Não precisa mais de projectId
            results,
            backendParams
          );
          
          // Mesclar resultados se disponíveis
          if (enhancedResults && enhancedResults !== results) {
            console.log('✅ === RESULTADOS DO BACKEND RECEBIDOS ===');
            console.log('🔄 Mesclando resultados frontend + backend...');
            results = enhancedResults;
          }
          
          console.log('🌐 === FIM INTEGRAÇÃO BACKEND ===');
        } catch (error) {
          console.log('⚠️ Erro na integração backend (usando frontend):', error);
        }
      } else {
        console.log('ℹ️ Backend desabilitado - usando apenas frontend');
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

      console.log('🧙‍♀️ === WIZARD: CÁLCULO CONCLUÍDO COM SUCESSO ===');

      setCalculationResults(results);
      setCurrentStep(6);

      if (onComplete) {
        onComplete(results);
      }

      toast({
        title: "Cálculo concluído!",
        description: "Resultados disponíveis na tela de resultados. Verifique o console do navegador (F12) para logs detalhados."
      });

    } catch (error: any) {
      console.error("Calculation Error:", error);
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
            <EquipmentSelectionForm 
              formData={currentDimensioning} 
              onFormChange={handleFormChange} 
            />
          </div>
        );
      
      case 'summary':
        return (
          <div className="space-y-6">
            <SystemSummary 
              formData={currentDimensioning}
            />
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
        {currentStep < 6 && (
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
              ) : currentStep === 5 ? (
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
        {currentStep === 6 && calculationResults && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 border-t dark:border-slate-700">
            <Button
              onClick={() => setCurrentStep(5)}
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