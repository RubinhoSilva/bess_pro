import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ProposalDocument from './proposal/ProposalDocument';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNewAuth } from '@/contexts/NewAuthContext';

const PVDesignResults = ({ results, onNewCalculation, onBackToForm }) => {
    const { toast } = useToast();
    const { profile, loading: profileLoading, supabase, user } = useNewAuth();
    const [isDownloading, setIsDownloading] = useState(false);
    const [proposalSettings, setProposalSettings] = useState(null);
    const [loadingSettings, setLoadingSettings] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) {
                setLoadingSettings(false);
                return;
            }
            setLoadingSettings(true);
            const { data, error } = await supabase
                .from('proposal_settings')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error("Error fetching proposal settings:", error);
                toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as configurações da proposta." });
            }
            
            if (data) {
                setProposalSettings(data);
            } else {
                // Default settings if none are found
                setProposalSettings({
                    show_introduction: true,
                    show_technical_analysis: true,
                    show_financial_analysis: true,
                });
            }
            setLoadingSettings(false);
        };

        fetchSettings();
    }, [user, supabase, toast]);

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

        const originalStyles = proposalElement.style.cssText;
        proposalElement.style.cssText += 'width: 210mm;';

        const pages = proposalElement.querySelectorAll('.proposal-page');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            try {
                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    windowWidth: page.scrollWidth,
                    windowHeight: page.scrollHeight,
                    onclone: (document) => {
                        Array.from(document.getElementsByTagName('img')).forEach(img => {
                            if (img.src.includes('supabase')) {
                                img.crossOrigin = 'anonymous';
                            }
                        });
                    }
                });

                const imgData = canvas.toDataURL('image/png');
                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                
                let heightLeft = imgHeight;
                let position = 0;

                if (i > 0) {
                    pdf.addPage();
                }
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, imgHeight));
                heightLeft -= pdfHeight;

                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
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

        pdf.save(`proposta-${results.formData.projectName || 'solar'}.pdf`);
        toast({
            title: "Download concluído!",
            description: "Seu relatório em PDF foi gerado com sucesso.",
        });
        setIsDownloading(false);
    };

    if (profileLoading || loadingSettings) {
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
                        <ProposalDocument results={results} profile={profile} settings={proposalSettings} />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="flex flex-wrap justify-center gap-4 pt-10 print:hidden"
                >
                    <Button onClick={onBackToForm} size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg">
                        <ArrowLeft className="mr-3 w-5 h-5" />
                        Voltar ao Dimensionamento
                    </Button>
                    <Button onClick={handlePrint} size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg">
                        <Printer className="mr-3 w-5 h-5" />
                        Imprimir
                    </Button>
                    <Button onClick={handleDownload} disabled={isDownloading} size="lg" className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg">
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

export default PVDesignResults;