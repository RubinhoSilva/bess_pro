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
import { CustomCurrencyInput } from '@/components/ui/currency-input';
import { calculateHybridSystem, validateHybridRequest } from '@/lib/bessAnalysisService';
import { HybridDimensioningRequest, SistemaSolarParams } from '@/types/bess';

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
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [calculationStage, setCalculationStage] = useState('');

  const handleInputChange = (field: keyof SimulationInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const runBESSSimulation = async () => {
    // ========================================================================
    // ETAPA 1: VALIDAÇÕES
    // ========================================================================



    // Validar se tem dados solares quando solar está selecionado
    if (systemConfig.solar && (!inputs.potenciaSolar || !inputs.irradiacao)) {
      toast({
        variant: "destructive",
        title: "Dados solares incompletos",
        description: "Preencha a potência solar e irradiação.",
      });
      return;
    }

    // Validar se tem dados BESS quando BESS está selecionado
    if (systemConfig.bess && (!inputs.capacidadeBaterias || !inputs.potenciaBaterias)) {
      toast({
        variant: "destructive",
        title: "Dados BESS incompletos",
        description: "Preencha a capacidade e potência das baterias.",
      });
      return;
    }

    setIsSimulating(true);
    setCalculationProgress(0);
    setCalculationStage('Preparando dados...');

    try {
      // ========================================================================
      // ETAPA 2: CONSTRUIR REQUEST - SISTEMA SOLAR
      // ========================================================================

      setCalculationProgress(10);
      setCalculationStage('Montando parâmetros do sistema solar...');

      // Construir parâmetros do sistema solar
      // IMPORTANTE: Ajustar conforme estrutura real dos dados disponíveis
      const sistemaSolar: SistemaSolarParams = {
        lat: inputs.latitude,
        lon: inputs.longitude,
        origem_dados: 'PVGIS',
        startyear: 2020,
        endyear: 2020,
        modelo_decomposicao: 'erbs',
        modelo_transposicao: 'perez',
        mount_type: 'open_rack_glass_glass', // Valor válido conforme validação Python

        // Consumo mensal: distribuir consumo diário em 12 meses
        // Se tiver dados mensais específicos, usar aqueles
        consumo_mensal_kwh: Array(12).fill(inputs.consumoMedioDiario * 30),

        perdas: {
          sujeira: 2.0,
          sombreamento: 3.0,
          incompatibilidade: 2.0,
          fiacao: 1.5,
          outras: 1.0,
        },

        // Módulo solar - dados completos conforme modelo Python
        modulo: {
          fabricante: 'Canadian Solar',
          modelo: 'CS3W-540MS',
          potencia_nominal_w: 550,
          largura_mm: 2261,
          altura_mm: 1134,
          peso_kg: 27.5,
          vmpp: 41.4,
          impp: 13.05,
          voc_stc: 51.16,
          isc_stc: 14.55,
          eficiencia: 20.9,
          temp_coef_pmax: -0.37,
          alpha_sc: 0.00041,
          beta_oc: -0.0025,
          gamma_r: -0.0029,
          cells_in_series: 144,
          a_ref: 1.8,
          il_ref: 14.86,
          io_ref: 2.5e-12,
          rs: 0.25,
          rsh_ref: 450.0,
        },

        // Inversores - lista separada conforme modelo Python
        inversores: [
          {
            inversor: {
              fabricante: 'Generic',
              modelo: 'Standard Inverter',
              potencia_saida_ca_w: (inputs.potenciaSolar || 0) * 1000,
              potencia_fv_max_w: (inputs.potenciaSolar || 0) * 1000 * 1.2, // 20% acima da potência nominal
              numero_mppt: 2,
              eficiencia_max: 98.0, // Em percentagem (90-99.9)
              efficiency_dc_ac: 0.98, // Em decimal (0.9-0.999)
              tensao_cc_max_v: 1000,
              strings_por_mppt: 2,
              tipo_rede: 'Trifásico 380V',
            },
            orientacoes: [
              {
                nome: 'Telhado Principal',
                orientacao: 0, // Norte
                inclinacao: inputs.latitude > 0 ? inputs.latitude : -inputs.latitude,
                modulos_por_string: Math.ceil(Math.sqrt(Math.ceil((inputs.potenciaSolar || 0) * 1000 / 550))), // Estimar módulos por string
                numero_strings: 2,
              },
            ],
          },
        ],
      };

      // ========================================================================
      // ETAPA 3: CONSTRUIR REQUEST - BESS E TARIFAS
      // ========================================================================

      setCalculationProgress(20);
      setCalculationStage('Configurando BESS e tarifas...');

      const request: HybridDimensioningRequest = {
        sistema_solar: sistemaSolar,

        // Parâmetros BESS
        capacidade_kwh: inputs.capacidadeBaterias || 100,
        potencia_kw: inputs.potenciaBaterias || 50,
        tipo_bateria: (inputs.tipoBateria === 'chumbo' ? 'chumbo_acido' : inputs.tipoBateria) || 'litio',
        eficiencia_roundtrip: 0.90, // 90% (típico para lítio)
        profundidade_descarga_max: 0.90, // 90% DOD
        soc_inicial: 0.50, // 50% inicial
        soc_minimo: 0.10, // 10% mínimo
        soc_maximo: 1.00, // 100% máximo

        // Estrutura tarifária
        tarifa: {
          tipo: 'convencional', // Ajustar conforme dados do form
          tarifa_fora_ponta_kwh: inputs.tarifaEnergia,
          tarifa_ponta_kwh: inputs.tarifaEnergia * 1.5, // Assumir ponta 50% mais cara
          // Removendo campos de horário para tarifa convencional (são necessários apenas para tarifa branca)
          tarifa_demanda_ponta: inputs.custoDemanda || 0,
          tarifa_demanda_fora_ponta: (inputs.custoDemanda || 0) * 0.5,
        },

        // Perfil de consumo
        perfil_consumo: {
          tipo: inputs.perfil,
          // curva_horaria pode ser omitida (backend gera padrão)
        },

        // Estratégia de operação
        estrategia: 'arbitragem', // ou 'peak_shaving', 'auto_consumo'
        limite_demanda_kw: inputs.demandaContratada,

        // Parâmetros econômicos
        custo_kwh_bateria: 3000, // R$/kWh - ajustar conforme mercado
        custo_kw_inversor_bess: 1500, // R$/kW
        custo_instalacao_bess: 50000, // R$ - custo fixo
        taxa_desconto: inputs.taxaDesconto / 100, // Converter % para decimal
        vida_util_anos: inputs.vidaUtilProjeto,
      };

      // ========================================================================
      // ETAPA 4: VALIDAÇÃO FRONTEND
      // ========================================================================

      setCalculationProgress(30);
      setCalculationStage('Validando parâmetros...');

      const validationErrors = validateHybridRequest(request);
      if (validationErrors.length > 0) {
        toast({
          variant: "destructive",
          title: "Erros de validação",
          description: validationErrors.join(', '),
        });
        setIsSimulating(false);
        return;
      }

      // ========================================================================
      // ETAPA 5: CHAMAR BACKEND (PODE DEMORAR 1-5 MINUTOS)
      // ========================================================================

      setCalculationProgress(40);
      setCalculationStage('Enviando para servidor...');

      // Simular progresso durante o cálculo (que é demorado no backend)
      const progressInterval = setInterval(() => {
        setCalculationProgress(prev => {
          const next = prev + 2;
          if (next >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return next;
        });
      }, 3000); // Incrementa 2% a cada 3 segundos

      // Atualizar mensagens de progresso
      setTimeout(() => setCalculationStage('Calculando geração solar (PVLIB)...'), 5000);
      setTimeout(() => setCalculationStage('Simulando operação BESS (8760 horas)...'), 30000);
      setTimeout(() => setCalculationStage('Analisando cenários financeiros...'), 60000);


      // CHAMADA REAL AO BACKEND
      const response = await calculateHybridSystem(request);

      clearInterval(progressInterval);
      setCalculationProgress(100);
      setCalculationStage('Concluído!');

      // ========================================================================
      // ETAPA 6: PROCESSAR RESULTADO E PASSAR PARA DASHBOARD
      // ========================================================================


      toast({
        title: "Cálculo concluído!",
        description: `Análise híbrida completa em ${((response.metadata?.duration_ms || 0) / 1000).toFixed(1)}s`,
      });

      // Passar resultado completo para o dashboard
      onSimulationComplete({
        ...response.data,
        // Adicionar metadados úteis
        _metadata: {
          leadId: selectedLead?.id,
          leadName: selectedLead?.name,
          systemConfig,
          calculatedAt: new Date().toISOString(),
          duration_ms: response.metadata?.duration_ms || 0,
        },
      });

    } catch (error: any) {

      toast({
        variant: "destructive",
        title: "Erro no cálculo",
        description: error.message || "Erro ao calcular sistema híbrido. Tente novamente.",
      });

      setIsSimulating(false);
      setCalculationProgress(0);
      setCalculationStage('');
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

      {/* Progress UI durante simulação */}
      {isSimulating && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Calculando Sistema Híbrido
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {calculationStage}
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {calculationProgress}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${calculationProgress}%` }}
              ></div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>⏱️ Este cálculo pode levar de 1 a 5 minutos</p>
              <p>🔬 Executando simulação PVLIB com 8760 pontos horários</p>
              <p>💰 Comparando 4 cenários: sem sistema, só solar, só BESS, híbrido</p>
            </div>
          </div>
        </Card>
      )}

      {/* Botão de Simulação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mt-8"
      >
        <Button
          onClick={runBESSSimulation}
          disabled={isSimulating || !selectedLead}
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
        
        {!selectedLead && (
          <p className="text-red-500 text-sm mt-2">
            ⚠️ Selecione um lead para executar a simulação
          </p>
        )}
        
        {selectedLead && (
          <p className="text-green-600 text-sm mt-2">
            ✅ Lead selecionado: {selectedLead.name}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default BESSSimulationForm;