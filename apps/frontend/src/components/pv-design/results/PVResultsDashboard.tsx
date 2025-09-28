import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import SystemSummary from './SystemSummary';
import { GenerationChart } from './GenerationChart';
import { PaybackChart } from './PaybackChart';
import { EconomyProjectionChart } from './EconomyProjectionChart';
import { InvestmentChart } from './InvestmentChart';
import { AnnualSavingsChart } from './AnnualSavingsChart';
import { AdvancedSolarAnalysis } from './AdvancedSolarAnalysis';
import { AdvancedFinancialAnalysis } from './AdvancedFinancialAnalysis';
import AdvancedPDFGenerator from '../report/AdvancedPDFGenerator';

interface PVResultsDashboardProps {
  results: {
    formData: any;
    potenciaPico: number;
    numeroModulos: number;
    totalInvestment: number;
    economiaAnualEstimada: number;
    vpl: number;
    tir: number;
    payback: number;
    fluxoCaixa: Array<{
      ano: number;
      economia: number;
      fluxoLiquido: number;
      custoSemFV: number;
      custoComFV: number;
    }>;
    geracaoEstimadaMensal: number[];
    selectedModule?: any;
    selectedInverters?: any[];
    // Advanced analysis results
    advancedSolar?: {
      irradiacaoMensal: number[];
      irradiacaoInclinada: number[];
      fatorTemperatura: number[];
      perdas: {
        temperatura: number[];
        sombreamento: number[];
        sujeira: number[];
        angular: number[];
        total: number[];
      };
      performance: {
        prMedio: number;
        yieldEspecifico: number;
        fatorCapacidade: number;
      };
      geracaoEstimada: {
        mensal: number[];
        anual: number;
        diarioMedio: number;
      };
    };
    advancedFinancial?: {
      vpl: number;
      tir: number;
      paybackSimples: number;
      paybackDescontado: number;
      economiaTotal25Anos: number;
      economiaAnualMedia: number;
      lucratividadeIndex: number;
      cashFlow: Array<{
        ano: number;
        geracaoAnual: number;
        economiaEnergia: number;
        custosOM: number;
        fluxoLiquido: number;
        fluxoAcumulado: number;
        valorPresente: number;
      }>;
      indicadores: {
        yieldEspecifico: number;
        custoNiveladoEnergia: number;
        eficienciaInvestimento: number;
        retornoSobreInvestimento: number;
      };
      sensibilidade: {
        vplVariacaoTarifa: { tarifa: number; vpl: number }[];
        vplVariacaoInflacao: { inflacao: number; vpl: number }[];
        vplVariacaoDesconto: { desconto: number; vpl: number }[];
      };
      scenarios: {
        base: any;
        otimista: any;
        conservador: any;
        pessimista: any;
      };
    };
  };
  onGenerateProposal?: () => void;
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
    console.warn('🚨 PVResultsDashboard: results is null/undefined');
    return null;
  }

  // Log dos dados recebidos para debug
  console.log('📊 PVResultsDashboard: Dados recebidos:', {
    hasFluxoCaixa: !!results.fluxoCaixa,
    fluxoCaixaLength: results.fluxoCaixa?.length,
    hasGeracaoMensal: !!results.geracaoEstimadaMensal,
    geracaoMensalLength: results.geracaoEstimadaMensal?.length,
    hasAdvancedSolar: !!results.advancedSolar,
    hasAdvancedFinancial: !!results.advancedFinancial
  });

  const normalized = {
    ...results,
    // Garantir arrays seguros
    fluxoCaixa: Array.isArray(results.fluxoCaixa) ? results.fluxoCaixa : [],
    geracaoEstimadaMensal: Array.isArray(results.geracaoEstimadaMensal) ? results.geracaoEstimadaMensal : Array(12).fill(0),
    selectedInverters: Array.isArray(results.selectedInverters) ? results.selectedInverters : [],
    
    // Normalizar dados numéricos
    potenciaPico: Number(results.potenciaPico) || 0,
    numeroModulos: Number(results.numeroModulos) || 0,
    totalInvestment: Number(results.totalInvestment) || 0,
    economiaAnualEstimada: Number(results.economiaAnualEstimada) || 0,
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
      }
    } : null,
    
    advancedFinancial: results.advancedFinancial ? {
      ...results.advancedFinancial,
      cashFlow: Array.isArray(results.advancedFinancial.cashFlow) 
        ? results.advancedFinancial.cashFlow 
        : []
    } : null
  };

  return normalized;
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
  results, 
  onGenerateProposal, 
  onBackToForm, 
  onNewCalculation 
}) => {
  // Validação inicial dos dados
  if (!results) {
    return <LoadingFallback />;
  }

  const validatedResults = validateAndNormalizeResults(results);
  
  if (!validatedResults) {
    return (
      <DataErrorFallback 
        message="Dados de resultado não encontrados ou inválidos" 
        onRetry={onNewCalculation}
      />
    );
  }

  // Verificações críticas para componentes que dependem de arrays
  const hasFinancialData = validatedResults.fluxoCaixa.length > 0;
  const hasGenerationData = validatedResults.geracaoEstimadaMensal.length > 0;
  
  if (!hasFinancialData && !hasGenerationData) {
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
              potenciaPico: validatedResults.potenciaPico,
              numeroModulos: validatedResults.numeroModulos,
              areaEstimada: 0,
              geracaoEstimadaAnual: validatedResults.geracaoEstimadaMensal.reduce((a: number, b: number) => a + b, 0),
              selectedInverters: validatedResults.selectedInverters,
              selectedModule: validatedResults.selectedModule,
              consumoTotalAnual: validatedResults.formData?.energyBills?.reduce((total: number, bill: any) => 
                total + (Array.isArray(bill?.consumoMensal) ? bill.consumoMensal.reduce((sum: number, val: number) => sum + (Number(val) || 0), 0) : 0), 0) || 0
            }} />
          </Section>

          {/* Advanced Solar Analysis */}
          {validatedResults.advancedSolar && (
            <Section title="Análise Solar Avançada" delay={2}>
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
          )}

          {/* Financial Analysis */}
          {validatedResults.advancedFinancial && (
            <Section title="Análise Financeira" delay={3}>
              <AdvancedFinancialAnalysis results={validatedResults} />
            </Section>
          )}

          <Section title="Gráficos de Desempenho" delay={4}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {hasFinancialData ? (
                <PaybackChart results={{
                  cash_flow: validatedResults.fluxoCaixa.map((item: any, index: number) => ({
                    ano: Number(item?.ano) || index + 1,
                    fluxo_liquido: Number(item?.fluxoLiquido || item?.fluxo_liquido) || 0,
                    fluxo_acumulado: Number(item?.fluxo_acumulado) || 0,
                    economia_energia: Number(item?.economia || item?.economia_energia) || 0,
                    custos_om: Number(item?.custos_om) || 0,
                    valor_presente: Number(item?.valorPresente || item?.valor_presente) || 0,
                    geracao_anual: Number(item?.geracao_anual) || 0
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
          </Section>

          <Section title="Projeção de Economia" delay={5}>
            {hasFinancialData || hasGenerationData ? (
              <AnnualSavingsChart results={validatedResults} />
            ) : (
              <div className="flex items-center justify-center min-h-[300px] border border-dashed border-gray-300 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>Dados de economia não disponíveis</p>
                </div>
              </div>
            )}
          </Section>
          
          <Section title="Análise Técnica Detalhada" delay={6}>
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
          </Section>
          
          <Section title="Composição do Investimento" delay={7}>
            <InvestmentChart results={validatedResults} />
          </Section>

          <Section title="Geração de Relatórios" delay={8}>
            <AdvancedPDFGenerator results={validatedResults} onGenerate={onGenerateProposal} />
          </Section>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex flex-wrap justify-center gap-4 pt-12"
        >
          {onBackToForm && (
            <Button 
              onClick={onBackToForm} 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground px-8 py-6 text-lg font-semibold rounded-full shadow-lg"
            >
              <ArrowLeft className="mr-3 w-5 h-5" />
              Voltar ao Dimensionamento
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