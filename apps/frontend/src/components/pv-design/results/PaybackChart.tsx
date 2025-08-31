import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { useTheme, getChartColors } from '@/hooks/use-theme';

interface PaybackChartProps {
  results: {
    fluxoCaixa: Array<{
      ano: number;
      fluxoLiquido: number;
    }>;
  };
}

export const PaybackChart: React.FC<PaybackChartProps> = ({ results }) => {
  const { fluxoCaixa } = results;
  const { isDark } = useTheme();
  const colors = getChartColors(isDark);

  const chartData = fluxoCaixa
    .filter(item => item.ano >= 1) // Começar do ano 1
    .map((item, index) => ({
      ...item,
      fluxoAcumulado: fluxoCaixa
        .filter(f => f.ano >= 1 && f.ano <= item.ano)
        .reduce((acc, curr) => acc + curr.fluxoLiquido, 0)
    }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis 
            dataKey="ano"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={chartData.map(item => item.ano)}
            tickFormatter={(value) => `Ano ${value}`}
            label={{ value: 'Anos do Projeto', position: 'insideBottom', offset: -5, fill: colors.axis }} 
            stroke={colors.axis}
            tick={{ fill: colors.axis }}
          />
          <YAxis
            tickFormatter={(value) => value.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL', 
              notation: 'compact' 
            })}
            label={{ value: 'Fluxo de Caixa Acumulado (R$)', angle: -90, position: 'insideLeft', fill: colors.axis }}
            stroke={colors.axis}
            tick={{ fill: colors.axis }}
          />
          <Tooltip
            formatter={(value, name) => [
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
              name
            ]}
            labelFormatter={(value) => `Ano ${value} do Projeto`}
            contentStyle={{
              backgroundColor: colors.tooltip.background,
              borderColor: colors.tooltip.border,
              color: colors.tooltip.text,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          />
          <Legend wrapperStyle={{ color: colors.legend }} />
          <ReferenceLine y={0} stroke={isDark ? "#64748b" : "#9ca3af"} strokeDasharray="3 3" />
          <Bar dataKey="fluxoAcumulado" name="Fluxo de Caixa Acumulado">
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fluxoAcumulado >= 0 
                  ? (isDark ? '#22c55e' : '#16a34a') 
                  : (isDark ? '#ef4444' : '#dc2626')
                } 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};