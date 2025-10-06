import React from 'react';
import { Sun, Zap, TrendingUp } from 'lucide-react';

interface PageCoverProps {
  results: {
    formData?: {
      projectName?: string;
      customer?: {
        name: string;
        email?: string;
        company?: string;
      };
    };
    potenciaSistema?: number;
    geracaoAnual?: number;
    economiaProjetada?: number;
  };
  profile?: {
    company?: string;
    logo_url?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
}

export const PageCover: React.FC<PageCoverProps> = ({ results, profile }) => {
  const { formData } = results;
  const companyName = profile?.company || 'BessPro Energia Solar';
  const companyLogo = profile?.logo_url;
  const companyPhone = profile?.phone || '(XX) XXXX-XXXX';
  const companyEmail = profile?.email || 'contato@besspro.com.br';
  const companyWebsite = profile?.website || 'www.besspro.com.br';
  const proposalNumber = `PROP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

  return (
    <section className="proposal-page relative flex flex-col justify-between overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-blue-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-start p-12">
        <div className="bg-white rounded-xl p-4 shadow-2xl">
          {companyLogo ? (
            <img
              src={companyLogo}
              className="h-16 w-auto object-contain"
              alt="Logo"
            />
          ) : (
            <div className="flex items-center gap-2">
              <Sun className="w-12 h-12 text-emerald-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">{companyName}</h3>
                <p className="text-xs text-gray-600">Energia Solar</p>
              </div>
            </div>
          )}
        </div>
        <div className="text-right bg-white/10 backdrop-blur-md rounded-xl p-4 text-white">
          <p className="font-bold text-sm">Proposta Nº</p>
          <p className="text-lg font-mono">{proposalNumber}</p>
          <p className="text-xs mt-2">{new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 text-center px-12 pb-12">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 shadow-2xl">
          <div className="inline-block bg-yellow-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold mb-6">
            PROPOSTA COMERCIAL
          </div>

          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Sistema de Energia Solar
            <br />
            <span className="text-yellow-300">Fotovoltaica</span>
          </h1>

          <div className="w-24 h-1 bg-yellow-400 mx-auto my-6"></div>

          <p className="text-2xl text-white/90 mb-3">Preparado para</p>
          <p className="text-4xl font-bold text-yellow-300 mb-8">
            {formData?.customer?.name || formData?.projectName || 'Cliente'}
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-white/80 mb-1">Potência do Sistema</p>
              <p className="text-2xl font-bold text-white">
                {(results.potenciaSistema || 0).toFixed(2)} kWp
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Sun className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-white/80 mb-1">Geração Anual</p>
              <p className="text-2xl font-bold text-white">
                {((results.geracaoAnual || 0) / 1000).toFixed(1)} MWh
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <TrendingUp className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-white/80 mb-1">Economia Anual</p>
              <p className="text-2xl font-bold text-white">
                {(results.economiaProjetada || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0
                })}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-12 px-12">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
          <p className="font-bold text-lg mb-2">{companyName}</p>
          <div className="flex justify-center gap-6 text-sm">
            <span>{companyPhone}</span>
            <span className="text-white/60">|</span>
            <span>{companyEmail}</span>
            <span className="text-white/60">|</span>
            <span>{companyWebsite}</span>
          </div>
          <p className="text-xs text-white/70 mt-4">
            Transformando luz solar em economia e sustentabilidade
          </p>
        </div>
      </footer>
    </section>
  );
};