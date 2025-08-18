import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Braces } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import GoogleAdsIntegration from '@/components/integrations/GoogleAdsIntegration';

const IntegrationsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-slate-900 print:bg-white">
            <Header />
            <main className="pt-20 print:pt-0">
                <div className="px-4 md:px-8 mb-4 print:hidden">
                    <Button variant="outline" onClick={() => navigate('/select-service')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a Seleção de Serviços
                    </Button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-4xl mx-auto px-4"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <Braces className="w-10 h-10 text-blue-400" />
                        <div>
                            <h1 className="text-3xl font-bold text-white">Integrações</h1>
                            <p className="text-slate-400">Conecte o BESS Pro com suas ferramentas favoritas.</p>
                        </div>
                    </div>
                    
                    <GoogleAdsIntegration />

                </motion.div>

            </main>
        </div>
    );
};

export default IntegrationsPage;