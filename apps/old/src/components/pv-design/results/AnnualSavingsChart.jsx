import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const AnnualSavingsChart = ({ results }) => {
    const { fluxoCaixa, formData } = results;

    const chartData = fluxoCaixa.filter(item => item.ano > 0).map(item => ({
        ano: item.ano,
        economia: item.economia
    }));

    return (
        <Card className="bg-slate-800/50 border-slate-700 print:border-gray-200 print:shadow-none">
            <CardHeader>
                <CardTitle className="text-white print:text-black">Projeção de Economia Anual</CardTitle>
                <CardDescription className="text-slate-300 print:text-gray-600">Economia com energia ao longo de {formData.vidaUtil} anos (considerando inflação energética).</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis dataKey="ano" label={{ value: 'Anos', position: 'insideBottom', offset: -5 }} stroke="#9ca3af" />
                        <YAxis
                            tickFormatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })}
                            stroke="#9ca3af"
                        />
                        <Tooltip
                            formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            contentStyle={{
                                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                            }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="economia" stroke="#84cc16" strokeWidth={3} name="Economia Anual" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default AnnualSavingsChart;