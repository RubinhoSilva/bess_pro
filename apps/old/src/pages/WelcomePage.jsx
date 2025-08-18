import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Zap, LogIn, UserPlus, Loader2, AlertCircle, BarChart, BatteryCharging, Users, ShieldCheck, ArrowRight, CheckCircle, BrainCircuit, TrendingUp, MessageSquare as MessageSquareQuote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';

const MotionSection = ({ children, className }) => (
  <motion.section
    className={className}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    {children}
  </motion.section>
);

const WelcomePage = () => {
  const { signUp, signIn } = useNewAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        const errorMessage = signInError.message === "Invalid login credentials"
          ? "Credenciais de login inválidas."
          : signInError.message === "Email not confirmed"
          ? "Por favor, confirme seu e-mail antes de fazer o login."
          : "Ocorreu um erro. Tente novamente.";
        setError(errorMessage);
        toast({ variant: "destructive", title: "Falha no Login", description: errorMessage });
      } else {
        navigate('/select-service');
      }
    } catch (error) {
      setError("Ocorreu um erro inesperado.");
      toast({ variant: "destructive", title: "Falha no Login", description: "Ocorreu um erro inesperado." });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      const errorMessage = "As senhas não coincidem.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "Erro de Cadastro", description: errorMessage });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, { name });

    if (error) {
      setError(error.message);
      toast({ variant: "destructive", title: "Falha no Cadastro", description: error.message });
    } else {
      toast({ title: "Sucesso!", description: "Cadastro realizado. Verifique seu e-mail para confirmação." });
      setSignupSuccess(true);
      clearForm();
    }
    setLoading(false);
  };

  const clearForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword(''); setName('');
  };

  return (
    <>
      <Helmet>
        <title>BESS Pro - Potencialize seus Projetos de Energia</title>
        <meta name="description" content="A plataforma completa para análise de viabilidade, dimensionamento de sistemas de armazenamento de energia (BESS), solar fotovoltaico (PV) e CRM integrado." />
      </Helmet>
      <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col relative overflow-hidden">
        <div className="aurora-bg"></div>
        <div className="absolute inset-0 -z-10 bg-slate-900/80"></div>

        <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-slate-900/50 backdrop-blur-lg border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">BESS Pro</span>
            </div>
          </div>
        </header>

        <main className="flex-grow pt-24 z-10">
          <MotionSection className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
                  Potencialize seus Projetos
                  <br />
                  com <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">BESS Pro</span>
                </h1>
                <p className="max-w-xl mx-auto lg:mx-0 text-lg text-slate-300 leading-relaxed">
                  A ferramenta completa para análise, dimensionamento e gestão de projetos de energia solar e armazenamento.
                </p>
              </div>
              
              <Card className="bg-slate-900/50 border-slate-700 text-white p-8 backdrop-blur-sm w-full max-w-md mx-auto">
                <CardContent className="p-0">
                  {isLoginView ? (
                    <div className="flex flex-col items-center text-center">
                        <div className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mb-4">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-1">Acesse sua Conta</h2>
                        <p className="text-slate-400 mb-6">Bem-vindo de volta!</p>
                        {signupSuccess && (
                            <div className="bg-green-900/50 border border-green-500/50 text-green-300 text-sm rounded-md p-3 mb-4 text-left flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-400" />
                                <div>
                                    <span className="font-bold">Cadastro realizado!</span>
                                    <p>Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada.</p>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleLogin} className="w-full space-y-4">
                            <div className="text-left w-full space-y-1.5">
                                <Label htmlFor="email-login">Email</Label>
                                <Input id="email-login" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-slate-800 border-slate-700 h-10" />
                            </div>
                            <div className="text-left w-full space-y-1.5">
                                <Label htmlFor="password-login">Senha</Label>
                                <Input id="password-login" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-slate-800 border-slate-700 h-10" />
                            </div>
                            {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-sm rounded-md p-2.5 flex items-center"><AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /><span>{error}</span></div>}
                             <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 h-10" disabled={loading}>
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><LogIn className="mr-2 h-5 w-5" /> Entrar</>}
                             </Button>
                        </form>
                        <Button variant="link" onClick={() => { setIsLoginView(false); setError(null); clearForm(); setSignupSuccess(false); }} className="text-slate-400 hover:text-blue-300 mt-4 text-sm">
                            Não tem uma conta? Crie sua conta teste de 7 dias
                        </Button>
                    </div>
                  ) : (
                     <div className="flex flex-col items-center text-center">
                        <div className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mb-4">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-1">Crie sua Conta Teste</h2>
                        <p className="text-slate-400 mb-6">Acesso total por 7 dias. Sem compromisso.</p>
                         <form onSubmit={handleSignUp} className="w-full space-y-3">
                            <div className="text-left w-full space-y-1"><Label htmlFor="name-modal">Nome Completo</Label><Input id="name-modal" value={name} onChange={(e) => setName(e.target.value)} required className="bg-slate-800 border-slate-700 h-9" /></div>
                            <div className="text-left w-full space-y-1"><Label htmlFor="email-modal">Email</Label><Input id="email-modal" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-slate-800 border-slate-700 h-9" /></div>
                            <div className="text-left w-full space-y-1"><Label htmlFor="password-modal">Senha</Label><Input id="password-modal" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-slate-800 border-slate-700 h-9" /></div>
                            <div className="text-left w-full space-y-1"><Label htmlFor="confirm-password-modal">Confirmar Senha</Label><Input id="confirm-password-modal" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-slate-800 border-slate-700 h-9" /></div>
                            {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-sm rounded-md p-2.5 flex items-center"><AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /><span>{error}</span></div>}
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 h-10" disabled={loading}>
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><UserPlus className="mr-2 h-5 w-5" /> Criar Conta Grátis</>}
                            </Button>
                        </form>
                        <Button variant="link" onClick={() => { setIsLoginView(true); setError(null); clearForm(); }} className="text-slate-400 hover:text-blue-300 mt-4 text-sm">
                            Já tem uma conta? Faça login
                        </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </MotionSection>

          <MotionSection className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-center text-3xl font-bold mb-4">Como Funciona?</h2>
            <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">Transforme dados em decisões e projetos em resultados em três passos simples.</p>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700">
                <div className="inline-block p-4 bg-blue-500/20 rounded-full mb-5"><BrainCircuit className="w-8 h-8 text-blue-300" /></div>
                <h3 className="text-xl font-bold mb-3">1. Simule e Analise</h3>
                <p className="text-slate-400">Insira os dados de consumo e tarifas para simular cenários de BESS e FV, identificando a solução mais rentável.</p>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700">
                <div className="inline-block p-4 bg-purple-500/20 rounded-full mb-5"><BarChart className="w-8 h-8 text-purple-300" /></div>
                <h3 className="text-xl font-bold mb-3">2. Projete e Dimensione</h3>
                <p className="text-slate-400">Utilize nossas ferramentas para dimensionar sistemas fotovoltaicos com precisão e gerar propostas técnicas.</p>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700">
                <div className="inline-block p-4 bg-cyan-500/20 rounded-full mb-5"><TrendingUp className="w-8 h-8 text-cyan-300" /></div>
                <h3 className="text-xl font-bold mb-3">3. Venda e Gerencie</h3>
                <p className="text-slate-400">Acompanhe leads, clientes e feche mais negócios com o funil de vendas do nosso CRM integrado.</p>
              </div>
            </div>
          </MotionSection>

          <MotionSection className="max-w-6xl mx-auto px-4 py-16">
            <h2 className="text-center text-3xl font-bold mb-12">Recursos Poderosos para Impulsionar seu Negócio</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <BatteryCharging className="w-7 h-7 text-blue-400" />, title: "Análise BESS Completa", desc: "Simule cenários e encontre a solução de armazenamento mais rentável." },
                { icon: <BarChart className="w-7 h-7 text-green-400" />, title: "Dimensionamento PV Inteligente", desc: "Projete sistemas fotovoltaicos otimizados com precisão e análise financeira." },
                { icon: <Users className="w-7 h-7 text-cyan-400" />, title: "CRM Integrado", desc: "Gerencie leads, clientes e propostas em um único lugar, otimizando seu fluxo de vendas." },
                { icon: <CheckCircle className="w-7 h-7 text-purple-400" />, title: "Propostas Automáticas", desc: "Gere propostas comerciais e técnicas profissionais em minutos, com dados do projeto." },
                { icon: <TrendingUp className="w-7 h-7 text-yellow-400" />, title: "Análise Financeira", desc: "Calcule VPL, TIR e Payback para apresentar o retorno sobre o investimento de forma clara." },
                { icon: <ShieldCheck className="w-7 h-7 text-red-400" />, title: "Gestão de Clientes", desc: "Acompanhe manutenções e crie novas oportunidades com sua base de clientes." },
              ].map(feature => (
                <div key={feature.title} className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 flex items-start gap-5 hover:border-blue-500 transition-colors duration-300">
                  <div className="flex-shrink-0 mt-1">{feature.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                    <p className="text-slate-400 mt-2">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </MotionSection>

          <MotionSection className="max-w-5xl mx-auto px-4 py-16">
            <h2 className="text-center text-3xl font-bold mb-12">O que nossos clientes dizem</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700">
                <MessageSquareQuote className="w-8 h-8 text-blue-400 mb-4" />
                <p className="text-slate-300 mb-5">"A BESS Pro transformou a forma como apresentamos nossos projetos. A análise financeira é robusta e as propostas são geradas em tempo recorde. Essencial para qualquer integrador."</p>
                <div>
                  <p className="font-bold text-white">João Silva</p>
                  <p className="text-sm text-slate-400">CEO, Soluções Energéticas</p>
                </div>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700">
                <MessageSquareQuote className="w-8 h-8 text-blue-400 mb-4" />
                <p className="text-slate-300 mb-5">"O CRM integrado é um divisor de águas. Conseguimos unificar nossa prospecção e gestão de projetos, o que aumentou nossa eficiência em mais de 40%."</p>
                <div>
                  <p className="font-bold text-white">Maria Oliveira</p>
                  <p className="text-sm text-slate-400">Diretora de Vendas, Energia Pura</p>
                </div>
              </div>
            </div>
          </MotionSection>

          <MotionSection className="max-w-3xl mx-auto px-4 py-16">
            <h2 className="text-center text-3xl font-bold mb-10">Perguntas Frequentes</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Para quem é a BESS Pro?</AccordionTrigger>
                <AccordionContent className="text-slate-400">A BESS Pro é ideal para engenheiros, integradores de sistemas de energia, consultores e empresas que projetam e vendem sistemas de armazenamento de energia (BESS) e solar fotovoltaico.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Preciso instalar algum software?</AccordionTrigger>
                <AccordionContent className="text-slate-400">Não. A BESS Pro é uma plataforma 100% baseada na web. Você pode acessá-la de qualquer lugar, a qualquer momento, com uma conexão à internet.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Meus dados estão seguros?</AccordionTrigger>
                <AccordionContent className="text-slate-400">Sim. A segurança dos seus dados é nossa prioridade máxima. Usamos criptografia de ponta e as melhores práticas de segurança para proteger todas as informações de seus projetos e clientes.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Existe um período de teste gratuito?</AccordionTrigger>
                <AccordionContent className="text-slate-400">Sim! Crie uma conta e tenha acesso completo à plataforma por 7 dias para explorar todas as funcionalidades da BESS Pro. Não é necessário cartão de crédito.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </MotionSection>
        </main>

        <footer className="w-full text-center p-8 text-slate-500 text-sm mt-auto z-10 border-t border-slate-800">
          <div className="flex justify-center items-center gap-4">
            <span>© {new Date().getFullYear()} BESS Pro. Todos os direitos reservados.</span>
            <span className="text-slate-700">|</span>
            <Link to="/privacy-policy" className="hover:text-blue-400 transition-colors flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Política de Privacidade
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default WelcomePage;