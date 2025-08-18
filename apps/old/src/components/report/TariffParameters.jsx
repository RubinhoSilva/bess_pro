import React from 'react';
import { Zap, BarChart, Percent, CalendarDays } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

const PremiseCard = ({ icon, title, items }) => (
  <div className="bg-slate-100/70 p-4 rounded-lg print:bg-slate-100">
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h4 className="font-bold text-slate-600">{title}</h4>
    </div>
    <div className="space-y-1.5 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between">
          <span className="text-slate-500">{item.label}</span>
          <span className="font-medium text-slate-700">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const TariffParameters = ({ data }) => {
  const { formData, consumoAnual } = data;

  const consumptionItems = [
    { label: 'Ponta (mês)', value: `${formatNumber(formData.consumoPonta)} kWh` },
    { label: 'Anual', value: `${formatNumber(consumoAnual)} kWh` },
    { label: 'Horas Ponta/dia', value: `${formData.horasPonta}h` },
  ];

  const tariffItems = [
    { label: 'Ponta', value: `${formatCurrency(formData.tarifaPonta)}/kWh` },
    { label: 'Fora Ponta', value: `${formatCurrency(formData.tarifaForaPonta)}/kWh` },
    { label: 'Demanda Ponta', value: `${formatCurrency(formData.demandaPonta)}/kW` },
  ];

  const financialItems = [
    { label: 'Taxa Desconto', value: `${formData.taxaDesconto}%` },
    { label: 'Inflação Energia', value: `${formData.inflacaoEnergia}%` },
  ];

  const operationalItems = [
    { label: 'Dias úteis/mês', value: formData.diasMes },
    { label: 'Horizonte', value: `${formData.vidaUtil} anos` },
  ];

  return (
    <section className="p-6 bg-slate-50 rounded-lg border border-slate-200 print:bg-slate-50 print:border-slate-200">
      <h2 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">4. Premissas do Projeto</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PremiseCard icon={<BarChart className="w-5 h-5 text-purple-500" />} title="Consumo" items={consumptionItems} />
        <PremiseCard icon={<Zap className="w-5 h-5 text-orange-500" />} title="Tarifas" items={tariffItems} />
        <PremiseCard icon={<Percent className="w-5 h-5 text-green-500" />} title="Financeiro" items={financialItems} />
        <PremiseCard icon={<CalendarDays className="w-5 h-5 text-cyan-500" />} title="Operacional" items={operationalItems} />
      </div>
    </section>
  );
};

export default TariffParameters;