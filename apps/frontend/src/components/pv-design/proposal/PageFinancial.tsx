import React from 'react';
import { DollarSign, TrendingUp, Calendar, PiggyBank, Percent } from 'lucide-react';

interface PageFinancialProps {
  results: {
    totalInvestment?: number;
    economiaAnualEstimada?: number;
    economiaProjetada?: number;
    vpl?: number;
    tir?: number;
    payback?: number;
    roi?: number;
    lcoe?: number;
  };
}

export const PageFinancial: React.FC<PageFinancialProps> = ({ results }) => {
  const formatCurrency = (value: number) =>
    (value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    });

  const totalInvestment = results.totalInvestment || 0;
  const economiaAnual = results.economiaAnualEstimada || results.economiaProjetada || 0;
  const vpl = results.vpl || 0;
  const tir = results.tir || 0;
  const payback = results.payback || 0;
  const roi = results.roi || 0;
  const lcoe = results.lcoe || 0;

  // Calculate 25-year savings
  const economia25Anos = economiaAnual * 25;

  return (
    <section className="proposal-page p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="mb-3">
        <div className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
          ANÁLISE FINANCEIRA
        </div>
        <h2 className="proposal-title text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Viabilidade Econômica do Investimento
        </h2>
      </div>

      {/* Investment Summary */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-xl p-6 mb-3 text-white">
        <div className="text-center mb-3">
          <p className="text-lg mb-2 text-white/90">Investimento Total do Projeto</p>
          <p className="text-5xl font-bold text-yellow-300">{formatCurrency(totalInvestment)}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-sm text-white/80 mb-1">Economia Anual</p>
            <p className="text-lg font-bold">{formatCurrency(economiaAnual)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-sm text-white/80 mb-1">Economia em 25 Anos</p>
            <p className="text-lg font-bold text-yellow-300">{formatCurrency(economia25Anos)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-sm text-white/80 mb-1">Retorno Total</p>
            <p className="text-lg font-bold text-yellow-300">
              {((economia25Anos / totalInvestment) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Key Financial Indicators */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Indicadores de Retorno
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valor Presente Líquido (VPL)</p>
                <p className="text-xs text-gray-500">Valor do projeto descontado no tempo</p>
              </div>
              <p className={`text-lg font-bold ${vpl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(vpl)}
              </p>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-600 mb-1">Taxa Interna de Retorno (TIR)</p>
                <p className="text-xs text-gray-500">Rentabilidade anual do investimento</p>
              </div>
              <p className="text-lg font-bold text-green-600">{tir.toFixed(2)}%</p>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Retorno sobre Investimento (ROI)</p>
                <p className="text-xs text-gray-500">Retorno total percentual</p>
              </div>
              <p className="text-lg font-bold text-green-600">{(roi * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Período de Retorno
          </h3>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center mb-3">
              <p className="text-6xl font-bold text-blue-600 mb-2">{payback.toFixed(1)}</p>
              <p className="text-xl text-gray-900 font-semibold">anos</p>
              <p className="text-sm text-gray-600 mt-2">Tempo de Payback</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 w-full">
              <p className="text-sm text-gray-700 text-center">
                Após <strong>{payback.toFixed(1)} anos</strong>, o investimento estará totalmente recuperado
                e você começará a ter lucro líquido com a economia de energia.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-3">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-purple-600" />
          Composição do Investimento
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Equipamentos (módulos + inversores)</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(totalInvestment * 0.65)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-600">Instalação e mão de obra</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(totalInvestment * 0.20)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-600">Estruturas e cabos</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(totalInvestment * 0.10)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-600">Projeto e homologação</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(totalInvestment * 0.05)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-40 h-40 rounded-full border-8 border-green-500 flex items-center justify-center mb-4 mx-auto">
                <div>
                  <p className="text-xl font-bold text-green-600">100%</p>
                  <p className="text-xs text-gray-600">Incluso</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Todos os custos estão incluídos no investimento total. Não há custos ocultos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LCOE */}
      {lcoe > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Custo Nivelado de Energia (LCOE)
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-yellow-300">
                {formatCurrency(lcoe / 100)}
                <span className="text-xl text-white/90">/kWh</span>
              </p>
              <p className="text-sm text-white/80 mt-2">
                Custo médio da energia gerada ao longo da vida útil do sistema
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-sm text-white/80 mb-2">Comparado com tarifa média</p>
              <p className="text-xl font-bold text-yellow-300">-75%</p>
              <p className="text-xs text-white/70 mt-1">de economia</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="proposal-footer">
        <p className="text-gray-500">Página 5</p>
      </footer>
    </section>
  );
};
