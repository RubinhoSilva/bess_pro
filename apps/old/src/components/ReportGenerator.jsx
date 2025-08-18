import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Download, Printer, Share2, CheckCircle, XCircle, TrendingUp, DollarSign, Calendar, Zap, Sun, Fuel, Battery } from 'lucide-react';

const ReportGenerator = ({ data }) => {
  const { toast } = useToast();
  
  const {
    formData,
    vpl,
    tir,
    payback,
    economiaAnualBESS,
    economiaAnualSolar,
    custoAnualCombustivel,
    investimentoTotal,
    viabilidade,
    consumoAnual
  } = data;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const handleExportPDF = () => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento!",
      description: "A exportação em PDF não está implementada ainda—mas você pode solicitar na próxima mensagem! 🚀",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento!",
      description: "O compartilhamento não está implementado ainda—mas você pode solicitar na próxima mensagem! 🚀",
    });
  };

  const getViabilityColor = () => {
    return viabilidade === 'Viável' ? 'text-green-400' : 'text-red-400';
  };

  const getViabilityIcon = () => {
    return viabilidade === 'Viável' ? <CheckCircle className="w-6 h-6 text-green-400" /> : <XCircle className="w-6 h-6 text-red-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Relatório */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Relatório de Viabilidade BESS</h2>
          <p className="text-gray-300">Análise completa do sistema de armazenamento de energia</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleShare} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </motion.div>

      {/* Resumo Executivo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {getViabilityIcon()}
              <span className={`text-2xl font-bold ${getViabilityColor()}`}>
                Projeto {viabilidade}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-white font-semibold">VPL</span>
                </div>
                <p className={`text-xl font-bold ${vpl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(vpl)}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-semibold">TIR</span>
                </div>
                <p className="text-xl font-bold text-blue-400">{tir.toFixed(1)}%</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-semibold">Payback</span>
                </div>
                <p className="text-xl font-bold text-purple-400">{payback} anos</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Conclusão:</h4>
              <p className="text-gray-300 leading-relaxed">
                {viabilidade === 'Viável' 
                  ? `O projeto apresenta viabilidade econômica positiva com VPL de ${formatCurrency(vpl)} e TIR de ${tir.toFixed(1)}%. O investimento se paga em ${payback} anos, demonstrando ser uma oportunidade atrativa para redução de custos energéticos no horário de ponta.`
                  : `O projeto não apresenta viabilidade econômica nas condições atuais, com VPL negativo de ${formatCurrency(vpl)}. Recomenda-se revisar os parâmetros técnicos e econômicos para melhorar a atratividade do investimento.`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Especificações Técnicas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Especificações Técnicas</CardTitle>
            <CardDescription className="text-gray-300">
              Configuração dos sistemas analisados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sistema BESS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Battery className="w-5 h-5 text-blue-400" />
                  <h4 className="text-white font-semibold">Sistema BESS</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Capacidade:</span>
                    <span className="text-white">{formatNumber(formData.capacidadeBateria)} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Potência:</span>
                    <span className="text-white">{formatNumber(formData.potenciaBateria)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Eficiência:</span>
                    <span className="text-white">{formData.eficienciaBateria}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Vida Útil:</span>
                    <span className="text-white">{formData.vidaUtil} anos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Investimento:</span>
                    <span className="text-white">{formatCurrency(formData.custoInvestimento)}</span>
                  </div>
                </div>
              </div>

              {/* Sistema Solar */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="w-5 h-5 text-yellow-400" />
                  <h4 className="text-white font-semibold">Sistema Solar</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Potência:</span>
                    <span className="text-white">{formatNumber(formData.potenciaSolar)} kWp</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Geração Específica:</span>
                    <span className="text-white">{formatNumber(formData.geracaoSolar)} kWh/kWp/ano</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Geração Anual:</span>
                    <span className="text-white">{formatNumber(formData.potenciaSolar * formData.geracaoSolar)} kWh/ano</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Custo por kWp:</span>
                    <span className="text-white">{formatCurrency(formData.custoSolar)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Investimento:</span>
                    <span className="text-white">{formatCurrency(formData.potenciaSolar * formData.custoSolar)}</span>
                  </div>
                </div>
              </div>

              {/* Gerador Diesel */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Fuel className="w-5 h-5 text-gray-400" />
                  <h4 className="text-white font-semibold">Gerador Diesel</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Potência:</span>
                    <span className="text-white">{formatNumber(formData.potenciaGerador)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Consumo:</span>
                    <span className="text-white">{formData.consumoCombustivel} L/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Preço Combustível:</span>
                    <span className="text-white">{formatCurrency(formData.precoCombustivel)}/L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Horas/ano:</span>
                    <span className="text-white">{formatNumber(formData.horasPonta * formData.diasMes * 12)} h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Investimento:</span>
                    <span className="text-white">{formatCurrency(formData.custoGerador)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Análise Econômica Detalhada */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Análise Econômica Detalhada</CardTitle>
            <CardDescription className="text-gray-300">
              Breakdown completo dos custos e benefícios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Investimentos */}
              <div>
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-red-400" />
                  Investimentos Iniciais
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300">Sistema BESS</span>
                    <span className="text-white font-semibold">{formatCurrency(formData.custoInvestimento)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300">Sistema Solar</span>
                    <span className="text-white font-semibold">{formatCurrency(formData.potenciaSolar * formData.custoSolar)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300">Gerador Diesel</span>
                    <span className="text-white font-semibold">{formatCurrency(formData.custoGerador)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-white font-bold text-lg">{formatCurrency(investimentoTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Benefícios Anuais */}
              <div>
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Benefícios Anuais
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300">Economia BESS</span>
                    <span className="text-green-400 font-semibold">{formatCurrency(economiaAnualBESS)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300">Economia Solar</span>
                    <span className="text-green-400 font-semibold">{formatCurrency(economiaAnualSolar)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300">Custo Diesel</span>
                    <span className="text-red-400 font-semibold">-{formatCurrency(custoAnualCombustivel)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                    <span className="text-white font-semibold">Benefício Líquido</span>
                    <span className="text-white font-bold text-lg">
                      {formatCurrency(economiaAnualBESS + economiaAnualSolar - custoAnualCombustivel)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Parâmetros Tarifários */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Parâmetros Tarifários e Consumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Consumo</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Ponta:</span>
                    <span className="text-white">{formatNumber(formData.consumoPonta)} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Anual:</span>
                    <span className="text-white">{formatNumber(consumoAnual)} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Horas/dia:</span>
                    <span className="text-white">{formData.horasPonta}h</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Tarifas</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Ponta:</span>
                    <span className="text-white">{formatCurrency(formData.tarifaPonta)}/kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Fora Ponta:</span>
                    <span className="text-white">{formatCurrency(formData.tarifaForaPonta)}/kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Demanda:</span>
                    <span className="text-white">{formatCurrency(formData.demandaPonta)}/kW</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Parâmetros</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Taxa Desconto:</span>
                    <span className="text-white">{formData.taxaDesconto}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Inflação:</span>
                    <span className="text-white">{formData.inflacaoEnergia}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Dias/mês:</span>
                    <span className="text-white">{formData.diasMes}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Resultados</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Status:</span>
                    <span className={getViabilityColor()}>{viabilidade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">ROI:</span>
                    <span className="text-white">{tir.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Retorno:</span>
                    <span className="text-white">{payback} anos</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recomendações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Recomendações</CardTitle>
            <CardDescription className="text-gray-300">
              Sugestões para otimização do projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {viabilidade === 'Viável' ? (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold">Projeto Recomendado</h5>
                      <p className="text-gray-300 text-sm">
                        O projeto apresenta indicadores econômicos favoráveis. Recomenda-se prosseguir com a implementação.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold">Otimizações Possíveis</h5>
                      <p className="text-gray-300 text-sm">
                        Considere ajustar o dimensionamento dos sistemas para maximizar o retorno sobre investimento.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold">Revisão Necessária</h5>
                      <p className="text-gray-300 text-sm">
                        O projeto não apresenta viabilidade econômica. Considere revisar os parâmetros técnicos e econômicos.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold">Sugestões de Melhoria</h5>
                      <p className="text-gray-300 text-sm">
                        Analise a redução de custos de investimento, aumento da capacidade ou melhoria das condições tarifárias.
                      </p>
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <h5 className="text-white font-semibold">Próximos Passos</h5>
                  <p className="text-gray-300 text-sm">
                    Realize uma análise de sensibilidade dos principais parâmetros e considere cenários alternativos de operação.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReportGenerator;