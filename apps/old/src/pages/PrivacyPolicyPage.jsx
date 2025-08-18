import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    };

    return (
        <>
            <Helmet>
                <title>Política de Privacidade - BESS Pro</title>
                <meta name="description" content="Conheça nossa política de privacidade e como lidamos com seus dados na plataforma BESS Pro." />
            </Helmet>
            <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col items-center p-4 sm:p-8">
                <div className="absolute inset-0 -z-10 h-full w-full bg-slate-900 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                <motion.div
                    className="w-full max-w-4xl"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className="mb-8">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="text-center mb-12">
                        <Shield className="mx-auto h-16 w-16 text-blue-500 mb-4" />
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white">Política de Privacidade</h1>
                        <p className="text-lg text-slate-400 mt-2">Última atualização: 11 de Julho de 2025</p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-8 text-slate-300 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">1. Introdução</h2>
                            <p>Bem-vindo à BESS Pro. Sua privacidade é de extrema importância para nós. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você utiliza nossa plataforma. Ao usar nossos serviços, você concorda com a coleta e uso de informações de acordo com esta política.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">2. Informações que Coletamos</h2>
                            <p>Podemos coletar informações sobre você de várias maneiras. As informações que podemos coletar na plataforma incluem:</p>
                            <ul className="list-disc list-inside mt-4 space-y-2 pl-4">
                                <li><strong>Dados Pessoais:</strong> Informações de identificação pessoal, como seu nome, endereço de e-mail, número de telefone, nome da empresa e endereço, que você nos fornece voluntariamente ao se registrar na plataforma.</li>
                                <li><strong>Dados de Projetos:</strong> Informações relacionadas aos projetos que você cria, como dados de consumo de energia, parâmetros financeiros, especificações de equipamentos e outras informações técnicas necessárias para as simulações.</li>
                                <li><strong>Dados de Uso:</strong> Informações que nosso servidor coleta automaticamente quando você acessa a plataforma, como seu endereço IP, tipo de navegador, sistema operacional, horários de acesso e as páginas que você visualizou.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">3. Uso de Suas Informações</h2>
                            <p>Ter informações precisas sobre você nos permite fornecer uma experiência tranquila, eficiente e personalizada. Especificamente, podemos usar as informações coletadas sobre você através da plataforma para:</p>
                             <ul className="list-disc list-inside mt-4 space-y-2 pl-4">
                                <li>Criar e gerenciar sua conta.</li>
                                <li>Fornecer os serviços de simulação e análise.</li>
                                <li>Melhorar a plataforma e nossos serviços.</li>
                                <li>Comunicar-se com você sobre sua conta ou serviços.</li>
                                <li>Garantir a segurança e a operacionalidade da nossa plataforma.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">4. Segurança de Suas Informações</h2>
                            <p>Usamos medidas de segurança administrativas, técnicas e físicas para ajudar a proteger suas informações pessoais. Embora tenhamos tomado medidas razoáveis para proteger as informações pessoais que você nos fornece, esteja ciente de que, apesar de nossos esforços, nenhuma medida de segurança é perfeita ou impenetrável, e nenhum método de transmissão de dados pode ser garantido contra qualquer interceptação ou outro tipo de uso indevido.</p>
                        </section>
                        
                         <section>
                            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">5. Direitos do Usuário</h2>
                            <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento. Você pode gerenciar as informações da sua conta diretamente no seu perfil ou entrar em contato conosco para solicitar alterações.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">6. Contato</h2>
                            <p>Se você tiver dúvidas ou comentários sobre esta Política de Privacidade, entre em contato conosco em: <a href="mailto:privacidade@besspro.com.br" className="text-blue-400 hover:underline">privacidade@besspro.com.br</a>.</p>
                        </section>
                    </motion.div>
                </motion.div>
            </div>
        </>
    );
};

export default PrivacyPolicyPage;