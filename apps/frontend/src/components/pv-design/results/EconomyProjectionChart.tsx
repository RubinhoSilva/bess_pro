import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme, getChartColors } from '@/hooks/use-theme';

interface EconomyProjectionChartProps {
  results: {
    fluxoCaixa: Array<{
      ano: number;
      custoSemFV: number;
      custoComFV: number;
      economia: number;
    }>;
  };
}

export const EconomyProjectionChart: React.FC<EconomyProjectionChartProps> = ({ results }) => {
  const { fluxoCaixa } = results;
  const { isDark } = useTheme();
  const colors = getChartColors(isDark);

  const chartData = (fluxoCaixa || [])
    .filter(item => item.ano >= 1) // Começar do ano 1
    .map((item: any, index: any) => {
      // Estimar custo sem FV baseado na economia + custos O&M
      const custoSemFV = (item.custoSemFV || 0) + (item.custoComFV || 0);

      return {
        ano: item.ano, // Usar número simples para melhor ordenação
        anoLabel: `Ano ${item.ano}`, // Para exibição nos tooltips
        'Custo Sem FV': custoSemFV,
        'Custo Com FV': item.custosOM || item.custos_om || 0, // camelCase ou snake_case
        'Economia Anual': item.economiaEnergia || item.economia_energia || 0, // camelCase ou snake_case
      };
    });

  return (
    <Card className="bg-white dark:bg-slate-800/50 border-gray-300 dark:border-slate-700 print:border-gray-200 print:shadow-none h-full">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-slate-200 print:text-black">Projeção de Custos e Economia</CardTitle>
        <CardDescription className="text-gray-600 dark:text-slate-300 print:text-gray-600">
          Comparativo de custos e economia anual ao longo dos anos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCustoSemFV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCustoComFV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorEconomia" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              label={{ value: 'Valor (R$)', angle: -90, position: 'insideLeft', fill: colors.axis }}
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
            <Legend />
            <Area 
              type="monotone" 
              dataKey="Custo Sem FV" 
              stroke={isDark ? "#ef4444" : "#dc2626"} 
              fillOpacity={1} 
              fill="url(#colorCustoSemFV)" 
            />
            <Area 
              type="monotone" 
              dataKey="Custo Com FV" 
              stroke={isDark ? "#f97316" : "#ea580c"} 
              fillOpacity={1} 
              fill="url(#colorCustoComFV)" 
            />
            <Area 
              type="monotone" 
              dataKey="Economia Anual" 
              stroke={isDark ? "#22c55e" : "#16a34a"} 
              fillOpacity={1} 
              fill="url(#colorEconomia)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};