import React from 'react';
import { Phone, Mail, MapPin, Globe, CheckCircle2, Sun } from 'lucide-react';

interface PageConclusionProps {
  results: {
    formData?: {
      customer?: {
        name?: string;
      };
    };
  };
  profile?: {
    company?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
}

export const PageConclusion: React.FC<PageConclusionProps> = ({ results, profile }) => {
  const companyName = profile?.company || 'BessPro Energia Solar';
  const companyPhone = profile?.phone || '(XX) XXXX-XXXX';
  const companyEmail = profile?.email || 'contato@besspro.com.br';
  const companyWebsite = profile?.website || 'www.besspro.com.br';
  const companyAddress = profile?.address || 'Endereço da Empresa';
  const customerName = results.formData?.customer?.name || 'Cliente';

  return (
    <section className="proposal-page relative flex flex-col justify-between overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-blue-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="relative z-10 p-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block bg-yellow-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold mb-3">
            PRÓXIMOS PASSOS
          </div>
          <h2 className="text-lg font-bold text-white mb-3">
            Pronto para Transformar Seu Futuro Energético?
          </h2>
          <p className="text-lg text-white/90 max-w-3xl mx-auto">
            Esta proposta foi desenvolvida especialmente para {customerName}, com soluções personalizadas
            e equipamentos de alta qualidade para garantir o melhor retorno do seu investimento.
          </p>
        </div>

        {/* Benefits Summary */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-3 text-center">Por Que Escolher {companyName}?</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-yellow-400 rounded-full p-2 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Experiência Comprovada</h4>
                <p className="text-sm text-white/80">Anos de experiência em projetos fotovoltaicos residenciais e comerciais</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-yellow-400 rounded-full p-2 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Equipamentos Premium</h4>
                <p className="text-sm text-white/80">Apenas marcas reconhecidas internacionalmente com certificação INMETRO</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-yellow-400 rounded-full p-2 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Suporte Completo</h4>
                <p className="text-sm text-white/80">Desde o projeto até o pós-venda, estamos sempre disponíveis</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-yellow-400 rounded-full p-2 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Garantias Estendidas</h4>
                <p className="text-sm text-white/80">Proteção completa do seu investimento por até 25 anos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-yellow-400 rounded-xl p-6 mb-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Aceite Esta Proposta Hoje!</h3>
          <p className="text-lg text-gray-800 mb-3">
            Entre em contato conosco para esclarecer dúvidas e dar o próximo passo rumo à sua independência energética.
          </p>
          <div className="inline-block bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg">
            Proposta válida por 15 dias
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sun className="w-8 h-8 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">{companyName}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-white/80">Telefone</p>
                <p className="font-semibold">{companyPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-white/80">E-mail</p>
                <p className="font-semibold">{companyEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-white/80">Website</p>
                <p className="font-semibold">{companyWebsite}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-white/80">Endereço</p>
                <p className="font-semibold">{companyAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pb-16 px-10">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center text-white">
          <p className="text-sm mb-2">
            Esta proposta foi gerada em {new Date().toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </p>
          <p className="text-xs text-white/70">
            Todos os cálculos são baseados em dados históricos e estimativas. Resultados reais podem variar conforme condições climáticas e uso.
          </p>
          <div className="w-full h-px bg-white/20 my-4"></div>
          <p className="text-xs text-white/60 mb-4">
            Página 10 | {companyName} - Transformando luz solar em economia e sustentabilidade
          </p>
        </div>
      </footer>
    </section>
  );
};
