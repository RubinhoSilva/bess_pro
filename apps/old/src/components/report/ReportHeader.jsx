import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Download, Printer, Share2 } from 'lucide-react';

const ReportHeader = ({ profile }) => {
  const { toast } = useToast();
  const today = new Date().toLocaleDateString('pt-BR');

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

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-100 pb-4 print:border-b">
        <div>
          {profile?.logo_url ? (
            <img  src={profile.logo_url} alt="Logotipo da Empresa" className="h-12 max-w-xs object-contain mb-4 print:h-10" src="https://images.unsplash.com/photo-1642888621621-ff7d83f3fdcf" />
          ) : (
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 print:text-black">
              {profile?.company || 'Sua Empresa'}
            </h1>
          )}
          <h2 className="text-2xl font-bold text-slate-800 print:text-xl">Relatório de Viabilidade de Sistema Híbrido</h2>
          <p className="text-slate-500 text-sm">Análise Técnico-Econômica | Data: {today}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" /> Compartilhar
          </Button>
        </div>
      </header>
    </motion.div>
  );
};

export default ReportHeader;