import React from 'react';
import { CreditCard, Banknote, Calendar, Percent, Shield, Clock } from 'lucide-react';

interface PagePaymentProps {
  results: {
    totalInvestment?: number;
  };
  profile?: {
    company?: string;
  };
}

export const PagePayment: React.FC<PagePaymentProps> = ({ results, profile }) => {
  const companyName = profile?.company || 'BessPro Energia Solar';
  const totalInvestment = results.totalInvestment || 0;

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    });

  // Calculate installment options
  const avista = totalInvestment * 0.95; // 5% discount
  const cartao12x = totalInvestment / 12;
  const financiamento60x = (totalInvestment * 1.3) / 60; // ~30% interest over 5 years

  return (
    <section className="proposal-page relative bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Formas de Pagamento
          </h2>
          <p className="text-gray-600 text-lg">
            Escolha a melhor opção para seu orçamento com condições especiais
          </p>
        </div>

        {/* Payment Options */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          {/* À Vista */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            <div className="absolute top-4 right-4 bg-yellow-400 text-green-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
              5% OFF
            </div>
            
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 w-fit mb-6">
                <Banknote className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">À Vista</h3>
              <p className="text-4xl font-bold text-yellow-300 mb-4">{formatCurrency(avista)}</p>
              <p className="text-white/90 leading-relaxed mb-6">Pagamento único com desconto especial</p>
              
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Percent className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">Economia imediata</span>
                  </div>
                  <p className="text-xl font-bold text-yellow-300">{formatCurrency(totalInvestment - avista)}</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">Melhor custo-benefício</span>
                  </div>
                  <p className="text-sm text-white/90">Retorno mais rápido do investimento</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cartão/Boleto */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 w-fit mb-6">
                <CreditCard className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Cartão/Boleto</h3>
              <p className="text-4xl font-bold text-yellow-300 mb-2">12x</p>
              <p className="text-2xl font-semibold mb-4">{formatCurrency(cartao12x)}</p>
              <p className="text-white/90 leading-relaxed mb-6">Parcelamento sem juros no cartão de crédito</p>
              
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">Parcelas fixas</span>
                  </div>
                  <p className="text-sm text-white/90">Sem juros ou taxas adicionais</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">Segurança</span>
                  </div>
                  <p className="text-sm text-white/90">Transação protegida e certificada</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financiamento */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden transform hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 w-fit mb-6">
                <Calendar className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Financiamento</h3>
              <p className="text-4xl font-bold text-yellow-300 mb-2">60x</p>
              <p className="text-2xl font-semibold mb-4">{formatCurrency(financiamento60x)}</p>
              <p className="text-white/90 leading-relaxed mb-6">Financiamento bancário em até 5 anos</p>
              
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">Prazo estendido</span>
                  </div>
                  <p className="text-sm text-white/90">Até 60 meses para pagar</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">Aprovação facilitada</span>
                  </div>
                  <p className="text-sm text-white/90">Análise de crédito rápida</p>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Footer */}
        <footer className="proposal-footer">
          <p className="text-gray-500">Página 9</p>
        </footer>
      </div>
    </section>
  );
};