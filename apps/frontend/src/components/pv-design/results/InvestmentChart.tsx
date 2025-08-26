import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme, getChartColors } from '@/hooks/use-theme';

interface InvestmentChartProps {
  results: {
    formData: {
      custoEquipamento: number;
      custoMateriais: number;
      custoMaoDeObra: number;
    };
  };
}

export const InvestmentChart: React.FC<InvestmentChartProps> = ({ results }) => {
  const { formData } = results;
  const { isDark } = useTheme();
  const colors = getChartColors(isDark);
  
  const COLORS = isDark 
    ? ['#3b82f6', '#10b981', '#f97316'] 
    : ['#2563eb', '#059669', '#ea580c'];

  const data = [
    { name: 'Equipamentos', value: formData.custoEquipamento },
    { name: 'Materiais', value: formData.custoMateriais },
    { name: 'Mão de Obra', value: formData.custoMaoDeObra },
  ];

  return (
    <Card className="bg-white dark:bg-slate-800/50 border-gray-300 dark:border-slate-700 h-full print:border-gray-200 print:shadow-none">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-slate-200 print:text-black">Composição do Investimento</CardTitle>
        <CardDescription className="text-gray-600 dark:text-slate-300 print:text-gray-600">
          Distribuição dos custos (sem BDI).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Tooltip
              formatter={(value) => value.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
              contentStyle={{
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => value.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
              contentStyle={{
                backgroundColor: colors.tooltip.background,
                borderColor: colors.tooltip.border,
                color: colors.tooltip.text,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            />
            <Legend wrapperStyle={{ color: colors.legend }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};