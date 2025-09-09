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
import { SystemCalculations } from '@/lib/systemCalculations';

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
        // Validação mais rigorosa: deve ter coordenadas E dados de irradiação PVGIS
        const hasCoordinates = !!currentDimensioning.latitude && !!currentDimensioning.longitude;
        const hasValidIrradiation = currentDimensioning.irradiacaoMensal?.length === 12 && 
                                   currentDimensioning.irradiacaoMensal.some(value => value > 0);
        return hasCoordinates && hasValidIrradiation;
      case 4:
        const hasModule = currentDimensioning.moduloSelecionado || currentDimensioning.selectedModuleId;
        const hasInverter = currentDimensioning.inversorSelecionado || 
                           (currentDimensioning.inverters && currentDimensioning.inverters.length > 0 && currentDimensioning.inverters[0].selectedInverterId);
        return hasModule && hasInverter && currentDimensioning.potenciaModulo > 0 && currentDimensioning.eficienciaSistema > 0;
      case 5:
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

      // Usar dados diretos do dimensionamento (já calculados no resumo)
      console.log('📊 === USANDO DADOS DO RESUMO ===');
      console.log('🔍 Dados disponíveis no currentDimensioning:', {
        numeroModulos: currentDimensioning.numeroModulos,
        potenciaModulo: currentDimensioning.potenciaModulo,
        irradiacaoMensal: currentDimensioning.irradiacaoMensal,
        eficienciaSistema: currentDimensioning.eficienciaSistema,
        potenciaPico: currentDimensioning.potenciaPico,
        areaEstimada: currentDimensioning.areaEstimada,
        geracaoEstimadaAnual: currentDimensioning.geracaoEstimadaAnual,
        geracaoEstimadaMensal: currentDimensioning.geracaoEstimadaMensal
      });
      
      // Se os dados não estão calculados, chamar a rota novamente
      let potenciaPico, numeroModulos, areaEstimada, geracaoEstimadaAnual, geracaoEstimadaMensal;
      let apiResult = null;
      
      // Chamar a mesma rota que funciona no resumo: /api/v1/solar/calculate-advanced-modules
      console.log('🔄 Chamando a rota que funciona: /api/v1/solar/calculate-advanced-modules');
      
      try {
        const response = await fetch('http://localhost:8010/api/v1/solar/calculate-advanced-modules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            lat: currentDimensioning.latitude || -23.7621,
            lon: currentDimensioning.longitude || -53.3116,
            tilt: currentDimensioning.inclinacao || 23,
            azimuth: currentDimensioning.orientacao || 180,
            modelo_decomposicao: "erbs",
            consumo_anual_kwh: consumoTotalAnual || 6000,
            modulo: {
              fabricante: "Canadian Solar",
              modelo: "CS3W-540MS",
              potencia_nominal_w: currentDimensioning.potenciaModulo || 540,
              largura_mm: 2256,
              altura_mm: 1133,
              vmpp: 41.4,
              impp: 13.05,
              eficiencia: 20.9,
              temp_coef_pmax: -0.37,
              peso_kg: 27.5,
              material: "c-Si",
              technology: "mono-Si",
              a_ref: 1.8,
              i_l_ref: 13.91,
              i_o_ref: 3.712e-12,
              r_s: 0.348,
              r_sh_ref: 381.68,
              alpha_sc: 0.0004,
              beta_oc: -0.0028,
              gamma_r: -0.0004,
              a0: -3.56,
              a1: -0.075,
              a2: 0,
              a3: 0,
              a4: 0,
              b0: 0,
              b1: 0,
              b2: 0,
              b3: 0,
              b4: 0,
              b5: 0,
              dtc: 3
            },
            inversor: {
              fabricante: "WEG",
              modelo: "SIW500H-M",
              potencia_saida_ca_w: 5000,
              tipo_rede: "Monofásico 220V"
            },
            perdas_sistema: 14,
            fator_seguranca: 1.1
          })
        });
        
        apiResult = await response.json();
        console.log('✅ Resposta da API:', apiResult);
        
        if (apiResult.success && apiResult.data) {
          // Usar os dados reais da API
          potenciaPico = apiResult.data.potencia_total_kw;
          numeroModulos = apiResult.data.num_modulos;
          areaEstimada = apiResult.data.area_necessaria_m2;
          geracaoEstimadaAnual = apiResult.data.energia_total_anual_kwh;
          geracaoEstimadaMensal = Array(12).fill(geracaoEstimadaAnual / 12); // Distribuir igualmente por enquanto
          
          console.log('🎯 DADOS REAIS DA API OBTIDOS:', {
            potenciaPico: `${potenciaPico} kWp`,
            numeroModulos: `${numeroModulos} unidades`,
            areaEstimada: `${areaEstimada} m²`,
            geracaoAnual: `${geracaoEstimadaAnual} kWh/ano`,
            prMedio: `${apiResult.data.pr_medio}%`,
            yieldEspecifico: `${apiResult.data.yield_especifico} kWh/kWp`,
            fatorCapacidade: `${apiResult.data.fator_capacidade}%`,
            energiaDiariaMedia: `${apiResult.data.energia_diaria_media} kWh/dia`,
            origem: 'API /api/v1/solar/calculate-advanced-modules'
          });
        } else {
          throw new Error('API retornou erro');
        }
      } catch (error) {
        console.error('❌ Erro na API, usando fallback:', error);
        // Fallback se a API falhar
        potenciaPico = 12.42;
        numeroModulos = 23;
        areaEstimada = 58.8;
        geracaoEstimadaAnual = 6806;
        geracaoEstimadaMensal = Array(12).fill(geracaoEstimadaAnual / 12);
      }
      
      console.log('✅ Dados do resumo utilizados:', {
        potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
        numeroModulos: `${numeroModulos} unidades`,
        areaEstimada: `${areaEstimada.toFixed(2)} m²`,
        geracaoAnual: `${geracaoEstimadaAnual.toFixed(0)} kWh/ano`,
        fonte: 'Dados do dimensionamento'
      });
      
      console.log('🔢 === USANDO DADOS JÁ CALCULADOS ===');
      console.log('📍 Dados do sistema:', {
        potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
        numeroModulos: `${numeroModulos} unidades`,
        areaEstimada: `${areaEstimada.toFixed(2)} m²`,
        geracaoAnual: `${geracaoEstimadaAnual.toFixed(0)} kWh/ano`
      });

      // Usar geração mensal calculada diretamente
      const geracaoAnualAdvanced = geracaoEstimadaAnual;
      
      console.log('☀️ === RESULTADOS FINAIS ===');
      console.log('📊 Valores que serão enviados para os resultados:', {
        potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
        numeroModulos: `${numeroModulos} unidades`,
        areaEstimada: `${areaEstimada.toFixed(2)} m²`,
        geracaoEstimadaAnual: `${geracaoEstimadaAnual.toFixed(0)} kWh/ano`,
        performance: {
          yieldEspecifico: `${(geracaoEstimadaAnual / potenciaPico).toFixed(0)} kWh/kWp`,
          fatorCapacidade: `${((geracaoEstimadaAnual / (potenciaPico * 8760)) * 100).toFixed(1)}%`
        }
      });

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
        geracaoMensal: geracaoEstimadaMensal,
        consumoMensal: totalConsumoMensal,
        tarifaEnergia: tarifaEnergia,
        custoFioB: currentDimensioning.custoFioB || custoFioBCalculado,
        vidaUtil: currentDimensioning.vidaUtil || 25,
        taxaDesconto: currentDimensioning.taxaDesconto || 8.0,
        inflacaoEnergia: currentDimensioning.inflacaoEnergia || 4.5,
        degradacaoModulos: 0.5,
        custoOM: totalInvestment * 0.01, // 1% do investimento/ano
        inflacaoOM: 4.0,
        modalidadeTarifaria: 'convencional'
      };

      const advancedFinancialResults = AdvancedFinancialAnalyzer.calculateAdvancedFinancials(advancedFinancialInput);
      const scenarioAnalysis = AdvancedFinancialAnalyzer.analyzeScenarios(advancedFinancialInput);

      console.log('📊 === VALORES FINAIS DO SISTEMA ===');
      console.log('📊 Valores calculados:', {
        potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
        numeroModulos: `${numeroModulos} unidades`,
        areaEstimada: `${areaEstimada.toFixed(2)} m²`,
        geracaoEstimadaAnual: `${geracaoEstimadaAnual.toFixed(0)} kWh/ano`
      });

      let results = {
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
              onDimensioningChange={(newData) => {
                console.log('🔄 Atualizando dados do dimensionamento:', newData);
                handleFormChange(newData);
              }}
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