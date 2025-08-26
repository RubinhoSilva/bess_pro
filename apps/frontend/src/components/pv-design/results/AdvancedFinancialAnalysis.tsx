import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  LineChart,
  PieChart,
  Activity
} from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatters';

interface AdvancedFinancialAnalysisProps {
  results: {
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
}

const FinancialMetricCard: React.FC<{ 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, subtitle, icon, color = "from-blue-500 to-indigo-500", trend = 'neutral' }) => {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-slate-400'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-300">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className={`text-xs ${trendColors[trend]} mt-1`}>{subtitle}</p>
          )}
        </div>
        <div className={`p-3 bg-gradient-to-r ${color} rounded-full text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const CashFlowChart: React.FC<{ cashFlow: any[] }> = ({ cashFlow }) => {
  const maxValue = Math.max(...cashFlow.map(cf => Math.max(cf.fluxoLiquido, cf.fluxoAcumulado)));
  const minValue = Math.min(...cashFlow.map(cf => Math.min(cf.fluxoLiquido, cf.fluxoAcumulado)));
  const range = maxValue - minValue;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Fluxo de Caixa Projetado (25 anos)
      </h4>
      <div className="relative h-64 mb-4">
        <svg className="w-full h-full" viewBox="0 0 800 200">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line 
              key={y} 
              x1="0" 
              y1={y * 2} 
              x2="800" 
              y2={y * 2} 
              stroke="currentColor" 
              strokeOpacity="0.1" 
              className="text-gray-400"
            />
          ))}
          
          {/* Cash flow lines */}
          <polyline
            fill="none"
            stroke="url(#gradientBlue)"
            strokeWidth="3"
            points={cashFlow.map((cf, index) => 
              `${(index / (cashFlow.length - 1)) * 800},${200 - ((cf.fluxoLiquido - minValue) / range) * 200}`
            ).join(' ')}
          />
          
          <polyline
            fill="none"
            stroke="url(#gradientGreen)"
            strokeWidth="3"
            points={cashFlow.map((cf, index) => 
              `${(index / (cashFlow.length - 1)) * 800},${200 - ((cf.fluxoAcumulado - minValue) / range) * 200}`
            ).join(' ')}
          />
          
          <defs>
            <linearGradient id="gradientBlue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      <div className="flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-700 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-slate-300">Fluxo Líquido Anual</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-700 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-slate-300">Fluxo Acumulado</span>
        </div>
      </div>
    </div>
  );
};

const SensitivityAnalysis: React.FC<{ sensibilidade: any }> = ({ sensibilidade }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Análise de Sensibilidade do VPL
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sensitivity to Energy Tariff */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            Variação da Tarifa de Energia
          </h5>
          <div className="space-y-2">
            {sensibilidade.vplVariacaoTarifa?.slice(0, 5).map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-slate-400">
                  {item.tarifa > 0 ? '+' : ''}{item.tarifa}%
                </span>
                <span className={`font-medium ${item.vpl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(item.vpl)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sensitivity to Inflation */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            Variação da Inflação Energética
          </h5>
          <div className="space-y-2">
            {sensibilidade.vplVariacaoInflacao?.slice(0, 5).map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-slate-400">
                  {item.inflacao}%
                </span>
                <span className={`font-medium ${item.vpl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(item.vpl)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sensitivity to Discount Rate */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
            Variação da Taxa de Desconto
          </h5>
          <div className="space-y-2">
            {sensibilidade.vplVariacaoDesconto?.slice(0, 5).map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-slate-400">
                  {item.desconto}%
                </span>
                <span className={`font-medium ${item.vpl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(item.vpl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScenarioComparison: React.FC<{ scenarios: any }> = ({ scenarios }) => {
  const scenarioNames = {
    base: 'Base',
    otimista: 'Otimista',
    conservador: 'Conservador', 
    pessimista: 'Pessimista'
  };

  const scenarioColors = {
    base: 'from-blue-500 to-blue-600',
    otimista: 'from-green-500 to-green-600',
    conservador: 'from-yellow-500 to-yellow-600',
    pessimista: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Comparação de Cenários
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(scenarios).map(([key, scenario]: [string, any]) => (
          <div key={key} className="text-center">
            <div className={`bg-gradient-to-r ${scenarioColors[key as keyof typeof scenarioColors]} rounded-lg p-4 text-white mb-3`}>
              <h5 className="font-semibold">{scenarioNames[key as keyof typeof scenarioNames]}</h5>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-slate-400">VPL:</span>
                <div className={`font-medium ${scenario.vpl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(scenario.vpl)}
                </div>
              </div>
              
              <div>
                <span className="text-gray-600 dark:text-slate-400">TIR:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatPercentage(scenario.tir)}
                </div>
              </div>
              
              <div>
                <span className="text-gray-600 dark:text-slate-400">Payback:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatNumber(scenario.paybackSimples, 1)} anos
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdvancedFinancialAnalysis: React.FC<AdvancedFinancialAnalysisProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!results.advancedFinancial) {
    return null;
  }

  const { advancedFinancial } = results;

  const getTrendForMetric = (value: number, type: 'vpl' | 'tir' | 'payback' | 'roi'): 'up' | 'down' | 'neutral' => {
    switch (type) {
      case 'vpl':
        return value > 0 ? 'up' : 'down';
      case 'tir':
        return value > 12 ? 'up' : value > 8 ? 'neutral' : 'down';
      case 'payback':
        return value < 7 ? 'up' : value < 10 ? 'neutral' : 'down';
      case 'roi':
        return value > 100 ? 'up' : value > 50 ? 'neutral' : 'down';
      default:
        return 'neutral';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinancialMetricCard
          title="Valor Presente Líquido (VPL)"
          value={formatCurrency(advancedFinancial.vpl)}
          subtitle={advancedFinancial.vpl > 0 ? "Investimento viável" : "Investimento não viável"}
          icon={<DollarSign className="w-6 h-6" />}
          color="from-green-500 to-emerald-600"
          trend={getTrendForMetric(advancedFinancial.vpl, 'vpl')}
        />
        
        <FinancialMetricCard
          title="Taxa Interna de Retorno (TIR)"
          value={formatPercentage(advancedFinancial.tir)}
          subtitle="Rentabilidade do investimento"
          icon={<TrendingUp className="w-6 h-6" />}
          color="from-blue-500 to-indigo-600"
          trend={getTrendForMetric(advancedFinancial.tir, 'tir')}
        />
        
        <FinancialMetricCard
          title="Payback Simples"
          value={`${formatNumber(advancedFinancial.paybackSimples, 1)} anos`}
          subtitle="Tempo para recuperar o investimento"
          icon={<Calendar className="w-6 h-6" />}
          color="from-purple-500 to-violet-600"
          trend={getTrendForMetric(advancedFinancial.paybackSimples, 'payback')}
        />
        
        <FinancialMetricCard
          title="Índice de Lucratividade"
          value={formatNumber(advancedFinancial.lucratividadeIndex, 2)}
          subtitle={advancedFinancial.lucratividadeIndex > 1 ? "Projeto lucrativo" : "Projeto não lucrativo"}
          icon={<BarChart3 className="w-6 h-6" />}
          color="from-orange-500 to-amber-600"
          trend={advancedFinancial.lucratividadeIndex > 1 ? 'up' : 'down'}
        />
      </div>

      {/* Additional Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinancialMetricCard
          title="Economia Total (25 anos)"
          value={formatCurrency(advancedFinancial.economiaTotal25Anos)}
          subtitle="Economia total projetada"
          icon={<DollarSign className="w-6 h-6" />}
          color="from-cyan-500 to-blue-600"
          trend="up"
        />
        
        <FinancialMetricCard
          title="LCOE"
          value={`${formatCurrency(advancedFinancial.indicadores.custoNiveladoEnergia)}/kWh`}
          subtitle="Custo nivelado da energia"
          icon={<Activity className="w-6 h-6" />}
          color="from-teal-500 to-green-600"
          trend="neutral"
        />
        
        <FinancialMetricCard
          title="ROI"
          value={formatPercentage(advancedFinancial.indicadores.retornoSobreInvestimento)}
          subtitle="Retorno sobre o investimento"
          icon={<LineChart className="w-6 h-6" />}
          color="from-pink-500 to-rose-600"
          trend={getTrendForMetric(advancedFinancial.indicadores.retornoSobreInvestimento, 'roi')}
        />
        
        <FinancialMetricCard
          title="Payback Descontado"
          value={`${formatNumber(advancedFinancial.paybackDescontado, 1)} anos`}
          subtitle="Considerando valor presente"
          icon={<PieChart className="w-6 h-6" />}
          color="from-indigo-500 to-purple-600"
          trend={getTrendForMetric(advancedFinancial.paybackDescontado, 'payback')}
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Visão Geral', icon: BarChart3 },
            { id: 'cashflow', name: 'Fluxo de Caixa', icon: LineChart },
            { id: 'sensitivity', name: 'Sensibilidade', icon: Activity },
            { id: 'scenarios', name: 'Cenários', icon: PieChart }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-gray-800 dark:text-slate-200'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'cashflow' && (
          <CashFlowChart cashFlow={advancedFinancial.cashFlow} />
        )}
        
        {activeTab === 'sensitivity' && (
          <SensitivityAnalysis sensibilidade={advancedFinancial.sensibilidade} />
        )}
        
        {activeTab === 'scenarios' && (
          <ScenarioComparison scenarios={advancedFinancial.scenarios} />
        )}
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CashFlowChart cashFlow={advancedFinancial.cashFlow.slice(0, 10)} />
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resumo da Análise Financeira
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-300">Investimento Inicial:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(advancedFinancial.cashFlow[0]?.valorPresente * -1 || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-300">Economia Anual Média:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(advancedFinancial.economiaAnualMedia)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-300">Eficiência do Investimento:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPercentage(advancedFinancial.indicadores.eficienciaInvestimento)}
                  </span>
                </div>
                <hr className="border-gray-200 dark:border-slate-700" />
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">Resultado Final:</span>
                  <span className={`${advancedFinancial.vpl > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {advancedFinancial.vpl > 0 ? 'VIÁVEL' : 'NÃO VIÁVEL'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};