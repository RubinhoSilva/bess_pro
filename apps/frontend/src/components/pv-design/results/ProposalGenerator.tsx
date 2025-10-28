import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Download, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import proposalService, { ProposalRequest } from '@/services/proposalService';
import ProposalDataAdapter from './ProposalDataAdapter';

interface ProposalGeneratorProps {
  results: any;
  customerData: any;
  energyData: any;
  systemData: any;
  budgetData: any;
  systemSummaryData: any;
  aggregatedRoofData: any;
}

type GenerationState = 'idle' | 'generating' | 'success' | 'error';

const ProposalGenerator: React.FC<ProposalGeneratorProps> = ({
  results,
  customerData,
  energyData,
  systemData,
  budgetData,
  systemSummaryData,
  aggregatedRoofData
}) => {
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const { toast } = useToast();

  /**
   * Gera a proposta através da API
   */
  const generateProposal = async () => {
    setGenerationState('generating');
    setErrorMessage('');
    setPdfUrl('');
    setPdfBase64('');

    try {
      // Prepara os dados para a API
      const storeData = {
        customerData,
        energyData,
        systemData,
        budgetData,
        resultsData: { calculationResults: results },
        systemSummaryData,
        aggregatedRoofData
      };

      const proposalData: ProposalRequest = ProposalDataAdapter.adaptStoreToProposal(storeData);


      // Chama a API
      const response = await proposalService.generateProposal(proposalData);


      if (response.success) {
        setGenerationState('success');
        
        if (response.data.pdfUrl) {
          setPdfUrl(response.data.pdfUrl);
        }
        
        if (response.data.pdfBase64) {
          setPdfBase64(response.data.pdfBase64);
        }

        toast({
          title: "Proposta gerada com sucesso!",
          description: "O PDF foi gerado e está pronto para visualização.",
          variant: "default",
        });

        // Abre automaticamente em nova aba após 1 segundo
        setTimeout(() => {
          openPDFInNewTab();
        }, 1000);

      } else {
        throw new Error(response.data.error || 'Erro ao gerar proposta');
      }

    } catch (error: any) {
      setGenerationState('error');
      setErrorMessage(error.message || 'Erro ao gerar proposta. Tente novamente.');
      
      toast({
        title: "Erro ao gerar proposta",
        description: error.message || 'Ocorreu um erro ao gerar a proposta. Tente novamente.',
        variant: "destructive",
      });
    }
  };

  /**
   * Tenta gerar novamente
   */
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    generateProposal();
  };

  /**
   * Abre o PDF em nova aba
   */
  const openPDFInNewTab = () => {
    try {
      if (pdfUrl) {
        proposalService.openPDFInNewTab(pdfUrl);
      } else if (pdfBase64) {
        proposalService.openBase64PDFInNewTab(pdfBase64);
      } else {
        throw new Error('PDF não disponível');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao abrir PDF",
        description: error.message || 'Não foi possível abrir o PDF.',
        variant: "destructive",
      });
    }
  };

  /**
   * Faz o download do PDF
   */
  const downloadPDF = () => {
    try {
      const fileName = `proposta-${customerData?.name || 'sistema'}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (pdfUrl) {
        proposalService.downloadPDF(pdfUrl, fileName);
      } else if (pdfBase64) {
        proposalService.downloadBase64PDF(pdfBase64, fileName);
      } else {
        throw new Error('PDF não disponível');
      }

      toast({
        title: "Download iniciado",
        description: "O PDF está sendo baixado.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao baixar PDF",
        description: error.message || 'Não foi possível baixar o PDF.',
        variant: "destructive",
      });
    }
  };

  /**
   * Reseta o estado para gerar nova proposta
   */
  const resetState = () => {
    setGenerationState('idle');
    setErrorMessage('');
    setPdfUrl('');
    setPdfBase64('');
    setRetryCount(0);
  };

  // Renderização do botão principal
  const renderMainButton = () => {
    switch (generationState) {
      case 'generating':
        return (
          <Button
            disabled
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
          >
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Gerando Proposta...
          </Button>
        );

      case 'success':
        return (
          <div className="space-y-3">
            <Button
              onClick={openPDFInNewTab}
              size="lg"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Visualizar Proposta
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={downloadPDF}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
              
              <Button
                onClick={resetState}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Gerar Nova
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              size="lg"
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Tentar Novamente {retryCount > 0 && `(${retryCount})`}
            </Button>
            
            <Button
              onClick={resetState}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        );

      default:
        return (
          <Button
            onClick={generateProposal}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Gerar Proposta Comercial
          </Button>
        );
    }
  };

  // Renderização do status
  const renderStatus = () => {
    switch (generationState) {
      case 'generating':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Gerando proposta comercial...</p>
                    <p className="text-xs text-muted-foreground">
                      Processando dados financeiros e técnicos. Isso pode levar até 60 segundos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Proposta gerada com sucesso! O PDF foi aberto em nova aba.
              </AlertDescription>
            </Alert>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Proposta Comercial</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Gere uma proposta comercial completa com análise técnica e financeira em PDF.
        </p>
      </div>

      {renderMainButton()}
      {renderStatus()}

      {/* Informações adicionais */}
      {generationState === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-muted/30 rounded-lg"
        >
          <h4 className="font-medium mb-2">O que está incluído na proposta:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Análise técnica detalhada do sistema</li>
            <li>• Projeção financeira completa (25 anos)</li>
            <li>• Métricas de desempenho e economia</li>
            <li>• Especificações dos equipamentos</li>
            <li>• Condições comerciais e pagamento</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default ProposalGenerator;