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
// MÚLTIPLAS ÁGUAS DE TELHADO - COMENTADO PARA USO FUTURO
// import MultipleRoofAreasForm from './MultipleRoofAreasForm';
// import { AguaTelhado } from '@/contexts/DimensioningContext';

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
                required
              >
                <SelectTrigger className={(formData.moduloSelecionado || formData.selectedModuleId) ? "" : "border-red-300 focus:border-red-500"}>
                  <SelectValue placeholder="Selecione o módulo fotovoltaico *" />
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
                required
              >
                <SelectTrigger className={(formData.inversorSelecionado || (formData.inverters && formData.inverters.length > 0 ? formData.inverters[0].selectedInverterId : '')) ? "" : "border-red-300 focus:border-red-500"}>
                  <SelectValue placeholder="Selecione o inversor *" />
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

          </div>

          {/* Parâmetros Gerais do Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Parâmetros Gerais</h3>
            
            {/* Perdas Específicas do Sistema */}
            <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-card/30">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                Perdas do Sistema (%)
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Especifique cada tipo de perda individualmente para maior precisão</p>
                  </TooltipContent>
                </Tooltip>
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perdaSombreamento">Sombreamento (%)</Label>
                  <Input
                    id="perdaSombreamento"
                    type="number"
                    min="0"
                    max="30"
                    step="0.1"
                    value={formData.perdaSombreamento || ''}
                    onChange={(e) => onFormChange('perdaSombreamento', parseFloat(e.target.value) || 3)}
                    placeholder="3.0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="perdaMismatch">Mismatch (%)</Label>
                  <Input
                    id="perdaMismatch"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.perdaMismatch || ''}
                    onChange={(e) => onFormChange('perdaMismatch', parseFloat(e.target.value) || 2)}
                    placeholder="2.0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="perdaCabeamento">Cabeamento (%)</Label>
                  <Input
                    id="perdaCabeamento"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.perdaCabeamento || ''}
                    onChange={(e) => onFormChange('perdaCabeamento', parseFloat(e.target.value) || 2)}
                    placeholder="2.0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="perdaSujeira">Sujeira (%)</Label>
                  <Input
                    id="perdaSujeira"
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={formData.perdaSujeira || ''}
                    onChange={(e) => onFormChange('perdaSujeira', parseFloat(e.target.value) || 5)}
                    placeholder="5.0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="perdaInversor">Inversor (%)</Label>
                  <Input
                    id="perdaInversor"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.perdaInversor || ''}
                    onChange={(e) => onFormChange('perdaInversor', parseFloat(e.target.value) || 3)}
                    placeholder="3.0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="perdaOutras">Outras Perdas (%)</Label>
                  <Input
                    id="perdaOutras"
                    type="number"
                    min="0"
                    max="15"
                    step="0.1"
                    value={formData.perdaOutras || ''}
                    onChange={(e) => onFormChange('perdaOutras', parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                  />
                </div>
              </div>
              
              <div className="pt-2 border-t border-border/30">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Eficiência Resultante:</span>
                  <span className="font-medium text-foreground">
                    {(() => {
                      const totalPerdas = (formData.perdaSombreamento || 3) + 
                                         (formData.perdaMismatch || 2) + 
                                         (formData.perdaCabeamento || 2) + 
                                         (formData.perdaSujeira || 5) + 
                                         (formData.perdaInversor || 3) + 
                                         (formData.perdaOutras || 0);
                      const eficiencia = Math.max(0, 100 - totalPerdas);
                      return `${eficiencia.toFixed(1)}%`;
                    })()}
                  </span>
                </div>
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


          {/* MÚLTIPLAS ÁGUAS DE TELHADO - COMENTADO PARA USO FUTURO */}
          {/* 
          <div className="mt-6">
            <MultipleRoofAreasForm
              aguasTelhado={formData.aguasTelhado || []}
              onAguasChange={(aguas: AguaTelhado[]) => onFormChange('aguasTelhado', aguas)}
              potenciaModulo={formData.potenciaModulo || 550}
            />
          </div>
          */}
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