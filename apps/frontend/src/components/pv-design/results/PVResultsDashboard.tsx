import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import SystemSummary from './SystemSummary';
import { FinancialSummary } from './FinancialSummary';
import { GenerationChart } from './GenerationChart';
import { CableSizingResult } from './CableSizingResult';
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
    cableSizingResults?: Array<{
      inverterName: string;
      correnteProjeto: number;
      secaoMinimaCalculada: number;
      quedaTensaoPercentual: number;
      isQuedaTensaoOk: boolean;
    }>;
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

export const PVResultsDashboard: React.FC<PVResultsDashboardProps> = ({ 
  results, 
  onGenerateProposal, 
  onBackToForm, 
  onNewCalculation 
}) => {
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
              potenciaPico: results.potenciaPico,
              numeroModulos: results.numeroModulos,
              areaEstimada: results.numeroModulos * 2.7, // Estimativa padrão de 2.7m² por módulo
              geracaoEstimadaAnual: results.geracaoEstimadaMensal.reduce((acc, val) => acc + val, 0)
            }} />
          </Section>

          {/* Advanced Solar Analysis */}
          {results.advancedSolar && (
            <Section title="Análise Solar Avançada" delay={2}>
              <AdvancedSolarAnalysis results={results} />
            </Section>
          )}

          {/* Advanced Financial Analysis */}
          {results.advancedFinancial && (
            <Section title="Análise Financeira Avançada" delay={3}>
              <AdvancedFinancialAnalysis results={results} />
            </Section>
          )}

          <Section title="Análise Financeira Resumida" delay={4}>
            <FinancialSummary results={results} />
          </Section>

          <Section title="Gráficos de Desempenho" delay={5}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PaybackChart results={results} />
              <EconomyProjectionChart results={results} />
            </div>
          </Section>

          <Section title="Projeção de Economia" delay={6}>
            <AnnualSavingsChart results={results} />
          </Section>
          
          <Section title="Análise Técnica Detalhada" delay={7}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <GenerationChart results={results} />
              </div>
              <div className="lg:col-span-2">
                <CableSizingResult results={results} />
              </div>
            </div>
          </Section>
          
          <Section title="Composição do Investimento" delay={8}>
            <InvestmentChart results={results} />
          </Section>

          <Section title="Geração de Relatórios" delay={9}>
            <AdvancedPDFGenerator results={results} onGenerate={onGenerateProposal} />
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