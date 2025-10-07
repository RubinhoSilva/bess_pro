import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface PageServicesProps {
  results: {
    totalInvestment?: number;
  };
  profile?: {
    company?: string;
  };
}

export const PageServices: React.FC<PageServicesProps> = ({ results, profile }) => {
  const totalInvestment = results.totalInvestment || 0;

  return (
    <section className="proposal-page relative bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Services Included - Enhanced */}
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-3xl shadow-2xl p-8 mb-8 border border-purple-100/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8 flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-xl shadow-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              Serviços Inclusos no Investimento
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-4 bg-white/60 rounded-2xl p-5 backdrop-blur-sm border border-white/50">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-lg shadow-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Projeto Técnico Completo</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Dimensionamento, diagramas elétricos e memorial descritivo</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 rounded-2xl p-5 backdrop-blur-sm border border-white/50">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2 rounded-lg shadow-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Equipamentos Certificados</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Módulos solares e inversores de alta qualidade com certificação INMETRO</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 rounded-2xl p-5 backdrop-blur-sm border border-white/50">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-lg shadow-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Instalação Completa</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Mão de obra especializada, estruturas de fixação e cabeamento</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 rounded-2xl p-5 backdrop-blur-sm border border-white/50">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-lg shadow-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Homologação na Concessionária</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Toda documentação e tramitação junto à distribuidora de energia</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 rounded-2xl p-5 backdrop-blur-sm border border-white/50">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-2 rounded-lg shadow-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Monitoramento Remoto</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Sistema de monitoramento via aplicativo em tempo real</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 rounded-2xl p-5 backdrop-blur-sm border border-white/50">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-2 rounded-lg shadow-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Garantias Estendidas</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Até 25 anos nos módulos e 5-10 anos nos inversores</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 rounded-2xl p-5 backdrop-blur-sm border border-white/50">
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-2 rounded-lg shadow-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Suporte Técnico</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Assistência técnica e manutenção preventiva</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 rounded-2xl p-5 backdrop-blur-sm border border-white/50">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-2 rounded-lg shadow-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Treinamento Operacional</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Orientação completa sobre uso e manutenção do sistema</p>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Footer */}
        <footer className="proposal-footer">
          <p className="text-gray-500">Página 8</p>
        </footer>
      </div>
    </section>
  );
};
