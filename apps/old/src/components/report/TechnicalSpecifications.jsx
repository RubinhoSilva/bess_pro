import React from 'react';
import { Battery, Sun, Fuel } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

const SectionTitle = ({ children }) => (
  <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">{children}</h3>
);

const SpecItem = ({ label, value }) => (
  <div className="flex justify-between text-sm py-1.5 border-b border-slate-100">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium text-slate-700">{value}</span>
  </div>
);

const TechnicalSpecifications = ({ data }) => {
  const { formData } = data;

  return (
    <section className="p-6 bg-slate-50 rounded-lg border border-slate-200 print:bg-slate-50 print:border-slate-200">
      <h2 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">2. Especificações Técnicas</h2>
      <div className="space-y-6">
        <div>
          <SectionTitle><Battery className="w-5 h-5 text-blue-500" /> Sistema BESS</SectionTitle>
          <div className="space-y-1">
            <SpecItem label="Capacidade" value={`${formatNumber(formData.capacidadeBateria)} kWh`} />
            <SpecItem label="Potência" value={`${formatNumber(formData.potenciaBateria)} kW`} />
            <SpecItem label="Eficiência" value={`${formData.eficienciaBateria}%`} />
            <SpecItem label="Investimento" value={formatCurrency(formData.custoInvestimento)} />
          </div>
        </div>
        <div>
          <SectionTitle><Sun className="w-5 h-5 text-yellow-500" /> Sistema Solar</SectionTitle>
          <div className="space-y-1">
            <SpecItem label="Potência" value={`${formatNumber(formData.potenciaSolar)} kWp`} />
            <SpecItem label="Geração Anual" value={`${formatNumber(formData.potenciaSolar * formData.geracaoSolar)} kWh`} />
            <SpecItem label="Investimento" value={formatCurrency(formData.potenciaSolar * formData.custoSolar)} />
          </div>
        </div>
        <div>
          <SectionTitle><Fuel className="w-5 h-5 text-gray-500" /> Gerador Diesel</SectionTitle>
          <div className="space-y-1">
            <SpecItem label="Potência" value={`${formatNumber(formData.potenciaGerador)} kW`} />
            <SpecItem label="Consumo Espec." value={`${formData.consumoCombustivel} L/h`} />
            <SpecItem label="Investimento" value={formatCurrency(formData.custoGerador)} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnicalSpecifications;