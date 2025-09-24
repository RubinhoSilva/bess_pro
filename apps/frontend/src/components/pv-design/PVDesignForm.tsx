import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Sun, BarChart, FilePlus } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useDimensioning } from '@/contexts/DimensioningContext';
import { ProjectType } from '@/types/project';
import { AdvancedSolarCalculator, SolarCalculationOptions } from '@/lib/solarCalculations';
import { AdvancedFinancialInput } from '@/types/financial';
import { apiClient } from '@/lib/api';
import { NotificationManager } from '@/lib/notificationSystem';
import { useCalculationLogger } from '@/hooks/useCalculationLogger';
import { BackendCalculationService, shouldUseBackendCalculations } from '@/lib/backendCalculations';
import { FrontendCalculationLogger } from '@/lib/calculationLogger';
import { PVDimensioningService } from '@/lib/pvDimensioning';
import CustomerDataForm from './form-sections/CustomerDataForm';
import ConsumptionForm from './form-sections/ConsumptionForm';
import LocationForm from './form-sections/LocationForm';
import SystemParametersForm from './form-sections/SystemParametersForm';
import EquipmentSelectionForm from './form-sections/EquipmentSelectionForm';
import FinancialForm from './form-sections/FinancialForm';
import PaymentConditionsForm from './form-sections/PaymentConditionsForm';
import ValidationPanel from './validation/ValidationPanel';
import BackupManager from './backup/BackupManager';

interface PVDesignFormProps {
  onCalculationComplete: (results: any) => void;
  onNewProject: () => void;
}

const PVDesignForm: React.FC<PVDesignFormProps> = ({ onCalculationComplete, onNewProject }) => {
  const { toast } = useToast();
  const { currentProject, updateProject, projectName } = useProject();
  const { 
    currentDimensioning, 
    updateDimensioning, 
    saveDimensioning,
    dimensioningId,
    createNewDimensioning,
    isSaving
  } = useDimensioning();
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const notificationManager = NotificationManager.getInstance();

  const handleFormChange = (field: string, value: any) => {
    updateDimensioning({ [field]: value });
  };


  const handleRestoreBackup = (restoredData: any) => {
    updateDimensioning(restoredData);
    notificationManager.success(
      "Backup Restaurado",
      "Dados importados com sucesso. Verifique as informações antes de calcular.",
      { category: 'backup' }
    );
    toast({
      title: "Dados restaurados com sucesso!",
      description: "Verifique os dados importados antes de prosseguir.",
    });
  };

  const handleValidationChange = (result: any) => {
    setValidationResult(result);
    
    if (result.errors.length > 0) {
      notificationManager.validationIssue(result.errors.length, 'error');
    } else if (result.warnings.length > 0) {
      notificationManager.validationIssue(result.warnings.length, 'warning');
    }
  };

  const totalInvestment = useMemo(() => {
    const subtotal = (currentDimensioning.custoEquipamento || 0) + 
                    (currentDimensioning.custoMateriais || 0) + 
                    (currentDimensioning.custoMaoDeObra || 0);
    return subtotal * (1 + (currentDimensioning.bdi || 0) / 100);
  }, [currentDimensioning.custoEquipamento, currentDimensioning.custoMateriais, currentDimensioning.custoMaoDeObra, currentDimensioning.bdi]);

  const handleCalculate = () => {
    const logger = new FrontendCalculationLogger(`pvdesign-${Date.now()}`);
    
    logger.startCalculationSection('CÁLCULO DE DIMENSIONAMENTO PV - SISTEMA SOLAR FOTOVOLTAICO');
    logger.context('PVDesign', 'Iniciando cálculo via PVDesignForm', {
      cliente: currentDimensioning.customer?.name,
      projeto: currentDimensioning.dimensioningName,
      irradiacao: currentDimensioning.irradiacaoMensal,
      potenciaModulo: currentDimensioning.potenciaModulo,
      eficiencia: currentDimensioning.eficienciaSistema,
      numeroModulos: currentDimensioning.numeroModulos,
      energyBills: currentDimensioning.energyBills?.length
    }, 'Dados de entrada coletados pelo formulário PVDesignForm para dimensionamento do sistema fotovoltaico');
    
    setIsCalculating(true);
    setTimeout(async () => {
      try {
        // Validação básica
        logger.info('Validação', 'Executando validações dos dados de entrada');
        
        if (!currentDimensioning.irradiacaoMensal || currentDimensioning.irradiacaoMensal.length !== 12) {
          logger.error('Validação', 'Dados de irradiação mensal ausentes ou incompletos', {
            irradiacaoMensal: currentDimensioning.irradiacaoMensal,
            comprimento: currentDimensioning.irradiacaoMensal?.length
          });
          toast({ 
            variant: "destructive", 
            title: "Dados incompletos", 
            description: "Dados de irradiação mensal são obrigatórios." 
          });
          setIsCalculating(false);
          return;
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
          toast({ 
            variant: "destructive", 
            title: "Valores inválidos", 
            description: "Potência do módulo e irradiação devem ser maiores que zero." 
          });
          setIsCalculating(false);
          return;
        }

        // Cálculo do consumo total mensal
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

        const consumoTotalAnual = totalConsumoMensal.reduce((a: number, b: number) => a + b, 0);
        
        logger.result('Consumo', 'Consumo mensal total calculado', {
          consumoMensal: totalConsumoMensal,
          unidade: 'kWh/mês',
          total_anual: consumoTotalAnual
        });

        // Calcular resumo do sistema usando método detalhado com logging
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
        
        // Configurar dados para cálculo avançado
        const solarOptions: SolarCalculationOptions = {
          location: {
            latitude: currentDimensioning.latitude || -23.5505,
            longitude: currentDimensioning.longitude || -46.6333,
            state: currentDimensioning.estado || 'SP',
            city: currentDimensioning.cidade || 'São Paulo'
          },
          tilt: 23, // Usar valor padrão por enquanto
          azimuth: 180, // Usar valor padrão por enquanto
          considerarSombreamento: (currentDimensioning.perdaSombreamento || 0) > 0,
          sombreamento: Array(12).fill(currentDimensioning.perdaSombreamento || 0),
          considerarSujeira: (currentDimensioning.perdaSujeira || 0) > 0,
          sujeira: currentDimensioning.perdaSujeira || 0,
          outrasPerdasPercentual: currentDimensioning.perdaOutras || 0,
          // Perdas específicas do usuário
          perdaMismatch: currentDimensioning.perdaMismatch || 2,
          perdaCabeamento: currentDimensioning.perdaCabeamento || 2,
          perdaInversor: currentDimensioning.perdaInversor || 3
        };

        // Calcular resultados detalhados
        console.log('🔢 === CÁLCULOS SOLARES AVANÇADOS (FORM) ===');
        console.log('📍 Parâmetros para cálculo solar:', {
          potenciaPico: `${potenciaPico.toFixed(2)} kWp`,
          localizacao: solarOptions.location,
          irradiacaoMensal: (solarOptions as any).irradiationData,
          parametrosSistema: (solarOptions as any).systemParams
        });

        const advancedResults = await AdvancedSolarCalculator.calculateDetailedSolar(
          potenciaPico,
          solarOptions
        );

        // Usar os resultados avançados para a geração
        const geracaoEstimadaMensal = advancedResults.geracaoEstimada.mensal;
        const geracaoAnualAdvanced = advancedResults.geracaoEstimada.anual;

        console.log('☀️ === RESULTADOS DE GERAÇÃO (FORM) ===');
        console.log('📊 Geração mensal calculada:');
        geracaoEstimadaMensal.forEach((geracao, index) => {
          const irradiacao = currentDimensioning.irradiacaoMensal[index];
          const eficiencia = (currentDimensioning.eficienciaSistema || 85) / 100;
          const diasMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][index];
          console.log(`   Mês ${index + 1}: ${potenciaPico.toFixed(2)} kWp × ${irradiacao} kWh/m²/dia × ${diasMes} dias × ${eficiencia} = ${geracao.toFixed(0)} kWh`);
        });
        console.log(`📈 Geração anual total: ${geracaoEstimadaMensal.map(g => g.toFixed(0)).join(' + ')} = ${geracaoAnualAdvanced.toFixed(0)} kWh/ano`);

        // Cálculos financeiros básicos (manter compatibilidade)
        console.log('🔢 === CÁLCULOS FINANCEIROS (FORM) ===');
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

        const parametrosFinanceiros = {
          totalInvestment,
          geracaoEstimadaMensal,
          consumoMensal: totalConsumoMensal,
          tarifaEnergiaB: tarifaB,
          custoFioB: custoFioB,
          vidaUtil: currentDimensioning.vidaUtil || 25,
          inflacaoEnergia: currentDimensioning.inflacaoEnergia || 4.5,
          taxaDesconto: currentDimensioning.taxaDesconto || 8.0,
        };
        
        console.log('💵 === PARÂMETROS FINANCEIROS DETALHADOS ===');
        console.log(`💰 Investimento total: R$ ${totalInvestment.toLocaleString('pt-BR')}`);
        console.log(`⚡ Tarifa energia (Grupo B): R$ ${(parametrosFinanceiros.tarifaEnergiaB).toFixed(4)}/kWh`);
        console.log(`🔌 Custo do fio B: R$ ${(parametrosFinanceiros.custoFioB).toFixed(4)}/kWh`);
        console.log(`⏳ Vida útil do sistema: ${parametrosFinanceiros.vidaUtil} anos`);
        console.log(`📈 Inflação energia: ${parametrosFinanceiros.inflacaoEnergia}% ao ano`);
        console.log(`📊 Taxa de desconto: ${parametrosFinanceiros.taxaDesconto}% ao ano`);
        
        // Cálculos derivados dos parâmetros
        const tarifaEfetiva = parametrosFinanceiros.tarifaEnergiaB - parametrosFinanceiros.custoFioB;
        console.log(`💡 Tarifa efetiva (energia - fio B): R$ ${tarifaEfetiva.toFixed(4)}/kWh`);
        
        // Usar API Python para cálculos financeiros básicos
        const basicFinancialApiInput = {
          investimento_inicial: parametrosFinanceiros.totalInvestment,
          geracao_mensal: parametrosFinanceiros.geracaoEstimadaMensal,
          consumo_mensal: parametrosFinanceiros.consumoMensal,
          tarifa_energia: parametrosFinanceiros.tarifaEnergiaB,
          custo_fio_b: parametrosFinanceiros.custoFioB,
          vida_util: parametrosFinanceiros.vidaUtil,
          taxa_desconto: parametrosFinanceiros.taxaDesconto,
          inflacao_energia: parametrosFinanceiros.inflacaoEnergia,
          degradacao_modulos: 0.5,
          custo_om: parametrosFinanceiros.totalInvestment * 0.01,
          inflacao_om: 4.0,
          modalidade_tarifaria: 'convencional'
        };
        
        const financialApiResponse = await apiClient.solarAnalysis.calculateAdvancedFinancial(basicFinancialApiInput);
        const financialResults = financialApiResponse.data;
        console.log('📊 === RESULTADOS FINANCEIROS CALCULADOS ===');
        if (financialResults) {
          console.log(`💰 Payback calculado: ${(financialResults.payback || 0).toFixed(2)} anos`);
          console.log(`📈 VPL calculado: R$ ${(financialResults.vpl || 0).toLocaleString('pt-BR')}`);
          console.log(`📊 TIR calculada: ${((financialResults.tir || 0) * 100).toFixed(2)}%`);
          console.log(`💵 Economia anual calculada: R$ ${((financialResults as any).economiaAnual || 0).toLocaleString('pt-BR')}`);
        } else {
          console.log('⚠️ Nenhum resultado financeiro calculado');
        }

        // Análise financeira avançada
        const advancedFinancialInput: AdvancedFinancialInput = {
          investimentoInicial: totalInvestment,
          geracaoMensal: geracaoEstimadaMensal,
          consumoMensal: totalConsumoMensal,
          tarifaEnergia: currentDimensioning.tarifaEnergiaB || 0.8,
          custoFioB: currentDimensioning.custoFioB || (currentDimensioning.tarifaEnergiaB || 0.8) * 0.3,
          vidaUtil: currentDimensioning.vidaUtil || 25,
          taxaDesconto: currentDimensioning.taxaDesconto || 8.0,
          inflacaoEnergia: currentDimensioning.inflacaoEnergia || 4.5,
          degradacaoModulos: 0.5, // Usar valor padrão por enquanto
          custoOM: totalInvestment * 0.01, // 1% do investimento por ano
          inflacaoOM: 4.0,
          modalidadeTarifaria: 'convencional'
        };

        // Usar API Python para cálculos financeiros
        const financialApiInput = {
          investimento_inicial: advancedFinancialInput.investimentoInicial,
          geracao_mensal: advancedFinancialInput.geracaoMensal,
          consumo_mensal: advancedFinancialInput.consumoMensal,
          tarifa_energia: advancedFinancialInput.tarifaEnergia,
          custo_fio_b: advancedFinancialInput.custoFioB,
          vida_util: advancedFinancialInput.vidaUtil,
          taxa_desconto: advancedFinancialInput.taxaDesconto,
          inflacao_energia: advancedFinancialInput.inflacaoEnergia,
          degradacao_modulos: advancedFinancialInput.degradacaoModulos,
          custo_om: advancedFinancialInput.custoOM,
          inflacao_om: advancedFinancialInput.inflacaoOM,
          modalidade_tarifaria: advancedFinancialInput.modalidadeTarifaria || 'convencional'
        };
        
        const advancedFinancialApiResponse = await apiClient.solarAnalysis.calculateAdvancedFinancial(financialApiInput);
        const advancedFinancialResults = advancedFinancialApiResponse.data;
        const scenarioAnalysis = null; // TODO: Implementar endpoint de cenários na API Python


        let results = {
          formData: currentDimensioning,
          potenciaPico,
          numeroModulos,
          areaEstimada,
          geracaoEstimadaAnual, // Do resumo sistema
          geracaoEstimadaMensal,
          consumoTotalAnual,
          totalInvestment,
          // Resultados avançados de irradiação solar
          advancedSolar: {
            irradiacaoMensal: advancedResults.irradiacaoMensal,
            irradiacaoInclinada: advancedResults.irradiacaoInclinada,
            fatorTemperatura: advancedResults.fatorTemperatura,
            perdas: advancedResults.perdas,
            performance: advancedResults.performance,
            geracaoEstimada: advancedResults.geracaoEstimada
          },
          // Análise financeira avançada
          advancedFinancial: {
            ...advancedFinancialResults,
            scenarios: scenarioAnalysis
          },
          // Resultados financeiros básicos (compatibilidade)
          ...financialResults,
        };

        console.log('✅ === CÁLCULO FINALIZADO COM SUCESSO ===');
        console.log('📈 Resumo dos resultados:', {
          potencia_pico: potenciaPico,
          numero_modulos: numeroModulos,
          area_estimada: areaEstimada,
          geracao_anual: geracaoEstimadaAnual, // Do resumo sistema
          investimento_total: totalInvestment,
          payback: financialResults.payback,
          vpl: financialResults.vpl,
          tir: financialResults.tir
        });

        // Log: Finalizando todos os cálculos
        console.log('✅ === TODOS OS CÁLCULOS FINALIZADOS ===');
        console.log('🎯 Resultados finais completos:', {
          potenciaPico: `${(potenciaPico || 0).toFixed(2)} kWp`,
          numeroModulos: numeroModulos || 0,
          areaEstimada: `${(areaEstimada || 0).toFixed(2)} m²`, 
          geracaoAnual: `${(geracaoEstimadaAnual || 0).toFixed(0)} kWh/ano`,
          investimentoTotal: `R$ ${(totalInvestment || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
          payback: `${(financialResults?.payback || 0).toFixed(1)} anos`,
          vpl: `R$ ${(financialResults?.vpl || 0).toLocaleString('pt-BR')}`,
          tir: `${((financialResults?.tir || 0) * 100).toFixed(2)}%`,
          economiaAnual: `R$ ${((financialResults as any)?.economiaAnual || 0).toLocaleString('pt-BR')}`,
          co2Evitado: `${((advancedResults as any)?.co2Savings || 0).toFixed(0)} kg/ano`
        });
        
        console.log('🔍 Detalhes técnicos completos:', {
          irradiacaoMedia: `${(irradiacaoMediaAnual || 0).toFixed(2)} kWh/m²/dia`,
          hsol: `${((advancedResults as any)?.hsol || 0).toFixed(2)} horas`,
          pr: `${((advancedResults as any)?.pr || 0).toFixed(3)}`,
          fatorCapacidade: `${((advancedResults as any)?.capacityFactor || 0).toFixed(1)}%`,
          consumoTotal: `${(consumoTotalAnual || 0).toFixed(0)} kWh/ano`,
          autossuficiencia: `${(((geracaoEstimadaAnual||0)/(consumoTotalAnual||1))*100).toFixed(1)}%`
        });
        
        console.log('💰 === ANÁLISE FINANCEIRA DETALHADA ===');
        console.log(`💵 Investimento inicial: R$ ${(totalInvestment || 0).toLocaleString('pt-BR')}`);
        console.log(`📈 Economia anual: R$ ${((financialResults as any)?.economiaAnual || 0).toLocaleString('pt-BR')}`);
        console.log(`📅 Economia mensal: R$ ${(((financialResults as any)?.economiaAnual || 0)/12).toLocaleString('pt-BR')} (economia anual ÷ 12)`);
        console.log(`⏱️ Payback simples: ${(financialResults?.payback || 0).toFixed(1)} anos`);
        console.log(`📊 VPL (25 anos): R$ ${(financialResults?.vpl || 0).toLocaleString('pt-BR')}`);
        console.log(`📈 TIR: ${((financialResults?.tir || 0) * 100).toFixed(2)}%`);
        console.log(`💰 Economia total (25 anos): R$ ${(((financialResults as any)?.economiaAnual || 0) * 25).toLocaleString('pt-BR')} (economia anual × 25)`);
        
        // Cálculos adicionais do resumo financeiro
        const economiaAnual = ((financialResults as any)?.economiaAnual || 0);
        const paybackMeses = (financialResults?.payback || 0) * 12;
        const roiAnual = totalInvestment > 0 ? (economiaAnual / totalInvestment) * 100 : 0;
        
        console.log('🔢 === CÁLCULOS DO RESUMO FINANCEIRO ===');
        console.log(`⏰ Payback em meses: ${paybackMeses.toFixed(1)} meses (${(financialResults?.payback || 0).toFixed(1)} anos × 12)`);
        console.log(`📊 ROI anual: ${roiAnual.toFixed(2)}% (economia anual ÷ investimento × 100)`);
        console.log(`💡 Economia por kWh gerado: R$ ${(geracaoEstimadaAnual > 0 ? economiaAnual / geracaoEstimadaAnual : 0).toFixed(3)}/kWh`);
        console.log(`🏠 Economia mensal por R$ investido: R$ ${(totalInvestment > 0 ? (economiaAnual/12) / (totalInvestment/1000) : 0).toFixed(2)} por R$ 1.000 investidos`);
        
        // Tentar integração com backend se habilitado
        if (shouldUseBackendCalculations()) {
          try {
            console.log('🌐 === INTEGRAÇÃO COM BACKEND (FORM - SEM PROJETO) ===');
            
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
        
        console.log('📊 === FORM: DIMENSIONAMENTO CONCLUÍDO ===');

        onCalculationComplete(results);
        
        // Finalizar logging
        logger.endCalculationSection('CÁLCULO DE DIMENSIONAMENTO PV - SISTEMA SOLAR FOTOVOLTAICO', {
          potenciaPico: `${potenciaPico} kWp`,
          numeroModulos: `${numeroModulos} unidades`,
          areaEstimada: `${areaEstimada.toFixed(1)} m²`,
          geracaoAnual: `${geracaoEstimadaAnual.toFixed(0)} kWh/ano`,
          investimento: `R$ ${totalInvestment.toLocaleString('pt-BR')}`
        });

        // Notificação de conclusão
        notificationManager.calculationComplete(results);
        
        toast({ 
          title: "Cálculo concluído!", 
          description: "Resultados disponíveis na próxima tela. Verifique o console do navegador (F12) para logs detalhados." 
        });

      } catch (error) {
        console.error("Calculation Error:", error);
        toast({ 
          variant: "destructive", 
          title: "Erro no cálculo", 
          description: "Ocorreu um erro inesperado. Verifique os dados e tente novamente." 
        });
      } finally {
        setIsCalculating(false);
      }
    }, 1500);
  };

  const handleNewDimensioning = () => {
    updateDimensioning({
      dimensioningName: '',
      customer: undefined,
      irradiacaoMensal: Array(12).fill(5.0),
      potenciaModulo: 550,
      eficienciaSistema: 85,
      numeroModulos: 0,
      energyBills: [{
        id: crypto.randomUUID(),
        name: 'Conta Principal',
        consumoMensal: Array(12).fill(500)
      }],
      custoEquipamento: 0,
      custoMateriais: 0,
      custoMaoDeObra: 0,
      bdi: 25,
      tarifaEnergiaB: 0.75,
      custoFioB: 0.30,
      inverters: [{
        id: crypto.randomUUID(),
        selectedInverterId: '',
        quantity: 1
      }],
    });
    
    toast({ 
      title: "Novo dimensionamento", 
      description: "Dimensionamento limpo, você pode começar uma nova análise." 
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl shadow-lg">
              <Sun className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Dimensionamento Fotovoltaico
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
            {currentDimensioning.dimensioningName || currentDimensioning.customer?.name || 'Selecione um lead para dimensionar o sistema solar.'}
          </p>
        </motion.div>

        {/* Validation Panel */}
        <div className="mb-8">
          <ValidationPanel
            formData={currentDimensioning}
            onValidationChange={handleValidationChange}
            autoValidate={false}
            collapsed={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <CustomerDataForm 
              formData={currentDimensioning} 
              onFormChange={handleFormChange}
              isLeadLocked={!!currentDimensioning.customer && !!currentDimensioning.customer.type && currentDimensioning.customer.type === 'lead'}
            />
            <LocationForm 
              formData={currentDimensioning} 
              onFormChange={handleFormChange} 
            />
            <SystemParametersForm 
              formData={currentDimensioning} 
              onFormChange={handleFormChange} 
            />
            <EquipmentSelectionForm 
              formData={currentDimensioning} 
              onFormChange={handleFormChange} 
            />
            {/* Dimensionamento de Circuitos CA - Comentado temporariamente
            <CableSizingForm 
              formData={currentDimensioning} 
              onFormChange={handleFormChange} 
            />
            */}
          </div>

          <div className="space-y-8">
            <ConsumptionForm 
              formData={currentDimensioning} 
              onFormChange={handleFormChange} 
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
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center items-center gap-4 pt-10"
        >
          <Button 
            onClick={handleNewDimensioning} 
            variant="outline" 
            className="text-green-600 dark:text-green-400 border-green-500 hover:bg-green-500/20 hover:text-green-700 dark:hover:text-green-300"
          >
            <FilePlus className="w-4 h-4 mr-2" /> 
            Novo Dimensionamento
          </Button>
          
          <div className="relative">
            <Button 
              onClick={() => {
                console.log('🔘 Botão Salvar clicado!', {
                  isSaving,
                  customer: currentDimensioning.customer,
                  dimensioningName: currentDimensioning.dimensioningName
                });
                saveDimensioning();
              }} 
              disabled={isSaving || !currentDimensioning.customer || !currentDimensioning.dimensioningName?.trim()}
              variant="outline" 
              className="text-blue-600 dark:text-blue-400 border-blue-500 hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FilePlus className="w-4 h-4" />
                  Salvar Dimensionamento
                </div>
              )}
            </Button>
            
            {/* Mostrar requisitos quando botão estiver desabilitado */}
            {(!currentDimensioning.customer || !currentDimensioning.dimensioningName?.trim()) && !isSaving && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg shadow-lg z-10 min-w-64">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Para salvar, preencha:
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                  {!currentDimensioning.customer && (
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                      Lead selecionado
                    </li>
                  )}
                  {!currentDimensioning.dimensioningName?.trim() && (
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                      Nome do dimensionamento
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
          

          {/* Backup Manager - em posição destacada */}
          <div className="w-full max-w-4xl mx-auto mb-8">
            <BackupManager
              dimensioning={currentDimensioning}
              onRestore={handleRestoreBackup}
              userInfo={{
                userId: 'current-user', // Em implementação real, vem do contexto de auth
                name: currentDimensioning.customer?.name
              }}
            />
          </div>
          
          <Button 
            onClick={handleCalculate} 
            disabled={isCalculating} 
            size="lg" 
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-10 py-6 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            {isCalculating ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Calculando...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <BarChart className="w-6 h-6" /> 
                Ver Resultados
              </div>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default PVDesignForm;