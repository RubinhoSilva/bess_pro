import React from 'react';
import { motion } from 'framer-motion';
import { Sun, TrendingDown, Thermometer, CloudRain } from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatters';

interface AdvancedSolarAnalysisProps {
  results: {
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
  };
}

const MetricCard: React.FC<{ 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, subtitle, icon, color = "from-blue-500 to-indigo-500" }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-slate-300">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 bg-gradient-to-r ${color} rounded-full text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

const MonthlyChart: React.FC<{ 
  data: number[]; 
  label: string; 
  color?: string;
  suffix?: string;
}> = ({ data, label, color = "bg-blue-500", suffix = "" }) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const maxValue = Math.max(...data);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{label}</h4>
      <div className="space-y-3">
        {data.map((value, index) => (
          <div key={index} className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-300 w-8">
              {months[index]}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-4 relative">
              <div 
                className={`${color} h-4 rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${(value / maxValue) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                {formatNumber(value, 1)}{suffix}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LossesBreakdown: React.FC<{ perdas: any }> = ({ perdas }) => {
  const lossTypes = [
    { name: 'Temperatura', data: perdas.temperatura, color: 'bg-red-500' },
    { name: 'Sombreamento', data: perdas.sombreamento, color: 'bg-gray-600' },
    { name: 'Sujeira', data: perdas.sujeira, color: 'bg-yellow-600' },
    { name: 'Angular/Espectral', data: perdas.angular, color: 'bg-purple-500' }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Análise de Perdas do Sistema
      </h4>
      <div className="space-y-4">
        {lossTypes.map((loss, index) => {
          const avgLoss = loss.data.reduce((a: number, b: number) => a + b, 0) / loss.data.length;
          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {loss.name}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatPercentage(avgLoss)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className={`${loss.color} h-2 rounded-full transition-all duration-1000`}
                  style={{ width: `${avgLoss * 4}%` }} // Scale for visual effect
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AdvancedSolarAnalysis: React.FC<AdvancedSolarAnalysisProps> = ({ results }) => {
  if (!results.advancedSolar) {
    return null;
  }

  const { advancedSolar } = results;
  const { performance, perdas, geracaoEstimada } = advancedSolar;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Performance Ratio (PR)"
          value={formatPercentage(performance.prMedio * 100)}
          subtitle="Razão entre energia real e teórica"
          icon={<Sun className="w-6 h-6" />}
          color="from-orange-500 to-yellow-500"
        />
        <MetricCard
          title="Yield Específico"
          value={`${formatNumber(performance.yieldEspecifico)} kWh/kWp`}
          subtitle="Geração anual por kWp instalado"
          icon={<TrendingDown className="w-6 h-6" />}
          color="from-green-500 to-blue-500"
        />
        <MetricCard
          title="Fator de Capacidade"
          value={formatPercentage(performance.fatorCapacidade)}
          subtitle="Utilização da capacidade instalada"
          icon={<Thermometer className="w-6 h-6" />}
          color="from-purple-500 to-indigo-500"
        />
      </div>

      {/* Generation Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Geração Anual Total"
          value={`${formatNumber(geracaoEstimada.anual)} kWh`}
          subtitle="Estimativa considerando todas as perdas"
          icon={<Sun className="w-6 h-6" />}
          color="from-yellow-400 to-orange-500"
        />
        <MetricCard
          title="Geração Diária Média"
          value={`${formatNumber(geracaoEstimada.diarioMedio)} kWh/dia`}
          subtitle="Média diária ao longo do ano"
          icon={<CloudRain className="w-6 h-6" />}
          color="from-blue-400 to-cyan-500"
        />
        <MetricCard
          title="Perdas Totais Médias"
          value={formatPercentage(perdas.total.reduce((a, b) => a + b, 0) / 12)}
          subtitle="Perdas médias mensais do sistema"
          icon={<TrendingDown className="w-6 h-6" />}
          color="from-red-500 to-pink-500"
        />
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative">
          <MonthlyChart
            data={advancedSolar.irradiacaoInclinada}
            label="Irradiação Corrigida por Inclinação"
            color="bg-gradient-to-r from-yellow-400 to-orange-500"
            suffix=" kWh/m²"
          />
          {advancedSolar.source === 'pvlib' && (
            <div className="absolute top-2 right-2">
              <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full border border-green-200 dark:border-green-700/50">
                PVLIB
              </div>
            </div>
          )}
        </div>
        
        <LossesBreakdown perdas={perdas} />
      </div>

      {/* Monthly Generation vs Irradiation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Geração Mensal vs Irradiação
        </h4>
        <div className="grid grid-cols-12 gap-2">
          {geracaoEstimada.mensal.map((geracao, index) => {
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const maxGeracao = Math.max(...geracaoEstimada.mensal);
            const maxIrradiacao = Math.max(...advancedSolar.irradiacaoInclinada);
            
            return (
              <div key={index} className="text-center">
                <div className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
                  {months[index]}
                </div>
                
                {/* Generation Bar */}
                <div 
                  className="bg-gradient-to-t from-green-400 to-blue-500 rounded-t mb-1"
                  style={{ 
                    height: `${(geracao / maxGeracao) * 80}px`,
                    minHeight: '10px'
                  }}
                  title={`Geração: ${formatNumber(geracao)} kWh`}
                />
                
                {/* Irradiation Bar */}
                <div 
                  className="bg-gradient-to-t from-yellow-400 to-orange-500 rounded-b"
                  style={{ 
                    height: `${(advancedSolar.irradiacaoInclinada[index] / maxIrradiacao) * 40}px`,
                    minHeight: '8px'
                  }}
                  title={`Irradiação: ${formatNumber(advancedSolar.irradiacaoInclinada[index], 1)} kWh/m²`}
                />
                
                <div className="text-xs font-medium text-gray-800 dark:text-slate-200 mt-1">
                  {formatNumber(geracao / 1000, 1)}k
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-center space-x-6 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-slate-300">Geração (kWh)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-slate-300">Irradiação (kWh/m²)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};