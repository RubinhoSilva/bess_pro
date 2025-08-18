import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResultCard from './ResultCard';
import { DollarSign, TrendingUp, Calendar, Banknote } from 'lucide-react';

const FinancialSummary = ({ results }) => {
    const { totalInvestment, economiaAnualEstimada, vpl, tir, payback } = results;

    return (
        <Card className="bg-slate-800/50 border-slate-700 print:border-gray-200 print:shadow-none">
            <CardHeader>
                <CardTitle className="text-white print:text-black">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
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
                <ResultCard
                    icon={<TrendingUp className="w-7 h-7 text-green-400" />}
                    title="VPL"
                    value={vpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    delay={2}
                    isPositive={vpl > 0}
                />
                <ResultCard
                    icon={<TrendingUp className="w-7 h-7 text-blue-400" />}
                    title="TIR"
                    value={`${tir.toFixed(2)}%`}
                    delay={3}
                />
                <ResultCard
                    icon={<Calendar className="w-7 h-7 text-purple-400" />}
                    title="Payback Simples"
                    value={`${payback.toFixed(1)} anos`}
                    delay={4}
                />
            </CardContent>
        </Card>
    );
};

export default FinancialSummary;