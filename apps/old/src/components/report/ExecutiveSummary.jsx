import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, TrendingUp, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const ExecutiveSummary = ({ data }) => {
  const { vpl, tir, payback, viabilidade } = data;

  const getViabilityColor = () => (viabilidade === 'Viável' ? 'text-green-600' : 'text-red-600');
  const getViabilityIcon = () => (viabilidade === 'Viável' ? <CheckCircle className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-500" />);

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">1. Resumo Executivo</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-slate-50 rounded-lg border border-slate-200 print:bg-slate-50 print:border-slate-200">
          <h3 className="font-bold text-slate-600 mb-2">Parecer Técnico</h3>
          <div className="flex items-center gap-4 mb-4">
            {getViabilityIcon()}
            <span className={`text-2xl font-bold ${getViabilityColor()}`}>
              Projeto {viabilidade}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed text-sm">
            {viabilidade === 'Viável' 
              ? `A análise técnico-econômica indica que o projeto é viável, apresentando um Valor Presente Líquido (VPL) positivo e uma Taxa Interna de Retorno (TIR) superior à taxa de desconto. O investimento é recuperado em ${payback} anos, representando uma oportunidade atrativa para otimização dos custos de energia.`
              : `Nas condições atuais, o projeto não demonstra viabilidade econômica, com um VPL negativo. Recomenda-se uma revisão dos parâmetros técnicos e financeiros para identificar oportunidades de otimização que possam tornar o investimento atrativo.`
            }
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <InfoCard icon={<DollarSign className="w-5 h-5 text-green-500" />} title="VPL (Valor Presente Líquido)" value={formatCurrency(vpl)} color="text-green-600" />
          <InfoCard icon={<TrendingUp className="w-5 h-5 text-blue-500" />} title="TIR (Taxa Interna de Retorno)" value={`${tir.toFixed(1)}%`} color="text-blue-600" />
          <InfoCard icon={<Calendar className="w-5 h-5 text-purple-500" />} title="Payback Simples" value={`${payback} anos`} color="text-purple-600" />
        </div>
      </div>
    </section>
  );
};

const InfoCard = ({ icon, title, value, color }) => (
  <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-4 border border-slate-200 print:bg-slate-50 print:border-slate-200">
    <div className="p-2 bg-slate-100 rounded-full print:bg-slate-100">{icon}</div>
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

export default ExecutiveSummary;