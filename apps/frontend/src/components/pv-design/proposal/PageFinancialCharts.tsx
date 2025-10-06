import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine, Cell } from 'recharts';
import { TrendingUp, Leaf, DollarSign } from 'lucide-react';

interface PageFinancialChartsProps {
  results: {
    fluxoCaixa?: Array<{
      ano: number;
      economia?: number;
      fluxoLiquido?: number;
      fluxoAcumulado?: number;
      custoSemFV?: number;
      custoComFV?: number;
    }>;
    advancedFinancial?: {
      cashFlow?: Array<{
        ano: number;
        geracaoAnual?: number;
        economiaEnergia?: number;
        custosOM?: number;
        fluxoLiquido?: number;
        fluxoAcumulado?: number;
      }>;
    };
    payback?: number;
    totalInvestment?: number;
    economiaAnualEstimada?: number;
    economiaProjetada?: number;
    potenciaSistema?: number;
  };
}

export const PageFinancialCharts: React.FC<PageFinancialChartsProps> = ({ results }) => {
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    });

  // Use advanced financial data if available, otherwise use basic
  const cashFlowData = results.advancedFinancial?.cashFlow || results.fluxoCaixa || [];

  // Prepare cash flow chart data (first 25 years)
  const cashFlowChartData = cashFlowData.slice(0, 25).map((item) => ({
    ano: item.ano,
    fluxoAcumulado: item.fluxoAcumulado || 0,
  }));

  // Payback visualization data
  const paybackYear = Math.ceil(results.payback || 0);
  const paybackData = cashFlowData.slice(0, paybackYear + 2).map((item) => ({
    ano: item.ano,
    acumulado: item.fluxoAcumulado || 0,
  }));

  // Cost comparison over 25 years
  const costComparisonData = cashFlowData.slice(0, 25).map((item: any) => ({
    ano: item.ano,
    semSolar: item.custoSemFV || 0,
    comSolar: item.custoComFV || 0,
  }));

  // Calculate CO2 savings (avg 0.5 kg CO2/kWh)
  const economiaAnual = results.economiaAnualEstimada || results.economiaProjetada || 0;
  const co2Anual = (economiaAnual * 0.5) / 1000; // tons
  const co2Total25Anos = co2Anual * 25;
  const arvoresEquivalentes = Math.round(co2Total25Anos / 0.02); // 1 tree = ~20kg CO2/year

  return (
    <section className="proposal-page p-8 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="mb-4">
        <div className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold mb-2">
          PROJEÇÕES FINANCEIRAS
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Fluxo de Caixa e Análise de Retorno
        </h2>
      </div>

      {/* Cash Flow Projection */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Fluxo de Caixa Acumulado (25 Anos)
        </h3>
        <div style={{ height: '140px' }}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={cashFlowChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorFluxo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="ano"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                stroke="#9ca3af"
                label={{ value: 'Ano do Projeto', position: 'insideBottom', offset: -5, fill: '#6b7280' }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                stroke="#9ca3af"
                tickFormatter={formatCurrency}
                label={{ value: 'Fluxo Acumulado (R$)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              />
              <Tooltip
                formatter={(value: any) => [formatCurrency(value), 'Fluxo Acumulado']}
                labelFormatter={(label) => `Ano ${label}`}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="fluxoAcumulado"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorFluxo)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-3 text-center">
          Projeção do retorno financeiro acumulado ao longo de 25 anos de operação do sistema
        </p>
      </div>

      {/* Payback Visualization */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            Visualização do Payback
          </h3>
          <div style={{ height: '120px' }}>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={paybackData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="ano"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  stroke="#9ca3af"
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                <Bar dataKey="acumulado" radius={[4, 4, 0, 0]}>
                  {paybackData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.acumulado >= 0 ? '#10b981' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4 bg-blue-50 rounded-xl p-3">
            <p className="text-sm text-gray-700">
              Retorno do investimento em <strong className="text-blue-600">{paybackYear} anos</strong>
            </p>
          </div>
        </div>

        {/* Cost Comparison */}
        {costComparisonData.length > 0 && costComparisonData[0].semSolar > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3">Com vs Sem Solar (10 anos)</h3>
            <div style={{ height: '120px' }}>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={costComparisonData.slice(0, 10)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="ano"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    stroke="#9ca3af"
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="semSolar"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Sem Solar"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="comSolar"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Com Solar"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-600 mt-3 text-center">
              Custo acumulado de energia com e sem sistema solar
            </p>
          </div>
        )}
      </div>

      {/* Environmental Impact */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-xl p-4 text-white">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <Leaf className="w-5 h-5" />
          Impacto Ambiental Positivo
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-3xl mb-1">🌳</div>
            <p className="text-xl font-bold text-yellow-300">{arvoresEquivalentes.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-white/90 mt-1">Árvores Plantadas</p>
            <p className="text-xs text-white/70">equivalente em 25 anos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-3xl mb-1">♻️</div>
            <p className="text-xl font-bold text-yellow-300">{co2Total25Anos.toFixed(1)}</p>
            <p className="text-xs text-white/90 mt-1">Toneladas de CO₂</p>
            <p className="text-xs text-white/70">evitadas em 25 anos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-3xl mb-1">🚗</div>
            <p className="text-xl font-bold text-yellow-300">{Math.round(co2Total25Anos * 4.5).toLocaleString('pt-BR')}</p>
            <p className="text-xs text-white/90 mt-1">km de Carro</p>
            <p className="text-xs text-white/70">emissões equivalentes</p>
          </div>
        </div>
        <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <p className="text-center text-xs text-white/95">
            Ao investir em energia solar, você contribui para um planeta mais limpo e sustentável.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="proposal-footer">
        <p className="text-gray-500">Página 6</p>
      </footer>
    </section>
  );
};
