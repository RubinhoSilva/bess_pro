import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResultCard from './ResultCard';
import { DollarSign, TrendingUp, Calendar, Banknote } from 'lucide-react';

interface FinancialSummaryProps {
  results: {
    totalInvestment: number;
    economiaAnualEstimada: number;
    economiaTotal25Anos?: number;
    vpl: number;
    tir: number;
    payback: number;
    paybackDescontado?: number;
    roi?: number;
  };
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ results }) => {
  const { 
    totalInvestment, 
    economiaAnualEstimada, 
    economiaTotal25Anos,
    vpl, 
    tir, 
    payback,
    paybackDescontado,
    roi 
  } = results;

  return (
    <Card className="bg-white dark:bg-slate-800/50 border-gray-300 dark:border-slate-700 print:border-gray-200 print:shadow-none">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-slate-200 print:text-black">Resumo Financeiro</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        <ResultCard
          icon={<Banknote className="w-7 h-7 text-red-400" />}
          title="Investimento Total"
          value={totalInvestment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          delay={0}
        />
        <ResultCard
          icon={<DollarSign className="w-7 h-7 text-emerald-400" />}
          title="Economia Anual"
          value={economiaAnualEstimada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          delay={1}
        />
        {economiaTotal25Anos && (
          <ResultCard
            icon={<DollarSign className="w-7 h-7 text-green-500" />}
            title="Economia Total 25 Anos"
            value={economiaTotal25Anos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            delay={2}
          />
        )}
        <ResultCard
          icon={<TrendingUp className="w-7 h-7 text-green-400" />}
          title="VPL"
          value={vpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          delay={3}
          isPositive={vpl > 0}
        />
        <ResultCard
          icon={<TrendingUp className="w-7 h-7 text-blue-400" />}
          title="TIR"
          value={`${tir.toFixed(2)}%`}
          delay={4}
        />
        <ResultCard
          icon={<Calendar className="w-7 h-7 text-purple-400" />}
          title="Payback Simples"
          value={`${payback.toFixed(1)} anos`}
          delay={5}
        />
        {paybackDescontado && (
          <ResultCard
            icon={<Calendar className="w-7 h-7 text-indigo-400" />}
            title="Payback Descontado"
            value={`${paybackDescontado.toFixed(1)} anos`}
            delay={6}
          />
        )}
        {roi !== undefined && (
          <ResultCard
            icon={<TrendingUp className="w-7 h-7 text-cyan-400" />}
            title="ROI"
            value={`${roi.toFixed(1)}%`}
            delay={7}
            isPositive={roi > 0}
          />
        )}
      </CardContent>
    </Card>
  );
};