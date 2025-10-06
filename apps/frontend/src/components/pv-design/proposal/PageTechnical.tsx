import React from 'react';
import { Sun, Zap, Package, Unplug, Gauge, Boxes, MapPin, Calendar } from 'lucide-react';

interface PageTechnicalProps {
  results: {
    potenciaSistema?: number;
    potenciaPico?: number;
    numeroModulos?: number;
    geracaoEstimadaMensal?: number[];
    geracaoAnual?: number;
    performanceRatio?: number;
    yield?: number;
    selectedModule?: {
      nome?: string;
      name?: string;
      potencia?: number;
      power?: number;
      eficiencia?: number;
      efficiency?: number;
      fabricante?: string;
      manufacturer?: string;
      vmp?: number;
      imp?: number;
    };
    selectedInverters?: Array<{
      id: string;
      quantity: number;
      details?: {
        nome?: string;
        name?: string;
        potencia_saida_ca?: number;
        power?: number;
        tipo_rede?: string;
        numero_mppt?: number;
        eficiencia_max?: number;
        efficiency?: number;
        fabricante?: string;
        manufacturer?: string;
      };
    }>;
    formData?: {
      location?: {
        address?: string;
        latitude?: number;
        longitude?: number;
      };
    };
  };
}

export const PageTechnical: React.FC<PageTechnicalProps> = ({ results }) => {
  const potencia = results.potenciaSistema || results.potenciaPico || 0;
  const numeroModulos = results.numeroModulos || 0;
  const selectedModule = results.selectedModule;
  const selectedInverters = results.selectedInverters || [];
  const geracaoAnual = results.geracaoAnual || (results.geracaoEstimadaMensal || []).reduce((acc, val) => acc + val, 0);
  const performanceRatio = results.performanceRatio || 0;
  const yieldValue = results.yield || 0;

  // Calculations
  const areaEstimada = numeroModulos * 2.7;
  const numeroTotalInversores = selectedInverters.reduce((acc, inv) => acc + inv.quantity, 0);
  const modulePower = selectedModule?.potencia || selectedModule?.power || 0;
  const moduleEfficiency = selectedModule?.eficiencia || selectedModule?.efficiency || 0;
  const moduleName = selectedModule?.nome || selectedModule?.name || 'Módulo Fotovoltaico';
  const moduleManufacturer = selectedModule?.fabricante || selectedModule?.manufacturer || '';

  return (
    <section className="proposal-page p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="mb-3">
        <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
          ANÁLISE TÉCNICA
        </div>
        <h2 className="proposal-title text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Dimensionamento do Sistema Fotovoltaico
        </h2>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-3">
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <p className="text-xs font-semibold text-gray-600">POTÊNCIA</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{potencia.toFixed(2)}</p>
          <p className="text-xs text-gray-500">kWp</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-5 h-5 text-green-600" />
            <p className="text-xs font-semibold text-gray-600">GERAÇÃO ANUAL</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {(geracaoAnual / 1000).toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">MWh/ano</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-2">
            <Boxes className="w-5 h-5 text-purple-600" />
            <p className="text-xs font-semibold text-gray-600">MÓDULOS</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{numeroModulos}</p>
          <p className="text-xs text-gray-500">unidades</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            <p className="text-xs font-semibold text-gray-600">ÁREA NECESSÁRIA</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{areaEstimada.toFixed(0)}</p>
          <p className="text-xs text-gray-500">m²</p>
        </div>
      </div>

      {/* System Overview */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-3">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-blue-600" />
          Especificações do Sistema
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Potência Instalada</span>
            <span className="font-bold text-gray-900">{potencia.toFixed(2)} kWp</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Módulos Fotovoltaicos</span>
            <span className="font-bold text-gray-900">{numeroModulos} unidades</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Inversores</span>
            <span className="font-bold text-gray-900">{numeroTotalInversores} unidades</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Área de Instalação</span>
            <span className="font-bold text-gray-900">{areaEstimada.toFixed(1)} m²</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Geração Anual Estimada</span>
            <span className="font-bold text-gray-900">{geracaoAnual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Geração Média Diária</span>
            <span className="font-bold text-gray-900">{(geracaoAnual / 365).toFixed(1)} kWh/dia</span>
          </div>
          {performanceRatio > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Performance Ratio (PR)</span>
              <span className="font-bold text-green-600">{(performanceRatio * 100).toFixed(1)}%</span>
            </div>
          )}
          {yieldValue > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Yield Específico</span>
              <span className="font-bold text-gray-900">{yieldValue.toFixed(0)} kWh/kWp/ano</span>
            </div>
          )}
        </div>
      </div>

      {/* Equipment */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* Solar Module */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-6 h-6" />
            <h3 className="text-lg font-bold">Módulo Fotovoltaico</h3>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-3">
            <p className="font-bold text-lg mb-1">{moduleName}</p>
            {moduleManufacturer && (
              <p className="text-sm text-white/80">{moduleManufacturer}</p>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/80">Potência Nominal</span>
              <span className="font-bold">{modulePower} Wp</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/80">Eficiência</span>
              <span className="font-bold">{moduleEfficiency}%</span>
            </div>
            {selectedModule?.vmp && (
              <div className="flex justify-between">
                <span className="text-white/80">Tensão (Vmp)</span>
                <span className="font-bold">{selectedModule.vmp} V</span>
              </div>
            )}
            {selectedModule?.imp && (
              <div className="flex justify-between">
                <span className="text-white/80">Corrente (Imp)</span>
                <span className="font-bold">{selectedModule.imp} A</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-white/20">
              <span className="text-white/80">Quantidade</span>
              <span className="font-bold text-yellow-300">{numeroModulos} unidades</span>
            </div>
          </div>
        </div>

        {/* Inverters */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Unplug className="w-6 h-6" />
            <h3 className="text-lg font-bold">Inversor{numeroTotalInversores > 1 ? 'es' : ''}</h3>
          </div>
          <div className="space-y-3">
            {selectedInverters.map((inv, index) => {
              const invName = inv.details?.nome || inv.details?.name || 'Inversor';
              const invPower = inv.details?.potencia_saida_ca || inv.details?.power || 0;
              const invEfficiency = inv.details?.eficiencia_max || inv.details?.efficiency || 0;
              const invMPPT = inv.details?.numero_mppt || 0;
              const invManufacturer = inv.details?.fabricante || inv.details?.manufacturer || '';

              return (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="font-bold mb-1">{invName}</p>
                  {invManufacturer && (
                    <p className="text-sm text-white/80 mb-2">{invManufacturer}</p>
                  )}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/80">Potência</span>
                      <span className="font-semibold">{invPower} kW</span>
                    </div>
                    {invEfficiency > 0 && (
                      <div className="flex justify-between">
                        <span className="text-white/80">Eficiência</span>
                        <span className="font-semibold">{invEfficiency}%</span>
                      </div>
                    )}
                    {invMPPT > 0 && (
                      <div className="flex justify-between">
                        <span className="text-white/80">MPPTs</span>
                        <span className="font-semibold">{invMPPT}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-white/20">
                      <span className="text-white/80">Quantidade</span>
                      <span className="font-bold text-yellow-300">{inv.quantity} unidade{inv.quantity > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Installation Details */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Informações de Instalação
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Garantias</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Módulos: 25 anos de desempenho (mín. 80%)</li>
              <li>• Inversores: 5-10 anos (extensível)</li>
              <li>• Instalação: 5 anos</li>
              <li>• Estruturas: 10 anos</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Normas e Certificações</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• IEC 61215 - Módulos Fotovoltaicos</li>
              <li>• IEC 61730 - Segurança de Módulos</li>
              <li>• ABNT NBR 16690 - Instalações Elétricas</li>
              <li>• INMETRO - Equipamentos Certificados</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="proposal-footer">
        <p className="text-gray-500">Página 3</p>
      </footer>
    </section>
  );
};
