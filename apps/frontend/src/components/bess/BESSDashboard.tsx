import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, Battery, Sun, Fuel, DollarSign, Zap, TrendingUp } from 'lucide-react';
import { BESSSystemConfiguration } from './BESSAnalysisTool';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface BESSDashboardProps {
  results: any;
  systemConfig: BESSSystemConfiguration;
  onNewSimulation: () => void;
  onBackToForm: () => void;
}

const BESSDashboard: React.FC<BESSDashboardProps> = ({
  results,
  systemConfig,
  onNewSimulation,
  onBackToForm
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 1) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Dados para gráficos
  const monthlyData = results.detalhes.performanceMensal?.map((item: any) => ({
    mes: `${item.mes}/2024`,
    consumo: item.consumo,
    solar: item.geracaoSolar,
    bateria: item.usoBateria,
    diesel: item.geradorDiesel
  })) || [];

  const energySourcesData = [
    { name: 'Solar', value: systemConfig.solar ? results.performance.geracaoSolarAnual : 0, color: '#FFA500' },
    { name: 'Bateria', value: systemConfig.bess ? (results.inputs.capacidadeBaterias || 0) * 300 : 0, color: '#00AA00' },
    { name: 'Diesel', value: systemConfig.diesel ? results.performance.consumoAnual * 0.2 : 0, color: '#808080' },
    { name: 'Rede', value: Math.max(0, results.performance.consumoAnual - results.performance.geracaoSolarAnual), color: '#0066CC' }
  ].filter(item => item.value > 0);

  // Cards de KPIs principais
  const kpiCards = [
    {
      title: 'Investimento Total',
      value: formatCurrency(results.financeiro.investimentoTotal),
      icon: DollarSign,
      color: 'from-blue-500 to-blue-600',
      description: 'Capital necessário para implementação'
    },
    {
      title: 'Payback',
      value: `${formatNumber(results.financeiro.payback, 1)} anos`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      description: 'Tempo de retorno do investimento'
    },
    {
      title: 'ROI',
      value: `${formatNumber(results.financeiro.roi, 1)}%`,
      icon: TrendingUp,
      color: results.financeiro.roi > 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600',
      description: 'Retorno sobre investimento'
    },
    {
      title: 'Economia Anual',
      value: formatCurrency(results.financeiro.economiaAnual),
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      description: 'Economia gerada por ano'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Button
            onClick={onBackToForm}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Formulário
          </Button>
          <Button
            onClick={onNewSimulation}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Nova Simulação
          </Button>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Resultados da Análise BESS
          </h2>
          <div className="flex justify-center gap-2 mb-4">
            {systemConfig.solar && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                <Sun className="w-4 h-4 mr-1" /> Solar {formatNumber(results.inputs.potenciaSolar || 0)} kWp
              </span>
            )}
            {systemConfig.bess && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                <Battery className="w-4 h-4 mr-1" /> BESS {formatNumber(results.inputs.capacidadeBaterias || 0)} kWh
              </span>
            )}
            {systemConfig.diesel && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
                <Fuel className="w-4 h-4 mr-1" /> Diesel {formatNumber(results.inputs.potenciaDiesel || 0)} kW
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {kpi.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${kpi.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {kpi.value}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {kpi.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Performance e Dimensionamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Performance do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Consumo Anual</span>
              <span className="font-semibold">{formatNumber(results.performance.consumoAnual)} kWh</span>
            </div>
            {systemConfig.solar && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Geração Solar</span>
                <span className="font-semibold text-yellow-600">{formatNumber(results.performance.geracaoSolarAnual)} kWh</span>
              </div>
            )}
            {systemConfig.bess && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Autonomia Real</span>
                <span className="font-semibold text-green-600">{formatNumber(results.performance.autonomiaReal)} horas</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Eficiência Global</span>
              <span className="font-semibold text-blue-600">{formatNumber(results.performance.eficienciaGlobal)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Dimensionamento */}
        <Card>
          <CardHeader>
            <CardTitle>Dimensionamento dos Sistemas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {results.dimensionamento.solar && (
              <div>
                <h4 className="font-semibold text-yellow-600 mb-2 flex items-center gap-2">
                  <Sun className="w-4 h-4" /> Sistema Solar
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Potência:</span>
                    <span>{formatNumber(results.dimensionamento.solar.potencia)} kWp</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Área estimada:</span>
                    <span>{formatNumber(results.dimensionamento.solar.area)} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Número de módulos:</span>
                    <span>{results.dimensionamento.solar.numeroModulos} unidades</span>
                  </div>
                </div>
              </div>
            )}
            
            {results.dimensionamento.bess && (
              <div>
                <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                  <Battery className="w-4 h-4" /> Sistema BESS
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Capacidade:</span>
                    <span>{formatNumber(results.dimensionamento.bess.capacidade)} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potência:</span>
                    <span>{formatNumber(results.dimensionamento.bess.potencia)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <span className="capitalize">{results.dimensionamento.bess.tipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Número de baterias:</span>
                    <span>{results.dimensionamento.bess.numeroBaterias} unidades</span>
                  </div>
                </div>
              </div>
            )}

            {results.dimensionamento.diesel && (
              <div>
                <h4 className="font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <Fuel className="w-4 h-4" /> Gerador Diesel
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Potência:</span>
                    <span>{formatNumber(results.dimensionamento.diesel.potencia)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consumo/hora:</span>
                    <span>{formatNumber(results.dimensionamento.diesel.consumoHora)} L/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo/hora:</span>
                    <span>{formatCurrency(results.dimensionamento.diesel.custoHora)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${formatNumber(value)} kWh`} />
                <Legend />
                <Bar dataKey="consumo" fill="#0066CC" name="Consumo" />
                {systemConfig.solar && <Bar dataKey="solar" fill="#FFA500" name="Solar" />}
                {systemConfig.bess && <Bar dataKey="bateria" fill="#00AA00" name="Bateria" />}
                {systemConfig.diesel && <Bar dataKey="diesel" fill="#808080" name="Diesel" />}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Fontes */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Fontes de Energia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={energySourcesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {energySourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${formatNumber(value)} kWh`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise Financeira Detalhada */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Análise Financeira Detalhada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Investimento</h4>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(results.financeiro.investimentoTotal)}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">VPL (20 anos)</h4>
              <p className={`text-2xl font-bold ${results.financeiro.vpl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(results.financeiro.vpl)}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Economia/Ano</h4>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(results.financeiro.economiaAnual)}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Custo Atual/Ano</h4>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(results.detalhes.custoEnergiaAnual)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BESSDashboard;