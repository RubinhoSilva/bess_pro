import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Settings, Info, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSolarModules } from '@/hooks/equipment-hooks';
import { AddSolarModuleModal } from '../modals/AddSolarModuleModal';
import { AddInverterModal } from '../modals/AddInverterModal';
import { MultipleInvertersSelector } from './MultipleInvertersSelector';
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


const SystemParametersForm: React.FC<SystemParametersFormProps> = ({ formData, onFormChange }) => {
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showInverterModal, setShowInverterModal] = useState(false);
  
  // Fetch equipment data from API
  const { data: solarModules = { modules: [], total: 0 }, refetch: refetchModules } = useSolarModules({ pageSize: 100 });

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


  const handleModuleAdded = () => {
    refetchModules();
  };

  const handleModuleSelected = (moduleId: string) => {
    // Wait for refetch to complete, then select the module
    refetchModules().then(() => {
      handleModuleChange(moduleId);
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


          </div>

          {/* Sistema Multi-Inversor */}
          <MultipleInvertersSelector
            selectedInverters={formData.selectedInverters || []}
            onInvertersChange={(inverters) => onFormChange('selectedInverters', inverters)}
            onTotalPowerChange={(totalPower) => {
              onFormChange('totalInverterPower', totalPower);
              // Manter compatibilidade com código legado
              onFormChange('potenciaInversor', totalPower);
            }}
            onTotalMpptChannelsChange={(totalChannels) => {
              onFormChange('totalMpptChannels', totalChannels);
              // Manter compatibilidade com código legado
              onFormChange('canaisMppt', totalChannels);
            }}
            selectedModule={{
              potenciaNominal: formData.potenciaModulo || 540,
              vocStc: formData.tensaoModulo || 49.7,
              tempCoefVoc: -0.27 // Default value - could be made configurable
            }}
            coordinates={{
              latitude: formData.latitude || -15.7942,
              longitude: formData.longitude || -47.8822
            }}
            showMPPTLimits={Boolean(formData.potenciaModulo && formData.tensaoModulo)}
          />


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
        onInverterAdded={() => {
          // Refetch will happen automatically via useInverters hook
        }}
      />
      
    </TooltipProvider>
  );
};

export default SystemParametersForm;