import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Zap, Target, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const ResultsCharts = ({ data }) => {
  const {
    vpl,
    tir,
    payback,
    fluxoCaixa,
    economiaAnualBESS,
    economiaAnualSolar,
    custoAnualCombustivel,
    investimentoTotal,
    viabilidade
  } = data;

  const investmentData = [
    { name: 'Sistema BESS', value: data.formData.custoInvestimento, color: '#3B82F6' },
    { name: 'Sistema Solar', value: data.formData.potenciaSolar * data.formData.custoSolar, color: '#F59E0B' },
    { name: 'Gerador Diesel', value: data.formData.custoGerador, color: '#6B7280' }
  ];

  const savingsData = [
    { name: 'BESS', economia: economiaAnualBESS, color: '#3B82F6' },
    { name: 'Solar', economia: economiaAnualSolar, color: '#F59E0B' },
    { name: 'Diesel', economia: -custoAnualCombustivel, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className={`bg-gradient-to-r ${vpl > 0 ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' : 'from-red-500/20 to-rose-500/20 border-red-500/30'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">VPL</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(vpl)}</p>
              </div>
              <div className={`p-3 rounded-full ${vpl > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">TIR</p>
                <p className="text-2xl font-bold text-white">{tir.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Payback</p>
                <p className="text-2xl font-bold text-white">{payback} anos</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${viabilidade === 'Viável' ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' : 'from-red-500/20 to-rose-500/20 border-red-500/30'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Status</p>
                <p className="text-2xl font-bold text-white">{viabilidade}</p>
              </div>
              <div className={`p-3 rounded-full ${viabilidade === 'Viável' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Fluxo de Caixa Projetado
            </CardTitle>
            <CardDescription className="text-gray-300">
              Evolução do fluxo de caixa ao longo dos anos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="ano" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Fluxo Líquido']}
                  labelStyle={{ color: '#1F2937' }}
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="fluxoLiquido" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  name="Fluxo Líquido"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Composição do Investimento
              </CardTitle>
              <CardDescription className="text-gray-300">
                Distribuição dos custos por sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={investmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {investmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Economia Anual por Fonte
              </CardTitle>
              <CardDescription className="text-gray-300">
                Contribuição de cada sistema para a economia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={savingsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Economia/Custo']}
                    labelStyle={{ color: '#1F2937' }}
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  />
                  <Bar dataKey="economia" fill="#3B82F6">
                    {savingsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Resumo Financeiro Detalhado</CardTitle>
            <CardDescription className="text-gray-300">
              Principais indicadores econômicos do projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4">Indicador</th>
                    <th className="text-right py-3 px-4">Valor</th>
                    <th className="text-left py-3 px-4">Unidade</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Investimento Total</td>
                    <td className="text-right py-3 px-4 font-semibold">{formatCurrency(investimentoTotal)}</td>
                    <td className="py-3 px-4">R$</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Economia Anual BESS</td>
                    <td className="text-right py-3 px-4 font-semibold text-green-400">{formatCurrency(economiaAnualBESS)}</td>
                    <td className="py-3 px-4">R$/ano</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Economia Anual Solar</td>
                    <td className="text-right py-3 px-4 font-semibold text-green-400">{formatCurrency(economiaAnualSolar)}</td>
                    <td className="py-3 px-4">R$/ano</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Custo Anual Diesel</td>
                    <td className="text-right py-3 px-4 font-semibold text-red-400">{formatCurrency(custoAnualCombustivel)}</td>
                    <td className="py-3 px-4">R$/ano</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Valor Presente Líquido (VPL)</td>
                    <td className={`text-right py-3 px-4 font-bold ${vpl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(vpl)}
                    </td>
                    <td className="py-3 px-4">R$</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Taxa Interna de Retorno (TIR)</td>
                    <td className="text-right py-3 px-4 font-bold text-blue-400">{tir.toFixed(2)}%</td>
                    <td className="py-3 px-4">% a.a.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Período de Payback</td>
                    <td className="text-right py-3 px-4 font-bold text-purple-400">{payback}</td>
                    <td className="py-3 px-4">anos</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResultsCharts;