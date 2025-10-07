import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Sun, TrendingUp, Activity, Zap } from 'lucide-react';

interface PageTechnicalCharts2Props {
  results: {
    geracaoEstimadaMensal?: number[];
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

export const PageTechnicalCharts2: React.FC<PageTechnicalCharts2Props> = ({ results }) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const geracaoMensal = results.geracaoEstimadaMensal || Array(12).fill(0);
  const irradiacaoMensal = results.advancedSolar?.irradiacaoMensal || [];

  // Irradiation Data
  const irradiacaoData = months.map((month, index) => ({
    name: month,
    irradiacao: parseFloat((irradiacaoMensal[index] || 0).toFixed(2)),
    geracao: parseFloat((geracaoMensal[index] || 0).toFixed(0)),
  }));

  // Calculate statistics
  const irradiacaoMedia = irradiacaoMensal.length > 0 ? irradiacaoMensal.reduce((a, b) => a + b, 0) / irradiacaoMensal.length : 0;
  const irradiacaoMax = irradiacaoMensal.length > 0 ? Math.max(...irradiacaoMensal) : 0;
  const irradiacaoMin = irradiacaoMensal.length > 0 ? Math.min(...irradiacaoMensal.filter(v => v > 0)) : 0;

  // Performance metrics
  const pr = results.advancedSolar?.performance?.prMedio || 0;
  const yieldEspecifico = results.advancedSolar?.performance?.yieldEspecifico || 0;
  const fatorCapacidade = results.advancedSolar?.performance?.fatorCapacidade || 0;

  return (
    <section className="proposal-page relative bg-gradient-to-br from-slate-50 via-white to-orange-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-700 via-yellow-600 to-orange-700 bg-clip-text text-transparent leading-tight">
            Irradiação Solar e Performance
          </h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-r from-orange-500 to-yellow-600 text-white rounded-xl p-3">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">IRRADIAÇÃO MÉDIA</p>
                <p className="text-2xl font-bold text-orange-600">{irradiacaoMedia.toFixed(2)}</p>
                <p className="text-xs text-gray-500">kWh/m²/dia</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl p-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">PICO MÁXIMO</p>
                <p className="text-2xl font-bold text-yellow-600">{irradiacaoMax.toFixed(2)}</p>
                <p className="text-xs text-gray-500">kWh/m²/dia</p>
              </div>
            </div>
          </div>


        </div>

        {/* Main Irradiation Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-2 rounded-lg">
                <Sun className="w-5 h-5" />
              </div>
              Irradiação Solar Mensal vs Geração
            </h3>
            
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={irradiacaoData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorIrradiacao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorGeracao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6b7280', fontSize: 14, fontWeight: 500 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#6b7280', fontSize: 14, fontWeight: 500 }}
                    stroke="#9ca3af"
                    label={{ value: 'Irradiação (kWh/m²/dia)', angle: -90, position: 'insideLeft', fill: '#6b7280', style: { fontSize: 14, fontWeight: 500 } }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#6b7280', fontSize: 14, fontWeight: 500 }}
                    stroke="#9ca3af"
                    label={{ value: 'Geração (kWh)', angle: 90, position: 'insideRight', fill: '#6b7280', style: { fontSize: 14, fontWeight: 500 } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                      padding: '12px'
                    }}
                    formatter={(value: any, name: string) => [
                      `${value.toLocaleString('pt-BR')}`,
                      name === 'irradiacao' ? 'Irradiação (kWh/m²/dia)' : 'Geração (kWh)'
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="irradiacao"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorIrradiacao)"
                    name="Irradiação Solar"
                    animationDuration={1000}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="geracao"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorGeracao)"
                    name="Geração Estimada"
                    animationDuration={1200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
              <p className="text-gray-700 text-center leading-relaxed">
                <span className="font-semibold text-gray-900">Análise de Irradiação:</span> A irradiação solar média diária é de 
                <span className="text-orange-600 font-semibold"> {irradiacaoMedia.toFixed(2)} kWh/m²/dia</span>, 
                com pico de <span className="text-yellow-600 font-semibold">{irradiacaoMax.toFixed(2)} kWh/m²/dia</span>. 
                Esta irradiação determina diretamente a capacidade de geração do sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="proposal-footer">
          <p className="text-gray-500 text-sm">Página 5</p>
        </footer>
      </div>
    </section>
  );
};