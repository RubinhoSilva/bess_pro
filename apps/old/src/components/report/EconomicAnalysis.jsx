import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const EconomicAnalysis = ({ data }) => {
  const { formData, investimentoTotal, economiaAnualBESS, economiaAnualSolar, custoAnualCombustivel } = data;
  const beneficioLiquidoAnual = economiaAnualBESS + economiaAnualSolar - custoAnualCombustivel;

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">3. Análise Econômica</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 print:bg-slate-50 print:border-slate-200">
          <h3 className="font-bold text-slate-600 mb-3 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Composição do Investimento
          </h3>
          <div className="space-y-2">
            <AnalysisItem label="Sistema BESS" value={formatCurrency(formData.custoInvestimento)} />
            <AnalysisItem label="Sistema Solar" value={formatCurrency(formData.potenciaSolar * formData.custoSolar)} />
            <AnalysisItem label="Gerador Diesel" value={formatCurrency(formData.custoGerador)} />
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg mt-4 print:bg-slate-100">
            <span className="font-bold text-slate-700">Investimento Total</span>
            <span className="font-bold text-lg text-slate-800">{formatCurrency(investimentoTotal)}</span>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 print:bg-slate-50 print:border-slate-200">
          <h3 className="font-bold text-slate-600 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Benefícios Anuais
          </h3>
          <div className="space-y-2">
            <AnalysisItem label="Economia BESS" value={formatCurrency(economiaAnualBESS)} isBenefit />
            <AnalysisItem label="Economia Solar" value={formatCurrency(economiaAnualSolar)} isBenefit />
            <AnalysisItem label="Custo Anual Diesel" value={`-${formatCurrency(custoAnualCombustivel)}`} />
          </div>
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg mt-4 print:bg-green-50">
            <span className="font-bold text-green-800">Benefício Líquido Anual</span>
            <span className="font-bold text-lg text-green-700">{formatCurrency(beneficioLiquidoAnual)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const AnalysisItem = ({ label, value, isBenefit = false }) => (
  <div className="flex justify-between text-sm py-1.5 border-b border-slate-100">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium ${isBenefit ? 'text-green-600' : 'text-slate-700'}`}>{value}</span>
  </div>
);

export default EconomicAnalysis;