import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGrupoBFinancialCalculation } from '@/hooks/financial-calculation-hooks';
import { convertToGrupoBInput } from '@/lib/financial-utils';
import { ResultadosCodigoB, isResultadosCodigoB, objectSnakeToCamel, GrupoBConfig } from '@bess-pro/shared';
import toast from 'react-hot-toast';

/**
 * Componente para exibir resultados financeiros do Grupo B
 * @description Renderiza todos os dados financeiros especializados para consumidores do Grupo B
 * @param calculationData Dados de cálculo para o Grupo B
 * @param config Configurações do projeto
 */
interface CalculationData {
  investimentoInicial: number;
  geracaoMensal: number[];
  consumoMensal: number[];
}

interface GrupoBFinancialResultsProps {
  calculationData: CalculationData;
  config: GrupoBConfig;
}

const GrupoBFinancialResults: React.FC<GrupoBFinancialResultsProps> = ({ calculationData, config }) => {
  const [financialResults, setFinancialResults] = useState<ResultadosCodigoB | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const grupoBCalculation = useGrupoBFinancialCalculation({
    onSuccess: (data) => {
      console.log(data);
      setFinancialResults(data);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('[GrupoBFinancialResults] Erro no cálculo:', error);
      toast.error('Erro ao calcular análise financeira do Grupo B');
      setIsLoading(false);
    }
  });

  // Fazer chamada API quando os dados de cálculo mudam
  useEffect(() => {
    if (calculationData && config) {
      setIsLoading(true);
      try {
        const input = convertToGrupoBInput(config, calculationData);
        grupoBCalculation.mutateAsync(input);
      } catch (error) {
        console.error('[GrupoBFinancialResults] Erro ao converter input:', error);
        setIsLoading(false);
      }
    }
  }, [calculationData, config, grupoBCalculation.mutateAsync]);

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
            <p className="text-muted-foreground">Calculando análise financeira do Grupo B...</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Geração Anual</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {financialResults?.somasIniciais?.geracaoAnual ||
                    `${(calculationData?.geracaoMensal?.reduce((a: number, b: number) => a + b, 0) || 0).toLocaleString('pt-BR')} kWh`}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Consumo Anual</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {financialResults?.somasIniciais?.consumoAnual ||
                    `${(calculationData?.consumoMensal?.reduce((total: number, val: number) => total + val, 0) || 0).toLocaleString('pt-BR')} kWh`}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">CAPEX</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {financialResults?.somasIniciais?.capex ||
                    (calculationData?.investimentoInicial ? calculationData.investimentoInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Comparativo de Custos de Abatimento */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-slate-200">
              Comparativo de Custos de Abatimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Custo Sem Sistema</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {financialResults.comparativoCustoAbatimento.custoSemSistema}
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Custo Com Sistema</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {financialResults?.comparativoCustoAbatimento?.custoComSistema ||
                    `R$ ${(
                      (calculationData?.consumoMensal?.reduce((total: number, val: number) => total + val, 0) || 0) *
                      (config?.tarifaBase || 0.8) -
                      (financialResults?.financeiro?.economiaTotalNominal || 0)
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano`}
                </p>
              </div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Economia Anual</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {financialResults?.comparativoCustoAbatimento?.economiaAnual ||
                    `R$ ${(financialResults?.financeiro?.economiaTotalNominal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
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
                  {((financialResults?.financeiro?.roiSimples || 0) * 100).toFixed(2)}%
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Consumo Local</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {(financialResults?.consumoAno1?.consumoLocal ||
                    calculationData?.consumoMensal?.reduce((total: number, val: number) => total + val, 0) || 0).toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Geração</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {(financialResults?.consumoAno1?.geracao ||
                    calculationData?.geracaoMensal?.reduce((a: number, b: number) => a + b, 0) || 0).toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Autoconsumo Instantâneo</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {(financialResults?.consumoAno1?.autoconsumoInstantaneo || 0).toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Percentual Abatido</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {((financialResults?.consumoAno1?.percentualAbatido || 0)).toFixed(2)}%
                </p>
              </div>
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
                    <TableHead className="text-center">Geração (kWh)</TableHead>
                    <TableHead className="text-center">Economia (R$)</TableHead>
                    <TableHead className="text-center">Custos O&M (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(financialResults?.tabelaResumoAnual || []).map((item, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center font-medium">{item.ano || index + 1}</TableCell>
                      <TableCell className="text-center">{(item.geracao || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-center">{(item.economia || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{(item.custosOm || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
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
                    <TableHead className="text-center">Fluxo Nominal (R$)</TableHead>
                    <TableHead className="text-center">Fluxo Acumulado Nominal (R$)</TableHead>
                    <TableHead className="text-center">Fluxo Descontado (R$)</TableHead>
                    <TableHead className="text-center">Fluxo Acumulado Descontado (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(financialResults?.tabelaFluxoCaixa || []).map((item, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center font-medium">{item.ano || index}</TableCell>
                      <TableCell className="text-center">{(item.fluxoNominal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{(item.fluxoAcumuladoNominal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{(item.fluxoDescontado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{(item.fluxoAcumuladoDescontado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
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

export default GrupoBFinancialResults;
