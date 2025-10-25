import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme, getChartColors } from '@/hooks/use-theme';
import { useGrupoAFinancialCalculation } from '@/hooks/financial-calculation-hooks';
import { convertToGrupoAInput } from '@/lib/financial-utils';
import { GrupoAAdapter, IGrupoAData } from '@/types/adapters/grupo-a-adapter';
import toast from 'react-hot-toast';

/**
 * Componente para exibir resultados financeiros do Grupo A
 * @description Renderiza todos os dados financeiros especializados para consumidores do Grupo A
 */
interface GrupoAFinancialResultsProps {
  data: IGrupoAData;
}

const GrupoAFinancialResults: React.FC<GrupoAFinancialResultsProps> = ({ data }) => {
  
  // DEBUG: Log para identificar dados faltantes
  console.log('=== DEBUG GRUPO A DATA ===');
  console.log('Dados completos:', data);
  console.log('Consumo fora ponta:', data.consumoForaPontaMensal);
  console.log('Consumo ponta:', data.consumoPontaMensal);
  console.log('Geração mensal:', data.geracaoMensal);
  console.log('Tarifas TE:', {
    tePontaA: data.tePontaA,
    teForaPontaA: data.teForaPontaA
  });
  console.log('Tarifas TUSD:', {
    tusdPontaA: data.tusdPontaA,
    tusdForaPontaA: data.tusdForaPontaA
  });
  console.log('==========================');
  
  // Validar dados
  const validation = GrupoAAdapter.validateGrupoAData(data);
  if (!validation.isValid) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-muted-foreground">Dados inválidos para cálculo financeiro</p>
            <ul className="text-sm text-red-500 mt-2">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Memoizar objeto de dados de cálculo para evitar re-renders
  const calculationData = useMemo(() => ({
    investimentoInicial: data.investimentoInicial,
    geracaoMensal: data.geracaoMensal,
    // CORREÇÃO: Para Grupo A, usar consumo separado por posto se disponível
    consumoMensal: data.consumoForaPontaMensal && data.consumoPontaMensal
      ? data.consumoForaPontaMensal.map((foraPonta, index) =>
          (foraPonta || 0) + (data.consumoPontaMensal?.[index] || 0)
        )
      : data.consumoMensal
  }), [data.investimentoInicial, data.geracaoMensal, data.consumoMensal, data.consumoForaPontaMensal, data.consumoPontaMensal]);
  
  // Memoizar objeto de configuração para evitar re-renders
  const config = useMemo(() => ({
    financeiros: {
      capex: data.investimentoInicial,
      anos: data.vidaUtil,
      taxaDesconto: data.taxaDesconto,
      inflacaoEnergia: data.inflacaoEnergia,
      degradacao: data.degradacaoAnual,
      salvagePct: data.valorResidual,
      omaFirstPct: data.custoOperacao,
      omaInflacao: 4.0  // CORREÇÃO: 4% como percentual (não decimal 0.04)
    },
    // CORREÇÃO: Estrutura de tarifas com TE e TUSD separados
    tarifas: {
      ponta: {
        te: data.tePontaA,
        tusd: data.tusdPontaA || 0.35
      },
      foraPonta: {
        te: data.teForaPontaA,
        tusd: data.tusdForaPontaA || 0.25
      }
    },
    te: {
      ponta: data.tePontaA,
      foraPonta: data.teForaPontaA
    },
    // Adicionar os campos que estavam faltando
    tipoRede: data.tipoRede,
    fatorSimultaneidadeLocal: data.fatorSimultaneidade
  }), [
    data.investimentoInicial,
    data.vidaUtil,
    data.taxaDesconto,
    data.inflacaoEnergia,
    data.degradacaoAnual,
    data.valorResidual,
    data.custoOperacao,
    data.tarifaEnergiaPontaA,
    data.tarifaEnergiaForaPontaA,
    data.tePontaA,
    data.teForaPontaA,
    data.tipoRede,
    data.fatorSimultaneidade
  ]);
  const { isDark } = useTheme();
  const colors = getChartColors(isDark);
  const [financialResults, setFinancialResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // useRef para evitar chamadas duplicadas à API
  const isCalculatingRef = useRef(false);
  
  const grupoACalculation = useGrupoAFinancialCalculation({
    onSuccess: (data) => {
      setFinancialResults(data);
      setIsLoading(false);
      isCalculatingRef.current = false;
    },
    onError: (error) => {
      toast.error('Erro ao calcular análise financeira do Grupo A');
      setIsLoading(false);
      isCalculatingRef.current = false;
    }
  });

  // Fazer chamada API quando os dados de cálculo mudam
  useEffect(() => {
    // Evitar chamadas duplicadas
    if (isCalculatingRef.current) {
      return;
    }
    
    if (calculationData && config) {
      setIsLoading(true);
      isCalculatingRef.current = true;
      try {
        const input = convertToGrupoAInput(config, calculationData);
        // Backend fará a conversão para snake_case corretamente
        grupoACalculation.mutateAsync(input);
      } catch (error) {
        setIsLoading(false);
        isCalculatingRef.current = false;
      }
    }
  }, [calculationData, config]); // Removido grupoACalculation.mutateAsync das dependências

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  // Preparar dados para o gráfico de sensibilidade
  const sensibilidadeChartData = financialResults?.dadosSensibilidade?.multiplicadoresTarifa?.map((multiplicador: any, index: number) => ({
    multiplicador: `${(multiplicador * 100).toFixed(0)}%`,
    vpl: financialResults?.dadosSensibilidade?.vplMatrix?.[index] || 0
  })) || [];

  // Exibir loading enquanto os dados financeiros são carregados
  if (isLoading) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mr-4"></div>
            <p className="text-muted-foreground">Calculando análise financeira do Grupo A...</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Exibir mensagem se não houver dados financeiros
  if (!financialResults) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum dado financeiro disponível</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Somas Iniciais */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-slate-200">
              Somas Iniciais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Geração Anual</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {financialResults?.somasIniciais?.geracaoAnual ||
                    `${(calculationData?.geracaoMensal?.reduce((a: number, b: number) => a + b, 0) || 0).toLocaleString('pt-BR')} kWh`}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Consumo Fora Ponta</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {financialResults?.somasIniciais?.consumoForaPonta ||
                    `${(calculationData?.consumoMensal?.reduce((total: number, val: number) => total + val, 0) * 0.8 || 0).toLocaleString('pt-BR')} kWh`}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Consumo Ponta</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {financialResults?.somasIniciais?.consumoPonta ||
                    `${(calculationData?.consumoMensal?.reduce((total: number, val: number) => total + val, 0) * 0.2 || 0).toLocaleString('pt-BR')} kWh`}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">CAPEX</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {financialResults?.somasIniciais?.capex ||
                    `${calculationData?.investimentoInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resumo Financeiro */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-slate-200">
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">VPL</p>
                <p className={`text-xl font-bold ${(financialResults?.financeiro?.vpl || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {(financialResults?.financeiro?.vpl || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">TIR</p>
                <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                  {(financialResults?.financeiro?.tir || 0) === 0 ? 'N/A' : `${((financialResults?.financeiro?.tir || 0) * 100).toFixed(2)}%`}
                </p>
              </div>
              <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">PI</p>
                <p className={`text-xl font-bold ${(financialResults?.financeiro?.pi || 0) >= 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {(financialResults?.financeiro?.pi || 0).toFixed(2)}
                </p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Payback Simples</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {(financialResults?.financeiro?.paybackSimples || 0).toFixed(2)} anos
                </p>
              </div>
              <div className="text-center p-4 bg-lime-50 dark:bg-lime-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Payback Descontado</p>
                <p className="text-xl font-bold text-lime-600 dark:text-lime-400">
                  {(financialResults?.financeiro?.paybackDescontado || 0).toFixed(2)} anos
                </p>
              </div>
              <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">LCOE</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {(financialResults?.financeiro?.lcoe || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/kWh
                </p>
              </div>
              <div className="text-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">ROI Simples</p>
                <p className={`text-xl font-bold ${(financialResults?.financeiro?.roiSimples || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {(financialResults?.financeiro?.roiSimples || 0).toFixed(2)}%
                </p>
              </div>
              <div className="text-center p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Economia Total VP</p>
                <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
                  {(financialResults?.financeiro?.economiaTotalValorPresente || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Consumo do Primeiro Ano */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-slate-200">
              Consumo do Primeiro Ano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Geração</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {(financialResults?.consumoAno1?.geracao ||
                    calculationData?.geracaoMensal?.reduce((a: number, b: number) => a + b, 0) || 0).toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Local Fora Ponta</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {(financialResults?.consumoAno1?.localForaPonta ||
                    (calculationData?.consumoMensal?.reduce((total: number, val: number) => total + val, 0) * 0.8) || 0).toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Local Ponta</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {(financialResults?.consumoAno1?.localPonta ||
                    (calculationData?.consumoMensal?.reduce((total: number, val: number) => total + val, 0) * 0.2) || 0).toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Remoto Fora Ponta</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {(financialResults?.consumoAno1?.remotoForaPonta || 0).toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Remoto Ponta</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {(financialResults?.consumoAno1?.remotoPonta || 0).toLocaleString('pt-BR')} kWh
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Gráfico de Sensibilidade */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-slate-200">
              Análise de Sensibilidade Tarifária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensibilidadeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis 
                    dataKey="multiplicador" 
                    stroke={colors.axis}
                    tick={{ fill: colors.axis }}
                  />
                  <YAxis 
                    stroke={colors.axis}
                    tick={{ fill: colors.axis }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: colors.tooltip.background,
                      border: `1px solid ${colors.tooltip.border}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: colors.tooltip.text }}
                    formatter={(value: number) => [
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                      'VPL'
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ color: colors.legend }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vpl" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="VPL"
                  />
                  <Line 
                    type="monotone" 
                    dataKey={(data: any) => 0} 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Ponto de Equilíbrio"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabela Resumo Anual */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-slate-200">
              Tabela Resumo Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Ano</TableHead>
                    <TableHead className="text-center">Geração Anual (kWh)</TableHead>
                    <TableHead className="text-center">Consumo Fora Ponta (kWh)</TableHead>
                    <TableHead className="text-center">Consumo Ponta (kWh)</TableHead>
                    <TableHead className="text-center">Economia Anual (R$)</TableHead>
                    <TableHead className="text-center">Economia Acumulada (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(financialResults?.tabelaResumoAnual || []).map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center font-medium">{item.ano}</TableCell>
                      <TableCell className="text-center">{(item.geracaoAnual || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-center">{(item.consumoForaPonta || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-center">{(item.consumoPonta || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-center">{(item.economiaAnual || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{(item.fluxoNominal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabela Fluxo de Caixa */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-slate-200">
              Tabela Fluxo de Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Ano</TableHead>
                    <TableHead className="text-center">Fluxo Operacional (R$)</TableHead>
                    <TableHead className="text-center">Fluxo Líquido (R$)</TableHead>
                    <TableHead className="text-center">Fluxo Acumulado (R$)</TableHead>
                    <TableHead className="text-center">Valor Presente (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(financialResults?.tabelaFluxoCaixa || []).map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center font-medium">{item.ano}</TableCell>
                      <TableCell className="text-center">{(item.fluxoNominal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{(item.fluxoNominal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{(item.fluxoAcumuladoNominal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{(item.fluxoDescontado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default GrupoAFinancialResults;
