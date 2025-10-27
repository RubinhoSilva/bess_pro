import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResultCard from './ResultCard';
import { Sun, Zap, AreaChart, Calculator, TrendingUp } from 'lucide-react';

interface SystemSummaryProps {
  results: {
    potenciaPico: number;
    numeroModulos: number;
    areaEstimada: number;
    geracaoEstimadaAnual: number;
    selectedInverters?: Array<{
      fabricante: string;
      modelo: string;
      potenciaNominal: number;
      quantity: number;
    }>;
    selectedModule?: {
      id: string;
      model: string;
      manufacturer: {
        name: string;
      };
      nominalPower: number;
    };
    consumoTotalAnual?: number;
    cobertura?: number;
  };
}

const SystemSummary: React.FC<SystemSummaryProps> = ({ results }) => {
  const { potenciaPico, numeroModulos, areaEstimada, geracaoEstimadaAnual, selectedInverters, selectedModule, consumoTotalAnual, cobertura } = results;
  
  // Calcular cobertura se não informada
  const coberturaCalculada = cobertura || (consumoTotalAnual && consumoTotalAnual > 0 ? (geracaoEstimadaAnual / consumoTotalAnual) * 100 : 0);

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          Resumo do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <ResultCard
          icon={
            <div className="w-7 h-7 grid grid-cols-2 grid-rows-2 gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-blue-500 w-2.5 h-2.5 rounded-sm"></div>
              ))}
            </div>
          }
          title="Nº de Módulos"
          value={numeroModulos}
          unit="un"
          delay={0}
        />
        <ResultCard
          icon={<Zap className="w-7 h-7 text-orange-500" />}
          title="Geração Anual"
          value={geracaoEstimadaAnual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          unit="kWh"
          delay={1}
        />
        <ResultCard
          icon={<TrendingUp className="w-7 h-7 text-green-500" />}
          title="Cobertura"
          value={coberturaCalculada.toFixed(1)}
          unit="%"
          delay={2}
        />
      </CardContent>
      
      {/* Seção de Equipamentos */}
      {(selectedModule || (selectedInverters && selectedInverters.length > 0)) && (
        <CardContent className="pt-0">
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Equipamentos Selecionados
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Módulo Fotovoltaico */}
              {selectedModule && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-yellow-500" />
                    Módulo Fotovoltaico
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <p><span className="font-medium">Fabricante:</span> {selectedModule?.manufacturer?.name || 'N/A'}</p>
                    <p><span className="font-medium">Modelo:</span> {selectedModule?.model || 'N/A'}</p>
                    <p><span className="font-medium">Potência:</span> {selectedModule?.nominalPower || 0}W</p>
                    <p><span className="font-medium">Quantidade:</span> {numeroModulos} unidades</p>
                  </div>
                </div>
              )}
              
              {/* Inversores */}
              {selectedInverters && selectedInverters.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    Inversores ({selectedInverters.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedInverters?.map((inverter, index) => (
                      <div key={index} className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <p><span className="font-medium">Fabricante:</span> {inverter.fabricante || 'N/A'}</p>
                        <p><span className="font-medium">Modelo:</span> {inverter.modelo || 'N/A'}</p>
                        <p><span className="font-medium">Potência:</span> {inverter.potenciaNominal || 0}W</p>
                        <p><span className="font-medium">Quantidade:</span> {inverter.quantity || 1} unidade(s)</p>
                        {index < selectedInverters.length - 1 && (
                          <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SystemSummary;