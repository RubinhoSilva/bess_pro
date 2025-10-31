import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import SystemSummary from './SystemSummary';
import { GenerationChart } from './GenerationChart';
import { PaybackChart } from './PaybackChart';
import { EconomyProjectionChart } from './EconomyProjectionChart';
import { useQuery } from '@tanstack/react-query';

import { AnnualSavingsChart } from './AnnualSavingsChart';
import { AdvancedSolarAnalysis } from './AdvancedSolarAnalysis';
import { AdvancedFinancialAnalysis } from './AdvancedFinancialAnalysis';
import { useDimensioningOperations } from '@/hooks/dimensioning';
import GrupoBFinancialResults from './GrupoBFinancialResults';
import GrupoAFinancialResults from './GrupoAFinancialResults';
import { GrupoConfigAdapter } from '@/types/adapters/grupo-config-adapter';
import { GrupoBAdapter, IGrupoBData } from '@/types/adapters/grupo-b-adapter';
import { GrupoAAdapter, IGrupoAData } from '@/types/adapters/grupo-a-adapter';
import { GrupoTarifarioDetector, GrupoTarifarioRender } from '@/utils/grupo-tarifario-detector';
import { moduleService } from '@/services/ModuleService';
import ProposalGenerator from './ProposalGenerator';

// Store imports
import { usePVDimensioningStore } from '@/store/pv-dimensioning-store';
import { selectResultsData, selectCustomerData, selectEnergyData, selectSystemData, selectRoofData, selectBudgetData, selectSystemSummaryData, selectAggregatedRoofData } from '@/store/selectors/pv-dimensioning-selectors';

interface PVResultsDashboardProps {
  onGenerateProposal?: () => void;
  onBackToWizard?: () => void;
  onBackToForm?: () => void;
  onNewCalculation?: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; delay?: number }> = ({ 
  title, 
  children, 
  delay = 0 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: delay * 0.1 }}
    className="space-y-6"
  >
    <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-200 border-b-2 border-gray-300 dark:border-slate-700 pb-2">
      {title}
    </h2>
    {children}
  </motion.div>
);

// Função para validar e normalizar dados
const validateAndNormalizeResults = (results: any) => {
  if (!results) {
    return null;
  }

  const normalized: any = {
    ...results,
    // Garantir arrays seguros
    fluxoCaixa: Array.isArray(results.fluxoCaixa) ? results.fluxoCaixa : [],
    geracaoEstimadaMensal: Array.isArray(results.geracaoEstimadaMensal) ? results.geracaoEstimadaMensal : Array(12).fill(0),
    selectedInverters: Array.isArray(results.selectedInverters) ? results.selectedInverters : [],
    
    // Normalizar dados numéricos
    potenciaPico: Number(results.potenciaPico) || 0,
    numeroModulos: Number(results.numeroModulos) || 0,
    totalInvestment: Number(results.totalInvestment) || 0,
    economiaAnualEstimada: Number(results.economiaAnualEstimada || results.economiaAnualMedia || results.advancedFinancial?.economiaAnualMedia || results.economiaProjetada || 0), // Será calculado depois
    vpl: Number(results.vpl) || 0,
    tir: Number(results.tir) || 0,
    payback: Number(results.payback) || 0,
    
    // Normalizar dados avançados
    advancedSolar: results.advancedSolar ? {
      ...results.advancedSolar,
      irradiacaoMensal: Array.isArray(results.advancedSolar.irradiacaoMensal) 
        ? results.advancedSolar.irradiacaoMensal 
        : Array(12).fill(0),
      irradiacaoInclinada: Array.isArray(results.advancedSolar.irradiacaoInclinada) 
        ? results.advancedSolar.irradiacaoInclinada 
        : Array(12).fill(0),
      fatorTemperatura: Array.isArray(results.advancedSolar.fatorTemperatura) 
        ? results.advancedSolar.fatorTemperatura 
        : Array(12).fill(1),
      perdas: {
        temperatura: Array.isArray(results.advancedSolar.perdas?.temperatura) 
          ? results.advancedSolar.perdas.temperatura 
          : Array(12).fill(0),
        sombreamento: Array.isArray(results.advancedSolar.perdas?.sombreamento) 
          ? results.advancedSolar.perdas.sombreamento 
          : Array(12).fill(0),
        sujeira: Array.isArray(results.advancedSolar.perdas?.sujeira) 
          ? results.advancedSolar.perdas.sujeira 
          : Array(12).fill(0),
        angular: Array.isArray(results.advancedSolar.perdas?.angular) 
          ? results.advancedSolar.perdas.angular 
          : Array(12).fill(0),
        total: Array.isArray(results.advancedSolar.perdas?.total) 
          ? results.advancedSolar.perdas.total 
          : Array(12).fill(0)
      },
      performance: {
        prMedio: Number(results.advancedSolar.performance?.prMedio) || 0.8,
        yieldEspecifico: Number(results.advancedSolar.performance?.yieldEspecifico) || 1200,
        fatorCapacidade: Number(results.advancedSolar.performance?.fatorCapacidade) || 0.15
      },
      geracaoEstimada: {
        mensal: Array.isArray(results.advancedSolar.geracaoEstimada?.mensal)
          ? results.advancedSolar.geracaoEstimada.mensal
          : Array(12).fill(0),
        anual: Number(results.advancedSolar.geracaoEstimada?.anual) || 0,
        diarioMedio: Number(results.advancedSolar.geracaoEstimada?.diarioMedio) || 0
      },
      geracaoPorOrientacao: results.advancedSolar.geracaoPorOrientacao
    } : null,
    
    advancedFinancial: results.advancedFinancial ? {
      ...results.advancedFinancial,
      cashFlow: Array.isArray(results.advancedFinancial.cashFlow)
        ? results.advancedFinancial.cashFlow
        : [],
      // Garantir que scenarios existe, mesmo que null
      scenarios: results.advancedFinancial.scenarios || null
    } : null
  };

  // Adicionar campos derivados para compatibilidade com componentes PDF
  const geracaoEstimadaMensal: number[] = normalized.geracaoEstimadaMensal || [];
  const geracaoAnualCalculada = geracaoEstimadaMensal.reduce((acc: number, val: number) => acc + val, 0);

  // Calcular ROI se temos dados financeiros
  const economia25Anos = (normalized.economiaAnualEstimada || 0) * 25;
  const roiCalculado = normalized.totalInvestment > 0
    ? ((economia25Anos - normalized.totalInvestment) / normalized.totalInvestment) * 100
    : 0;

  const enrichedResults = {
    ...normalized,
    // Campos derivados para compatibilidade
    potenciaSistema: normalized.potenciaPico, // Já está em kWp
    geracaoAnual: geracaoAnualCalculada, // kWh/ano
    economiaProjetada: normalized.economiaAnualEstimada || (geracaoAnualCalculada * 0.9), // Estimativa: R$ 0.90/kWh média nacional
    performanceRatio: normalized.advancedSolar?.performance?.prMedio || 0.85,
    yield: (normalized.advancedSolar?.performance?.yieldEspecifico && normalized.advancedSolar.performance.yieldEspecifico < 5000) ? normalized.advancedSolar.performance.yieldEspecifico : 1500, // Valor mais realista
    roi: roiCalculado,
    lcoe: normalized.advancedFinancial?.indicadores?.custoNiveladoEnergia || 0
  };

  return enrichedResults;
};

// Componente de erro para dados inválidos
const DataErrorFallback: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center min-h-[400px] p-8"
  >
    <Alert className="max-w-md">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p className="font-medium">Erro ao carregar resultados</p>
          <p className="text-sm text-muted-foreground">{message}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              Tentar Novamente
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  </motion.div>
);

// Componente de loading
const LoadingFallback: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center min-h-[400px] p-8"
  >
    <Loader2 className="h-8 w-8 animate-spin mb-4" />
    <p className="text-muted-foreground">Carregando resultados...</p>
  </motion.div>
);


export const PVResultsDashboard: React.FC<PVResultsDashboardProps> = ({
  onGenerateProposal,
  onBackToWizard,
  onNewCalculation
}) => {
  // Obter dados diretamente do store
  const resultsData = usePVDimensioningStore(selectResultsData);
  const customerData = usePVDimensioningStore(selectCustomerData);
  const energyData = usePVDimensioningStore(selectEnergyData);
  const systemData = usePVDimensioningStore(selectSystemData);
  const roofData = usePVDimensioningStore(selectRoofData);
  const budgetData = usePVDimensioningStore(selectBudgetData);
  
  // Obter dados dos módulos solares
  const { data: solarModulesData } = useQuery({
    queryKey: ['modules'],
    queryFn: () => moduleService.getModules(),
    staleTime: 10 * 60 * 1000,
  });
  const solarModules = solarModulesData?.modules || [];
  
  // Obter dados agregados das águas do telhado
  const systemSummaryData = usePVDimensioningStore(selectSystemSummaryData(solarModules));
  const aggregatedRoofData = usePVDimensioningStore(selectAggregatedRoofData);
  
  const [currentDimensioning] = useState<any>({});
  
  // Hooks MOVIDOS PARA O TOPO - ANTES de qualquer early return
  // Detectar qual grupo tarifário renderizar
  const grupoTarifarioInfo = useMemo(() => {
    return GrupoTarifarioDetector.detectarGrupoTarifario(customerData, energyData);
  }, [customerData, energyData]);

  // Preparar dados para ambos os grupos (se necessário)
  const grupoAData = useMemo(() => {
    if (grupoTarifarioInfo.renderizar === GrupoTarifarioRender.GRUPO_A ||
        grupoTarifarioInfo.renderizar === GrupoTarifarioRender.AMBOS) {
      // Validar dados antes de passar para o adapter
      if (!customerData || !energyData || !budgetData || !resultsData) {
        return null;
      }
      
      return GrupoAAdapter.extractGrupoAData(customerData, energyData, systemData, budgetData, resultsData);
    }
    return null;
  }, [customerData, energyData, systemData, budgetData, resultsData, grupoTarifarioInfo.renderizar]);

  const grupoBData = useMemo(() => {
    if (grupoTarifarioInfo.renderizar === GrupoTarifarioRender.GRUPO_B ||
        grupoTarifarioInfo.renderizar === GrupoTarifarioRender.AMBOS) {
      // Validar dados antes de passar para o adapter
      if (!customerData || !energyData || !budgetData || !resultsData) {
        return null;
      }
      
      return GrupoBAdapter.extractGrupoBData(customerData, energyData, systemData, budgetData, resultsData);
    }
    return null;
  }, [customerData, energyData, systemData, budgetData, resultsData, grupoTarifarioInfo.renderizar]);

  // Memoizar a seção do grupo tarifário para evitar re-renderizações desnecessárias
  const grupoTarifarioSection = useMemo(() => {
    // Renderização condicional baseada no detector
    const mensagemInformativa = GrupoTarifarioDetector.getMensagemInformativa(grupoTarifarioInfo);
    
    switch (grupoTarifarioInfo.renderizar) {
      case GrupoTarifarioRender.GRUPO_A:
        return (
          <Section title={GrupoTarifarioDetector.getTituloSeção(grupoTarifarioInfo.renderizar)} delay={4}>
            {mensagemInformativa && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{mensagemInformativa}</AlertDescription>
              </Alert>
            )}
            <GrupoAFinancialResults data={grupoAData!} />
          </Section>
        );
        
      case GrupoTarifarioRender.GRUPO_B:
        return (
          <Section title={GrupoTarifarioDetector.getTituloSeção(grupoTarifarioInfo.renderizar)} delay={4}>
            {mensagemInformativa && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{mensagemInformativa}</AlertDescription>
              </Alert>
            )}
            <GrupoBFinancialResults data={grupoBData!} />
          </Section>
        );
        
      case GrupoTarifarioRender.AMBOS:
        return (
          <>
            <Section title="Resultados Financeiros - Grupo A" delay={4}>
              <GrupoAFinancialResults data={grupoAData!} />
            </Section>
            <Section title="Resultados Financeiros - Grupo B" delay={5}>
              <GrupoBFinancialResults data={grupoBData!} />
            </Section>
            {mensagemInformativa && (
              <Section title="Análise Comparativa" delay={6}>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{mensagemInformativa}</AlertDescription>
                </Alert>
              </Section>
            )}
          </>
        );
        
      case GrupoTarifarioRender.NENHUM:
      default:
        return (
          <Section title={GrupoTarifarioDetector.getTituloSeção(grupoTarifarioInfo.renderizar)} delay={4}>
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-muted-foreground">{grupoTarifarioInfo.motivo}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {mensagemInformativa}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Section>
        );
    }
  }, [grupoTarifarioInfo, grupoAData, grupoBData]);
  
  // Validação inicial dos dados
  if (!resultsData?.calculationResults) {
    return <LoadingFallback />;
  }

  const validatedResults = validateAndNormalizeResults(resultsData.calculationResults);
  
  if (!validatedResults) {
    return (
      <DataErrorFallback
        message="Dados de resultado não encontrados ou inválidos"
        onRetry={onNewCalculation}
      />
    );
  }

  // Função para verificar se existem dados financeiros
  const hasFinancialData = (data: any): boolean => {
    if (!data) return false;
    
    // Verificar indicadores financeiros principais
    return (
      data.vpl !== undefined ||
      data.tir !== undefined ||
      data.paybackSimples !== undefined ||
      data.paybackDescontado !== undefined ||
      data.economiaAnualMedia !== undefined ||
      data.lcoe !== undefined ||
      data.roiSimples !== undefined ||
      data.payback !== undefined ||
      // Verificar dados de cash flow
      (data.cashFlow && data.cashFlow.length > 0) ||
      (data.fluxoCaixa && data.fluxoCaixa.length > 0) ||
      // Verificar dados do advancedFinancial
      (data.advancedFinancial && (
        data.advancedFinancial.vpl !== undefined ||
        data.advancedFinancial.tir !== undefined ||
        data.advancedFinancial.paybackSimples !== undefined ||
        data.advancedFinancial.cashFlow && data.advancedFinancial.cashFlow.length > 0
      ))
    );
  };

  // Verificações críticas para componentes que dependem de arrays
  const hasFinancialDataCheck = hasFinancialData(validatedResults);
  const hasGenerationData = validatedResults.geracaoEstimadaMensal.length > 0;
  
  if (!hasFinancialDataCheck && !hasGenerationData) {
    return (
      <DataErrorFallback
        message="Dados financeiros e de geração não disponíveis. Verifique os parâmetros de entrada."
        onRetry={onNewCalculation}
      />
    );
  }
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
            Resultados da Análise
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-300 max-w-3xl mx-auto mt-4">
            Confira os resultados técnicos e financeiros do sistema dimensionado.
          </p>
        </motion.div>

        <div className="space-y-12">
          <Section title="Resumo do Sistema" delay={1}>
            <SystemSummary results={{
              potenciaPico: systemSummaryData.potenciaPico,
              numeroModulos: systemSummaryData.numeroModulos,
              areaEstimada: systemSummaryData.areaEstimada,
              geracaoEstimadaAnual: systemSummaryData.geracaoEstimadaAnual,
              selectedInverters: systemSummaryData.selectedInverters,
              selectedModule: systemSummaryData.selectedModule,
              consumoTotalAnual: systemSummaryData.consumoTotalAnual,
              cobertura: systemSummaryData.cobertura
            }} />
          </Section>

          {/* Advanced Solar Analysis */}
          {/* {validatedResults.advancedSolar && (
            <Section title="Análise Solar Avançada" delay={3}>
              <AdvancedSolarAnalysis results={{
                ...validatedResults,
                advancedSolar: {
                  ...validatedResults.advancedSolar,
                  perdas: {
                    temperatura: validatedResults.advancedSolar.perdas.temperatura,
                    sombreamento: validatedResults.advancedSolar.perdas.sombreamento,
                    mismatch: (validatedResults.advancedSolar.perdas as any).mismatch || Array(12).fill(0),
                    cabeamento: (validatedResults.advancedSolar.perdas as any).cabeamento || Array(12).fill(0),
                    sujeira: validatedResults.advancedSolar.perdas.sujeira,
                    inversor: (validatedResults.advancedSolar.perdas as any).inversor || Array(12).fill(0),
                    outras: (validatedResults.advancedSolar.perdas as any).outras || Array(12).fill(0),
                    total: validatedResults.advancedSolar.perdas.total
                  }
                }
              }} />
            </Section>
          )} */}

          {/* Financial Analysis */}
          {/* {validatedResults.advancedFinancial && (
            <Section title="Análise Financeira" delay={3}>
              <AdvancedFinancialAnalysis results={validatedResults} />
            </Section>
          )} */}

          {/* Renderizar seção do grupo tarifário */}
          {grupoTarifarioSection}

          {/* <Section title="Gráficos de Desempenho" delay={5}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {hasFinancialDataCheck ? (
                <PaybackChart results={{
                  cash_flow: validatedResults.fluxoCaixa.map((item: any, index: number) => ({
                    ano: Number(item?.ano) || index + 1,
                    fluxo_liquido: Number(item?.fluxoLiquido || item?.fluxo_liquido) || 0,
                    fluxo_acumulado: Number(item?.fluxoAcumulado || item?.fluxo_acumulado) || 0,
                    economia_energia: Number(item?.economiaEnergia || item?.economia_energia || item?.economia) || 0,
                    custos_om: Number(item?.custosOM || item?.custos_om) || 0,
                    valor_presente: Number(item?.valorPresente || item?.valor_presente) || 0,
                    geracao_anual: Number(item?.geracaoAnual || item?.geracao_anual) || 0
                  }))
                }} />
              ) : (
                <div className="flex items-center justify-center min-h-[300px] border border-dashed border-gray-300 rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Dados de payback indisponíveis</p>
                  </div>
                </div>
              )}
              <EconomyProjectionChart results={validatedResults} />
            </div>
          </Section> */}

          {/* <Section title="Projeção de Economia" delay={6}>
            {hasFinancialDataCheck || hasGenerationData ? (
              <AnnualSavingsChart results={validatedResults} />
            ) : (
              <div className="flex items-center justify-center min-h-[300px] border border-dashed border-gray-300 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>Dados de economia não disponíveis</p>
                </div>
              </div>
            )}
          </Section> */}
          
          {/* <Section title="Análise Técnica Detalhada" delay={7}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                {hasGenerationData ? (
                  <GenerationChart results={validatedResults} />
                ) : (
                  <div className="flex items-center justify-center min-h-[300px] border border-dashed border-gray-300 rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <p>Dados de geração não disponíveis</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Section> */}
          


          {/* Seção de Geração de Proposta */}
          <Section title="📄 Gerar Proposta" delay={9}>
            <ProposalGenerator
              results={resultsData}
              customerData={customerData}
              energyData={energyData}
              systemData={systemData}
              budgetData={budgetData}
              systemSummaryData={systemSummaryData}
              aggregatedRoofData={aggregatedRoofData}
            />
          </Section>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex flex-wrap justify-center gap-4 pt-12"
        >
          {onBackToWizard && (
            <Button
              variant="outline"
              onClick={onBackToWizard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Assistente
            </Button>
          )}
          
          {onNewCalculation && (
            <Button 
              onClick={onNewCalculation} 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground px-8 py-6 text-lg font-semibold rounded-full shadow-lg"
            >
              Nova Análise
            </Button>
          )}
          
          {onGenerateProposal && (
            <Button 
              onClick={onGenerateProposal} 
              size="lg" 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg"
            >
              <FileText className="mr-3 w-5 h-5" />
              Gerar Relatório/Proposta
              <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
};
