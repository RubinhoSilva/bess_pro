import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Sun, BarChart, FilePlus } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useDimensioning } from '@/contexts/DimensioningContext';
import { ProjectType } from '@/types/project';
import { calculateAdvancedFinancials } from '@/lib/financialCalculations';
import { AdvancedSolarCalculator, SolarCalculationOptions } from '@/lib/solarCalculations';
import { AdvancedFinancialAnalyzer, AdvancedFinancialInput } from '@/lib/advancedFinancialAnalysis';
import { NotificationManager } from '@/lib/notificationSystem';
import { CalculationLogDisplayer } from '@/lib/calculationLogger';
import { BackendCalculationService, shouldUseBackendCalculations } from '@/lib/backendCalculations';
import CustomerDataForm from './form-sections/CustomerDataForm';
import ConsumptionForm from './form-sections/ConsumptionForm';
import LocationForm from './form-sections/LocationForm';
import SystemParametersForm from './form-sections/SystemParametersForm';
import EquipmentSelectionForm from './form-sections/EquipmentSelectionForm';
import SystemSummary from './form-sections/SystemSummary';
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
    console.log('🚀 === INICIANDO CÁLCULO DE DIMENSIONAMENTO ===');
    console.log('📊 Dados de entrada:', {
      cliente: currentDimensioning.customer?.name,
      projeto: currentDimensioning.dimensioningName,
      irradiacao: currentDimensioning.irradiacaoMensal,
      potenciaModulo: currentDimensioning.potenciaModulo,
      eficiencia: currentDimensioning.eficienciaSistema,
      numeroModulos: currentDimensioning.numeroModulos,
      energyBills: currentDimensioning.energyBills?.length
    });
    
    setIsCalculating(true);
    setTimeout(async () => {
      try {
        // Validação básica
        console.log('🔍 Executando validações básicas...');
        if (!currentDimensioning.irradiacaoMensal || currentDimensioning.irradiacaoMensal.length !== 12) {
          console.error('❌ Validação falhou: Dados de irradiação mensal ausentes');
          toast({ 
            variant: "destructive", 
            title: "Dados incompletos", 
            description: "Dados de irradiação mensal são obrigatórios." 
          });
          setIsCalculating(false);
          return;
        }

        const irradiacaoMediaAnual = currentDimensioning.irradiacaoMensal.reduce((a: number, b: number) => a + b, 0) / 12;
        console.log('☀️ Irradiação média anual calculada:', {
          valores: currentDimensioning.irradiacaoMensal,
          soma: currentDimensioning.irradiacaoMensal.reduce((a: number, b: number) => a + b, 0),
          media: irradiacaoMediaAnual,
          operacao: 'soma / 12'
        });
        
        if (irradiacaoMediaAnual <= 0 || !currentDimensioning.potenciaModulo || currentDimensioning.potenciaModulo <= 0) {
          console.error('❌ Validação falhou:', {
            irradiacaoMediaAnual,
            potenciaModulo: currentDimensioning.potenciaModulo,
            motivo: 'Valores devem ser maiores que zero'
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
        console.log('🔢 === CÁLCULO DO CONSUMO MENSAL (FORM) ===');
        const totalConsumoMensal = currentDimensioning.energyBills?.reduce((acc: number[], bill: any) => {
          console.log(`📊 Processando conta: ${bill.name}`, {
            consumoMensal: bill.consumoMensal,
            operacao: 'Soma mensal por mês'
          });
          bill.consumoMensal.forEach((consumo: number, index: number) => {
            const valorAnterior = acc[index] || 0;
            acc[index] = valorAnterior + consumo;
            console.log(`   Mês ${index + 1}: ${valorAnterior} + ${consumo} = ${acc[index]} kWh`);
          });
          return acc;
        }, Array(12).fill(0)) || Array(12).fill(0);
        
        console.log('⚡ Consumo total mensal calculado:', {
          valores: totalConsumoMensal,
          total_anual: totalConsumoMensal.reduce((a, b) => a + b, 0),
          operacao: 'soma de todas as contas por mês'
        });

        // Cálculo da potência e número de módulos
        console.log('🔢 === DIMENSIONAMENTO DO SISTEMA (FORM) ===');
        let potenciaPico: number;
        let numeroModulos: number;
        const consumoTotalAnual = totalConsumoMensal.reduce((a: number, b: number) => a + b, 0);
        console.log(`📈 Consumo total anual: ${totalConsumoMensal.join(' + ')} = ${consumoTotalAnual} kWh/ano`);

        // Verifica se há equipamentos selecionados da API (usar dados simulados por enquanto)
        const selectedModules: any[] = [];
        const selectedInverters = currentDimensioning.inverters || [];

        if (selectedModules.length > 0) {
          console.log('🔌 Usando equipamentos selecionados da API');
          // Usar equipamentos selecionados da API
          numeroModulos = selectedModules.reduce((total: number, module: any) => total + module.quantity, 0);
          // Para calcular potência, precisaríamos buscar os dados dos módulos da API
          // Por enquanto, mantemos compatibilidade com o sistema legado
          const modulePower = currentDimensioning.potenciaModulo || 550;
          potenciaPico = (numeroModulos * modulePower) / 1000;
          console.log('⚙️ Cálculo com equipamentos selecionados:', {
            numeroModulos,
            potenciaUnitaria: modulePower,
            potenciaPico,
            operacao: `(${numeroModulos} × ${modulePower}) ÷ 1000`
          });
        } else if (currentDimensioning.numeroModulos && currentDimensioning.numeroModulos > 0) {
          numeroModulos = currentDimensioning.numeroModulos;
          console.log(`🔧 Modo: Número de módulos fixo = ${numeroModulos} módulos`);
          
          const potenciaModuloKW = currentDimensioning.potenciaModulo / 1000;
          potenciaPico = numeroModulos * potenciaModuloKW;
          console.log(`⚡ Potência pico: ${numeroModulos} módulos × ${currentDimensioning.potenciaModulo}W ÷ 1000 = ${potenciaPico.toFixed(2)} kWp`);
        } else {
          console.log('🔧 Modo: Dimensionamento automático baseado no consumo');
          
          const consumoMedioDiario = consumoTotalAnual / 365;
          console.log(`📅 Consumo médio diário: ${consumoTotalAnual} ÷ 365 = ${consumoMedioDiario.toFixed(2)} kWh/dia`);
          
          const eficienciaDecimal = (currentDimensioning.eficienciaSistema || 85) / 100;
          const irradiacaoEfetiva = irradiacaoMediaAnual * eficienciaDecimal;
          console.log(`☀️ Irradiação efetiva: ${irradiacaoMediaAnual.toFixed(2)} × ${eficienciaDecimal} = ${irradiacaoEfetiva.toFixed(2)} kWh/m²/dia`);
          
          potenciaPico = consumoMedioDiario / irradiacaoEfetiva;
          console.log(`⚡ Potência pico: ${consumoMedioDiario.toFixed(2)} ÷ ${irradiacaoEfetiva.toFixed(2)} = ${potenciaPico.toFixed(2)} kWp`);
          
          const potenciaW = potenciaPico * 1000;
          numeroModulos = Math.ceil(potenciaW / currentDimensioning.potenciaModulo);
          console.log(`🔢 Número de módulos: ceil(${potenciaW.toFixed(0)}W ÷ ${currentDimensioning.potenciaModulo}W) = ${numeroModulos} módulos`);
          
          // Recalcular potência real com número inteiro de módulos
          const potenciaReal = (numeroModulos * currentDimensioning.potenciaModulo) / 1000;
          console.log(`⚡ Potência real: ${numeroModulos} × ${currentDimensioning.potenciaModulo}W ÷ 1000 = ${potenciaReal.toFixed(2)} kWp`);
          potenciaPico = potenciaReal;
          
          console.log('⚙️ Cálculo automático:', {
            consumoMedioDiario,
            operacao_potencia: `${consumoMedioDiario} ÷ (${irradiacaoMediaAnual} × ${eficienciaDecimal})`,
            potenciaPico_calculada: potenciaPico,
            operacao_modulos: `ceil((${potenciaPico} × 1000) ÷ ${currentDimensioning.potenciaModulo})`,
            numeroModulos_final: numeroModulos
          });
        }

        // Cálculos avançados de geração usando o AdvancedSolarCalculator
        const areaEstimada = numeroModulos * 2.5;
        console.log('📐 Área estimada calculada:', {
          numeroModulos,
          fator: 2.5,
          areaEstimada,
          operacao: `${numeroModulos} × 2.5`,
          unidade: 'm²'
        });
        
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
          considerarSombreamento: false,
          sombreamento: undefined,
          considerarSujeira: true,
          sujeira: 3
        };

        // Calcular resultados detalhados
        console.log('🔢 === CÁLCULOS SOLARES AVANÇADOS (FORM) ===');
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

        // Usar os resultados avançados para a geração
        const geracaoEstimadaMensal = advancedResults.geracaoEstimada.mensal;
        const geracaoEstimadaAnual = advancedResults.geracaoEstimada.anual;

        console.log('☀️ === RESULTADOS DE GERAÇÃO (FORM) ===');
        console.log('📊 Geração mensal calculada:');
        geracaoEstimadaMensal.forEach((geracao, index) => {
          const irradiacao = currentDimensioning.irradiacaoMensal[index];
          const eficiencia = (currentDimensioning.eficienciaSistema || 85) / 100;
          const diasMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][index];
          console.log(`   Mês ${index + 1}: ${potenciaPico.toFixed(2)} kWp × ${irradiacao} kWh/m²/dia × ${diasMes} dias × ${eficiencia} = ${geracao.toFixed(0)} kWh`);
        });
        console.log(`📈 Geração anual total: ${geracaoEstimadaMensal.map(g => g.toFixed(0)).join(' + ')} = ${geracaoEstimadaAnual.toFixed(0)} kWh/ano`);

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
        
        const financialResults = calculateAdvancedFinancials(parametrosFinanceiros);
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

        const advancedFinancialResults = AdvancedFinancialAnalyzer.calculateAdvancedFinancials(advancedFinancialInput);
        const scenarioAnalysis = AdvancedFinancialAnalyzer.analyzeScenarios(advancedFinancialInput);


        let results = {
          formData: currentDimensioning,
          potenciaPico,
          numeroModulos,
          areaEstimada,
          geracaoEstimadaAnual,
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
          geracao_anual: geracaoEstimadaAnual,
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
        
        // Notificação de conclusão
        notificationManager.calculationComplete(results);
        
        toast({ 
          title: "Cálculo concluído!", 
          description: "Resultados disponíveis na próxima tela." 
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