import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Battery, Sun, Fuel, BarChart, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';

interface SimulationFormProps {
  onSimulationComplete: (data: any) => void;
  activeSystems: {
    bess: boolean;
    solar: boolean;
    diesel: boolean;
  } | null;
}

export default function SimulationForm({ onSimulationComplete, activeSystems }: SimulationFormProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [formData, setFormData] = useState({
    // Parâmetros gerais
    demandaPico: 100, // kW
    demandaMedia: 50, // kW
    fatorCarga: 0.5,
    horasOperacao: 24,
    
    // BESS
    bessCapacidade: 200, // kWh
    bessPotencia: 100, // kW
    bessEficiencia: 90, // %
    bessCusto: 500000, // R$
    
    // Solar
    solarPotencia: 150, // kWp
    irradiacaoMedia: 5.5, // kWh/m²/dia
    solarCusto: 400000, // R$
    
    // Diesel
    dieselPotencia: 120, // kW
    consumoEspecifico: 0.3, // L/kWh
    precoCombustivel: 4.5, // R$/L
    dieselCusto: 80000, // R$
    
    // Econômicos
    tarifaEnergia: 0.65, // R$/kWh
    tarifaDemanda: 30, // R$/kW
    inflacao: 5, // %
    taxaDesconto: 10, // %
    vidaUtil: 20, // anos
  });

  const handleInputChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    try {
      // Simulação de cálculo (implementar lógica real aqui)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Resultados mockados
      const investimentoInicial = 
        (activeSystems?.bess ? formData.bessCusto : 0) + 
        (activeSystems?.solar ? formData.solarCusto : 0) +
        (activeSystems?.diesel ? formData.dieselCusto : 0);
      
      const results = {
        formData,
        activeSystems,
        resultados: {
          lcoe: 0.45, // R$/kWh
          investimentoInicial,
          payback: 8.5, // anos
          vpl: 150000, // R$
          tir: 12.5, // %
          economiaAnual: 85000, // R$
          reducaoEmissoes: 250, // tCO2/ano
        }
      };
      
      onSimulationComplete(results);
      toast.success('Simulação concluída com sucesso!');
      
    } catch (error) {
      console.error('Erro na simulação:', error);
      toast.error('Erro ao executar a simulação');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Parâmetros de Simulação
            </h1>
          </div>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Configure os parâmetros para análise de viabilidade do sistema
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Parâmetros Gerais */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart className="w-5 h-5 text-cyan-400" />
                Parâmetros Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Demanda de Pico (kW)</Label>
                  <Input 
                    type="number" 
                    value={formData.demandaPico}
                    onChange={(e) => handleInputChange('demandaPico', parseFloat(e.target.value) || 0)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Demanda Média (kW)</Label>
                  <Input 
                    type="number" 
                    value={formData.demandaMedia}
                    onChange={(e) => handleInputChange('demandaMedia', parseFloat(e.target.value) || 0)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Horas de Operação/dia</Label>
                <Input 
                  type="number" 
                  value={formData.horasOperacao}
                  onChange={(e) => handleInputChange('horasOperacao', parseFloat(e.target.value) || 0)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Parâmetros Econômicos */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart className="w-5 h-5 text-green-400" />
                Parâmetros Econômicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Tarifa Energia (R$/kWh)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={formData.tarifaEnergia}
                    onChange={(e) => handleInputChange('tarifaEnergia', parseFloat(e.target.value) || 0)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Tarifa Demanda (R$/kW)</Label>
                  <Input 
                    type="number" 
                    value={formData.tarifaDemanda}
                    onChange={(e) => handleInputChange('tarifaDemanda', parseFloat(e.target.value) || 0)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Taxa de Desconto (%)</Label>
                  <Input 
                    type="number" 
                    value={formData.taxaDesconto}
                    onChange={(e) => handleInputChange('taxaDesconto', parseFloat(e.target.value) || 0)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Vida Útil (anos)</Label>
                  <Input 
                    type="number" 
                    value={formData.vidaUtil}
                    onChange={(e) => handleInputChange('vidaUtil', parseInt(e.target.value) || 0)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parâmetros BESS */}
          {activeSystems?.bess && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Battery className="w-5 h-5 text-blue-400" />
                  Sistema BESS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Capacidade (kWh)</Label>
                    <Input 
                      type="number" 
                      value={formData.bessCapacidade}
                      onChange={(e) => handleInputChange('bessCapacidade', parseFloat(e.target.value) || 0)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Potência (kW)</Label>
                    <Input 
                      type="number" 
                      value={formData.bessPotencia}
                      onChange={(e) => handleInputChange('bessPotencia', parseFloat(e.target.value) || 0)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Custo do Sistema (R$)</Label>
                  <Input 
                    type="number" 
                    value={formData.bessCusto}
                    onChange={(e) => handleInputChange('bessCusto', parseFloat(e.target.value) || 0)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parâmetros Solar */}
          {activeSystems?.solar && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sun className="w-5 h-5 text-yellow-400" />
                  Sistema Fotovoltaico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Potência (kWp)</Label>
                    <Input 
                      type="number" 
                      value={formData.solarPotencia}
                      onChange={(e) => handleInputChange('solarPotencia', parseFloat(e.target.value) || 0)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Irradiação (kWh/m²/dia)</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={formData.irradiacaoMedia}
                      onChange={(e) => handleInputChange('irradiacaoMedia', parseFloat(e.target.value) || 0)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Custo do Sistema (R$)</Label>
                  <Input 
                    type="number" 
                    value={formData.solarCusto}
                    onChange={(e) => handleInputChange('solarCusto', parseFloat(e.target.value) || 0)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-12 py-6 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            {isCalculating ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Calculando...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <BarChart className="w-6 h-6" />
                Executar Simulação
              </div>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}