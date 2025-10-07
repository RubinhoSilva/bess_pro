import React from 'react';
import { Sun, Zap, Package, Unplug, Gauge, Boxes, MapPin, Award, TrendingUp, BarChart3 } from 'lucide-react';

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
    <section className="proposal-page relative bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 bg-clip-text text-transparent leading-tight">
            Dimensionamento do Sistema Fotovoltaico
          </h2>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">POTÊNCIA</p>
                <p className="text-2xl font-bold text-gray-900">{potencia.toFixed(2)}</p>
                <p className="text-sm text-gray-500 font-medium">kWp</p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">GERAÇÃO ANUAL</p>
                <p className="text-2xl font-bold text-gray-900">{(geracaoAnual / 1000).toFixed(1)}</p>
                <p className="text-sm text-gray-500 font-medium">MWh/ano</p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">MÓDULOS</p>
                <p className="text-2xl font-bold text-gray-900">{numeroModulos}</p>
                <p className="text-sm text-gray-500 font-medium">unidades</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              Especificações do Sistema
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Potência Instalada
                </span>
                <span className="font-bold text-lg text-gray-900">{potencia.toFixed(2)} kWp</span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-purple-500" />
                  Módulos Fotovoltaicos
                </span>
                <span className="font-bold text-lg text-gray-900">{numeroModulos} unidades</span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium flex items-center gap-2">
                  <Unplug className="w-4 h-4 text-emerald-500" />
                  Inversores
                </span>
                <span className="font-bold text-lg text-gray-900">{numeroTotalInversores} unidades</span>
              </div>

              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium flex items-center gap-2">
                  <Sun className="w-4 h-4 text-green-500" />
                  Geração Anual Estimada
                </span>
                <span className="font-bold text-lg text-gray-900">{geracaoAnual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh</span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Geração Média Diária
                </span>
                <span className="font-bold text-lg text-gray-900">{(geracaoAnual / 365).toFixed(1)} kWh/dia</span>
              </div>
              {performanceRatio > 0 && (
                <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    Performance Ratio (PR)
                  </span>
                  <span className="font-bold text-lg text-green-600">{(performanceRatio * 100).toFixed(1)}%</span>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Equipment Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Solar Module */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold">Módulo Fotovoltaico</h3>
              </div>
              

              
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-white/10 backdrop-blur-sm rounded-xl">
                  <span className="text-white/90 text-sm font-medium">Potência Nominal</span>
                  <span className="font-bold text-base">{modulePower} Wp</span>
                </div>

                {selectedModule?.vmp && (
                  <div className="flex justify-between items-center py-2 px-3 bg-white/10 backdrop-blur-sm rounded-xl">
                    <span className="text-white/90 text-sm font-medium">Tensão (Vmp)</span>
                    <span className="font-bold text-base">{selectedModule.vmp} V</span>
                  </div>
                )}
                {selectedModule?.imp && (
                  <div className="flex justify-between items-center py-2 px-3 bg-white/10 backdrop-blur-sm rounded-xl">
                    <span className="text-white/90 text-sm font-medium">Corrente (Imp)</span>
                    <span className="font-bold text-base">{selectedModule.imp} A</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 px-3 bg-yellow-400/20 backdrop-blur-sm rounded-xl border border-yellow-400/30">
                  <span className="text-white/90 text-sm font-medium">Quantidade</span>
                  <span className="font-bold text-lg text-yellow-300">{numeroModulos} unidades</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inverters */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <Unplug className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold">Inversor{numeroTotalInversores > 1 ? 'es' : ''}</h3>
              </div>
              
              <div className="space-y-4">
                {selectedInverters.map((inv, index) => {
                  const invName = inv.details?.nome || inv.details?.name || 'Inversor';
                  const invPower = inv.details?.potencia_saida_ca || inv.details?.power || 0;
                  const invEfficiency = inv.details?.eficiencia_max || inv.details?.efficiency || 0;
                  const invMPPT = inv.details?.numero_mppt || 0;
                  const invManufacturer = inv.details?.fabricante || inv.details?.manufacturer || '';

                  return (
                    <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                      <p className="font-bold text-lg mb-2">{invName}</p>
                      {invManufacturer && (
                        <p className="text-base text-white/90 mb-4">{invManufacturer}</p>
                      )}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/90 font-medium">Potência</span>
                          <span className="font-bold text-lg">{invPower} kW</span>
                        </div>
                        {invEfficiency > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-white/90 font-medium">Eficiência</span>
                            <span className="font-bold text-lg">{invEfficiency}%</span>
                          </div>
                        )}
                        {invMPPT > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-white/90 font-medium">MPPTs</span>
                            <span className="font-bold text-lg">{invMPPT}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-3 border-t border-white/20">
                          <span className="text-white/90 font-medium">Quantidade</span>
                          <span className="font-bold text-xl text-yellow-300">{inv.quantity} unidade{inv.quantity > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>



        {/* Footer */}
        <footer className="proposal-footer mt-8">
          <p className="text-gray-500 text-sm">Página 3</p>
        </footer>
      </div>
    </section>
  );
};
