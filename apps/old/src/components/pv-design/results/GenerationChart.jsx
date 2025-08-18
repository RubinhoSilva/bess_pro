import React from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart } from 'recharts';

const GenerationChart = ({ results }) => {
    const { geracaoEstimadaMensal, formData } = results;
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const totalConsumoMensal = formData.energyBills.reduce((acc, bill) => {
        bill.consumoMensal.forEach((consumo, index) => {
            acc[index] = (acc[index] || 0) + consumo;
        });
        return acc;
    }, Array(12).fill(0));

    const chartData = months.map((month, index) => ({
        name: month,
        'Geração (kWh)': parseFloat((geracaoEstimadaMensal[index] || 0).toFixed(0)),
        'Consumo (kWh)': parseFloat((totalConsumoMensal[index] || 0).toFixed(0)),
    }));

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                        }}
                    />
                    <Legend wrapperStyle={{ color: '#fff' }} />
                    <Bar dataKey="Consumo (kWh)" fill="#3b82f6" name="Consumo" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Geração (kWh)" fill="#f59e0b" name="Geração" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GenerationChart;