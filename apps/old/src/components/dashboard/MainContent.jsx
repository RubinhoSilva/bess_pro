import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, Award, BarChart2, PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart, Cell } from 'recharts';

const MainContent = ({ data }) => {
  const { vpl, tir, payback, viabilidade, fluxoCaixa, investimentoTotal, economiaAnualBESS, economiaAnualSolar, custoAnualCombustivel } = data;

  const costBenefitData = [
    { name: 'Investimento', value: -investimentoTotal },
    { name: 'Economia BESS', value: economiaAnualBESS },
    { name: 'Economia Solar', value: economiaAnualSolar },
    { name: 'Custo Diesel', value: -custoAnualCombustivel },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-white">Dashboard do Projeto</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={`bg-gradient-to-br ${vpl > 0 ? 'from-green-900/50 to-slate-800' : 'from-red-900/50 to-slate-800'} border-slate-700`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">VPL</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${vpl > 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(vpl)}</div>
            <p className="text-xs text-slate-400 mt-1">Valor Presente Líquido</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">TIR</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{tir.toFixed(1)}%</div>
            <p className="text-xs text-slate-400 mt-1">Taxa Interna de Retorno</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Payback</CardTitle>
            <Calendar className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{payback} anos</div>
            <p className="text-xs text-slate-400 mt-1">Tempo de retorno do investimento</p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${viabilidade === 'Viável' ? 'from-emerald-900/50 to-slate-800' : 'from-rose-900/50 to-slate-800'} border-slate-700`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Resultado</CardTitle>
            <Award className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${viabilidade === 'Viável' ? 'text-emerald-400' : 'text-rose-400'}`}>{viabilidade}</div>
            <p className="text-xs text-slate-400 mt-1">Viabilidade econômica</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-200">
              <BarChart2 className="w-5 h-5 text-blue-400"/>
              Fluxo de Caixa Acumulado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="ano" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value) => [formatCurrency(value), 'Fluxo Líquido']}
                />
                <Line type="monotone" dataKey="fluxoLiquido" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4, fill: '#0ea5e9' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-200">
              <PieChart className="w-5 h-5 text-purple-400"/>
              Custos vs. Benefícios (Anual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={costBenefitData} layout="vertical" margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="#94a3b8" tickFormatter={formatCurrency} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                        formatter={(value) => formatCurrency(value)}
                    />
                    <Bar dataKey="value" barSize={30}>
                        {costBenefitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#22c55e' : '#ef4444'} />
                        ))}
                    </Bar>
                </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

    </motion.div>
  );
};

export default MainContent;