import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings, Info, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSolarModules, useInverters, useManufacturersList, ManufacturerType } from '@/hooks/equipment-hooks';
import { MultipleInvertersSelector } from './MultipleInvertersSelector';
import { AddSolarModuleModal } from '../modals/AddSolarModuleModal';
import { AddInverterModal } from '../modals/AddInverterModal';
// MÚLTIPLAS ÁGUAS DE TELHADO - COMENTADO PARA USO FUTURO
// import MultipleRoofAreasForm from './MultipleRoofAreasForm';
// import { AguaTelhado } from '@/contexts/DimensioningContext';

interface SystemParametersFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}



const SystemParametersForm: React.FC<SystemParametersFormProps> = ({ formData, onFormChange }) => {
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showInverterModal, setShowInverterModal] = useState(false);
  
  // Equipment data
  const { data: moduleManufacturers } = useManufacturersList({ type: ManufacturerType.SOLAR_MODULE });
  const { data: solarModulesData, refetch: refetchModules } = useSolarModules({ pageSize: 100 });

  const solarModules = solarModulesData?.modules || [];
  const moduleManufacturersList = moduleManufacturers || [];

  // Get available modules based on selected manufacturer
  const getAvailableModules = () => {
    if (!formData.fabricanteModulo) return solarModules;
    return solarModules.filter((module: any) => 
      moduleManufacturersList.find((m: any) => m.id === formData.fabricanteModulo && m.name === module.fabricante)
    );
  };

  // Update module data when selection changes
  const handleModuleChange = (moduleId: string) => {
    const selectedModule = solarModules.find((m: any) => m.id === moduleId);
    if (selectedModule) {
      onFormChange('moduloSelecionado', moduleId);
      onFormChange('potenciaModulo', selectedModule.potenciaNominal);
      onFormChange('eficienciaModulo', selectedModule.eficiencia);
      onFormChange('tensaoModulo', selectedModule.vmpp);
      onFormChange('correnteModulo', selectedModule.impp);
      onFormChange('fabricanteModuloNome', selectedModule.fabricante);
      onFormChange('modeloModulo', selectedModule.modelo);
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


          {/* Parâmetros Gerais do Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Parâmetros Gerais</h3>
            
            {/* Seleção de Equipamentos */}
            <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-card/30">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Módulos Fotovoltaicos</h4>
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
              
              <div className="grid grid-cols-1 gap-4">
                {/* Módulo Solar - ocupando largura total */}
                <div className="space-y-3">
                  {/* Fabricante e Módulo na mesma linha */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                    <div className="space-y-2">
                      <Label htmlFor="fabricanteModulo">Fabricante do Módulo</Label>
                      <Select 
                        value={formData.fabricanteModulo || ''} 
                        onValueChange={(value) => {
                          onFormChange('fabricanteModulo', value);
                          onFormChange('moduloSelecionado', ''); // Reset module selection
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o fabricante" />
                        </SelectTrigger>
                        <SelectContent>
                          {moduleManufacturersList.map((manufacturer: any) => (
                            <SelectItem key={manufacturer.id} value={manufacturer.id}>
                              {manufacturer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="moduloSelecionado">Módulo Solar</Label>
                      <Select 
                        value={formData.moduloSelecionado || ''} 
                        onValueChange={handleModuleChange}
                        disabled={!formData.fabricanteModulo}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o módulo" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableModules().map((module: any) => (
                            <SelectItem key={module.id} value={module.id}>
                              {module.modelo} - {module.potenciaNominal}W
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
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

          {/* Sistema Multi-Inversor */}
          <MultipleInvertersSelector
            selectedInverters={formData.selectedInverters || []}
            onInvertersChange={(inverters) => onFormChange('selectedInverters', inverters)}
            onTotalPowerChange={(totalPower) => onFormChange('potenciaInversorTotal', totalPower)}
            onTotalMpptChannelsChange={(totalChannels) => onFormChange('totalMpptChannels', totalChannels)}
          />

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