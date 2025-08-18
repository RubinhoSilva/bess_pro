import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Battery, Sun, Fuel, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BESSSystemConfiguration } from './BESSAnalysisTool';

interface SystemSelectorProps {
  onSelectionComplete: (config: BESSSystemConfiguration) => void;
}

const SystemSelector: React.FC<SystemSelectorProps> = ({ onSelectionComplete }) => {
  const [selectedSystems, setSelectedSystems] = useState<BESSSystemConfiguration>({
    solar: false,
    bess: false,
    diesel: false
  });

  const handleSystemToggle = (system: keyof BESSSystemConfiguration) => {
    setSelectedSystems(prev => ({
      ...prev,
      [system]: !prev[system]
    }));
  };

  const handleContinue = () => {
    if (!selectedSystems.solar && !selectedSystems.bess && !selectedSystems.diesel) {
      return; // Pelo menos um sistema deve ser selecionado
    }
    onSelectionComplete(selectedSystems);
  };

  const isSystemSelected = (system: keyof BESSSystemConfiguration) => selectedSystems[system];
  const canContinue = selectedSystems.solar || selectedSystems.bess || selectedSystems.diesel;

  const systemCards = [
    {
      key: 'solar' as keyof BESSSystemConfiguration,
      title: 'Sistema Fotovoltaico',
      description: 'Geração de energia solar com painéis fotovoltaicos',
      icon: Sun,
      color: 'from-yellow-400 to-orange-500',
      benefits: [
        'Energia renovável e limpa',
        'Redução de custos operacionais',
        'Baixa manutenção',
        'Vida útil de 25+ anos'
      ]
    },
    {
      key: 'bess' as keyof BESSSystemConfiguration,
      title: 'Sistema de Baterias (BESS)',
      description: 'Armazenamento de energia com baterias de lítio',
      icon: Battery,
      color: 'from-green-400 to-blue-500',
      benefits: [
        'Backup de energia confiável',
        'Otimização tarifária',
        'Estabilidade da rede',
        'Suporte a picos de demanda'
      ]
    },
    {
      key: 'diesel' as keyof BESSSystemConfiguration,
      title: 'Gerador Diesel',
      description: 'Geração complementar com combustível fóssil',
      icon: Fuel,
      color: 'from-gray-600 to-gray-800',
      benefits: [
        'Backup confiável',
        'Rápida resposta',
        'Tecnologia consolidada',
        'Baixo investimento inicial'
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Selecione os Sistemas de Energia
        </h2>
        <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
          Escolha uma ou mais fontes de energia para criar seu sistema híbrido personalizado.
          Você pode combinar diferentes tecnologias para máxima eficiência e confiabilidade.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {systemCards.map((system, index) => {
          const Icon = system.icon;
          const selected = isSystemSelected(system.key);

          return (
            <motion.div
              key={system.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selected 
                    ? `ring-2 ring-blue-500 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20` 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleSystemToggle(system.key)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${system.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {selected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                  <CardTitle className="text-xl">{system.title}</CardTitle>
                  <CardDescription>{system.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {system.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2 flex-shrink-0" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Configuration Preview */}
      {canContinue && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuração do Sistema Híbrido
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSystems.solar && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                <Sun className="w-4 h-4 mr-1" />
                Solar
              </span>
            )}
            {selectedSystems.bess && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                <Battery className="w-4 h-4 mr-1" />
                BESS
              </span>
            )}
            {selectedSystems.diesel && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
                <Fuel className="w-4 h-4 mr-1" />
                Diesel
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          size="lg"
          className={`px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 ${
            canContinue
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          Continuar para Simulação
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        {!canContinue && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Selecione pelo menos um sistema para continuar
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default SystemSelector;