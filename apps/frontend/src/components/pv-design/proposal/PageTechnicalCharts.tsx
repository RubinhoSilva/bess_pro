import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Sun } from 'lucide-react';

interface PageTechnicalChartsProps {
  results: {
    geracaoEstimadaMensal?: number[];
    formData?: {
      energyBills?: Array<{
        consumoMensal?: number[];
      }>;
    };
    advancedSolar?: {
      irradiacaoMensal?: number[];
      performance?: {
        prMedio?: number;
        yieldEspecifico?: number;
        fatorCapacidade?: number;
      };
    };
  };
}

export const PageTechnicalCharts: React.FC<PageTechnicalChartsProps> = ({ results }) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const geracaoMensal = results.geracaoEstimadaMensal || Array(12).fill(0);

  // Calculate total monthly consumption
  const consumoMensal = (results.formData?.energyBills || []).reduce((acc, bill) => {
    (bill.consumoMensal || []).forEach((consumo, index) => {
      acc[index] = (acc[index] || 0) + consumo;
    });
    return acc;
  }, Array(12).fill(0));

  // Monthly Generation vs Consumption Chart Data
  const monthlyComparisonData = months.map((month, index) => ({
    name: month,
    geracao: Math.round(geracaoMensal[index] || 0),
    consumo: Math.round(consumoMensal[index] || 0),
  }));

  // Irradiation Data
  const irradiacaoMensal = results.advancedSolar?.irradiacaoMensal || [];
  const irradiacaoData = months.map((month, index) => ({
    name: month,
    irradiacao: (irradiacaoMensal[index] || 0).toFixed(1),
  }));

  // Performance Metrics Pie Chart
  const pr = results.advancedSolar?.performance?.prMedio || 0;
  const performanceData = [
    { name: 'Performance Ratio', value: pr * 100, color: '#10b981' },
    { name: 'Perdas do Sistema', value: (1 - pr) * 100, color: '#ef4444' },
  ];

  return (
    <section className="proposal-page p-8 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold mb-2">
          ANÁLISE DE DESEMPENHO
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Gráficos e Projeções Técnicas
        </h2>
      </div>

      {/* Monthly Generation vs Consumption */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          Geração vs Consumo Mensal
        </h3>
        <div style={{ height: '140px' }}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthlyComparisonData} barGap={4} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                stroke="#9ca3af"
                label={{ value: 'Energia (kWh)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar
                dataKey="consumo"
                fill="#3b82f6"
                name="Consumo (kWh)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="geracao"
                fill="#10b981"
                name="Geração (kWh)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-3 text-center">
          Comparação entre a energia consumida e a geração estimada do sistema fotovoltaico ao longo do ano
        </p>
      </div>

      {/* Irradiation Chart */}
      {irradiacaoMensal.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Sun className="w-4 h-4 text-orange-600" />
            Irradiação Solar Mensal
          </h3>
          <div style={{ height: '120px' }}>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={irradiacaoData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#9ca3af"
                  label={{ value: 'Irradiação (kWh/m²/dia)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="irradiacao"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Irradiação Solar"
                  dot={{ fill: '#f59e0b', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-600 mt-3 text-center">
            Irradiação solar média diária por mês na localização do projeto
          </p>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Performance Ratio Pie */}
        {pr > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Performance Ratio
            </h3>
            <div style={{ height: '100px' }}>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ value }) => `${value.toFixed(1)}%`}
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-3">
              <p className="text-3xl font-bold text-green-600">{(pr * 100).toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Eficiência do Sistema</p>
            </div>
          </div>
        )}

        {/* Key Performance Indicators */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
          <h3 className="text-base font-bold mb-3">Indicadores de Desempenho</h3>
          <div className="space-y-2">
            {results.advancedSolar?.performance?.prMedio && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-white/80 mb-1">Performance Ratio Médio</p>
                <p className="text-2xl font-bold">{(results.advancedSolar.performance.prMedio * 100).toFixed(1)}%</p>
              </div>
            )}
            {results.advancedSolar?.performance?.yieldEspecifico && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-white/80 mb-1">Yield Específico</p>
                <p className="text-2xl font-bold">{results.advancedSolar.performance.yieldEspecifico.toFixed(0)}</p>
                <p className="text-xs text-white/70">kWh/kWp/ano</p>
              </div>
            )}
            {results.advancedSolar?.performance?.fatorCapacidade && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-white/80 mb-1">Fator de Capacidade</p>
                <p className="text-2xl font-bold">{(results.advancedSolar.performance.fatorCapacidade * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="proposal-footer">
        <p className="text-gray-500">Página 4</p>
      </footer>
    </section>
  );
};
