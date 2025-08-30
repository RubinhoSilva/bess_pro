import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Settings, Info, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSolarModules, useInverters } from '@/hooks/equipment-hooks';
import { AddSolarModuleModal } from '../modals/AddSolarModuleModal';
import { AddInverterModal } from '../modals/AddInverterModal';

interface SystemParametersFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

// Dados de módulos fotovoltaicos comuns
const SOLAR_MODULES = [
  { id: 'jinko-550', name: 'Jinko Solar 550W', power: 550, efficiency: 21.2, voltage: 41.8, current: 13.16 },
  { id: 'canadian-540', name: 'Canadian Solar 540W', power: 540, efficiency: 20.9, voltage: 41.4, current: 13.04 },
  { id: 'trina-545', name: 'Trina Solar 545W', power: 545, efficiency: 21.0, voltage: 41.6, current: 13.10 },
  { id: 'risen-550', name: 'Risen Energy 550W', power: 550, efficiency: 21.3, voltage: 41.7, current: 13.19 },
  { id: 'ja-550', name: 'JA Solar 550W', power: 550, efficiency: 21.1, voltage: 41.9, current: 13.13 },
  { id: 'longi-545', name: 'LONGi Solar 545W', power: 545, efficiency: 21.0, voltage: 41.5, current: 13.13 },
  { id: 'custom', name: 'Personalizado', power: 0, efficiency: 0, voltage: 0, current: 0 },
];

// Inversores comuns
const INVERTERS = [
  { id: 'fronius-8k', name: 'Fronius Primo 8.2kW', power: 8200, efficiency: 96.8, mpptChannels: 2 },
  { id: 'sma-8k', name: 'SMA Sunny Boy 8.0kW', power: 8000, efficiency: 97.1, mpptChannels: 2 },
  { id: 'abb-8k', name: 'ABB UNO-DM-8.0kW', power: 8000, efficiency: 96.5, mpptChannels: 2 },
  { id: 'growatt-10k', name: 'Growatt MIN 10000TL-X', power: 10000, efficiency: 98.4, mpptChannels: 2 },
  { id: 'huawei-10k', name: 'Huawei SUN2000-10KTL-M1', power: 10000, efficiency: 98.6, mpptChannels: 2 },
  { id: 'custom-inv', name: 'Personalizado', power: 0, efficiency: 0, mpptChannels: 1 },
];

const SystemParametersForm: React.FC<SystemParametersFormProps> = ({ formData, onFormChange }) => {
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showInverterModal, setShowInverterModal] = useState(false);
  
  // Fetch equipment data from API
  const { data: solarModules = { modules: [], total: 0 }, refetch: refetchModules } = useSolarModules({ pageSize: 100 });
  const { data: inverters = { inverters: [], total: 0 }, refetch: refetchInverters } = useInverters({ pageSize: 100 });

  const handleModuleChange = (moduleId: string) => {
    if (moduleId === 'custom') {
      // Reset to allow custom input
      onFormChange('moduloSelecionado', moduleId);
      onFormChange('selectedModuleId', moduleId);
      onFormChange('potenciaModulo', 0);
      onFormChange('eficienciaModulo', 0);
      onFormChange('tensaoModulo', 0);
      onFormChange('correnteModulo', 0);
      return;
    }

    // First check hardcoded modules for backward compatibility
    const hardcodedModule = SOLAR_MODULES.find(m => m.id === moduleId);
    if (hardcodedModule) {
      onFormChange('moduloSelecionado', moduleId);
      onFormChange('selectedModuleId', moduleId);
      onFormChange('potenciaModulo', hardcodedModule.power);
      onFormChange('eficienciaModulo', hardcodedModule.efficiency);
      onFormChange('tensaoModulo', hardcodedModule.voltage);
      onFormChange('correnteModulo', hardcodedModule.current);
      return;
    }

    // Then check API modules
    const selectedModule = solarModules.modules?.find((m: any) => m.id === moduleId);
    if (selectedModule) {
      onFormChange('moduloSelecionado', moduleId);
      onFormChange('selectedModuleId', moduleId);
      onFormChange('potenciaModulo', selectedModule.potenciaNominal);
      onFormChange('eficienciaModulo', selectedModule.eficiencia || 0);
      onFormChange('tensaoModulo', selectedModule.vmpp || 0);
      onFormChange('correnteModulo', selectedModule.impp || 0);
    }
  };

  const handleInverterChange = (inverterId: string) => {
    if (inverterId === 'custom-inv') {
      // Reset to allow custom input
      onFormChange('inversorSelecionado', inverterId);
      onFormChange('potenciaInversor', 0);
      onFormChange('eficienciaInversor', 0);
      onFormChange('canaisMppt', 1);
      
      // Update inverters array as well
      onFormChange('inverters', [{
        id: crypto.randomUUID(),
        selectedInverterId: inverterId,
        quantity: 1
      }]);
      return;
    }

    // First check hardcoded inverters for backward compatibility
    const hardcodedInverter = INVERTERS.find(i => i.id === inverterId);
    if (hardcodedInverter) {
      onFormChange('inversorSelecionado', inverterId);
      onFormChange('potenciaInversor', hardcodedInverter.power);
      onFormChange('eficienciaInversor', hardcodedInverter.efficiency);
      onFormChange('canaisMppt', hardcodedInverter.mpptChannels);
      onFormChange('totalInverterPower', hardcodedInverter.power);
      
      // Update inverters array as well
      onFormChange('inverters', [{
        id: crypto.randomUUID(),
        selectedInverterId: inverterId,
        quantity: 1
      }]);
      return;
    }

    // Then check API inverters
    const selectedInverter = inverters.inverters?.find((i: any) => i.id === inverterId);
    if (selectedInverter) {
      onFormChange('inversorSelecionado', inverterId);
      onFormChange('potenciaInversor', selectedInverter.potenciaSaidaCA);
      onFormChange('eficienciaInversor', selectedInverter.eficienciaMax || 0);
      onFormChange('canaisMppt', selectedInverter.numeroMppt || 2);
      onFormChange('totalInverterPower', selectedInverter.potenciaSaidaCA);
      
      // Update inverters array as well
      onFormChange('inverters', [{
        id: crypto.randomUUID(),
        selectedInverterId: inverterId,
        quantity: 1
      }]);
    }
  };

  const handleModuleAdded = () => {
    refetchModules();
  };

  const handleInverterAdded = () => {
    refetchInverters();
  };

  const handleModuleSelected = (moduleId: string) => {
    // Wait for refetch to complete, then select the module
    refetchModules().then(() => {
      handleModuleChange(moduleId);
    });
  };

  const handleInverterSelected = (inverterId: string) => {
    // Wait for refetch to complete, then select the inverter
    refetchInverters().then(() => {
      handleInverterChange(inverterId);
    });
  };

  return (
    <TooltipProvider>
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Settings className="w-5 h-5 text-purple-500" /> 
            Parâmetros do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Módulos Fotovoltaicos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Módulos Fotovoltaicos</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Modelo do Módulo</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModuleModal(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Módulo
                </Button>
              </div>
              <Select 
                onValueChange={handleModuleChange} 
                value={formData.moduloSelecionado || formData.selectedModuleId || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o módulo fotovoltaico" />
                </SelectTrigger>
                <SelectContent>
                  {/* Hardcoded modules for backward compatibility */}
                  {SOLAR_MODULES.map(module => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.name} {module.power > 0 && `- ${module.power}W`}
                    </SelectItem>
                  ))}
                  
                  {/* API modules */}
                  {solarModules.modules?.map((module: any) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.fabricante} {module.modelo} - {module.potenciaNominal}W
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="potenciaModulo">Potência do Módulo (W)</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Potência nominal do módulo em Watts</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="potenciaModulo"
                  type="number"
                  value={formData.potenciaModulo || ''}
                  onChange={(e) => onFormChange('potenciaModulo', parseFloat(e.target.value) || 0)}
                  placeholder="550"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eficienciaModulo">Eficiência (%)</Label>
                <Input
                  id="eficienciaModulo"
                  type="number"
                  step="0.1"
                  value={formData.eficienciaModulo || ''}
                  onChange={(e) => onFormChange('eficienciaModulo', parseFloat(e.target.value) || 0)}
                  placeholder="21.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tensaoModulo">Tensão MPP (V)</Label>
                <Input
                  id="tensaoModulo"
                  type="number"
                  step="0.1"
                  value={formData.tensaoModulo || ''}
                  onChange={(e) => onFormChange('tensaoModulo', parseFloat(e.target.value) || 0)}
                  placeholder="41.8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="correnteModulo">Corrente MPP (A)</Label>
                <Input
                  id="correnteModulo"
                  type="number"
                  step="0.1"
                  value={formData.correnteModulo || ''}
                  onChange={(e) => onFormChange('correnteModulo', parseFloat(e.target.value) || 0)}
                  placeholder="13.16"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroModulos">Número de Módulos</Label>
              <Input
                id="numeroModulos"
                type="number"
                value={formData.numeroModulos || ''}
                onChange={(e) => onFormChange('numeroModulos', parseInt(e.target.value) || 0)}
                placeholder="Deixe vazio para dimensionamento automático"
              />
              <p className="text-xs text-gray-500">
                Se não especificado, será calculado automaticamente baseado no consumo
              </p>
            </div>

            {/* Dimensionamento Percentual */}
            <div className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="dimensionamentoPercentual" className="text-sm font-semibold text-green-800">
                    Dimensionamento Percentual
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-green-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Ajuste o tamanho do sistema como percentual do dimensionamento base. 
                          Use valores menores que 100% para sistemas econômicos ou maiores que 100% para superdimensionamento.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${
                    (formData.dimensionamentoPercentual || 100) < 70 ? 'text-orange-600' :
                    (formData.dimensionamentoPercentual || 100) > 150 ? 'text-purple-600' : 'text-green-600'
                  }`}>
                    {formData.dimensionamentoPercentual || 100}%
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    (formData.dimensionamentoPercentual || 100) < 70 ? 'bg-orange-100 text-orange-600' :
                    (formData.dimensionamentoPercentual || 100) > 150 ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {(formData.dimensionamentoPercentual || 100) < 70 ? 'Subdimensionado' :
                     (formData.dimensionamentoPercentual || 100) > 150 ? 'Superdimensionado' : 'Padrão'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Slider
                  id="dimensionamentoPercentual"
                  min={30}
                  max={300}
                  step={5}
                  value={[formData.dimensionamentoPercentual || 100]}
                  onValueChange={(value) => onFormChange('dimensionamentoPercentual', value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>30% (Mínimo)</span>
                  <span>100% (Padrão)</span>
                  <span>300% (Máximo)</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-orange-100 rounded">
                  <div className="font-medium text-orange-700">30-69%</div>
                  <div className="text-orange-600">Econômico</div>
                </div>
                <div className="text-center p-2 bg-green-100 rounded">
                  <div className="font-medium text-green-700">70-149%</div>
                  <div className="text-green-600">Padrão</div>
                </div>
                <div className="text-center p-2 bg-purple-100 rounded">
                  <div className="font-medium text-purple-700">150-300%</div>
                  <div className="text-purple-600">Superdimensionado</div>
                </div>
              </div>

              {formData.dimensionamentoPercentual && formData.dimensionamentoPercentual !== 100 && (
                <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                  <p className="text-xs text-gray-600">
                    💡 <strong>Impacto:</strong> {' '}
                    {formData.dimensionamentoPercentual < 100 ? 
                      `Sistema ${formData.dimensionamentoPercentual}% do tamanho padrão. Menor investimento, mas pode não cobrir todo o consumo.` :
                      `Sistema ${formData.dimensionamentoPercentual}% do tamanho padrão. Maior geração, possível excesso de energia.`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Inversores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Inversor</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Modelo do Inversor</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInverterModal(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Inversor
                </Button>
              </div>
              <Select 
                onValueChange={handleInverterChange} 
                value={formData.inversorSelecionado || (formData.inverters && formData.inverters.length > 0 ? formData.inverters[0].selectedInverterId : '') || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o inversor" />
                </SelectTrigger>
                <SelectContent>
                  {/* Hardcoded inverters for backward compatibility */}
                  {INVERTERS.map(inverter => (
                    <SelectItem key={inverter.id} value={inverter.id}>
                      {inverter.name} {inverter.power > 0 && `- ${inverter.power/1000}kW`}
                    </SelectItem>
                  ))}
                  
                  {/* API inverters */}
                  {inverters.inverters?.map((inverter: any) => (
                    <SelectItem key={inverter.id} value={inverter.id}>
                      {inverter.fabricante} {inverter.modelo} - {(inverter.potenciaSaidaCA/1000).toFixed(1)}kW
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="potenciaInversor">Potência do Inversor (W)</Label>
                <Input
                  id="potenciaInversor"
                  type="number"
                  value={formData.potenciaInversor || ''}
                  onChange={(e) => onFormChange('potenciaInversor', parseFloat(e.target.value) || 0)}
                  placeholder="8200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eficienciaInversor">Eficiência (%)</Label>
                <Input
                  id="eficienciaInversor"
                  type="number"
                  step="0.1"
                  value={formData.eficienciaInversor || ''}
                  onChange={(e) => onFormChange('eficienciaInversor', parseFloat(e.target.value) || 0)}
                  placeholder="96.8"
                />
              </div>
            </div>
          </div>

          {/* Parâmetros Gerais do Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Parâmetros Gerais</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Eficiência do Sistema: {formData.eficienciaSistema || 85}%</Label>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Inclui perdas por sombreamento, cabeamento, sujeira, etc.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <Slider
                value={[formData.eficienciaSistema || 85]}
                onValueChange={(values) => onFormChange('eficienciaSistema', values[0])}
                max={95}
                min={70}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>70%</span>
                <span>95%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vidaUtil">Vida Útil (anos)</Label>
                <Input
                  id="vidaUtil"
                  type="number"
                  value={formData.vidaUtil || 25}
                  onChange={(e) => onFormChange('vidaUtil', parseInt(e.target.value) || 25)}
                  placeholder="25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="degradacaoAnual">Degradação Anual (%)</Label>
                <Input
                  id="degradacaoAnual"
                  type="number"
                  step="0.1"
                  value={formData.degradacaoAnual || 0.5}
                  onChange={(e) => onFormChange('degradacaoAnual', parseFloat(e.target.value) || 0.5)}
                  placeholder="0.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orientacao">Orientação (graus)</Label>
                <Input
                  id="orientacao"
                  type="number"
                  value={formData.orientacao || 180}
                  onChange={(e) => onFormChange('orientacao', parseFloat(e.target.value) || 180)}
                  placeholder="180 (Sul)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inclinacao">Inclinação (graus)</Label>
                <Input
                  id="inclinacao"
                  type="number"
                  value={formData.inclinacao || 23}
                  onChange={(e) => onFormChange('inclinacao', parseFloat(e.target.value) || 23)}
                  placeholder="23"
                />
              </div>
            </div>
          </div>

          {/* Resumo */}
          {formData.potenciaModulo > 0 && formData.numeroModulos > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Resumo do Sistema</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Potência Total: </span>
                  <span className="font-semibold">
                    {((formData.potenciaModulo * formData.numeroModulos) / 1000).toFixed(2)} kWp
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Área Estimada: </span>
                  <span className="font-semibold">
                    {(formData.numeroModulos * 2.5).toFixed(0)} m²
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddSolarModuleModal
        open={showModuleModal}
        onOpenChange={setShowModuleModal}
        onModuleAdded={handleModuleAdded}
        onModuleSelected={handleModuleSelected}
      />
      
      <AddInverterModal
        open={showInverterModal}
        onOpenChange={setShowInverterModal}
        onInverterAdded={handleInverterAdded}
        onInverterSelected={handleInverterSelected}
      />
    </TooltipProvider>
  );
};

export default SystemParametersForm;