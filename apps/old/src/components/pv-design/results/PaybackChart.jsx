import React from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, ReferenceLine, Cell } from 'recharts';

const PaybackChart = ({ results }) => {
    const { fluxoCaixa } = results;

    const chartData = fluxoCaixa.map((item, index) => ({
        ...item,
        fluxoAcumulado: fluxoCaixa.slice(0, index + 1).reduce((acc, curr) => acc + curr.fluxoLiquido, 0)
    }));

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="ano" label={{ value: 'Anos', position: 'insideBottom', offset: -5, fill: '#9ca3af' }} stroke="#9ca3af" />
                    <YAxis
                        tickFormatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })}
                        stroke="#9ca3af"
                    />
                    <Tooltip
                        formatter={(value, name) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), name]}
                        contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                        }}
                    />
                    <Legend wrapperStyle={{ color: '#fff' }} />
                    <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="3 3" />
                    <Bar dataKey="fluxoAcumulado" name="Fluxo de Caixa Acumulado">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fluxoAcumulado >= 0 ? '#22c55e' : '#ef4444'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PaybackChart;