import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import SystemSummary from './results/SystemSummary';
import FinancialSummary from './results/FinancialSummary';
import GenerationChart from './results/GenerationChart';
import CableSizingResult from './results/CableSizingResult';
import PaybackChart from './results/PaybackChart';
import EconomyProjectionChart from './results/EconomyProjectionChart';
import InvestmentChart from './results/InvestmentChart';

const Section = ({ title, children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay * 0.1 }}
        className="space-y-6"
    >
        <h2 className="text-2xl font-semibold text-slate-200 border-b-2 border-slate-700 pb-2">{title}</h2>
        {children}
    </motion.div>
);

const PVAnalysisDashboard = ({ results, onGenerateProposal, onBackToForm }) => {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                        Resultados da Análise
                    </h1>
                    <p className="text-lg text-slate-300 max-w-3xl mx-auto mt-4">
                        Confira os resultados técnicos e financeiros do sistema dimensionado.
                    </p>
                </motion.div>

                <div className="space-y-12">
                    <Section title="Resumo do Sistema" delay={1}>
                        <SystemSummary results={results} />
                    </Section>

                    <Section title="Análise Financeira" delay={2}>
                        <FinancialSummary results={results} />
                    </Section>

                    <Section title="Gráficos de Desempenho" delay={3}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <PaybackChart results={results} />
                            <EconomyProjectionChart results={results} />
                        </div>
                    </Section>
                    
                    <Section title="Análise Técnica Detalhada" delay={4}>
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="lg:col-span-3">
                                <GenerationChart results={results} />
                            </div>
                            <div className="lg:col-span-2">
                                <CableSizingResult results={results} />
                            </div>
                        </div>
                    </Section>
                    
                    <Section title="Composição do Investimento" delay={5}>
                         <InvestmentChart results={results} />
                    </Section>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="flex flex-wrap justify-center gap-4 pt-12"
                >
                     <Button onClick={onBackToForm} size="lg" variant="outline" className="bg-transparent border-slate-500 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg">
                        <ArrowLeft className="mr-3 w-5 h-5" />
                        Voltar ao Dimensionamento
                    </Button>
                    <Button onClick={onGenerateProposal} size="lg" className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg">
                        <FileText className="mr-3 w-5 h-5" />
                        Gerar Relatório/Proposta
                        <ArrowRight className="ml-3 w-5 h-5" />
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};

export default PVAnalysisDashboard;