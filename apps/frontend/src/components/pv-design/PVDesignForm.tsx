import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Sun, BarChart, FilePlus } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useDimensioning } from '@/contexts/DimensioningContext';
import { ProjectType } from '@/types/project';
import { calculateCableSizingForInverter } from '@/lib/cableSizing';
import { calculateAdvancedFinancials } from '@/lib/financialCalculations';
import { AdvancedSolarCalculator, SolarCalculationOptions } from '@/lib/solarCalculations';
import { AdvancedFinancialAnalyzer, AdvancedFinancialInput } from '@/lib/advancedFinancialAnalysis';
import { NotificationManager } from '@/lib/notificationSystem';
import CustomerDataForm from './form-sections/CustomerDataForm';
import ConsumptionForm from './form-sections/ConsumptionForm';
import LocationForm from './form-sections/LocationForm';
import SystemParametersForm from './form-sections/SystemParametersForm';
import EquipmentSelectionForm from './form-sections/EquipmentSelectionForm';
import FinancialForm from './form-sections/FinancialForm';
import PaymentConditionsForm from './form-sections/PaymentConditionsForm';
import EconomicParametersForm from './form-sections/EconomicParametersForm';
// import CableSizingForm from './form-sections/CableSizingForm'; // Temporariamente desabilitado
import IntelligentSizingModal from './intelligent-sizing/IntelligentSizingModal';
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
    createNewDimensioning,
    isSaving
  } = useDimensioning();
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const notificationManager = NotificationManager.getInstance();

  const handleFormChange = (field: string, value: any) => {
    updateDimensioning({ [field]: value });
  };

  const handleApplyConfiguration = (configuration: any) => {
    // Aplicar múltiplos campos de uma vez
    updateDimensioning(configuration);
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
    setIsCalculating(true);
    setTimeout(() => {
      try {
        // Validação básica
        if (!currentDimensioning.irradiacaoMensal || currentDimensioning.irradiacaoMensal.length !== 12) {
          toast({ 
            variant: "destructive", 
            title: "Dados incompletos", 
            description: "Dados de irradiação mensal são obrigatórios." 
          });
          setIsCalculating(false);
          return;
        }

        const irradiacaoMediaAnual = currentDimensioning.irradiacaoMensal.reduce((a: number, b: number) => a + b, 0) / 12;
        
        if (irradiacaoMediaAnual <= 0 || !currentDimensioning.potenciaModulo || currentDimensioning.potenciaModulo <= 0) {
          toast({ 
            variant: "destructive", 
            title: "Valores inválidos", 
            description: "Potência do módulo e irradiação devem ser maiores que zero." 
          });
          setIsCalculating(false);
          return;
        }

        // Cálculo do consumo total mensal
        const totalConsumoMensal = currentDimensioning.energyBills?.reduce((acc: number[], bill: any) => {
          bill.consumoMensal.forEach((consumo: number, index: number) => {
            acc[index] = (acc[index] || 0) + consumo;
          });
          return acc;
        }, Array(12).fill(0)) || Array(12).fill(0);

        // Cálculo da potência e número de módulos
        let potenciaPico: number;
        let numeroModulos: number;
        const consumoTotalAnual = totalConsumoMensal.reduce((a: number, b: number) => a + b, 0);

        // Verifica se há equipamentos selecionados da API (usar dados simulados por enquanto)
        const selectedModules: any[] = [];
        const selectedInverters = currentDimensioning.inverters || [];

        if (selectedModules.length > 0) {
          // Usar equipamentos selecionados da API
          numeroModulos = selectedModules.reduce((total: number, module: any) => total + module.quantity, 0);
          // Para calcular potência, precisaríamos buscar os dados dos módulos da API
          // Por enquanto, mantemos compatibilidade com o sistema legado
          const modulePower = currentDimensioning.potenciaModulo || 550;
          potenciaPico = (numeroModulos * modulePower) / 1000;
        } else if (currentDimensioning.numeroModulos && currentDimensioning.numeroModulos > 0) {
          numeroModulos = currentDimensioning.numeroModulos;
          potenciaPico = (numeroModulos * currentDimensioning.potenciaModulo) / 1000;
        } else {
          const consumoMedioDiario = consumoTotalAnual / 365;
          potenciaPico = (consumoMedioDiario / (irradiacaoMediaAnual * (currentDimensioning.eficienciaSistema || 85) / 100));
          numeroModulos = Math.ceil((potenciaPico * 1000) / currentDimensioning.potenciaModulo);
        }

        // Cálculos avançados de geração usando o AdvancedSolarCalculator
        const areaEstimada = numeroModulos * 2.5;
        
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
        const advancedResults = AdvancedSolarCalculator.calculateDetailedSolar(
          potenciaPico,
          solarOptions
        );

        // Usar os resultados avançados para a geração
        const geracaoEstimadaMensal = advancedResults.geracaoEstimada.mensal;
        const geracaoEstimadaAnual = advancedResults.geracaoEstimada.anual;

        // Cálculos financeiros básicos (manter compatibilidade)
        const financialResults = calculateAdvancedFinancials({
          totalInvestment,
          geracaoEstimadaMensal,
          consumoMensal: totalConsumoMensal,
          tarifaEnergiaB: currentDimensioning.tarifaEnergiaB || 0.8,
          custoFioB: currentDimensioning.custoFioB || (currentDimensioning.tarifaEnergiaB || 0.8) * 0.3,
          vidaUtil: currentDimensioning.vidaUtil || 25,
          inflacaoEnergia: currentDimensioning.inflacaoEnergia || 4.5,
          taxaDesconto: currentDimensioning.taxaDesconto || 8.0,
        });

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

        // Cálculos de dimensionamento de cabos - Comentado temporariamente
        const cableSizingResults: any[] = [];
        /* Dimensionamento de circuitos CA desabilitado temporariamente
        if (currentDimensioning.cableSizing && currentDimensioning.cableSizing.length > 0) {
          currentDimensioning.cableSizing.forEach((cableConfig: any, index: number) => {
            // Em produção real, buscaria a potência do inversor da base de dados
            // Para demo, usa potência estimada baseada no sistema
            const inverterPower = potenciaPico / (currentDimensioning.cableSizing?.length || 1);
            
            const result = calculateCableSizingForInverter({
              inverterPower,
              tipoLigacao: cableConfig.tipoLigacao,
              tensaoCA: cableConfig.tensaoCA,
              tipoCabo: cableConfig.tipoCabo,
              distanciaCircuito: cableConfig.distanciaCircuito,
              metodoInstalacao: cableConfig.metodoInstalacao,
            });

            if (!result.error) {
              cableSizingResults.push({
                inverterName: `Inversor ${index + 1}`,
                ...result
              });
            }
          });
        }
        */

        const results = {
          formData: currentDimensioning,
          potenciaPico,
          numeroModulos,
          areaEstimada,
          geracaoEstimadaAnual,
          geracaoEstimadaMensal,
          consumoTotalAnual,
          totalInvestment,
          cableSizingResults,
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
      // cableSizing: [], // Desabilitado temporariamente
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
            <EconomicParametersForm 
              formData={currentDimensioning} 
              onFormChange={handleFormChange} 
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
          
          
          <IntelligentSizingModal 
            formData={currentDimensioning}
            onApplyConfiguration={handleApplyConfiguration}
          />

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