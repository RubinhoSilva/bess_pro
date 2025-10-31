import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';

interface PageTechnicalCharts1Props {
  results: {
    geracaoEstimadaMensal?: number[];
    geracaoAnual?: number;
    potencia?: number;
    areaEstimada?: number;
    numeroModulos?: number;
    formData?: {
      energyBills?: Array<{
        consumoMensal?: number[];
      }>;
      energyBillsA?: Array<{
        consumoMensalPonta?: number[];
        consumoMensalForaPonta?: number[];
      }>;
      customer?: {
        grupoTarifario: string;
      };
    };
  };
}

export const PageTechnicalCharts1: React.FC<PageTechnicalCharts1Props> = ({ results }) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const geracaoMensal = results.geracaoEstimadaMensal || Array(12).fill(0);
  const geracaoAnual = results.geracaoAnual || 0;
  const potencia = results.potencia || 1;
  const areaEstimada = results.areaEstimada || 0;
  const numeroModulos = results.numeroModulos || 1;

  // Calculate total monthly consumption
  const consumoMensal = (() => {
    const grupoTarifario = results.formData?.customer?.grupoTarifario || 'B';
    const consumoMensal = Array(12).fill(0);
    
    if (grupoTarifario === 'A' && results.formData?.energyBillsA?.length) {
      // Grupo A: somar ponta + fora ponta para cada mês de todas as contas
      results.formData.energyBillsA.forEach((bill: any) => {
        for (let i = 0; i < 12; i++) {
          consumoMensal[i] += (bill.consumoMensalPonta?.[i] || 0) + (bill.consumoMensalForaPonta?.[i] || 0);
        }
      });
    } else if (results.formData?.energyBills?.length) {
      // Grupo B: somar todas as contas (local + remotas)
      results.formData.energyBills.forEach((bill: any) => {
        (bill.consumoMensal || []).forEach((consumo: number, index: number) => {
          consumoMensal[index] = (consumoMensal[index] || 0) + consumo;
        });
      });
    }
    
    return consumoMensal;
  })();

  // Monthly Generation vs Consumption Chart Data
  const monthlyComparisonData = months.map((month, index) => ({
    name: month,
    geracao: Math.round(geracaoMensal[index] || 0),
    consumo: Math.round(consumoMensal[index] || 0),
  }));

  // Calculate totals
  const totalGeracao = geracaoMensal.reduce((acc, val) => acc + val, 0);
  const totalConsumo = consumoMensal.reduce((acc, val) => acc + val, 0);
  const percentualAtendimento = totalConsumo > 0 ? (totalGeracao / totalConsumo * 100) : 0;

  return (
    <section className="proposal-page relative bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent leading-tight">
            Geração vs Consumo Mensal
          </h2>
        </div>



        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-3">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">GERAÇÃO TOTAL</p>
                <p className="text-2xl font-bold text-green-600">{(totalGeracao / 1000).toFixed(1)} MWh</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">CONSUMO TOTAL</p>
                <p className="text-2xl font-bold text-blue-600">{(totalConsumo / 1000).toFixed(1)} MWh</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-3">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">% ATENDIMENTO</p>
                <p className="text-2xl font-bold text-purple-600">{percentualAtendimento.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-green-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-2 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              Comparação Mensal de Energia
            </h3>
            
            <div style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyComparisonData} barGap={8} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6b7280', fontSize: 14, fontWeight: 500 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 14, fontWeight: 500 }}
                    stroke="#9ca3af"
                    label={{ value: 'Energia (kWh)', angle: -90, position: 'insideLeft', fill: '#6b7280', style: { fontSize: 14, fontWeight: 500 } }}
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
                      `${value.toLocaleString('pt-BR')} kWh`,
                      name === 'geracao' ? 'Geração' : 'Consumo'
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value: string) => value === 'geracao' ? 'Geração (kWh)' : 'Consumo (kWh)'}
                  />
                  <Bar
                    dataKey="consumo"
                    fill="#3b82f6"
                    name="consumo"
                    radius={[8, 8, 0, 0]}
                    animationDuration={1000}
                  />
                  <Bar
                    dataKey="geracao"
                    fill="#10b981"
                    name="geracao"
                    radius={[8, 8, 0, 0]}
                    animationDuration={1200}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
              <p className="text-gray-700 text-center leading-relaxed">
                <span className="font-semibold text-gray-900">Análise Comparativa:</span> Este gráfico demonstra a relação entre 
                o consumo mensal de energia e a geração estimada do sistema fotovoltaico. 
                {percentualAtendimento >= 80 ? (
                  <span className="text-green-600 font-semibold"> O sistema atende {percentualAtendimento.toFixed(1)}% do consumo anual!</span>
                ) : (
                  <span className="text-blue-600 font-semibold"> O sistema atende {percentualAtendimento.toFixed(1)}% do consumo anual.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Highlights */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <p className="text-sm font-semibold text-green-700 mb-1">Maior Geração</p>
            <p className="text-lg font-bold text-green-800">
              {Math.max(...geracaoMensal).toLocaleString('pt-BR')} kWh
            </p>
            <p className="text-xs text-green-600">
              {months[geracaoMensal.indexOf(Math.max(...geracaoMensal))]}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-700 mb-1">Maior Consumo</p>
            <p className="text-lg font-bold text-blue-800">
              {Math.max(...consumoMensal).toLocaleString('pt-BR')} kWh
            </p>
            <p className="text-xs text-blue-600">
              {months[consumoMensal.indexOf(Math.max(...consumoMensal))]}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <p className="text-sm font-semibold text-purple-700 mb-1">Média Geração</p>
            <p className="text-lg font-bold text-purple-800">
              {(totalGeracao / 12).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh
            </p>
            <p className="text-xs text-purple-600">por mês</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
            <p className="text-sm font-semibold text-orange-700 mb-1">Média Consumo</p>
            <p className="text-lg font-bold text-orange-800">
              {(totalConsumo / 12).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh
            </p>
            <p className="text-xs text-orange-600">por mês</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="proposal-footer mt-20">
          <p className="text-gray-500 text-sm">Página 4</p>
        </footer>
      </div>
    </section>
  );
};