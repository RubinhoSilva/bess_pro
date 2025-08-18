import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Zap, 
  Sun, 
  Battery,
  MapPin,
  User
} from 'lucide-react';

interface ReportData {
  // Financial metrics
  vpl?: number;
  tir?: number;
  payback?: number;
  viabilidade?: string;
  investimentoTotal?: number;
  economiaAnual?: number;
  
  // System data
  formData?: any;
  systemType?: 'pv' | 'bess' | 'hybrid';
  
  // PV specific
  potenciaInstalada?: number;
  geracaoAnual?: number;
  areaOcupada?: number;
  modulosQtd?: number;
  
  // Additional metrics
  [key: string]: any;
}

interface ReportGeneratorProps {
  data: ReportData;
  title?: string;
  subtitle?: string;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ 
  data, 
  title = "Relatório de Viabilidade",
  subtitle = "Análise completa do sistema de energia"
}) => {
  const { toast } = useToast();
  
  const {
    vpl = 0,
    tir = 0,
    payback = 0,
    viabilidade = 'Em análise',
    investimentoTotal = 0,
    economiaAnual = 0,
    formData = {},
    systemType = 'pv',
    potenciaInstalada = 0,
    geracaoAnual = 0,
    areaOcupada = 0,
    modulosQtd = 0
  } = data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const handleExportPDF = () => {
    // Try to use the same PDF generation logic from PVProposalGenerator
    const reportElement = document.getElementById('report-content');
    if (reportElement) {
      window.print();
    } else {
      toast({
        title: "🚧 Funcionalidade em desenvolvimento!",
        description: "A exportação em PDF será implementada em breve.",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: subtitle,
        url: window.location.href,
      }).catch((error) => {
        console.log('Error sharing:', error);
        toast({
          title: "Erro ao compartilhar",
          description: "Não foi possível compartilhar o relatório.",
          variant: "destructive"
        });
      });
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Link copiado!",
          description: "O link do relatório foi copiado para a área de transferência.",
        });
      }).catch(() => {
        toast({
          title: "🚧 Funcionalidade em desenvolvimento!",
          description: "O compartilhamento será implementado em breve.",
        });
      });
    }
  };

  const getViabilityColor = () => {
    return viabilidade === 'Viável' ? 'text-green-400' : 'text-red-400';
  };

  const getViabilityIcon = () => {
    return viabilidade === 'Viável' ? 
      <CheckCircle className="w-6 h-6 text-green-400" /> : 
      <XCircle className="w-6 h-6 text-red-400" />;
  };

  const getSystemIcon = () => {
    switch (systemType) {
      case 'bess':
        return <Battery className="w-5 h-5" />;
      case 'hybrid':
        return <Zap className="w-5 h-5" />;
      default:
        return <Sun className="w-5 h-5" />;
    }
  };

  return (
    <div id="report-content" className="space-y-6 print:text-black print:bg-white">
      {/* Cabeçalho do Relatório */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center print:mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold text-white print:text-black mb-2">{title}</h2>
          <p className="text-gray-300 print:text-gray-600">{subtitle}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button onClick={handleExportPDF} variant="outline" className="bg-background/10 border-border text-foreground hover:bg-background/20">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" className="bg-background/10 border-border text-foreground hover:bg-background/20">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleShare} variant="outline" className="bg-background/10 border-border text-foreground hover:bg-background/20">
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
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-white print:text-black flex items-center gap-2">
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
              <div className="bg-white/5 print:bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-white print:text-black font-semibold">VPL</span>
                </div>
                <p className={`text-xl font-bold ${vpl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(vpl)}
                </p>
              </div>
              
              <div className="bg-white/5 print:bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="text-white print:text-black font-semibold">TIR</span>
                </div>
                <p className="text-xl font-bold text-blue-400">{tir.toFixed(1)}%</p>
              </div>
              
              <div className="bg-white/5 print:bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-white print:text-black font-semibold">Payback</span>
                </div>
                <p className="text-xl font-bold text-purple-400">{payback} anos</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white/5 print:bg-gray-50 rounded-lg">
              <h4 className="text-white print:text-black font-semibold mb-2">Conclusão:</h4>
              <p className="text-gray-300 print:text-gray-600 leading-relaxed">
                {viabilidade === 'Viável' 
                  ? `O projeto apresenta viabilidade econômica positiva com VPL de ${formatCurrency(vpl)} e TIR de ${tir.toFixed(1)}%. O investimento se paga em ${payback} anos, demonstrando ser uma oportunidade atrativa para redução de custos energéticos.`
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
        <Card className="bg-white/5 print:bg-white backdrop-blur-lg border-white/10 print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-white print:text-black">Especificações Técnicas</CardTitle>
            <CardDescription className="text-gray-300 print:text-gray-600">
              Configuração do sistema analisado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sistema Principal */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  {getSystemIcon()}
                  <h4 className="text-white print:text-black font-semibold">
                    {systemType === 'pv' ? 'Sistema Fotovoltaico' : 
                     systemType === 'bess' ? 'Sistema BESS' : 'Sistema Híbrido'}
                  </h4>
                </div>
                <div className="space-y-2 text-sm">
                  {systemType === 'pv' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-300 print:text-gray-600">Potência:</span>
                        <span className="text-white print:text-black">{formatNumber(potenciaInstalada)} kWp</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 print:text-gray-600">Geração Anual:</span>
                        <span className="text-white print:text-black">{formatNumber(geracaoAnual)} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 print:text-gray-600">Módulos:</span>
                        <span className="text-white print:text-black">{formatNumber(modulosQtd)} unidades</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 print:text-gray-600">Área:</span>
                        <span className="text-white print:text-black">{formatNumber(areaOcupada)} m²</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-300 print:text-gray-600">Investimento:</span>
                    <span className="text-white print:text-black">{formatCurrency(investimentoTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Dados do Cliente */}
              {formData.nomeCliente && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white print:text-black font-semibold">Cliente</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300 print:text-gray-600">Nome:</span>
                      <span className="text-white print:text-black">{formData.nomeCliente}</span>
                    </div>
                    {formData.emailCliente && (
                      <div className="flex justify-between">
                        <span className="text-gray-300 print:text-gray-600">Email:</span>
                        <span className="text-white print:text-black">{formData.emailCliente}</span>
                      </div>
                    )}
                    {formData.telefoneCliente && (
                      <div className="flex justify-between">
                        <span className="text-gray-300 print:text-gray-600">Telefone:</span>
                        <span className="text-white print:text-black">{formData.telefoneCliente}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Localização */}
              {(formData.cidade || formData.estado) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-green-400" />
                    <h4 className="text-white print:text-black font-semibold">Localização</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {formData.cidade && (
                      <div className="flex justify-between">
                        <span className="text-gray-300 print:text-gray-600">Cidade:</span>
                        <span className="text-white print:text-black">{formData.cidade}</span>
                      </div>
                    )}
                    {formData.estado && (
                      <div className="flex justify-between">
                        <span className="text-gray-300 print:text-gray-600">Estado:</span>
                        <span className="text-white print:text-black">{formData.estado}</span>
                      </div>
                    )}
                    {formData.irradiacao && (
                      <div className="flex justify-between">
                        <span className="text-gray-300 print:text-gray-600">Irradiação:</span>
                        <span className="text-white print:text-black">{formData.irradiacao} kWh/m²/dia</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Análise Econômica */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-white/5 print:bg-white backdrop-blur-lg border-white/10 print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-white print:text-black">Análise Econômica</CardTitle>
            <CardDescription className="text-gray-300 print:text-gray-600">
              Detalhamento dos aspectos financeiros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Investimento */}
              <div>
                <h4 className="text-white print:text-black font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-red-400" />
                  Investimento Total
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-500/20 print:bg-red-50 rounded-lg border border-red-500/30 print:border-red-200">
                    <span className="text-white print:text-black font-semibold">Total</span>
                    <span className="text-white print:text-black font-bold text-lg">{formatCurrency(investimentoTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Benefícios */}
              <div>
                <h4 className="text-white print:text-black font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Economia Anual
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-500/20 print:bg-green-50 rounded-lg border border-green-500/30 print:border-green-200">
                    <span className="text-white print:text-black font-semibold">Economia</span>
                    <span className="text-white print:text-black font-bold text-lg">{formatCurrency(economiaAnual)}</span>
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
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-white print:text-black">Recomendações</CardTitle>
            <CardDescription className="text-gray-300 print:text-gray-600">
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
                      <h5 className="text-white print:text-black font-semibold">Projeto Recomendado</h5>
                      <p className="text-gray-300 print:text-gray-600 text-sm">
                        O projeto apresenta indicadores econômicos favoráveis. Recomenda-se prosseguir com a implementação.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h5 className="text-white print:text-black font-semibold">Otimizações Possíveis</h5>
                      <p className="text-gray-300 print:text-gray-600 text-sm">
                        Considere ajustar o dimensionamento do sistema para maximizar o retorno sobre investimento.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <h5 className="text-white print:text-black font-semibold">Revisão Necessária</h5>
                      <p className="text-gray-300 print:text-gray-600 text-sm">
                        O projeto não apresenta viabilidade econômica. Considere revisar os parâmetros técnicos e econômicos.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h5 className="text-white print:text-black font-semibold">Sugestões de Melhoria</h5>
                      <p className="text-gray-300 print:text-gray-600 text-sm">
                        Analise a redução de custos de investimento, aumento da capacidade ou melhoria das condições de financiamento.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};