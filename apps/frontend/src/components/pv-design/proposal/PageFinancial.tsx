import React from 'react';
import { DollarSign, TrendingUp, Target, Shield, CheckCircle, Percent } from 'lucide-react';

interface PageFinancialProps {
  results: {
    totalInvestment?: number;
    economiaAnualEstimada?: number;
    vpl?: number;
    tir?: number;
    payback?: number;
    lcoe?: number;
  };
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const PageFinancial: React.FC<PageFinancialProps> = ({ results }) => {
  const totalInvestment = results.totalInvestment || 0;
  const economiaAnual = results.economiaAnualEstimada || 0;
  const vpl = results.vpl || 0;
  const tir = results.tir || 0;
  const payback = results.payback || 0;
  const lcoe = results.lcoe || 0;

  const economia25Anos = economiaAnual * 25;

  return (
    <section className="proposal-page relative bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-8">


        {/* Investment Summary */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-xl p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10 text-center mb-6">
            <p className="text-xl mb-3 text-white/90 font-medium">Investimento Total do Projeto</p>
            <p className="text-6xl font-bold text-yellow-300">{formatCurrency(totalInvestment)}</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center border border-white/20">
              <p className="text-sm text-white/80 mb-2 font-medium">Economia Anual</p>
              <p className="text-2xl font-bold">{formatCurrency(economiaAnual)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center border border-white/20">
              <p className="text-sm text-white/80 mb-2 font-medium">Economia em 25 Anos</p>
              <p className="text-2xl font-bold text-yellow-300">{formatCurrency(economia25Anos)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center border border-white/20">
              <p className="text-sm text-white/80 mb-2 font-medium">Retorno Total</p>
              <p className="text-2xl font-bold text-yellow-300">
                {((economia25Anos / totalInvestment) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Key Financial Indicators */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              Indicadores de Retorno
            </h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center py-4 px-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Valor Presente Líquido (VPL)</p>
                  <p className="text-xs text-gray-500">Valor do projeto descontado no tempo</p>
                </div>
                <p className={`text-xl font-bold ${vpl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(vpl)}
                </p>
              </div>
              <div className="flex justify-between items-center py-4 px-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Taxa Interna de Retorno (TIR)</p>
                  <p className="text-xs text-gray-500">Rentabilidade anual do investimento</p>
                </div>
                <p className={`text-xl font-bold ${tir > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tir.toFixed(1)}%
                </p>
              </div>
              <div className="flex justify-between items-center py-4 px-4 bg-blue-50 rounded-xl border border-blue-200">
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Payback Simples</p>
                  <p className="text-xs text-blue-500">Tempo para recuperar o investimento</p>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {payback.toFixed(1)} anos
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              Benefícios do Projeto
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-2">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-900">Economia Imediata</p>
                  <p className="text-xs text-green-600">Redução na conta de luz desde o primeiro mês</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg p-2">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Valorização do Imóvel</p>
                  <p className="text-xs text-blue-600">Aumento de aproximadamente 10% no valor</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-2">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-900">Proteção contra Aumentos</p>
                  <p className="text-xs text-purple-600">Segurança contra reajustes na tarifa de energia</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LCOE */}
        {lcoe > 0 && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                  <Percent className="w-6 h-6" />
                </div>
                Custo Nivelado de Energia (LCOE)
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-yellow-300 mb-2">
                    {formatCurrency(lcoe / 100)}
                    <span className="text-2xl text-white/90 ml-2">/kWh</span>
                  </p>
                  <p className="text-sm text-white/80">
                    Custo médio da energia gerada ao longo da vida útil do sistema
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                  <p className="text-sm text-white/80 mb-3 font-medium">Comparado com tarifa média</p>
                  <p className="text-4xl font-bold text-yellow-300 mb-2">-75%</p>
                  <p className="text-sm text-white/70">de economia</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="proposal-footer">
          <p className="text-gray-500">Página 6</p>
        </footer>
      </div>
    </section>
  );
};
