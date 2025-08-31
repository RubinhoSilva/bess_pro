import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme, getChartColors } from '@/hooks/use-theme';

interface GenerationChartProps {
  results: {
    geracaoEstimadaMensal: number[];
    formData: {
      energyBills: Array<{
        consumoMensal: number[];
      }>;
    };
  };
}

export const GenerationChart: React.FC<GenerationChartProps> = ({ results }) => {
  const { geracaoEstimadaMensal, formData } = results;
  const { isDark } = useTheme();
  const colors = getChartColors(isDark);
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
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis 
            dataKey="name"
            label={{ value: 'Meses do Ano', position: 'insideBottom', offset: -5, fill: colors.axis }}
            stroke={colors.axis}
            tick={{ fill: colors.axis }}
          />
          <YAxis 
            stroke={colors.axis}
            tick={{ fill: colors.axis }}
            label={{ value: 'Energia Mensal (kWh)', angle: -90, position: 'insideLeft', fill: colors.axis }} 
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltip.background,
              borderColor: colors.tooltip.border,
              color: colors.tooltip.text,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          />
          <Legend wrapperStyle={{ color: colors.legend }} />
          <Bar 
            dataKey="Consumo (kWh)" 
            fill={isDark ? "#3b82f6" : "#2563eb"} 
            name="Consumo" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="Geração (kWh)" 
            fill={isDark ? "#f59e0b" : "#d97706"} 
            name="Geração" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};