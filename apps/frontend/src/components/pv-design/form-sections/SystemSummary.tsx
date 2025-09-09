import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Zap, 
  Sun, 
  Calculator, 
  Wrench, 
  TrendingUp,
  Loader,
  RefreshCw,
  Settings
} from 'lucide-react';
import { FrontendCalculationLogger } from '@/lib/calculationLogger';
import { SystemCalculations, SystemCalculationResults } from '@/lib/systemCalculations';
import { useSolarSystemCalculation } from '@/hooks/useSolarSystemCalculation';

interface SystemSummaryProps {
  formData: any;
  className?: string;
  onDimensioningChange?: (newData: any) => void;
}

const SystemSummary: React.FC<SystemSummaryProps> = ({ formData, className = '', onDimensioningChange }) => {
  // All hooks must be declared at the top level
  const [systemResults, setSystemResults] = useState<SystemCalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [dimensioningPercentage, setDimensioningPercentage] = useState<number>(100);
  const [originalModuleCount, setOriginalModuleCount] = useState<number>(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Hook para cálculo via serviço Python
  const { 
    isLoading: isPythonCalculating, 
    result: pythonResult,
    advancedResult: advancedPythonResult,
    calculateFromDimensioning,
    calculateAdvancedFromDimensioning
  } = useSolarSystemCalculation();

  // Variables that depend on formData
  const hasConsumptionData = formData.energyBills && formData.energyBills.length > 0;
  const consumoTotalAnual = formData.energyBills?.reduce((acc: number, bill: any) => {
    return acc + bill.consumoMensal.reduce((sum: number, consumo: number) => sum + consumo, 0);
  }, 0) || 0;
  const logger = new FrontendCalculationLogger(`system-summary-${Date.now()}`);

  // useCallback hooks
  const handleDimensioningChange = useCallback(async (newPercentage: number) => {
    if (!advancedPythonResult || !originalModuleCount || !onDimensioningChange) return;
    
    setIsRecalculating(true);
    
    try {
      // Calcular novo número de módulos baseado no percentual
      const targetCoverage = newPercentage / 100; // Converter para decimal
      const originalCoverage = advancedPythonResult.cobertura_percentual / 100;
      const newModuleCount = Math.round((originalModuleCount * targetCoverage) / originalCoverage);
      
      console.log('🔄 Recalculando dimensionamento:', {
        newPercentage,
        originalModuleCount,
        originalCoverage: advancedPythonResult.cobertura_percentual,
        newModuleCount
      });

      // Preparar novos dados para recalcular
      const newFormData = {
        ...formData,
        numeroModulos: newModuleCount,
        dimensionamentoPercentual: newPercentage,
        // Enviar num_modules para forçar o uso deste número específico
        num_modules: newModuleCount
      };

      // Recalcular com novo número de módulos
      await calculateAdvancedFromDimensioning(newFormData);
      
      // Notificar mudança para componente pai
      onDimensioningChange(newFormData);
      
    } catch (error) {
      console.error('Erro no recálculo:', error);
    } finally {
      setIsRecalculating(false);
    }
  }, [advancedPythonResult, originalModuleCount, formData, calculateAdvancedFromDimensioning, onDimensioningChange]);

  // useEffect hooks
  useEffect(() => {
    if (advancedPythonResult) {
      console.log('🔍 DEBUG - advancedPythonResult recebido:', {
        potencia_total_kw: advancedPythonResult.potencia_total_kw,
        energia_total_anual_kwh: advancedPythonResult.energia_total_anual_kwh,
        area_necessaria_m2: advancedPythonResult.area_necessaria_m2,
        num_modulos: advancedPythonResult.num_modulos,
        cobertura_percentual: advancedPythonResult.cobertura_percentual
      });
      
      // Definir o percentual inicial baseado na cobertura da API
      if (advancedPythonResult.cobertura_percentual > 0) {
        setDimensioningPercentage(Math.round(advancedPythonResult.cobertura_percentual));
        setOriginalModuleCount(advancedPythonResult.num_modulos);
      }
    }
  }, [advancedPythonResult]);

  // Effect para calcular sistema automaticamente
  useEffect(() => {
    const calculateSystem = async () => {
      if (consumoTotalAnual > 0) {
        setIsCalculating(true);
        
        logger.startCalculationSection('RESUMO AUTOMÁTICO DO SISTEMA - EXIBIÇÃO PASSO 5');
        
        // Primeiro tentar cálculo avançado via serviço Python
        let pythonCalculationSucceeded = false;
        try {
          // Verificar se temos equipamentos selecionados para usar cálculo avançado
          const hasSelectedEquipments = formData.selectedModules?.length > 0 || formData.inverters?.length > 0;
          
          if (hasSelectedEquipments) {
            await calculateAdvancedFromDimensioning(formData);
            logger.info('Python', 'Cálculo avançado via serviço Python realizado com sucesso');
          } else {
            await calculateFromDimensioning(formData);
            logger.info('Python', 'Cálculo básico via serviço Python realizado com sucesso');
          }
          
          pythonCalculationSucceeded = true;
          
          // Se Python funcionou, aguardar um pouco para garantir que o resultado foi setado
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          logger.info('Python', 'Cálculo Python não disponível, usando fallback local', { error: error?.toString() });
        }
        
        logger.context('Resumo', 'Calculando resumo automático do sistema fotovoltaico', {
          consumoTotalAnual,
          numeroContas: formData.energyBills?.length,
          temNumeroModulosDefinido: !!(formData.numeroModulos && formData.numeroModulos > 0),
          temDadosLocalizacao: !!(formData.latitude && formData.longitude),
          orientacao: formData.orientacao,
          inclinacao: formData.inclinacao
        }, 'Cálculos automáticos executados quando o resumo do sistema é exibido no passo 5 do formulário');

        logger.formula('Consumo', 'Consumo Total Anual',
          'C_anual = Σ(contas) → Σ(meses)',
          {
            contas: formData.energyBills?.map((bill: any) => ({
              nome: bill.name,
              consumo_mensal: bill.consumoMensal,
              total_conta: bill.consumoMensal.reduce((sum: number, c: number) => sum + c, 0)
            }))
          },
          consumoTotalAnual,
          {
            description: 'Soma de todos os consumos mensais de todas as contas de energia registradas',
            units: 'kWh/ano',
            references: ['Dados inseridos pelo usuário no formulário']
          }
        );

        // Só executar cálculos locais se Python não funcionou
        if (!pythonCalculationSucceeded) {
          try {
            // Usar cálculos padronizados com possível integração PVLIB
            const results = await SystemCalculations.calculate({
            numeroModulos: formData.numeroModulos || 0,
            potenciaModulo: formData.potenciaModulo || 550,
            irradiacaoMensal: formData.irradiacaoMensal || Array(12).fill(4.5),
            eficienciaSistema: formData.eficienciaSistema || 85,
            systemLosses: {
              perdaSombreamento: formData.perdaSombreamento,
              perdaMismatch: formData.perdaMismatch,
              perdaCabeamento: formData.perdaCabeamento,
              perdaSujeira: formData.perdaSujeira,
              perdaInversor: formData.perdaInversor,
              temperatura: formData.perdaTemperatura
            },
            dimensionamentoPercentual: formData.dimensionamentoPercentual || 100,
            consumoAnual: consumoTotalAnual > 0 ? consumoTotalAnual : undefined,
            // Dados para PVLIB (usar padrões se não definidos)
            latitude: formData.latitude || -23.5505,  // São Paulo como padrão
            longitude: formData.longitude || -46.6333, // São Paulo como padrão  
            orientacao: formData.orientacao || 180,    // Norte geográfico
            inclinacao: formData.inclinacao || 23      // Ângulo ótimo para Brasil
          });

          setSystemResults(results);

          if (results.usedPVLIB) {
            logger.context('PVLIB', 'Cálculo usando PVLIB para maior precisão', {
              latitude: formData.latitude,
              longitude: formData.longitude,
              orientacao: formData.orientacao,
              inclinacao: formData.inclinacao
            }, 'Sistema detectou dados de orientação/inclinação válidos e usou PVLIB');
          } else {
            logger.context('PVGIS', 'Cálculo usando dados PVGIS tradicionais', {
              motivo: !formData.latitude ? 'Sem localização' : 
                      (formData.orientacao === 0 && formData.inclinacao === 0) ? 'Sistema horizontal' : 'Fallback'
            }, 'Sistema usou cálculos PVGIS por limitações nos dados');
          }

          logger.endCalculationSection('RESUMO AUTOMÁTICO DO SISTEMA - EXIBIÇÃO PASSO 5', {
            potenciaPico: `${results.potenciaPico?.toFixed(2) || '0.00'} kWp`,
            numeroModulos: `${results.numeroModulos} × ${formData.potenciaModulo || 550}W`,
            areaEstimada: `${results.areaEstimada?.toFixed(1) || '0.0'} m²`,
            geracaoAnual: `${Math.round(results.geracaoEstimadaAnual)} kWh/ano`,
            coberturaConsumo: results.coberturaConsumo ? `${Math.round(results.coberturaConsumo)}%` : 'N/A',
            metodologiaUsada: results.usedPVLIB ? 'PVLIB (alta precisão)' : 'PVGIS (padrão)'
          });

        } catch (error) {
          console.error('Erro ao calcular sistema:', error);
          // Fallback para cálculo síncrono simples se houver erro
          const fallbackResults = await SystemCalculations.calculate({
            numeroModulos: formData.numeroModulos || 0,
            potenciaModulo: formData.potenciaModulo || 550,
            irradiacaoMensal: formData.irradiacaoMensal || Array(12).fill(4.5),
            eficienciaSistema: formData.eficienciaSistema || 85,
            systemLosses: {
              perdaSombreamento: formData.perdaSombreamento,
              perdaMismatch: formData.perdaMismatch,
              perdaCabeamento: formData.perdaCabeamento,
              perdaSujeira: formData.perdaSujeira,
              perdaInversor: formData.perdaInversor,
              temperatura: formData.perdaTemperatura
            },
            dimensionamentoPercentual: formData.dimensionamentoPercentual || 100,
            consumoAnual: consumoTotalAnual > 0 ? consumoTotalAnual : undefined,
            // Dados para PVLIB (usar padrões se não definidos)
            latitude: formData.latitude || -23.5505,
            longitude: formData.longitude || -46.6333,
            orientacao: formData.orientacao || 180,
            inclinacao: formData.inclinacao || 23
          });
          setSystemResults(fallbackResults);
          } finally {
            setIsCalculating(false);
          }
        } else {
          // Python funcionou, aguardar um pouco mais para garantir que os dados chegaram
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Se ainda não temos systemResults, criar um básico para evitar erro
          if (!systemResults) {
            setSystemResults({
              potenciaPico: 0, // Os dados do Python vão sobrescrever na renderização
              numeroModulos: formData.numeroModulos || 0,
              areaEstimada: 0,
              geracaoEstimadaAnual: 0,
              geracaoEstimadaMensal: Array(12).fill(0),
              irradiacaoMediaAnual: formData.irradiacaoMensal ? formData.irradiacaoMensal.reduce((a: number, b: number) => a + b, 0) / 12 : 4.5,
              coberturaConsumo: undefined,
              usedPVLIB: false
            });
          }
          setIsCalculating(false);
        }
      }
    };

    calculateSystem();
  }, [
    consumoTotalAnual,
    formData.numeroModulos,
    formData.potenciaModulo,
    formData.irradiacaoMensal,
    formData.eficienciaSistema,
    formData.dimensionamentoPercentual,
    formData.latitude,
    formData.longitude,
    formData.orientacao,
    formData.inclinacao
  ]);

  // Se ainda está calculando ou não há resultados, mostrar loading ou valores padrão
  if (isCalculating || !systemResults) {
    return (
      <Card className={`glass border-orange-400/30 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            {isCalculating ? <Loader className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
            Resumo do Sistema Fotovoltaico
            {isCalculating && <span className="text-sm font-normal">Calculando...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-muted-foreground">
              {isCalculating ? (
                <>
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p>Processando cálculos do sistema...</p>
                </>
              ) : (
                <p>Carregando dados do sistema...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Usar dados do Python (avançado primeiro, depois básico) se disponíveis, senão usar cálculos locais

  // Função helper para garantir valores numéricos válidos
  const safeNumber = (value: any, fallback: number = 0): number => {
    const num = typeof value === 'number' ? value : parseFloat(value);
    return !isNaN(num) && isFinite(num) ? num : fallback;
  };

  const potenciaPico = safeNumber(advancedPythonResult?.potencia_total_kw || pythonResult?.potenciaPico || systemResults.potenciaPico);
  const areaEstimada = safeNumber(advancedPythonResult?.area_necessaria_m2 || pythonResult?.areaNecessaria || systemResults.areaEstimada);
  const geracaoEstimadaAnual = safeNumber(advancedPythonResult?.energia_total_anual_kwh || pythonResult?.geracaoAnual || systemResults.geracaoEstimadaAnual);
  const numeroModulosCalculado = safeNumber(advancedPythonResult?.num_modulos || systemResults.numeroModulos);
  
  const { 
    numeroModulos, 
    irradiacaoMediaAnual,
    coberturaConsumo,
    usedPVLIB
  } = systemResults;
  
  // Usar número de módulos calculado se disponível
  const finalNumeroModulos = numeroModulosCalculado || numeroModulos;
  
  // Cobertura do consumo dos dados avançados se disponível
  const finalCoberturaConsumo = safeNumber(advancedPythonResult?.cobertura_percentual || coberturaConsumo);
  
  // Inversor selecionado
  const inversorSelecionado = formData.inverters?.[0] || null;
  const potenciaInversor = inversorSelecionado?.power || formData.potenciaInversor;
  const modeloInversor = inversorSelecionado?.name || formData.modeloInversor;


  return (
    <Card className={`glass border-orange-400/30 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Calculator className="w-5 h-5" />
          Resumo do Sistema Fotovoltaico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Especificações Técnicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-100/80 to-blue-200/80 dark:from-blue-500/20 dark:to-blue-600/20 p-4 rounded-lg border border-blue-300/50 dark:border-blue-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Potência Pico</span>
            </div>
            {isRecalculating ? (
              <div className="flex items-center gap-2">
                <Loader className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-lg text-blue-600 dark:text-blue-400">Calculando...</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-100">{potenciaPico?.toFixed(2) || '0.00'} kWp</p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">{finalNumeroModulos} módulos de {formData.potenciaModulo || 550}W</p>
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-green-100/80 to-green-200/80 dark:from-green-500/20 dark:to-green-600/20 p-4 rounded-lg border border-green-300/50 dark:border-green-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Geração Anual</span>
            </div>
            {isRecalculating ? (
              <div className="flex items-center gap-2">
                <Loader className="w-5 h-5 animate-spin text-green-600" />
                <span className="text-lg text-green-600 dark:text-green-400">Calculando...</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-green-800 dark:text-green-100">{Math.round(geracaoEstimadaAnual).toLocaleString()} kWh</p>
                <p className="text-xs text-green-600 dark:text-green-300 mt-1">~{Math.round(geracaoEstimadaAnual/12)} kWh/mês</p>
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-100/80 to-purple-200/80 dark:from-purple-500/20 dark:to-purple-600/20 p-4 rounded-lg border border-purple-300/50 dark:border-purple-400/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Área Necessária</span>
            </div>
            {isRecalculating ? (
              <div className="flex items-center gap-2">
                <Loader className="w-5 h-5 animate-spin text-purple-600" />
                <span className="text-lg text-purple-600 dark:text-purple-400">Calculando...</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">{areaEstimada?.toFixed(0) || '0'} m²</p>
                <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">Para instalação dos módulos</p>
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-100/80 to-amber-200/80 dark:from-amber-500/20 dark:to-amber-600/20 p-4 rounded-lg border border-amber-300/50 dark:border-amber-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Inversor</span>
            </div>
            {isRecalculating ? (
              <div className="flex items-center gap-2">
                <Loader className="w-5 h-5 animate-spin text-amber-600" />
                <span className="text-lg text-amber-600 dark:text-amber-400">Calculando...</span>
              </div>
            ) : (
              <>
                {potenciaInversor ? (
                  <>
                    <p className="text-lg font-bold text-amber-800 dark:text-amber-100">{potenciaInversor} kW</p>
                    <p className="text-xs text-amber-600 dark:text-amber-300 mt-1 truncate">{modeloInversor || 'A definir'}</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-amber-800 dark:text-amber-100">A definir</p>
                    <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">Selecione o inversor</p>
                  </>
                )}
              </>
            )}
          </div>
        </div>


        {/* Cobertura do Consumo */}
        {consumoTotalAnual > 0 && finalCoberturaConsumo > 0 && (
          <>
            <Separator className="bg-border/50" />
            <div className="bg-green-100/60 dark:bg-green-900/20 border border-green-300/60 dark:border-green-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700 dark:text-green-300">Cobertura do Consumo</span>
                {isRecalculating ? (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-green-600" />
                    <span className="text-sm text-green-600">Calculando...</span>
                  </div>
                ) : (
                  <Badge 
                    variant="secondary" 
                    className="bg-green-200/80 dark:bg-green-500/20 text-green-800 dark:text-green-300 border-green-400/60 dark:border-green-500/30"
                  >
                    {Math.round(finalCoberturaConsumo)}%
                  </Badge>
                )}
              </div>
              {isRecalculating ? (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Recalculando cobertura...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-600 dark:text-green-400 mb-1">Consumo Anual</p>
                    <p className="text-green-800 dark:text-green-100 font-medium">{Math.round(consumoTotalAnual).toLocaleString()} kWh</p>
                  </div>
                  <div>
                    <p className="text-green-600 dark:text-green-400 mb-1">Geração Estimada</p>
                    <p className="text-green-800 dark:text-green-100 font-medium">{Math.round(geracaoEstimadaAnual).toLocaleString()} kWh</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Informações de Compatibilidade do Sistema (apenas se disponíveis) */}
        {advancedPythonResult?.compatibilidade_sistema && (
          <>
            <Separator className="bg-border/50" />
            <div className="bg-blue-50/60 dark:bg-blue-900/20 border border-blue-300/60 dark:border-blue-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Compatibilidade do Sistema</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${advancedPythonResult.compatibilidade_sistema.compatibilidade_tensao ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-blue-700 dark:text-blue-300">Tensão: {advancedPythonResult.compatibilidade_sistema.compatibilidade_tensao ? 'Compatível' : 'Incompatível'}</span>
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  <span>Strings: {advancedPythonResult.compatibilidade_sistema.strings_recomendadas}</span>
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  <span>Utilização: {advancedPythonResult.compatibilidade_sistema.utilizacao_inversor?.toFixed(1) || '0.0'}%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Controle de Dimensionamento Percentual */}
        {advancedPythonResult && originalModuleCount > 0 && (
          <>
            <Separator className="bg-border/50" />
            <div className="bg-orange-50/60 dark:bg-orange-900/20 border border-orange-300/60 dark:border-orange-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Dimensionamento do Sistema</span>
                {isRecalculating && <Loader className="w-4 h-4 animate-spin text-orange-600" />}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-600 dark:text-orange-400">Cobertura do Consumo</span>
                  <span className="font-medium text-orange-800 dark:text-orange-200">
                    {dimensioningPercentage}%
                  </span>
                </div>
                
                <Slider
                  value={[dimensioningPercentage]}
                  onValueChange={([value]) => {
                    setDimensioningPercentage(value);
                  }}
                  onValueCommit={([value]) => {
                    handleDimensioningChange(value);
                  }}
                  min={50}
                  max={150}
                  step={5}
                  className="w-full"
                  disabled={isRecalculating}
                />
                
                <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400">
                  <span>50%</span>
                  <span>100%</span>
                  <span>150%</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                  <div>
                    <p className="text-orange-600 dark:text-orange-400 mb-1">Módulos Estimados</p>
                    <p className="text-orange-800 dark:text-orange-100 font-medium">
                      {Math.round((originalModuleCount * dimensioningPercentage) / (advancedPythonResult?.cobertura_percentual || 100))} módulos
                    </p>
                  </div>
                  <div>
                    <p className="text-orange-600 dark:text-orange-400 mb-1">Potência Estimada</p>
                    <p className="text-orange-800 dark:text-orange-100 font-medium">
                      {(() => {
                        const estimatedModules = Math.round((originalModuleCount * dimensioningPercentage) / (advancedPythonResult?.cobertura_percentual || 100));
                        const modulePower = advancedPythonResult?.parametros_completos?.modulo?.potencia_nominal_kw || (formData.potenciaModulo || 540) / 1000;
                        return (estimatedModules * modulePower).toFixed(2);
                      })()} kWp
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemSummary;