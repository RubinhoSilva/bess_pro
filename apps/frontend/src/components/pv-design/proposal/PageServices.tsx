import React from 'react';
import { CheckCircle2, CreditCard, Banknote, Calendar, Wrench, ShieldCheck } from 'lucide-react';

interface PageServicesProps {
  results: {
    totalInvestment?: number;
  };
  profile?: {
    company?: string;
  };
}

export const PageServices: React.FC<PageServicesProps> = ({ results, profile }) => {
  const companyName = profile?.company || 'BessPro Energia Solar';
  const totalInvestment = results.totalInvestment || 0;

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    });

  // Calculate installment options
  const avista = totalInvestment * 0.95; // 5% discount
  const cartao12x = totalInvestment / 12;
  const financiamento60x = (totalInvestment * 1.3) / 60; // ~30% interest over 5 years

  return (
    <section className="proposal-page p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="mb-3">
        <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
          SERVIÇOS E CONDIÇÕES
        </div>
        <h2 className="proposal-title text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          O Que Está Incluído na Proposta
        </h2>
      </div>

      {/* Services Included */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-3">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Serviços Inclusos no Investimento</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Projeto Técnico Completo</h4>
              <p className="text-sm text-gray-600">Dimensionamento, diagramas elétricos e memorial descritivo</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Equipamentos Certificados</h4>
              <p className="text-sm text-gray-600">Módulos solares e inversores de alta qualidade com certificação INMETRO</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Instalação Completa</h4>
              <p className="text-sm text-gray-600">Mão de obra especializada, estruturas de fixação e cabeamento</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Homologação na Concessionária</h4>
              <p className="text-sm text-gray-600">Toda documentação e tramitação junto à distribuidora de energia</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Monitoramento Remoto</h4>
              <p className="text-sm text-gray-600">Sistema de monitoramento via aplicativo em tempo real</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Garantias Estendidas</h4>
              <p className="text-sm text-gray-600">Até 25 anos nos módulos e 5-10 anos nos inversores</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Suporte Técnico</h4>
              <p className="text-sm text-gray-600">Assistência técnica e manutenção preventiva</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Treinamento Operacional</h4>
              <p className="text-sm text-gray-600">Orientação completa sobre uso e manutenção do sistema</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Options */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Formas de Pagamento</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* À Vista */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg p-4 text-white relative overflow-hidden">
            <div className="absolute top-2 right-2 bg-yellow-400 text-green-900 px-3 py-1 rounded-full text-xs font-bold">
              5% OFF
            </div>
            <Banknote className="w-8 h-8 mb-3" />
            <h4 className="text-lg font-bold mb-2">À Vista</h4>
            <p className="text-xl font-bold text-yellow-300 mb-2">{formatCurrency(avista)}</p>
            <p className="text-sm text-white/90">Pagamento único com desconto especial</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-white/80">Economia de {formatCurrency(totalInvestment - avista)}</p>
            </div>
          </div>

          {/* Cartão/Boleto */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
            <CreditCard className="w-8 h-8 mb-3" />
            <h4 className="text-lg font-bold mb-2">Cartão/Boleto</h4>
            <p className="text-xl font-bold text-yellow-300 mb-2">12x</p>
            <p className="text-xl font-semibold mb-2">{formatCurrency(cartao12x)}</p>
            <p className="text-sm text-white/90">Parcelamento sem juros no cartão de crédito</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-white/80">Total: {formatCurrency(totalInvestment)}</p>
            </div>
          </div>

          {/* Financiamento */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-4 text-white">
            <Calendar className="w-8 h-8 mb-3" />
            <h4 className="text-lg font-bold mb-2">Financiamento</h4>
            <p className="text-xl font-bold text-yellow-300 mb-2">60x</p>
            <p className="text-xl font-semibold mb-2">{formatCurrency(financiamento60x)}</p>
            <p className="text-sm text-white/90">Financiamento bancário em até 5 anos</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-white/80">Sujeito à aprovação de crédito</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-3">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Cronograma de Execução
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">1</div>
              <div className="w-0.5 h-full bg-purple-200"></div>
            </div>
            <div className="flex-1 pb-8">
              <h4 className="font-semibold text-gray-900">Aprovação e Assinatura</h4>
              <p className="text-sm text-gray-600">Análise técnica final e assinatura do contrato</p>
              <span className="text-xs text-purple-600 font-semibold">2-3 dias</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">2</div>
              <div className="w-0.5 h-full bg-purple-200"></div>
            </div>
            <div className="flex-1 pb-8">
              <h4 className="font-semibold text-gray-900">Projeto Executivo e Homologação</h4>
              <p className="text-sm text-gray-600">Elaboração do projeto e envio para concessionária</p>
              <span className="text-xs text-purple-600 font-semibold">15-30 dias</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">3</div>
              <div className="w-0.5 h-full bg-purple-200"></div>
            </div>
            <div className="flex-1 pb-8">
              <h4 className="font-semibold text-gray-900">Instalação do Sistema</h4>
              <p className="text-sm text-gray-600">Montagem das estruturas, módulos e inversores</p>
              <span className="text-xs text-purple-600 font-semibold">3-7 dias</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">✓</div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Vistoria e Ativação</h4>
              <p className="text-sm text-gray-600">Vistoria da concessionária e ativação do sistema</p>
              <span className="text-xs text-green-600 font-semibold">5-15 dias após instalação</span>
            </div>
          </div>
        </div>
        <div className="mt-6 bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-700">
            <strong>Prazo Total Estimado:</strong> 30 a 60 dias corridos a partir da assinatura do contrato
          </p>
        </div>
      </div>

      {/* Warranties */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Garantias
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between pb-2 border-b border-gray-100">
              <span className="text-gray-600">Módulos Fotovoltaicos</span>
              <span className="font-bold text-gray-900">25 anos</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-100">
              <span className="text-gray-600">Inversores</span>
              <span className="font-bold text-gray-900">5-10 anos</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-100">
              <span className="text-gray-600">Instalação</span>
              <span className="font-bold text-gray-900">5 anos</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-100">
              <span className="text-gray-600">Estruturas de Fixação</span>
              <span className="font-bold text-gray-900">10 anos</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            Manutenção
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Limpeza semestral dos módulos recomendada</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Inspeção visual anual das conexões</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Monitoramento remoto contínuo de performance</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">Suporte técnico disponível via telefone/email</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="proposal-footer">
        <p className="text-gray-500">Página 7</p>
      </footer>
    </section>
  );
};
