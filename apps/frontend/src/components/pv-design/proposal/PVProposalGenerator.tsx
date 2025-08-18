import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ProposalDocument } from './ProposalDocument';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '@/hooks/auth-hooks';

interface PVProposalGeneratorProps {
  results: any;
  onNewCalculation?: () => void;
  onBackToForm?: () => void;
}

export const PVProposalGenerator: React.FC<PVProposalGeneratorProps> = ({ 
  results, 
  onNewCalculation, 
  onBackToForm 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [proposalSettings, setProposalSettings] = useState({
    show_introduction: true,
    show_technical_analysis: true,
    show_financial_analysis: true,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Mock profile data - in a real app this would come from user context/API
  const profile = {
    company: 'Sua Empresa Solar',
    email: user?.email || 'seuemail@empresa.com',
    phone: '(XX) XXXX-XXXX',
    website: 'www.suaempresa.com',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const proposalElement = document.getElementById('proposal-content');
    if (!proposalElement) {
      setIsDownloading(false);
      return;
    }

    toast({
      title: "Gerando PDF...",
      description: "Aguarde um momento, estamos preparando seu relatório.",
    });

    try {
      const originalStyles = proposalElement.style.cssText;
      proposalElement.style.cssText += 'width: 210mm;';

      const pages = proposalElement.querySelectorAll('.proposal-page');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        try {
          const canvas = await html2canvas(page, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: page.scrollWidth,
            windowHeight: page.scrollHeight,
          });

          const imgData = canvas.toDataURL('image/png');
          const imgProps = pdf.getImageProperties(imgData);
          const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          let heightLeft = imgHeight;

          if (i > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, imgHeight));
          heightLeft -= pdfHeight;

          while (heightLeft > 0) {
            const position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
          }

        } catch (error) {
          console.error("Error generating canvas for page", i, error);
          toast({
            variant: "destructive",
            title: "Erro ao gerar PDF",
            description: `Falha ao processar a página ${i + 1}. Tente novamente.`,
          });
          proposalElement.style.cssText = originalStyles;
          setIsDownloading(false);
          return;
        }
      }

      proposalElement.style.cssText = originalStyles;

      const projectName = results.formData?.projectName || 
                         results.formData?.customer?.name || 
                         'solar';
      pdf.save(`proposta-${projectName}.pdf`);
      
      toast({
        title: "Download concluído!",
        description: "Seu relatório em PDF foi gerado com sucesso.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 print:p-0 bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 print:hidden"
        >
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Proposta Gerada
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto mt-4">
            Revise a proposta abaixo. Você pode imprimir ou baixar como PDF.
          </p>
        </motion.div>

        <div className="bg-white text-black shadow-2xl">
          <div id="proposal-content">
            <ProposalDocument 
              results={results} 
              profile={profile} 
              settings={proposalSettings} 
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex flex-wrap justify-center gap-4 pt-10 print:hidden"
        >
          {onBackToForm && (
            <Button 
              onClick={onBackToForm} 
              size="lg" 
              variant="outline" 
              className="bg-background/10 border-border text-foreground hover:bg-background/20 hover:text-foreground px-8 py-6 text-lg font-semibold rounded-full shadow-lg"
            >
              <ArrowLeft className="mr-3 w-5 h-5" />
              Voltar ao Dimensionamento
            </Button>
          )}
          
          <Button 
            onClick={handlePrint} 
            size="lg" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg"
          >
            <Printer className="mr-3 w-5 h-5" />
            Imprimir
          </Button>
          
          <Button 
            onClick={handleDownload} 
            disabled={isDownloading} 
            size="lg" 
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-3 w-5 h-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="mr-3 w-5 h-5" />
                Baixar PDF
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};