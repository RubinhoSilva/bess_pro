import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, BarChart3, Users, Briefcase, Calendar, Star } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { differenceInDays, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';

const services = [
    {
        title: 'Dimensionamento FV',
        description: 'Calcule e dimensione sistemas fotovoltaicos com precisão.',
        icon: <Zap className="w-10 h-10 text-yellow-400" />,
        path: '/pv-design',
        color: 'hover:border-yellow-400/50'
    },
    {
        title: 'Análise BESS',
        description: 'Analise a viabilidade de Sistemas de Armazenamento de Energia.',
        icon: <BarChart3 className="w-10 h-10 text-green-400" />,
        path: '/bess-analysis',
        color: 'hover:border-green-400/50'
    },
    {
        title: 'CRM de Vendas',
        description: 'Gerencie seu funil de vendas e leads de forma integrada.',
        icon: <Briefcase className="w-10 h-10 text-blue-400" />,
        path: '/crm',
        color: 'hover:border-blue-400/50'
    },
    {
        title: 'Gestão de Clientes',
        description: 'Acesse e gerencie sua base de clientes cadastrados.',
        icon: <Users className="w-10 h-10 text-cyan-400" />,
        path: '/clients',
        color: 'hover:border-cyan-400/50'
    }
];

const TrialFooter = () => {
    const { profile } = useNewAuth();
    const navigate = useNavigate();

    const trialDaysRemaining = useMemo(() => {
        if (profile?.subscription_status !== 'trialing' || !profile.trial_ends_at) {
            return null;
        }
        const endDate = new Date(profile.trial_ends_at);
        const now = new Date();
        if (isAfter(now, endDate)) return 0;
        
        const diff = differenceInDays(endDate, now);
        return diff >= 0 ? diff : 0;
    }, [profile]);

    if (trialDaysRemaining === null || trialDaysRemaining < 0) return null;

    const dayText = trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes';

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-4 border-t border-blue-500/30 z-50"
        >
            <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-4 text-center">
                <div className="flex items-center gap-2 text-blue-300">
                    <Calendar className="w-5 h-5" />
                    <p className="font-semibold">
                        Você está no período de teste gratuito.
                    </p>
                </div>
                <p className="text-white">
                    Você tem <span className="font-bold text-lg text-yellow-400">{trialDaysRemaining}</span> {dayText} para testar.
                </p>
                <Button
                    onClick={() => navigate('/subscription')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    size="sm"
                >
                    <Star className="w-4 h-4 mr-2" />
                    Escolha seu Plano Agora
                </Button>
            </div>
        </motion.div>
    );
};

const ServiceSelectionPage = () => {
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
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-900">
            <Header />
            <main className="flex flex-col items-center justify-center pt-20 pb-24">
                <div className="text-center p-8">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-5xl font-extrabold text-white tracking-tight"
                    >
                        Selecione um Serviço
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto"
                    >
                        Escolha uma das ferramentas abaixo para iniciar seu trabalho. Cada módulo foi projetado para otimizar uma parte do seu processo.
                    </motion.p>
                </div>

                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 pb-8 max-w-7xl w-full"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {services.map((service) => (
                        <motion.div key={service.title} variants={itemVariants}>
                            <Link to={service.path} className="block">
                                <Card 
                                    className={`bg-slate-800/50 border border-slate-700 text-white cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-2 ${service.color}`}
                                >
                                    <CardHeader className="flex flex-col items-center text-center p-6">
                                        <div className="p-4 bg-slate-700/50 rounded-full mb-4">
                                            {service.icon}
                                        </div>
                                        <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
                                        <CardDescription className="text-slate-400 mt-2">{service.description}</CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </main>
            <TrialFooter />
        </div>
    );
};

export default ServiceSelectionPage;