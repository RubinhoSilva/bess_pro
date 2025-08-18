import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check, Star, LogOut, CalendarX, ArrowLeft, ShieldCheck, Loader2, FlaskConical, Building } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/customSupabaseClient';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const SubscriptionPage = () => {
    const { session, profile, signOut } = useNewAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [stripeConfig, setStripeConfig] = useState(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [isTestMode, setIsTestMode] = useState(true);

    const stripePromise = useMemo(() => {
        if (stripeConfig?.publishableKey) {
            return loadStripe(stripeConfig.publishableKey);
        }
        return null;
    }, [stripeConfig]);
    
    const fetchStripeConfig = useCallback(async (testMode) => {
        setIsLoadingConfig(true);
        setStripeConfig(null);
        try {
            const { data, error } = await supabase.functions.invoke('get-stripe-config', {
                body: { isTestMode: testMode },
            });
            if (error) throw error;
            if (data.error) throw new Error(data.error);

            setStripeConfig(data);
        } catch (error) {
            console.error("Error fetching Stripe config:", error);
            const friendlyMessage = error.message.includes("não estão configuradas") 
                ? error.message 
                : "Não foi possível carregar as configurações de pagamento.";

            toast({
                variant: "destructive",
                title: "Erro de Configuração",
                description: friendlyMessage,
            });
        } finally {
            setIsLoadingConfig(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!isTestUser) {
            fetchStripeConfig(isTestMode);
        } else {
            setIsLoadingConfig(false);
        }
    }, [isTestMode, fetchStripeConfig, session?.user?.email]);

    const handleSignOut = async () => {
        await signOut();
        toast({ title: 'Até logo!', description: 'Você saiu da sua conta.' });
    };

    const handleChoosePlan = async (priceId) => {
        if (isLoadingConfig || !stripePromise || !priceId) {
            toast({
                variant: "destructive",
                title: "Aguarde um momento",
                description: "As configurações de pagamento ainda estão a ser carregadas. Tente novamente.",
            });
            return;
        }
        
        if (priceId.startsWith('YOUR_')) {
             toast({
                variant: "destructive",
                title: "Configuração Incompleta",
                description: "As chaves de teste do Stripe ainda não foram configuradas. Por favor, forneça as chaves.",
            });
            return;
        }

        setIsProcessingPayment(true);
        try {
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error("Stripe.js não foi carregado.");
            }
            
            const { error } = await stripe.redirectToCheckout({
                lineItems: [{ price: priceId, quantity: 1 }],
                mode: 'subscription',
                successUrl: `${window.location.origin}/select-service?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/subscription`,
                customerEmail: session?.user?.email,
            });

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Erro no Checkout",
                    description: error.message,
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: `Não foi possível iniciar o processo de pagamento. ${error.message}`,
            });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const isTestUser = useMemo(() => session?.user?.email === 'teste@teste.com.br', [session]);
    const isTrialExpired = profile?.subscription_status === 'trialing' && profile.trial_ends_at && isAfter(new Date(), new Date(profile.trial_ends_at));
    const isSubscriptionInactive = profile && !['trialing', 'active'].includes(profile.subscription_status);
    const isBlocked = !isTestUser && (isTrialExpired || isSubscriptionInactive);

    const trialEndDate = profile?.trial_ends_at ? format(new Date(profile.trial_ends_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : null;

    const plans = [
        { name: "Mensal", price: "R$ 199", period: "/mês", popular: false, features: ["Acesso completo", "Suporte por e-mail", "Atualizações contínuas"], priceIdKey: "monthlyPriceId" },
        { name: "Trimestral", price: "R$ 179", period: "/mês", popular: false, features: ["Economize 10%", "Acesso completo", "Suporte prioritário"], priceIdKey: "quarterlyPriceId" },
        { name: "Anual", price: "R$ 149", period: "/mês", popular: true, features: ["Economize 25%", "Acesso completo", "Suporte VIP", "2 meses grátis"], priceIdKey: "annualPriceId" },
    ];
    
    const EnvironmentSwitcher = () => (
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
            <FlaskConical className={`h-5 w-5 ${isTestMode ? 'text-cyan-400' : 'text-slate-500'}`} />
            <Label htmlFor="environment-mode" className="text-sm font-medium text-slate-300">Teste</Label>
            <Switch
                id="environment-mode"
                checked={!isTestMode}
                onCheckedChange={(checked) => setIsTestMode(!checked)}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-cyan-500"
            />
            <Label htmlFor="environment-mode" className="text-sm font-medium text-slate-300">Produção</Label>
            <Building className={`h-5 w-5 ${!isTestMode ? 'text-green-400' : 'text-slate-500'}`} />
        </div>
    );

    if (isTestUser) {
        return (
            <>
                <Helmet>
                    <title>Meu Plano - BESS Pro</title>
                    <meta name="description" content="Consulte o estado da sua subscrição BESS Pro." />
                </Helmet>
                <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col justify-center items-center p-4 relative">
                    <div className="aurora-bg"></div>
                    <div className="absolute inset-0 -z-10 bg-slate-900/80"></div>
                    <Button onClick={() => navigate(-1)} variant="ghost" className="absolute top-4 left-4 z-20 text-white hover:bg-slate-700/50">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
                    </Button>
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center z-10">
                        <ShieldCheck className="mx-auto w-24 h-24 text-green-400 mb-6" />
                        <h1 className="text-4xl md:text-5xl font-extrabold">Seu Plano Pro está Ativo</h1>
                        <p className="text-lg text-slate-300 mt-4 max-w-2xl">
                            Como utilizador de demonstração, você tem acesso ilimitado a todas as funcionalidades da plataforma.
                        </p>
                        <Button onClick={() => navigate('/select-service')} className="mt-8 bg-blue-600 hover:bg-blue-700">
                            Continuar para a Plataforma
                        </Button>
                    </motion.div>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>Escolha seu Plano - BESS Pro</title>
                <meta name="description" content="Seu período de teste terminou. Escolha um plano para continuar a usar o BESS Pro." />
            </Helmet>
            <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col justify-center items-center p-4 relative">
                <div className="aurora-bg"></div>
                <div className="absolute inset-0 -z-10 bg-slate-900/80"></div>
                
                <EnvironmentSwitcher />

                {!isBlocked && (
                     <Button 
                        onClick={() => navigate(-1)} 
                        variant="ghost" 
                        className="absolute top-4 left-4 z-20 text-white hover:bg-slate-700/50"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Voltar
                    </Button>
                )}

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-4xl mx-auto z-10"
                >
                    <div className="text-center mb-10 mt-20">
                        {isTrialExpired ? (
                            <>
                                <CalendarX className="mx-auto w-16 h-16 text-red-400 mb-4" />
                                <h1 className="text-4xl md:text-5xl font-extrabold">Seu Período de Teste Terminou</h1>
                                <p className="text-lg text-slate-300 mt-2">Seu acesso de 7 dias expirou em {trialEndDate}.</p>
                                <p className="text-lg text-slate-300">Escolha um plano abaixo para continuar a otimizar seus projetos.</p>
                            </>
                        ) : (
                            <>
                                <Star className="mx-auto w-16 h-16 text-yellow-400 mb-4" />
                                <h1 className="text-4xl md:text-5xl font-extrabold">Escolha o Melhor Plano para Você</h1>
                                <p className="text-lg text-slate-300 mt-2">Continue a ter acesso a todas as ferramentas poderosas do BESS Pro.</p>
                            </>
                        )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan, index) => {
                            const priceId = stripeConfig ? stripeConfig[plan.priceIdKey] : null;
                            const isButtonDisabled = isLoadingConfig || isProcessingPayment || !priceId;
                            return (
                                <motion.div
                                    key={plan.name}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <Card className={`bg-slate-800/70 border-2 ${plan.popular ? 'border-blue-500' : 'border-slate-700'} flex flex-col h-full relative`}>
                                        {plan.popular && (
                                            <div className="absolute -top-3 right-4 bg-blue-600 text-white px-3 py-1 text-sm font-bold rounded-full flex items-center gap-1">
                                                <Star className="w-4 h-4" /> Mais Popular
                                            </div>
                                        )}
                                        <CardHeader className="text-center">
                                            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                            <CardDescription className="text-slate-400">
                                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                                <span className="text-lg">{plan.period}</span>
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <ul className="space-y-3 text-slate-300">
                                                {plan.features.map(feature => (
                                                    <li key={feature} className="flex items-center gap-3">
                                                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            <Button 
                                              onClick={() => handleChoosePlan(priceId)} 
                                              disabled={isButtonDisabled}
                                              className={`w-full font-bold ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                                            >
                                                {isLoadingConfig || isProcessingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {isLoadingConfig ? 'A carregar...' : (isProcessingPayment ? 'A processar...' : 'Escolher Plano')}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-12">
                        <Button variant="ghost" onClick={handleSignOut} className="text-slate-400 hover:text-white">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sair da conta
                        </Button>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default SubscriptionPage;