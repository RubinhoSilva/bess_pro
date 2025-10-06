import React from 'react';
import { Sun, Zap, ShieldCheck, TrendingUp, Leaf, Award, Clock, DollarSign } from 'lucide-react';

interface PageIntroductionProps {
  profile?: {
    company?: string;
  };
}

export const PageIntroduction: React.FC<PageIntroductionProps> = ({ profile }) => {
  const companyName = profile?.company || 'BessPro Energia Solar';

  return (
    <section className="proposal-page p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="mb-4">
        <div className="inline-block bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-2">
          ENERGIA SOLAR FOTOVOLTAICA
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Sua Independência Energética Começa Agora
        </h2>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border-l-4 border-emerald-600">
        <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Sun className="w-4 h-4 text-emerald-600" />
          Sumário Executivo
        </h3>
        <p className="text-xs text-gray-700 leading-relaxed mb-2">
          Investir em energia solar fotovoltaica é uma decisão econômica inteligente e sustentável.
          Ao gerar sua própria eletricidade, você se protege contra altas nas tarifas e contribui para o meio ambiente.
        </p>
        <p className="text-xs text-gray-700 leading-relaxed">
          Esta proposta apresenta uma solução completa com equipamentos de alta qualidade e suporte especializado.
        </p>
      </div>

      {/* About Company */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg p-4 mb-4 text-white">
        <h3 className="text-base font-bold mb-2 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Sobre a {companyName}
        </h3>
        <p className="text-xs leading-relaxed text-white/95 mb-3">
          Especialistas em energia solar com anos de experiência. Projetos dimensionados com precisão e
          instalações de alta qualidade com suporte contínuo.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-300">25+</p>
            <p className="text-xs text-white/90">Anos Garantia</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-300">98%</p>
            <p className="text-xs text-white/90">Eficiência</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-300">100+</p>
            <p className="text-xs text-white/90">Projetos</p>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-gray-200 pb-1">Por Que Energia Solar?</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
            <div className="flex items-start gap-2">
              <div className="bg-yellow-100 rounded-lg p-1.5">
                <DollarSign className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Economia Imediata</h4>
                <p className="text-xs text-gray-600 leading-tight">
                  Reduza até 95% da conta de energia.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
            <div className="flex items-start gap-2">
              <div className="bg-green-100 rounded-lg p-1.5">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Valorização do Imóvel</h4>
                <p className="text-xs text-gray-600 leading-tight">
                  Valorização média de 10% no mercado.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
            <div className="flex items-start gap-2">
              <div className="bg-emerald-100 rounded-lg p-1.5">
                <Leaf className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Sustentabilidade</h4>
                <p className="text-xs text-gray-600 leading-tight">
                  Energia 100% limpa e renovável.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
            <div className="flex items-start gap-2">
              <div className="bg-blue-100 rounded-lg p-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Baixa Manutenção</h4>
                <p className="text-xs text-gray-600 leading-tight">
                  Vida útil superior a 25 anos.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
            <div className="flex items-start gap-2">
              <div className="bg-orange-100 rounded-lg p-1.5">
                <Zap className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Independência Energética</h4>
                <p className="text-xs text-gray-600 leading-tight">
                  Produza sua própria energia.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
            <div className="flex items-start gap-2">
              <div className="bg-purple-100 rounded-lg p-1.5">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Retorno Garantido</h4>
                <p className="text-xs text-gray-600 leading-tight">
                  Payback entre 4-7 anos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="proposal-footer">
        <p className="text-gray-500">Página 2</p>
      </footer>
    </section>
  );
};