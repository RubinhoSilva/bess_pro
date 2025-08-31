import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme, getChartColors } from '@/hooks/use-theme';

interface AnnualSavingsChartProps {
  results: {
    fluxoCaixa: Array<{
      ano: number;
      economia: number;
    }>;
    formData: {
      vidaUtil: number;
    };
  };
}

export const AnnualSavingsChart: React.FC<AnnualSavingsChartProps> = ({ results }) => {
  const { fluxoCaixa, formData } = results;
  const { isDark } = useTheme();
  const colors = getChartColors(isDark);

  const chartData = fluxoCaixa
    .filter(item => item.ano >= 1) // Começar do ano 1
    .map(item => ({
      ano: item.ano,
      economia: item.economia
    }));

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-lg print:border-gray-200 print:shadow-none">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-slate-200 print:text-black">Projeção de Economia Anual</CardTitle>
        <CardDescription className="text-gray-600 dark:text-slate-300 print:text-gray-600">
          Economia com energia ao longo de {formData.vidaUtil} anos (considerando inflação energética).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
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
              label={{ value: 'Economia Anual (R$)', angle: -90, position: 'insideLeft', fill: colors.axis }}
              stroke={colors.axis}
              tick={{ fill: colors.axis }}
            />
            <Tooltip
              formatter={(value) => value.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
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
            <Line 
              type="monotone" 
              dataKey="economia" 
              stroke={isDark ? "#84cc16" : "#65a30d"} 
              strokeWidth={3} 
              name="Economia Anual" 
              dot={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};