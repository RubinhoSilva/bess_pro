import React from 'react';
import { Sun, Zap, ShieldCheck, TrendingUp, Leaf, Award, Clock, DollarSign, CheckCircle } from 'lucide-react';

interface PageIntroductionProps {
  profile?: {
    company?: string;
  };
}

export const PageIntroduction: React.FC<PageIntroductionProps> = ({ profile }) => {
  const companyName = profile?.company || 'BessPro Energia Solar';

  return (
    <section className="proposal-page relative bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 bg-clip-text text-transparent leading-tight">
            Sua Independência Energética Começa Agora
          </h2>
        </div>

        {/* Executive Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full -mr-12 -mt-12 opacity-50"></div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-1.5 rounded-lg">
              <Sun className="w-4 h-4" />
            </div>
            Sumário Executivo
          </h3>
          <div className="space-y-2 text-gray-700 leading-relaxed">
            <p className="text-sm">
              Investir em energia solar fotovoltaica é uma decisão <span className="font-semibold text-emerald-600">econômica inteligente</span> e <span className="font-semibold text-teal-600">sustentável</span>. 
              Ao gerar sua própria eletricidade, você se protege contra altas nas tarifas e contribui para o meio ambiente.
            </p>
            <p className="text-sm">
              Esta proposta apresenta uma solução completa com equipamentos de alta qualidade e suporte especializado.
            </p>
          </div>
        </div>

        {/* About Company */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl shadow-xl p-4 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                <Award className="w-4 h-4" />
              </div>
              Sobre a {companyName}
            </h3>
            <p className="text-sm leading-relaxed text-white/95 mb-4">
              Especialistas em energia solar com anos de experiência. Projetos dimensionados com precisão e
              instalações de alta qualidade com suporte contínuo.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-2xl font-bold text-yellow-300 mb-1">25+</p>
                <p className="text-xs text-white/90 font-medium">Anos Garantia</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-2xl font-bold text-yellow-300 mb-1">98%</p>
                <p className="text-xs text-white/90 font-medium">Eficiência</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-2xl font-bold text-yellow-300 mb-1">100+</p>
                <p className="text-xs text-white/90 font-medium">Projetos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-1.5 rounded-lg">
              <CheckCircle className="w-4 h-4 text-gray-700" />
            </div>
            Por Que Energia Solar?
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="group bg-white rounded-lg p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-2 shadow-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Economia Imediata</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Reduza até <span className="font-semibold text-yellow-600">95% da conta</span> já no primeiro mês.
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-lg p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg p-2 shadow-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Valorização do Imóvel</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Valorização de <span className="font-semibold text-green-600">10% no mercado</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-lg p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-lg p-2 shadow-lg">
                  <Leaf className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Sustentabilidade</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Energia <span className="font-semibold text-emerald-600">100% limpa</span> e renovável.
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-lg p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-lg p-2 shadow-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Baixa Manutenção</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Vida útil de <span className="font-semibold text-blue-600">25+ anos</span> com manutenção mínima.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="proposal-footer mt-8">
          <p className="text-gray-500 text-sm">Página 2</p>
        </footer>
      </div>
    </section>
  );
};