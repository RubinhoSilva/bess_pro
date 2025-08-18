import React from 'react';
import { DollarSign, TrendingUp, Calendar, Banknote, CreditCard, Landmark } from 'lucide-react';
import { PaybackChart } from '../results/PaybackChart';

interface PageFinancialProps {
  results: {
    totalInvestment: number;
    economiaAnualEstimada: number;
    vpl: number;
    tir: number;
    payback: number;
    formData: {
      paymentMethod?: string;
      cardInstallments?: number;
      cardInterest?: number;
      financingInstallments?: number;
      financingInterest?: number;
    };
    fluxoCaixa: Array<{
      ano: number;
      fluxoLiquido: number;
    }>;
  };
  profile?: {
    company?: string;
  };
}

export const PageFinancial: React.FC<PageFinancialProps> = ({ results, profile }) => {
  const { totalInvestment, economiaAnualEstimada, vpl, tir, payback, formData } = results;
  const companyName = profile?.company || 'Sua Empresa Solar';

  const formatCurrency = (value: number) => (value || 0).toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });

  const calculateInstallment = (total: number, months: number, interestRate: number) => {
    if (!months || months <= 0) return 0;
    if (interestRate === 0) return total / months;
    const i = interestRate / 100;
    return total * (i * Math.pow(1 + i, months)) / (Math.pow(1 + i, months) - 1);
  };

  const cardInstallmentValue = calculateInstallment(
    totalInvestment, 
    formData.cardInstallments || 0, 
    formData.cardInterest || 0
  );
  
  const financingInstallmentValue = calculateInstallment(
    totalInvestment, 
    formData.financingInstallments || 0, 
    formData.financingInterest || 0
  );

  return (
    <section className="proposal-page p-10">
      <h2 className="proposal-title">Análise e Proposta Financeira</h2>
      
      <div className="mt-8">
        <h3 className="proposal-subtitle">Indicadores de Viabilidade</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
          <div className="financial-card">
            <Banknote className="w-6 h-6 text-red-400" />
            <span>Investimento</span>
            <p>{formatCurrency(totalInvestment)}</p>
          </div>
          
          <div className="financial-card">
            <DollarSign className="w-6 h-6 text-green-400" />
            <span>Economia Anual</span>
            <p>{formatCurrency(economiaAnualEstimada)}</p>
          </div>
          
          <div className="financial-card">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <span>VPL</span>
            <p className={vpl > 0 ? 'text-green-400' : 'text-red-400'}>
              {formatCurrency(vpl)}
            </p>
          </div>
          
          <div className="financial-card">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <span>TIR</span>
            <p>{(tir || 0).toFixed(2)}%</p>
          </div>
          
          <div className="financial-card">
            <Calendar className="w-6 h-6 text-purple-400" />
            <span>Payback</span>
            <p>{(payback || 0).toFixed(1)} anos</p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="proposal-subtitle">Fluxo de Caixa Projetado</h3>
        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <PaybackChart results={results} />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="proposal-subtitle">Proposta de Investimento</h3>
        <div className="mt-4 p-8 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-l-4 border-yellow-400 text-center rounded-r-lg">
          <p className="text-lg text-slate-300">Valor Total do Projeto</p>
          <p className="text-5xl font-bold text-white my-2">{formatCurrency(totalInvestment)}</p>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="proposal-subtitle">Condições de Pagamento</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="payment-card">
            <h4 className="font-bold text-lg">À Vista</h4>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalInvestment)}</p>
            <p className="text-sm text-slate-400">Pagamento único com desconto</p>
          </div>
          
          {formData.paymentMethod === 'parcelado' && (
            <>
              <div className="payment-card">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <CreditCard /> Cartão / Boleto
                </h4>
                <p className="text-2xl font-bold text-blue-400">
                  {formData.cardInstallments || 0}x de {formatCurrency(cardInstallmentValue)}
                </p>
                <p className="text-sm text-slate-400">
                  Com juros de {formData.cardInterest || 0}% a.m.
                </p>
              </div>
              
              <div className="payment-card md:col-span-2">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <Landmark /> Financiamento Bancário
                </h4>
                <p className="text-2xl font-bold text-purple-400">
                  {formData.financingInstallments || 0}x de {formatCurrency(financingInstallmentValue)}
                </p>
                <p className="text-sm text-slate-400">
                  Com juros de {formData.financingInterest || 0}% a.m. (Sujeito a aprovação)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="proposal-footer">
        <p>Proposta válida por 15 dias. Os valores podem sofrer alterações. | {companyName}</p>
      </footer>
    </section>
  );
};