import React from 'react';
import { CheckCircle, XCircle, TrendingUp, Calendar } from 'lucide-react';

const RecommendationItem = ({ icon, title, children }) => (
  <div className="flex items-start gap-4 p-4 bg-slate-100/70 rounded-lg print:bg-slate-100">
    <div className="flex-shrink-0 mt-1">{icon}</div>
    <div>
      <h4 className="font-bold text-slate-700">{title}</h4>
      <p className="text-sm text-slate-600">{children}</p>
    </div>
  </div>
);

const Recommendations = ({ data }) => {
  const { viabilidade } = data;

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">5. Recomendações e Próximos Passos</h2>
      <div className="space-y-4">
        {viabilidade === 'Viável' ? (
          <RecommendationItem icon={<CheckCircle className="w-6 h-6 text-green-500" />} title="Aprovação Recomendada">
            O projeto demonstrou robustez e indicadores econômicos favoráveis. Recomenda-se prosseguir para as etapas de detalhamento técnico e contratação.
          </RecommendationItem>
        ) : (
          <RecommendationItem icon={<XCircle className="w-6 h-6 text-red-500" />} title="Revisão Necessária">
            O projeto não atingiu os critérios mínimos de viabilidade. É crucial revisar as premissas para identificar pontos de otimização antes de qualquer decisão.
          </RecommendationItem>
        )}
        
        <RecommendationItem icon={<TrendingUp className="w-6 h-6 text-blue-500" />} title="Análise de Sensibilidade">
          Recomenda-se realizar uma análise de sensibilidade variando os custos de investimento e as tarifas de energia para entender o impacto nos resultados.
        </RecommendationItem>

        <RecommendationItem icon={<Calendar className="w-6 h-6 text-purple-500" />} title="Próximos Passos">
          O próximo passo sugerido é a elaboração de um projeto executivo detalhado, incluindo a seleção final de fornecedores e a negociação de contratos.
        </RecommendationItem>
      </div>
    </section>
  );
};

export default Recommendations;