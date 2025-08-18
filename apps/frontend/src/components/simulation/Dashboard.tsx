import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Battery, 
  Zap, 
  Timer,
  Leaf
} from 'lucide-react';

interface DashboardProps {
  data: any;
  onNewSimulation: () => void;
}

const MetricCard = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  color,
  delay = 0
}: {
  title: string;
  value: string | number;
  unit: string;
  icon: any;
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : value}
        </div>
        <p className="text-xs text-slate-400 mt-1">{unit}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default function Dashboard({ data, onNewSimulation }: DashboardProps) {
  const results = data?.resultados;
  
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Erro nos Dados
          </h1>
          <p className="text-slate-300 text-lg mb-8">
            Não foi possível carregar os resultados da simulação.
          </p>
          <Button
            onClick={onNewSimulation}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Nova Simulação
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Resultados da Simulação
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto mt-4">
            Análise de viabilidade econômica e técnica do sistema proposto
          </p>
        </motion.div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="LCOE"
            value={results.lcoe}
            unit="R$/kWh"
            icon={DollarSign}
            color="text-green-400"
            delay={0.1}
          />
          <MetricCard
            title="Payback"
            value={results.payback}
            unit="anos"
            icon={Timer}
            color="text-blue-400"
            delay={0.2}
          />
          <MetricCard
            title="TIR"
            value={results.tir}
            unit="% a.a."
            icon={TrendingUp}
            color="text-purple-400"
            delay={0.3}
          />
          <MetricCard
            title="VPL"
            value={results.vpl}
            unit="R$"
            icon={DollarSign}
            color="text-yellow-400"
            delay={0.4}
          />
        </div>

        {/* Resultados Detalhados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Análise Financeira
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Investimento Inicial</span>
                  <span className="text-white font-semibold">
                    R$ {results.investimentoInicial?.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Economia Anual</span>
                  <span className="text-green-400 font-semibold">
                    R$ {results.economiaAnual?.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Valor Presente Líquido</span>
                  <span className="text-blue-400 font-semibold">
                    R$ {results.vpl?.toLocaleString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Leaf className="w-5 h-5 text-green-400" />
                  Benefícios Ambientais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Redução de Emissões</span>
                  <span className="text-green-400 font-semibold">
                    {results.reducaoEmissoes} tCO₂/ano
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Equivalente a</span>
                  <span className="text-green-400 font-semibold">
                    {Math.round(results.reducaoEmissoes * 2.5)} árvores plantadas
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Em 20 anos</span>
                  <span className="text-green-400 font-semibold">
                    {results.reducaoEmissoes * 20} tCO₂ evitadas
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sistemas Ativos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5 text-yellow-400" />
                Configuração do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {data?.activeSystems?.bess && (
                  <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-2 rounded-full">
                    <Battery className="w-4 h-4" />
                    Sistema BESS
                  </div>
                )}
                {data?.activeSystems?.solar && (
                  <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-3 py-2 rounded-full">
                    <Zap className="w-4 h-4" />
                    Fotovoltaico
                  </div>
                )}
                {data?.activeSystems?.diesel && (
                  <div className="flex items-center gap-2 bg-gray-500/20 text-gray-300 px-3 py-2 rounded-full">
                    <Zap className="w-4 h-4" />
                    Gerador Diesel
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Botões de Ação */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center space-x-4"
        >
          <Button
            onClick={onNewSimulation}
            variant="outline"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Nova Simulação
          </Button>
          
          <Button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Imprimir Relatório
          </Button>
        </motion.div>
      </div>
    </div>
  );
}