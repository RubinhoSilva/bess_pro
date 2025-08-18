import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResultCard from './ResultCard';
import { Sun, Zap, AreaChart } from 'lucide-react';

const SystemSummary = ({ results }) => {
    const { potenciaPico, numeroModulos, areaEstimada, geracaoEstimadaAnual } = results;

    return (
        <Card className="bg-slate-800/50 border-slate-700 print:border-gray-200 print:shadow-none">
            <CardHeader>
                <CardTitle className="text-white print:text-black">Resumo do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <ResultCard
                    icon={<Sun className="w-7 h-7 text-yellow-400" />}
                    title="Potência de Pico"
                    value={potenciaPico.toFixed(2)}
                    unit="kWp"
                    delay={0}
                />
                <ResultCard
                    icon={<div className="w-7 h-7 grid grid-cols-2 grid-rows-2 gap-0.5">{[...Array(4)].map((_, i) => <div key={i} className="bg-blue-400 w-2.5 h-2.5 rounded-sm"></div>)}</div>}
                    title="Nº de Módulos"
                    value={numeroModulos}
                    unit="un"
                    delay={1}
                />
                <ResultCard
                    icon={<AreaChart className="w-7 h-7 text-green-400" />}
                    title="Área Estimada"
                    value={areaEstimada.toFixed(2)}
                    unit="m²"
                    delay={2}
                />
                <ResultCard
                    icon={<Zap className="w-7 h-7 text-orange-400" />}
                    title="Geração Anual"
                    value={geracaoEstimadaAnual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    unit="kWh"
                    delay={3}
                />
            </CardContent>
        </Card>
    );
};

export default SystemSummary;