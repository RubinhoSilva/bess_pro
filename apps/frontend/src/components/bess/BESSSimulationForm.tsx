import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, Battery, Sun, Fuel } from 'lucide-react';
import { BESSSystemConfiguration } from './BESSAnalysisTool';
import { useToast } from '@/components/ui/use-toast';
import CustomerDataForm from '../pv-design/form-sections/CustomerDataForm';
import { CustomCurrencyInput } from '@/components/ui/currency-input';

interface BESSSimulationFormProps {
  systemConfig: BESSSystemConfiguration;
  onSimulationComplete: (results: any) => void;
  onBack: () => void;
  selectedLead?: any;
  isLeadLocked?: boolean;
}

interface SimulationInputs {
  // Dados de Localização
  latitude: number;
  longitude: number;
  cidade: string;
  estado: string;

  // Dados de Consumo
  consumoMedioDiario: number; // kWh/dia
  picos: number[]; // Horários de pico (0-23h)
  perfil: 'residencial' | 'comercial' | 'industrial';

  // Sistema Solar (se selecionado)
  potenciaSolar?: number; // kWp
  irradiacao?: number; // kWh/m²/dia

  // Sistema BESS (se selecionado)
  capacidadeBaterias?: number; // kWh
  potenciaBaterias?: number; // kW
  tipoBateria?: 'litio' | 'chumbo' | 'flow';
  autonomiaDesejada?: number; // horas

  // Gerador Diesel (se selecionado)
  potenciaDiesel?: number; // kW
  consumoCombustivel?: number; // L/kWh
  custoLitro?: number; // R$/L

  // Dados Financeiros
  tarifaEnergia: number; // R$/kWh
  demandaContratada?: number; // kW
  custoDemanda?: number; // R$/kW
  inflacaoEnergia: number; // %/ano
  taxaDesconto: number; // %/ano
  vidaUtilProjeto: number; // anos
}

const BESSSimulationForm: React.FC<BESSSimulationFormProps> = ({ 
  systemConfig, 
  onSimulationComplete, 
  onBack,
  selectedLead,
  isLeadLocked = false
}) => {
  const { toast } = useToast();
  const [currentLead, setCurrentLead] = useState(selectedLead || null);
  const [inputs, setInputs] = useState<SimulationInputs>({
    latitude: -23.5505,
    longitude: -46.6333,
    cidade: 'São Paulo',
    estado: 'SP',
    consumoMedioDiario: 100,
    picos: [18, 19, 20],
    perfil: 'comercial',
    tarifaEnergia: 0.85,
    inflacaoEnergia: 4.5,
    taxaDesconto: 8.0,
    vidaUtilProjeto: 20,
    ...(systemConfig.solar && {
      potenciaSolar: 100,
      irradiacao: 5.2
    }),
    ...(systemConfig.bess && {
      capacidadeBaterias: 200,
      potenciaBaterias: 50,
      tipoBateria: 'litio' as const,
      autonomiaDesejada: 4
    }),
    ...(systemConfig.diesel && {
      potenciaDiesel: 150,
      consumoCombustivel: 0.25,
      custoLitro: 6.50
    })
  });

  const [isSimulating, setIsSimulating] = useState(false);

  const handleInputChange = (field: keyof SimulationInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleLeadChange = (field: string, value: any) => {
    if (field === 'lead' || field === 'customer') {
      setCurrentLead(value);
    }
  };

  const runBESSSimulation = async () => {
    // Validar se o lead está selecionado
    if (!currentLead) {
      toast({
        variant: "destructive",
        title: "Lead obrigatório",
        description: "Selecione um lead antes de executar a simulação.",
      });
      return;
    }

    setIsSimulating(true);
    
    try {
      // Simular processamento (em produção, seria uma chamada para API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cálculos básicos de simulação BESS
      const consumoAnual = inputs.consumoMedioDiario * 365;
      
      // Simulação de geração solar
      let geracaoSolarAnual = 0;
      if (systemConfig.solar && inputs.potenciaSolar && inputs.irradiacao) {
        geracaoSolarAnual = inputs.potenciaSolar * inputs.irradiacao * 365 * 0.8; // PR = 0.8
      }

      // Cálculo de custos operacionais
      const custoEnergiaAnual = consumoAnual * inputs.tarifaEnergia;
      const custoOperacionalDiesel = systemConfig.diesel 
        ? (inputs.potenciaDiesel || 0) * (inputs.consumoCombustivel || 0) * (inputs.custoLitro || 0) * 365
        : 0;

      // Economia com sistema híbrido
      const economiaEnergiaSolar = Math.min(geracaoSolarAnual, consumoAnual) * inputs.tarifaEnergia;
      const reducaoPicos = systemConfig.bess ? (inputs.capacidadeBaterias || 0) * inputs.tarifaEnergia * 200 : 0; // 200 ciclos/ano

      // Análise de autonomia
      const autonomiaReal = systemConfig.bess 
        ? (inputs.capacidadeBaterias || 0) / (inputs.consumoMedioDiario / 24)
        : 0;

      // ROI e payback
      const investimentoTotal = 
        (systemConfig.solar ? (inputs.potenciaSolar || 0) * 4500 : 0) +
        (systemConfig.bess ? (inputs.capacidadeBaterias || 0) * 2800 : 0) +
        (systemConfig.diesel ? (inputs.potenciaDiesel || 0) * 800 : 0);

      const economiaAnual = economiaEnergiaSolar + reducaoPicos - custoOperacionalDiesel;
      const payback = investimentoTotal / economiaAnual;
      const roi = (economiaAnual * inputs.vidaUtilProjeto - investimentoTotal) / investimentoTotal * 100;

      // Performance mensal simulada
      const performanceMensal = Array.from({ length: 12 }, (_, i) => {
        const fatorSazonalidade = 1 + 0.2 * Math.sin((i - 2) * Math.PI / 6); // Variação sazonal
        return {
          mes: i + 1,
          consumo: inputs.consumoMedioDiario * 30 * fatorSazonalidade,
          geracaoSolar: systemConfig.solar 
            ? (inputs.potenciaSolar || 0) * (inputs.irradiacao || 0) * 30 * 0.8 * fatorSazonalidade
            : 0,
          usoBateria: systemConfig.bess 
            ? Math.min((inputs.capacidadeBaterias || 0) * 25, inputs.consumoMedioDiario * 30 * 0.3)
            : 0,
          geradorDiesel: systemConfig.diesel 
            ? Math.max(0, inputs.consumoMedioDiario * 30 * fatorSazonalidade - (geracaoSolarAnual / 12))
            : 0
        };
      });

      const simulationResults = {
        inputs,
        systemConfig,
        performance: {
          consumoAnual,
          geracaoSolarAnual,
          autonomiaReal,
          eficienciaGlobal: ((geracaoSolarAnual + (inputs.capacidadeBaterias || 0) * 300) / consumoAnual) * 100
        },
        financeiro: {
          investimentoTotal,
          economiaAnual,
          payback,
          roi,
          vpl: economiaAnual * ((1 - Math.pow(1 + inputs.taxaDesconto/100, -inputs.vidaUtilProjeto)) / (inputs.taxaDesconto/100)) - investimentoTotal
        },
        detalhes: {
          performanceMensal,
          custoEnergiaAnual,
          economiaEnergiaSolar,
          reducaoPicos,
          custoOperacionalDiesel
        },
        dimensionamento: {
          solar: systemConfig.solar ? {
            potencia: inputs.potenciaSolar,
            area: (inputs.potenciaSolar || 0) / 0.22, // 220W/m²
            numeroModulos: Math.ceil((inputs.potenciaSolar || 0) / 0.55) // 550W por módulo
          } : null,
          bess: systemConfig.bess ? {
            capacidade: inputs.capacidadeBaterias,
            potencia: inputs.potenciaBaterias,
            tipo: inputs.tipoBateria,
            numeroBaterias: Math.ceil((inputs.capacidadeBaterias || 0) / 10) // 10kWh por bateria
          } : null,
          diesel: systemConfig.diesel ? {
            potencia: inputs.potenciaDiesel,
            consumoHora: (inputs.potenciaDiesel || 0) * (inputs.consumoCombustivel || 0),
            custoHora: (inputs.potenciaDiesel || 0) * (inputs.consumoCombustivel || 0) * (inputs.custoLitro || 0)
          } : null
        }
      };

      onSimulationComplete(simulationResults);
      
      toast({
        title: "Simulação Concluída!",
        description: "Análise BESS realizada com sucesso. Visualize os resultados."
      });

    } catch (error) {
      console.error('Erro na simulação:', error);
      toast({
        variant: "destructive",
        title: "Erro na Simulação",
        description: "Ocorreu um erro durante a simulação. Tente novamente."
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Button
          onClick={onBack}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar à Seleção
        </Button>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Configuração da Simulação BESS
          </h2>
          <div className="flex justify-center gap-2 mb-4">
            {systemConfig.solar && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                <Sun className="w-4 h-4 mr-1" /> Solar
              </span>
            )}
            {systemConfig.bess && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                <Battery className="w-4 h-4 mr-1" /> BESS
              </span>
            )}
            {systemConfig.diesel && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
                <Fuel className="w-4 h-4 mr-1" /> Diesel
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Campo de Lead */}
      <div className="mb-6">
        <CustomerDataForm 
          formData={{ lead: currentLead, customer: currentLead }}
          onFormChange={handleLeadChange}
          isLeadLocked={isLeadLocked}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Gerais do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={inputs.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={inputs.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consumo">Consumo Médio Diário (kWh)</Label>
                <Input
                  id="consumo"
                  type="number"
                  value={inputs.consumoMedioDiario}
                  onChange={(e) => handleInputChange('consumoMedioDiario', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="perfil">Perfil de Consumo</Label>
                <Select value={inputs.perfil} onValueChange={(value) => handleInputChange('perfil', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residencial">Residencial</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistema Solar */}
        {systemConfig.solar && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Sistema Fotovoltaico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="potenciaSolar">Potência Instalada (kWp)</Label>
                <Input
                  id="potenciaSolar"
                  type="number"
                  value={inputs.potenciaSolar}
                  onChange={(e) => handleInputChange('potenciaSolar', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="irradiacao">Irradiação Solar (kWh/m²/dia)</Label>
                <Input
                  id="irradiacao"
                  type="number"
                  step="0.1"
                  value={inputs.irradiacao}
                  onChange={(e) => handleInputChange('irradiacao', parseFloat(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sistema BESS */}
        {systemConfig.bess && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="w-5 h-5" />
                Sistema de Baterias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacidadeBaterias">Capacidade (kWh)</Label>
                  <Input
                    id="capacidadeBaterias"
                    type="number"
                    value={inputs.capacidadeBaterias}
                    onChange={(e) => handleInputChange('capacidadeBaterias', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="potenciaBaterias">Potência (kW)</Label>
                  <Input
                    id="potenciaBaterias"
                    type="number"
                    value={inputs.potenciaBaterias}
                    onChange={(e) => handleInputChange('potenciaBaterias', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipoBateria">Tipo de Bateria</Label>
                  <Select value={inputs.tipoBateria} onValueChange={(value) => handleInputChange('tipoBateria', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="litio">Lítio (Li-ion)</SelectItem>
                      <SelectItem value="chumbo">Chumbo-Ácido</SelectItem>
                      <SelectItem value="flow">Flow Battery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="autonomia">Autonomia Desejada (h)</Label>
                  <Input
                    id="autonomia"
                    type="number"
                    value={inputs.autonomiaDesejada}
                    onChange={(e) => handleInputChange('autonomiaDesejada', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gerador Diesel */}
        {systemConfig.diesel && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="w-5 h-5" />
                Gerador Diesel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="potenciaDiesel">Potência (kW)</Label>
                <Input
                  id="potenciaDiesel"
                  type="number"
                  value={inputs.potenciaDiesel}
                  onChange={(e) => handleInputChange('potenciaDiesel', parseFloat(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="consumoCombustivel">Consumo (L/kWh)</Label>
                  <Input
                    id="consumoCombustivel"
                    type="number"
                    step="0.01"
                    value={inputs.consumoCombustivel}
                    onChange={(e) => handleInputChange('consumoCombustivel', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="custoLitro">Custo Combustível (R$/L)</Label>
                  <CustomCurrencyInput
                    value={inputs.custoLitro}
                    onValueChange={(value) => handleInputChange('custoLitro', value)}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados Financeiros */}
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros Financeiros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tarifaEnergia">Tarifa de Energia (R$/kWh)</Label>
              <CustomCurrencyInput
                value={inputs.tarifaEnergia}
                onValueChange={(value) => handleInputChange('tarifaEnergia', value)}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inflacao">Inflação Energia (%/ano)</Label>
                <Input
                  id="inflacao"
                  type="number"
                  step="0.1"
                  value={inputs.inflacaoEnergia}
                  onChange={(e) => handleInputChange('inflacaoEnergia', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="taxa">Taxa de Desconto (%/ano)</Label>
                <Input
                  id="taxa"
                  type="number"
                  step="0.1"
                  value={inputs.taxaDesconto}
                  onChange={(e) => handleInputChange('taxaDesconto', parseFloat(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vidaUtil">Vida Útil do Projeto (anos)</Label>
              <Input
                id="vidaUtil"
                type="number"
                value={inputs.vidaUtilProjeto}
                onChange={(e) => handleInputChange('vidaUtilProjeto', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Simulação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mt-8"
      >
        <Button
          onClick={runBESSSimulation}
          disabled={isSimulating || !currentLead}
          size="lg"
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-10 py-6 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSimulating ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Simulando Sistema...
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6" />
              Executar Simulação BESS
            </div>
          )}
        </Button>
        
        {!currentLead && (
          <p className="text-red-500 text-sm mt-2">
            ⚠️ Selecione um lead para executar a simulação
          </p>
        )}
        
        {currentLead && (
          <p className="text-green-600 text-sm mt-2">
            ✅ Lead selecionado: {currentLead.name}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default BESSSimulationForm;