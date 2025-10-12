import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings, Info, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { moduleService } from '@/services/ModuleService';
import { inverterService } from '@/services/InverterService';
import { manufacturerService } from '@/services/ManufacturerService';
import { MultipleInvertersSelector } from './MultipleInvertersSelector';
import { AddSolarModuleModal } from '../modals/AddSolarModuleModal';
import { AddInverterModal } from '../modals/AddInverterModal';
import { SolarModule, Manufacturer, SelectedInverter as SharedSelectedInverter } from '@bess-pro/shared';
// MÚLTIPLAS ÁGUAS DE TELHADO - COMENTADO PARA USO FUTURO
// import MultipleRoofAreasForm from './MultipleRoofAreasForm';
// import { AguaTelhado } from '@/contexts/DimensioningContext';

interface SystemParametersFormProps {
  formData: SystemFormData;
  onFormChange: (field: string, value: any) => void;
}

interface SystemFormData {
  fabricanteModulo?: string;
  moduloSelecionado?: string;
  potenciaModulo?: number;
  eficienciaModulo?: number;
  tensaoModulo?: number;
  correnteModulo?: number;
  fabricanteModuloNome?: string;
  modeloModulo?: string;
  selectedInverters?: SharedSelectedInverter[];
  potenciaInversorTotal?: number;
  totalMpptChannels?: number;
  perdaSombreamento?: number;
  perdaMismatch?: number;
  perdaCabeamento?: number;
  perdaSujeira?: number;
  perdaOutras?: number;
  vidaUtil?: number;
  degradacaoAnual?: number;
  [key: string]: any;
}

// Função de mapeamento para compatibilidade com código legado
const mapSolarModuleToLegacy = (module: SolarModule) => {
  return {
    id: module.id,
    potenciaNominal: module.nominalPower,
    eficiencia: module.specifications.efficiency || 0,
    voc: module.specifications.voc,
    impp: module.specifications.impp || 0,
    fabricante: module.manufacturer.name,
    modelo: module.model,
    // Adicionar outras propriedades se necessário
    isc: module.specifications.isc,
    vmpp: module.specifications.vmpp || 0,
    numeroCelulas: module.specifications.numberOfCells || 0,
    tipoCelula: module.specifications.cellType,
  };
};



const SystemParametersForm: React.FC<SystemParametersFormProps> = ({ formData, onFormChange }) => {
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showInverterModal, setShowInverterModal] = useState(false);
  
  // Equipment data
  const { data: moduleManufacturers } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturerService.getManufacturers({}),
    staleTime: 15 * 60 * 1000,
  });
  const { data: solarModulesData, refetch: refetchModules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => moduleService.getModules({}),
    staleTime: 10 * 60 * 1000,
  });

  const solarModules = solarModulesData?.modules || [];
  const moduleManufacturersList = moduleManufacturers?.manufacturers || [];
  


  // Get available modules based on selected manufacturer
  const getAvailableModules = () => {
    if (!formData.fabricanteModulo) return [];
    
    const selectedManufacturer = moduleManufacturersList.find((m: Manufacturer) => m.id === formData.fabricanteModulo);
    
    if (!selectedManufacturer) return [];
    
    return solarModules.filter((module: SolarModule) => {
      return module.manufacturer.id === selectedManufacturer.id;
    });
  };

  // Update module data when selection changes
  const handleModuleChange = (moduleId: string) => {
    const selectedModule = solarModules.find((m: SolarModule) => m.id === moduleId);
    if (selectedModule) {
      const legacyModule = mapSolarModuleToLegacy(selectedModule);
      onFormChange('moduloSelecionado', moduleId);
      onFormChange('potenciaModulo', legacyModule.potenciaNominal);
      onFormChange('eficienciaModulo', legacyModule.eficiencia);
      onFormChange('tensaoModulo', legacyModule.voc);
      onFormChange('correnteModulo', legacyModule.impp);
      onFormChange('fabricanteModuloNome', legacyModule.fabricante);
      onFormChange('modeloModulo', legacyModule.modelo);
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

  // Verificar se o módulo selecionado existe nos módulos disponíveis
  useEffect(() => {
    if (formData.moduloSelecionado && solarModules.length > 0) {
      const selectedModule = solarModules.find((m: SolarModule) => m.id === formData.moduloSelecionado);
      if (!selectedModule) {
        // Módulo selecionado não encontrado na lista
      }
    }
    
    // Tentar encontrar o módulo pelo nome do modelo se não tiver ID
    if (!formData.moduloSelecionado && formData.modeloModulo && solarModules.length > 0) {
      // Searching for module by model name using shared types
      
      // Primeiro tenta busca exata
      let moduleByModel = solarModules.find((m: SolarModule) => 
        m.model === formData.modeloModulo && 
        m.manufacturer.name === formData.fabricanteModuloNome
      );
      
      // Se não encontrar, tenta busca parcial pelo modelo
      if (!moduleByModel && formData.modeloModulo) {
        moduleByModel = solarModules.find((m: SolarModule) => 
          m.model.includes(formData.modeloModulo!) || 
          formData.modeloModulo!.includes(m.model)
        );
      }
      
      // Se ainda não encontrar, pega o primeiro módulo do fabricante
      if (!moduleByModel && formData.fabricanteModuloNome) {
        moduleByModel = solarModules.find((m: SolarModule) => m.manufacturer.name === formData.fabricanteModuloNome);
      }
      
      if (moduleByModel) {
        const legacyModule = mapSolarModuleToLegacy(moduleByModel);
        // Auto-preencher o ID do módulo
        onFormChange('moduloSelecionado', moduleByModel.id);
        // Também atualiza os dados do módulo
        onFormChange('potenciaModulo', legacyModule.potenciaNominal);
        onFormChange('eficienciaModulo', legacyModule.eficiencia);
        onFormChange('tensaoModulo', legacyModule.voc);
        onFormChange('correnteModulo', legacyModule.impp);
      }
    }
  }, [formData.moduloSelecionado, formData.modeloModulo, formData.fabricanteModuloNome, solarModules]);



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
                           {moduleManufacturersList.map((manufacturer: Manufacturer): JSX.Element => (
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
                           {getAvailableModules().length > 0 ? (
                             getAvailableModules().map((module: SolarModule): JSX.Element => {
                               const legacyModule = mapSolarModuleToLegacy(module);
                               return (
                                 <SelectItem key={module.id} value={module.id}>
                                   {module.model} - {legacyModule.potenciaNominal}W
                                 </SelectItem>
                               );
                             })
                           ) : (
                             <div className="p-2 text-sm text-gray-500 text-center">
                               {formData.fabricanteModulo 
                                 ? 'Nenhum módulo encontrado para este fabricante' 
                                 : 'Selecione um fabricante primeiro'
                               }
                             </div>
                           )}
                         </SelectContent>
                       </Select>
                     </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Configuração de Inversores */}
            <MultipleInvertersSelector
              selectedInverters={formData.selectedInverters || []}
              onInvertersChange={(inverters) => onFormChange('selectedInverters', inverters)}
              onTotalPowerChange={(totalPower) => onFormChange('potenciaInversorTotal', totalPower)}
              onTotalMpptChannelsChange={(totalChannels) => onFormChange('totalMpptChannels', totalChannels)}
            />
            
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
                    value={formData.perdaSombreamento !== undefined ? formData.perdaSombreamento : ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      onFormChange('perdaSombreamento', isNaN(value) ? 0 : value);
                    }}
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
                    value={formData.perdaMismatch !== undefined ? formData.perdaMismatch : ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      onFormChange('perdaMismatch', isNaN(value) ? 0 : value);
                    }}
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
                    value={formData.perdaCabeamento !== undefined ? formData.perdaCabeamento : ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      onFormChange('perdaCabeamento', isNaN(value) ? 0 : value);
                    }}
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
                    value={formData.perdaSujeira !== undefined ? formData.perdaSujeira : ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      onFormChange('perdaSujeira', isNaN(value) ? 0 : value);
                    }}
                    placeholder="5.0"
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
                    value={formData.perdaOutras !== undefined ? formData.perdaOutras : ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      onFormChange('perdaOutras', isNaN(value) ? 0 : value);
                    }}
                    placeholder="0.0"
                  />
                </div>
              </div>
              
              <div className="pt-2 border-t border-border/30">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Eficiência Resultante:</span>
                  <span className="font-medium text-foreground">
                    {(() => {
                      const totalPerdas = (formData.perdaSombreamento ?? 3) + 
                                         (formData.perdaMismatch ?? 2) + 
                                         (formData.perdaCabeamento ?? 2) + 
                                         (formData.perdaSujeira ?? 5) + 
                                         (formData.perdaOutras ?? 0);
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
