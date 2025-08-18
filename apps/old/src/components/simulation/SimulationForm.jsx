import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Calculator, Zap } from 'lucide-react';
import { calculateFinancials } from '@/lib/calculations';
import { initialFormData } from '@/lib/constants';
import BessFormSection from '@/components/simulation/BessFormSection';
import SolarFormSection from '@/components/simulation/SolarFormSection';
import DieselFormSection from '@/components/simulation/DieselFormSection';
import TariffFormSection from '@/components/simulation/TariffFormSection';
import EconomicFormSection from './EconomicFormSection';
import ProjectManager from '@/components/pv-design/ProjectManager';

const SimulationForm = ({ onSimulationComplete, activeSystems }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialFormData);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleNumberInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSliderChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value[0] }));
  };
  
  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMonthlyConsumptionChange = (index, type, value) => {
    setFormData(prev => {
      const newConsumoMensal = [...prev.consumoMensal];
      newConsumoMensal[index] = {
        ...newConsumoMensal[index],
        [type]: parseFloat(value) || 0,
      };
      return { ...prev, consumoMensal: newConsumoMensal };
    });
  };

  const handleMonthlyIrradiationChange = (index, value) => {
    setFormData(prev => {
        const newIrradiacaoMensal = [...prev.irradiacaoMensal];
        newIrradiacaoMensal[index] = parseFloat(value) || 0;
        return { ...prev, irradiacaoMensal: newIrradiacaoMensal };
    });
  };

  const loadProject = (projectData) => {
    setFormData(projectData);
  };

  const calculateViability = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const results = calculateFinancials(formData, activeSystems);
        onSimulationComplete(results);
        toast({
          title: "Simulação Concluída! ✅",
          description: "Análise de viabilidade calculada com sucesso. Confira o dashboard!",
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Erro na Simulação",
          description: "Ocorreu um erro ao calcular a viabilidade. Verifique os parâmetros e tente novamente.",
        });
      } finally {
        setIsCalculating(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              BESS Pro: Análise de Viabilidade
            </h1>
          </div>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Insira os parâmetros para simular a viabilidade econômica do seu projeto.
          </p>
        </motion.div>
        
        <div className="space-y-8">
          <TariffFormSection formData={formData} onInputChange={handleNumberInputChange} onMonthlyConsumptionChange={handleMonthlyConsumptionChange} onSelectChange={handleInputChange} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {activeSystems.bess && <BessFormSection formData={formData} onInputChange={handleNumberInputChange} onSelectChange={handleSelectChange} />}
            {activeSystems.solar && <SolarFormSection formData={formData} onInputChange={handleNumberInputChange} onSelectChange={handleSelectChange} onMonthlyIrradiationChange={handleMonthlyIrradiationChange} />}
            {activeSystems.diesel && <DieselFormSection formData={formData} onInputChange={handleNumberInputChange} onSelectChange={handleSelectChange} />}
          </div>
          
          <EconomicFormSection formData={formData} onSliderChange={handleSliderChange} onSelectChange={(field, value) => handleSelectChange(field, parseInt(value))} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center items-center gap-4 pt-10"
          >
            <ProjectManager currentData={formData} onLoadProject={loadProject} projectType="bess" />
            <Button
              onClick={calculateViability}
              disabled={isCalculating}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-10 py-6 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              {isCalculating ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Calculando...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Calculator className="w-6 h-6" />
                  Calcular Viabilidade
                </div>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SimulationForm;