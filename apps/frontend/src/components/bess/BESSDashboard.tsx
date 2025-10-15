import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, Battery, Sun, Fuel, DollarSign, Zap, TrendingUp, BarChart3, Lightbulb, AlertTriangle } from 'lucide-react';
import { BESSSystemConfiguration } from './BESSAnalysisTool';
import {
  HybridDimensioningResponse,
  SistemaSolarResult,
  SistemaBessResult,
  AnaliseHibrida
} from '@/types/bess';
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
  results: HybridDimensioningResponse & {
    _metadata?: {
      leadId: string;
      leadName: string;
      systemConfig: any;
      calculatedAt: string;
      duration_ms: number;
    };
  };
  systemConfig: BESSSystemConfiguration;
  onNewSimulation: () => void;
  onBackToForm: () => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`bg-gradient-to-r ${colorClasses[color]} text-white pb-2`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className={`text-xs mt-2 ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {trend === 'up' && '↑ Positivo'}
            {trend === 'down' && '↓ Negativo'}
            {trend === 'neutral' && '→ Neutro'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BESSDashboard: React.FC<BESSDashboardProps> = ({
  results,
  systemConfig,
  onNewSimulation,
  onBackToForm
}) => {
  // Debug log para verificar dados recebidos

  // Destructure dos resultados com validação
  const sistema_solar = results.sistema_solar || {};
  
  // 🔍 Logs para debug do fluxo de dados
  console.log('🔍 BESSDashboard - Results completo:', results);
  console.log('🔍 BESSDashboard - Sistema Solar completo:', sistema_solar);
  console.log('🔍 BESSDashboard - Potência Total kWp:', sistema_solar.potenciaTotalKwp);
  console.log('🔍 BESSDashboard - Energia Anual kWh:', sistema_solar.energiaAnualKwh);
  console.log('🔍 BESSDashboard - PR Total:', sistema_solar.prTotal);
  console.log('🔍 BESSDashboard - Yield Específico:', sistema_solar.yieldEspecifico);
  console.log('🔍 BESSDashboard - Tipo da potência:', typeof sistema_solar.potenciaTotalKwp);
  console.log('🔍 BESSDashboard - Chaves disponíveis:', Object.keys(sistema_solar));
  const sistema_bess = results.sistema_bess || {};
  const analise_hibrida = results.analise_hibrida || {};

  // Verificar se dados são válidos
  if (!sistema_solar || !sistema_bess || !analise_hibrida) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar resultados. Dados inválidos.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Funções de formatação
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number, decimals: number = 2) =>
    value.toFixed(decimals);

  const formatPercentage = (value: number) =>
    `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* HEADER COM RESUMO EXECUTIVO */}
      {/* ===================================================================== */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">
            Análise Híbrida Solar + BESS - Resultados
          </CardTitle>
          <CardDescription className="text-blue-100">
            {results._metadata?.leadName} •
            Calculado em {new Date(results._metadata?.calculatedAt || '').toLocaleString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatPercentage(analise_hibrida.autossuficiencia?.autossuficiencia_percentual || 0)}
              </div>
              <div className="text-sm text-blue-100">Autossuficiência</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatCurrency(analise_hibrida.retorno_financeiro?.npv_reais || 0)}
              </div>
              <div className="text-sm text-blue-100">VPL (25 anos)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatNumber(analise_hibrida.retorno_financeiro?.payback_simples_anos || 0, 1)} anos
              </div>
              <div className="text-sm text-blue-100">Payback Simples</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatPercentage(analise_hibrida.retorno_financeiro.tir_percentual)}
              </div>
              <div className="text-sm text-blue-100">TIR</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================== */}
      {/* SEÇÃO 1: MÉTRICAS DO SISTEMA SOLAR */}
      {/* ===================================================================== */}
      {systemConfig.solar && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sun className="w-6 h-6 text-orange-500" />
            Sistema Solar Fotovoltaico
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Potência Instalada"
              value={`${formatNumber(sistema_solar.potenciaTotalKwp)} kWp`}
              icon={<Zap className="w-5 h-5" />}
              color="orange"
            />
            <MetricCard
              title="Geração Anual"
              value={`${formatNumber(sistema_solar.energiaAnualKwh / 1000, 1)} MWh`}
              subtitle={`${formatNumber(sistema_solar.energiaAnualKwh)} kWh/ano`}
              icon={<Sun className="w-5 h-5" />}
              color="orange"
            />
            <MetricCard
              title="Performance Ratio"
              value={formatPercentage(sistema_solar.prTotal)}
              subtitle="Eficiência do sistema"
              icon={<TrendingUp className="w-5 h-5" />}
              color="green"
              trend="up"
            />
            <MetricCard
              title="Yield Específico"
              value={`${formatNumber(sistema_solar.yieldEspecifico)} kWh/kWp`}
              subtitle="Produtividade anual"
              icon={<BarChart3 className="w-5 h-5" />}
              color="purple"
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SEÇÃO 2: MÉTRICAS DO SISTEMA BESS */}
      {/* ===================================================================== */}
      {systemConfig.bess && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Battery className="w-6 h-6 text-green-500" />
            Sistema de Armazenamento (BESS)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Capacidade"
              value={`${formatNumber(sistema_bess.capacidade_kwh)} kWh`}
              subtitle={`${formatNumber(sistema_bess.potencia_kw)} kW`}
              icon={<Battery className="w-5 h-5" />}
              color="green"
            />
            <MetricCard
              title="Ciclos Equivalentes"
              value={`${formatNumber(sistema_bess.ciclos_equivalentes_ano, 1)}/ano`}
              subtitle={`DOD médio: ${formatPercentage(sistema_bess.profundidade_descarga_media * 100)}`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="blue"
            />
            <MetricCard
              title="SOC Médio"
              value={formatPercentage(sistema_bess.soc_medio_percentual)}
              subtitle={`Min: ${formatPercentage(sistema_bess.soc_minimo_percentual)} Max: ${formatPercentage(sistema_bess.soc_maximo_percentual)}`}
              icon={<BarChart3 className="w-5 h-5" />}
              color="purple"
            />
            <MetricCard
              title="Economia Anual BESS"
              value={formatCurrency(sistema_bess.economia_total_anual_reais)}
              subtitle={`Utilização: ${formatPercentage(sistema_bess.utilizacao_percentual)}`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="green"
              trend="up"
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SEÇÃO 3: FLUXOS DE ENERGIA */}
      {/* ===================================================================== */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-500" />
          Fluxos de Energia (Anual)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="bg-orange-50 dark:bg-orange-950">
              <CardTitle className="text-sm">Geração Solar</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total gerado:</span>
                  <span className="font-bold">
                    {formatNumber(analise_hibrida.fluxos_energia.energia_solar_gerada_kwh / 1000, 1)} MWh
                  </span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>→ Consumo direto:</span>
                  <span className="font-bold">
                    {formatNumber(analise_hibrida.fluxos_energia.energia_solar_para_consumo_kwh / 1000, 1)} MWh
                  </span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>→ Para BESS:</span>
                  <span className="font-bold">
                    {formatNumber(analise_hibrida.fluxos_energia.energia_solar_para_bess_kwh / 1000, 1)} MWh
                  </span>
                </div>
                <div className="flex justify-between text-purple-600">
                  <span>→ Para rede:</span>
                  <span className="font-bold">
                    {formatNumber(analise_hibrida.fluxos_energia.energia_solar_para_rede_kwh / 1000, 1)} MWh
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-green-50 dark:bg-green-950">
              <CardTitle className="text-sm">Armazenamento BESS</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total consumido:</span>
                  <span className="font-bold">
                    {formatNumber(analise_hibrida.fluxos_energia.energia_consumida_total_kwh / 1000, 1)} MWh
                  </span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>← De solar:</span>
                  <span className="font-bold">
                    {formatNumber(analise_hibrida.fluxos_energia.energia_consumo_de_solar_kwh / 1000, 1)} MWh
                  </span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>← De BESS:</span>
                  <span className="font-bold">
                    {formatNumber(analise_hibrida.fluxos_energia.energia_consumo_de_bess_kwh / 1000, 1)} MWh
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>← Da rede:</span>
                  <span className="font-bold">
                    {formatNumber(analise_hibrida.fluxos_energia.energia_consumo_de_rede_kwh / 1000, 1)} MWh
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-blue-50 dark:bg-blue-950">
              <CardTitle className="text-sm">Autossuficiência</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPercentage(analise_hibrida.autossuficiencia.autossuficiencia_percentual)}
                  </div>
                  <div className="text-xs text-gray-500">Independência energética</div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Autoconsumo solar:</span>
                  <span className="font-bold">
                    {formatPercentage(analise_hibrida.autossuficiencia.taxa_autoconsumo_solar * 100)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dependência rede:</span>
                  <span className="font-bold text-red-600">
                    {formatPercentage(analise_hibrida.autossuficiencia.dependencia_rede_percentual)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SEÇÃO 4: COMPARAÇÃO DE CENÁRIOS */}
      {/* ===================================================================== */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-500" />
          Comparação de Cenários (25 anos)
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Cenário</th>
                    <th className="text-right py-3 px-4">Investimento</th>
                    <th className="text-right py-3 px-4">Economia/Ano</th>
                    <th className="text-right py-3 px-4">Payback</th>
                    <th className="text-right py-3 px-4">VPL</th>
                    <th className="text-right py-3 px-4">TIR</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Sem Sistema */}
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium text-gray-500">
                      Sem Sistema
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.sem_sistema.investimento)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.sem_sistema.economia_anual)}
                    </td>
                    <td className="text-right py-3 px-4">-</td>
                    <td className="text-right py-3 px-4 text-red-600">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.sem_sistema.npv)}
                    </td>
                    <td className="text-right py-3 px-4">-</td>
                  </tr>

                  {/* Somente Solar */}
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium text-orange-600">
                      Somente Solar
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.somente_solar.investimento)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.somente_solar.economia_anual)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatNumber(analise_hibrida.comparacao_cenarios.somente_solar.payback_anos, 1)} anos
                    </td>
                    <td className="text-right py-3 px-4 text-green-600">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.somente_solar.npv)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatPercentage(analise_hibrida.comparacao_cenarios.somente_solar.tir_percentual)}
                    </td>
                  </tr>

                  {/* Somente BESS */}
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium text-green-600">
                      Somente BESS
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.somente_bess.investimento)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.somente_bess.economia_anual)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatNumber(analise_hibrida.comparacao_cenarios.somente_bess.payback_anos, 1)} anos
                    </td>
                    <td className="text-right py-3 px-4 text-green-600">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.somente_bess.npv)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatPercentage(analise_hibrida.comparacao_cenarios.somente_bess.tir_percentual)}
                    </td>
                  </tr>

                  {/* Híbrido (RECOMENDADO) */}
                  <tr className="bg-blue-50 dark:bg-blue-950 font-bold">
                    <td className="py-3 px-4 text-blue-600">
                      ★ Híbrido (Solar + BESS)
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.hibrido.investimento)}
                    </td>
                    <td className="text-right py-3 px-4 text-green-600">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.hibrido.economia_anual)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatNumber(analise_hibrida.comparacao_cenarios.hibrido.payback_anos, 1)} anos
                    </td>
                    <td className="text-right py-3 px-4 text-green-600 text-lg">
                      {formatCurrency(analise_hibrida.comparacao_cenarios.hibrido.npv)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatPercentage(analise_hibrida.comparacao_cenarios.hibrido.tir_percentual)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Vantagens do Híbrido */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Vantagem vs. Somente Solar
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(analise_hibrida.comparacao_cenarios.hibrido.vantagem_vs_solar_npv)}
                </div>
                <div className="text-xs text-gray-500">
                  +{formatPercentage(analise_hibrida.comparacao_cenarios.hibrido.vantagem_vs_solar_percentual)} de VPL
                </div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Vantagem vs. Somente BESS
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analise_hibrida.comparacao_cenarios.hibrido.vantagem_vs_bess_npv)}
                </div>
                <div className="text-xs text-gray-500">
                  +{formatPercentage(analise_hibrida.comparacao_cenarios.hibrido.vantagem_vs_bess_percentual)} de VPL
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===================================================================== */}
      {/* SEÇÃO 5: RECOMENDAÇÕES E ALERTAS */}
      {/* ===================================================================== */}
      {(analise_hibrida.recomendacoes.length > 0 || analise_hibrida.alertas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recomendações */}
          {analise_hibrida.recomendacoes.length > 0 && (
            <Card>
              <CardHeader className="bg-green-50 dark:bg-green-950">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {analise_hibrida.recomendacoes.map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Alertas */}
          {analise_hibrida.alertas.length > 0 && (
            <Card>
              <CardHeader className="bg-orange-50 dark:bg-orange-950">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {analise_hibrida.alertas.map((alert, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">⚠</span>
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* BOTÕES DE AÇÃO */}
      {/* ===================================================================== */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={onBackToForm}
          variant="outline"
          size="lg"
        >
          Voltar ao Formulário
        </Button>
        <Button
          onClick={onNewSimulation}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Nova Simulação
        </Button>
      </div>
    </div>
  );
};

export default BESSDashboard;