import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine, Cell } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

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
    <section className="proposal-page relative bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Cash Flow Projection - Enhanced */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-3xl shadow-2xl p-8 mb-8 border border-blue-100/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8 flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              Fluxo de Caixa Acumulado (25 Anos)
            </h3>
            <div style={{ height: '220px' }} className="bg-white/60 rounded-2xl p-4 backdrop-blur-sm border border-white/50">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorFluxo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorFluxoGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="ano"
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    stroke="#9ca3af"
                    label={{ value: 'Ano do Projeto', position: 'insideBottom', offset: -8, fill: '#6b7280', fontSize: 13, fontWeight: 600 }}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    stroke="#9ca3af"
                    tickFormatter={formatCurrency}
                    label={{ value: 'Fluxo Acumulado (R$)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 13, fontWeight: 600 }}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value), 'Fluxo Acumulado']}
                    labelFormatter={(label) => `Ano ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: '#3b82f6',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}
                  />
                  <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" strokeWidth={2} />
                  <Area
                    type="monotone"
                    dataKey="fluxoAcumulado"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorFluxo)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
              <p className="text-gray-700 text-center leading-relaxed font-medium">
                Projeção do retorno financeiro acumulado ao longo de 25 anos de operação do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Grid Layout */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Payback Visualization - Enhanced */}
          <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-3xl shadow-2xl p-8 border border-indigo-100/50 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full -mr-12 -mt-12"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-2 rounded-lg shadow-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                Visualização do Payback
              </h3>
              <div style={{ height: '180px' }} className="bg-white/60 rounded-2xl p-4 backdrop-blur-sm border border-white/50">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paybackData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="ano"
                      tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
                      stroke="#9ca3af"
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: '#6366f1',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                      }}
                    />
                    <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" strokeWidth={2} />
                    <Bar dataKey="acumulado" radius={[8, 8, 0, 0]}>
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
              <div className="text-center mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
                <p className="text-white/90 font-medium mb-2">Retorno do investimento</p>
                <p className="text-3xl font-bold text-yellow-300">{paybackYear} anos</p>
              </div>
            </div>
          </div>

          {/* Cost Comparison - Enhanced */}
          {costComparisonData.length > 0 && costComparisonData[0].semSolar > 0 && (
            <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-3xl shadow-2xl p-8 border border-orange-100/50 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full -mr-12 -mt-12"></div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-lg shadow-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  Com vs Sem Solar (10 anos)
                </h3>
                <div style={{ height: '180px' }} className="bg-white/60 rounded-2xl p-4 backdrop-blur-sm border border-white/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={costComparisonData.slice(0, 10)} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                      <XAxis
                        dataKey="ano"
                        tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
                        stroke="#9ca3af"
                      />
                      <YAxis
                        tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
                        stroke="#9ca3af"
                        tickFormatter={formatCurrency}
                      />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderColor: '#f97316',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(249, 115, 22, 0.15)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(249, 115, 22, 0.2)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{
                          paddingTop: '20px',
                          fontSize: '13px',
                          fontWeight: 600
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="semSolar"
                        stroke="#ef4444"
                        strokeWidth={3}
                        name="Sem Solar"
                        dot={{ r: 4, fill: '#ef4444' }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="comSolar"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Com Solar"
                        dot={{ r: 4, fill: '#10b981' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200/50">
                  <p className="text-gray-700 text-center leading-relaxed font-medium">
                    Custo acumulado de energia com e sem sistema solar
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="proposal-footer">
          <p className="text-gray-500">Página 7</p>
        </footer>
      </div>
    </section>
  );
};
