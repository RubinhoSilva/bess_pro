import React from 'react';
import { Sun, Zap, AreaChart, Package, Unplug } from 'lucide-react';
import GenerationChart from '../results/GenerationChart';

const DataRow = ({ label, value, unit }) => (
    <div className="flex justify-between py-3 border-b border-slate-700">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-white">{value} {unit}</span>
    </div>
);

const EquipmentCard = ({ title, icon, data }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
        <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-100">{icon} {title}</h4>
        <div className="space-y-2 text-sm">
            {Object.entries(data).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                    <span className="text-slate-400">{key}</span>
                    <span className="font-medium text-slate-200">{val}</span>
                </div>
            ))}
        </div>
    </div>
);

const PageTechnical = ({ results }) => {
    const { potenciaPico, numeroModulos, areaEstimada, geracaoEstimadaAnual, selectedModule, selectedInverters } = results;
    const numeroTotalInversores = selectedInverters.reduce((acc, inv) => acc + inv.quantity, 0);

    const moduleData = selectedModule ? {
        'Potência (Pmax)': `${selectedModule.potencia} Wp`,
        'Eficiência': `${selectedModule.eficiencia}%`,
        'Tensão (Vmp)': `${selectedModule.vmp} V`,
        'Corrente (Imp)': `${selectedModule.imp} A`,
    } : { 'Modelo': 'Não especificado' };

    return (
        <section className="proposal-page p-10">
            <h2 className="proposal-title">Dimensionamento e Análise Técnica</h2>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="proposal-subtitle">Resumo do Sistema Projetado</h3>
                    <div className="mt-4 space-y-2 text-base">
                        <DataRow label="Potência de Pico do Sistema" value={potenciaPico.toFixed(2)} unit="kWp" />
                        <DataRow label="Número de Módulos Fotovoltaicos" value={numeroModulos} unit="unidades" />
                        <DataRow label="Número Total de Inversores" value={numeroTotalInversores} unit="unidades" />
                        <DataRow label="Área Mínima Necessária" value={areaEstimada.toFixed(2)} unit="m²" />
                        <DataRow label="Geração Anual de Energia Estimada" value={geracaoEstimadaAnual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} unit="kWh/ano" />
                    </div>
                </div>
                <div>
                    <h3 className="proposal-subtitle">Equipamentos Selecionados</h3>
                    <div className="mt-4 space-y-4">
                        <EquipmentCard title={selectedModule?.nome || 'Módulo Padrão'} icon={<Package />} data={moduleData} />
                        {selectedInverters.map(inv => (
                            <EquipmentCard 
                                key={inv.id}
                                title={`${inv.quantity}x ${inv.details?.nome || 'Inversor Padrão'}`} 
                                icon={<Unplug />} 
                                data={inv.details ? {
                                    'Potência (CA)': `${inv.details.potencia_saida_ca} kW`,
                                    'Tipo de Rede': inv.details.tipo_rede,
                                    'Nº de MPPTs': inv.details.numero_mppt,
                                    'Eficiência Máx.': `${inv.details.eficiencia_max}%`,
                                } : { 'Modelo': 'Não especificado' }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-10">
                <h3 className="proposal-subtitle">Projeção de Geração Mensal</h3>
                <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <GenerationChart results={results} />
                </div>
            </div>
            <footer className="proposal-footer">
                <p>Página 3</p>
            </footer>
        </section>
    );
};

export default PageTechnical;