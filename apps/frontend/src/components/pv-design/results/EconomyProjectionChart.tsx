import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

  const chartData = fluxoCaixa.map(item => ({
    ano: `Ano ${item.ano}`,
    'Custo Sem FV': item.ano === 0 ? 0 : item.custoSemFV,
    'Custo Com FV': item.ano === 0 ? 0 : item.custoComFV,
    'Economia Anual': item.economia,
  }));

  return (
    <Card className="bg-white dark:bg-slate-800/50 border-gray-300 dark:border-slate-700 print:border-gray-200 print:shadow-none h-full">
      <CardHeader>
        <CardTitle className="text-white print:text-black">Projeção de Custos e Economia</CardTitle>
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="ano" stroke="#9ca3af" />
            <YAxis
              tickFormatter={(value) => value.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL', 
                notation: 'compact' 
              })}
              stroke="#9ca3af"
            />
            <Tooltip
              formatter={(value, name) => [
                value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
                name
              ]}
              contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="Custo Sem FV" 
              stroke="#ef4444" 
              fillOpacity={1} 
              fill="url(#colorCustoSemFV)" 
            />
            <Area 
              type="monotone" 
              dataKey="Custo Com FV" 
              stroke="#f97316" 
              fillOpacity={1} 
              fill="url(#colorCustoComFV)" 
            />
            <Area 
              type="monotone" 
              dataKey="Economia Anual" 
              stroke="#22c55e" 
              fillOpacity={1} 
              fill="url(#colorEconomia)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};