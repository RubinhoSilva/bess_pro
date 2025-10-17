import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResultadosCodigoB } from '@bess-pro/shared';

/**
 * Componente para exibir resultados financeiros do Grupo B
 * @description Renderiza todos os dados financeiros especializados para consumidores do Grupo B
 * @param results Dados de resultados financeiros do Grupo B
 */
interface GrupoBFinancialResultsProps {
  results: ResultadosCodigoB;
}

const GrupoBFinancialResults: React.FC<GrupoBFinancialResultsProps> = ({ results }) => {
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
                  {results.somasIniciais.geracaoAnual}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Consumo Anual</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {results.somasIniciais.consumoAnual}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">CAPEX</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {results.somasIniciais.capex}
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
                  {results.comparativoCustoAbatimento.custoSemSistema}
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Custo Com Sistema</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {results.comparativoCustoAbatimento.custoComSistema}
                </p>
              </div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Economia Anual</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {results.comparativoCustoAbatimento.economiaAnual}
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
                <p className={`text-xl font-bold ${results.financeiro.vpl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {results.financeiro.vpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">TIR</p>
                <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                  {results.financeiro.tir === 0 ? 'N/A' : `${(results.financeiro.tir * 100).toFixed(2)}%`}
                </p>
              </div>
              <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">PI</p>
                <p className={`text-xl font-bold ${results.financeiro.pi >= 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {results.financeiro.pi.toFixed(2)}
                </p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Payback Simples</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {results.financeiro.paybackSimples.toFixed(2)} anos
                </p>
              </div>
              <div className="text-center p-4 bg-lime-50 dark:bg-lime-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Payback Descontado</p>
                <p className="text-xl font-bold text-lime-600 dark:text-lime-400">
                  {results.financeiro.paybackDescontado.toFixed(2)} anos
                </p>
              </div>
              <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">LCOE</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {results.financeiro.lcoe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/kWh
                </p>
              </div>
              <div className="text-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">ROI Simples</p>
                <p className={`text-xl font-bold ${results.financeiro.roiSimples >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {(results.financeiro.roiSimples * 100).toFixed(2)}%
                </p>
              </div>
              <div className="text-center p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Economia Total VP</p>
                <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
                  {results.financeiro.economiaTotalValorPresente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                  {results.consumoAno1.consumoLocal.toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Geração</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {results.consumoAno1.geracao.toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Autoconsumo Instantâneo</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {results.consumoAno1.autoconsumoInstantaneo.toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Percentual Abatido</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {results.consumoAno1.percentualAbatido.toFixed(2)}%
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
                  {results.tabelaResumoAnual.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center font-medium">{item.ano}</TableCell>
                      <TableCell className="text-center">{item.geracao.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-center">{item.economia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{item.custosOm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
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
                  {results.tabelaFluxoCaixa.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center font-medium">{item.ano}</TableCell>
                      <TableCell className="text-center">{item.fluxoNominal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{item.fluxoAcumuladoNominal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{item.fluxoDescontado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-center">{item.fluxoAcumuladoDescontado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
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