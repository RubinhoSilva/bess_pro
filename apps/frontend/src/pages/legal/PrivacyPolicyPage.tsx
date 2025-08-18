import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../../components/ui/button';
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
                    <p className="text-lg text-slate-400 mt-2">Última atualização: 14 de Agosto de 2025</p>
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
                            <li><strong>Dados de CRM:</strong> Informações sobre leads, clientes e oportunidades de negócio que você gerencia através da plataforma.</li>
                            <li><strong>Dados de Alertas:</strong> Lembretes e notificações que você configura para acompanhamento de leads e projetos.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">3. Uso de Suas Informações</h2>
                        <p>Ter informações precisas sobre você nos permite fornecer uma experiência tranquila, eficiente e personalizada. Especificamente, podemos usar as informações coletadas sobre você através da plataforma para:</p>
                         <ul className="list-disc list-inside mt-4 space-y-2 pl-4">
                            <li>Criar e gerenciar sua conta.</li>
                            <li>Fornecer os serviços de simulação e análise.</li>
                            <li>Processar dimensionamentos de sistemas fotovoltaicos e BESS.</li>
                            <li>Gerar relatórios e propostas personalizadas.</li>
                            <li>Gerenciar seu pipeline de vendas e CRM.</li>
                            <li>Enviar notificações e alertas configurados.</li>
                            <li>Melhorar a plataforma e nossos serviços.</li>
                            <li>Comunicar-se com você sobre sua conta ou serviços.</li>
                            <li>Garantir a segurança e a operacionalidade da nossa plataforma.</li>
                            <li>Cumprir obrigações legais e regulamentares.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">4. Compartilhamento de Informações</h2>
                        <p>Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros, exceto nas seguintes situações:</p>
                        <ul className="list-disc list-inside mt-4 space-y-2 pl-4">
                            <li><strong>Prestadores de Serviços:</strong> Podemos compartilhar informações com prestadores de serviços terceirizados que nos ajudam a operar nossa plataforma (hospedagem, processamento de pagamentos, análise de dados).</li>
                            <li><strong>Cumprimento Legal:</strong> Quando exigido por lei ou para proteger nossos direitos legais.</li>
                            <li><strong>Integração de APIs:</strong> Com sua autorização expressa, para integrar com serviços externos como Google Ads, PVGIS e outros serviços de terceiros.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">5. Segurança de Suas Informações</h2>
                        <p>Implementamos medidas de segurança técnicas, administrativas e físicas adequadas para proteger suas informações pessoais contra acesso, alteração, divulgação ou destruição não autorizados. Utilizamos:</p>
                        <ul className="list-disc list-inside mt-4 space-y-2 pl-4">
                            <li>Criptografia SSL/TLS para transmissão de dados</li>
                            <li>Autenticação JWT para controle de acesso</li>
                            <li>Backup regular de dados</li>
                            <li>Monitoramento de segurança 24/7</li>
                            <li>Controles de acesso baseados em função</li>
                        </ul>
                        <p className="mt-4">Embora tenhamos tomado medidas razoáveis para proteger suas informações, nenhuma medida de segurança é perfeita ou impenetrável.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">6. Direitos do Usuário (LGPD)</h2>
                        <p>Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:</p>
                        <ul className="list-disc list-inside mt-4 space-y-2 pl-4">
                            <li><strong>Acesso:</strong> Confirmar a existência de tratamento e acessar seus dados.</li>
                            <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados.</li>
                            <li><strong>Anonimização/Bloqueio:</strong> Solicitar anonimização ou bloqueio de dados desnecessários.</li>
                            <li><strong>Eliminação:</strong> Excluir dados tratados com seu consentimento.</li>
                            <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado e interoperável.</li>
                            <li><strong>Informação:</strong> Obter informações sobre o tratamento de seus dados.</li>
                            <li><strong>Revogação do Consentimento:</strong> Retirar seu consentimento a qualquer momento.</li>
                        </ul>
                        <p className="mt-4">Para exercer esses direitos, entre em contato conosco através dos canais indicados na seção de contato.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">7. Retenção de Dados</h2>
                        <p>Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política, exceto quando um período de retenção mais longo for exigido ou permitido por lei. Dados de projetos são mantidos enquanto sua conta estiver ativa ou conforme necessário para prestação dos serviços.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">8. Cookies e Tecnologias Similares</h2>
                        <p>Utilizamos cookies e tecnologias similares para:</p>
                        <ul className="list-disc list-inside mt-4 space-y-2 pl-4">
                            <li>Manter você logado na plataforma</li>
                            <li>Lembrar suas preferências e configurações</li>
                            <li>Analisar o uso da plataforma para melhorias</li>
                            <li>Personalizar sua experiência</li>
                        </ul>
                        <p className="mt-4">Você pode gerenciar cookies através das configurações do seu navegador.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">9. Alterações nesta Política</h2>
                        <p>Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas através de um aviso em nossa plataforma ou por e-mail. Recomendamos que você revise esta política regularmente para se manter informado sobre como protegemos suas informações.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">10. Encarregado de Dados (DPO)</h2>
                        <p>Nosso Encarregado de Proteção de Dados está disponível para esclarecer dúvidas sobre o tratamento de dados pessoais e pode ser contatado através do e-mail: <a href="mailto:dpo@besspro.com.br" className="text-blue-400 hover:underline">dpo@besspro.com.br</a>.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">11. Contato</h2>
                        <p>Se você tiver dúvidas, comentários ou solicitações sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, entre em contato conosco:</p>
                        <div className="mt-4 space-y-2">
                            <p><strong>E-mail:</strong> <a href="mailto:privacidade@besspro.com.br" className="text-blue-400 hover:underline">privacidade@besspro.com.br</a></p>
                            <p><strong>DPO:</strong> <a href="mailto:dpo@besspro.com.br" className="text-blue-400 hover:underline">dpo@besspro.com.br</a></p>
                            <p><strong>Suporte:</strong> <a href="mailto:suporte@besspro.com.br" className="text-blue-400 hover:underline">suporte@besspro.com.br</a></p>
                        </div>
                        <p className="mt-4">Você também pode registrar uma reclamação junto à Autoridade Nacional de Proteção de Dados (ANPD) se acreditar que seus direitos de proteção de dados foram violados.</p>
                    </section>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default PrivacyPolicyPage;