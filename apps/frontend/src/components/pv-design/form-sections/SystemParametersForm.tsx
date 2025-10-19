// React/Next.js imports
import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';

// External libraries
import { useQuery } from '@tanstack/react-query';
import { Settings, Info, Plus } from 'lucide-react';

// Internal components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MultipleInvertersSelector } from './MultipleInvertersSelector';
import { AddSolarModuleModal } from '../modals/AddSolarModuleModal';

// Services
import { moduleService } from '@/services/ModuleService';
import { manufacturerService } from '@/services/ManufacturerService';

// Types
import { SolarModule, Manufacturer } from '@bess-pro/shared';
import { ISystemData } from '@/store/pv-dimensioning-store';

interface SystemParametersFormProps {
  systemData: ISystemData;
  onFormChange: (field: string, value: any) => void;
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
    isc: module.specifications.isc,
    vmpp: module.specifications.vmpp || 0,
    numeroCelulas: module.specifications.numberOfCells || 0,
    tipoCelula: module.specifications.cellType,
  };
};

const SystemParametersForm: React.FC<SystemParametersFormProps> = ({ systemData, onFormChange }) => {
  const [showModuleModal, setShowModuleModal] = useState(false);

  // Guard para prevenir múltiplas execuções do auto-select
  // CORREÇÃO DEFINITIVA: Previne loop infinito ao entrar na Step 4
  const hasAutoSelected = useRef(false);
  
  // Contador para rastrear renders
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  // Memoizar callbacks para evitar recriação e loops infinitos
  const handleInvertersChange = useCallback((inverters: any[]) => {
    onFormChange('selectedInverters', inverters);
  }, [onFormChange]);
  
  const handleTotalPowerChange = useCallback((totalPower: number) => {
    onFormChange('potenciaInversorTotal', totalPower);
  }, [onFormChange]);
  
  const handleTotalMpptChannelsChange = useCallback((totalChannels: number) => {
    onFormChange('totalMpptChannels', totalChannels);
  }, [onFormChange]);

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
  // Get available modules based on selected manufacturer - memoized to prevent unnecessary recalculations
  const availableModules = useMemo(() => {
    if (!systemData.fabricanteModulo) return [];
    
    const selectedManufacturer = moduleManufacturersList.find((m: Manufacturer) => m.id === systemData.fabricanteModulo);
    
    if (!selectedManufacturer) return [];
    
    return solarModules.filter((module: SolarModule) => {
      return module.manufacturer.id === selectedManufacturer.id;
    });
  }, [systemData.fabricanteModulo, moduleManufacturersList, solarModules]);

  // Calcular eficiência resultante de forma memoizada para evitar recálculos
  const eficienciaResultante = useMemo(() => {
    const totalPerdas = (systemData.perdaSombreamento ?? 3) +
                       (systemData.perdaMismatch ?? 2) +
                       (systemData.perdaCabeamento ?? 2) +
                       (systemData.perdaSujeira ?? 5) +
                       (systemData.perdaOutras ?? 0);
    const eficiencia = Math.max(0, 100 - totalPerdas);
    return `${eficiencia.toFixed(1)}%`;
  }, [
    systemData.perdaSombreamento,
    systemData.perdaMismatch,
    systemData.perdaCabeamento,
    systemData.perdaSujeira,
    systemData.perdaOutras
  ]);

  // Update module data when selection changes - wrapped in useCallback to prevent recreation
  // CORREÇÃO DEFINITIVA: Batch update para evitar múltiplos re-renders (7 atualizações → 1 atualização)
  const handleModuleChange = useCallback((moduleId: string) => {
    const selectedModule = solarModules.find((m: SolarModule) => m.id === moduleId);
    if (selectedModule) {
      const legacyModule = mapSolarModuleToLegacy(selectedModule);

      // Batch update: uma única chamada com todos os dados do módulo
      onFormChange('moduleData', {
        moduloSelecionado: moduleId,
        potenciaModulo: legacyModule.potenciaNominal,
        eficienciaModulo: legacyModule.eficiencia,
        tensaoModulo: legacyModule.voc,
        correnteModulo: legacyModule.impp,
        fabricanteModuloNome: legacyModule.fabricante,
        modeloModulo: legacyModule.modelo
      });
    } else {
      console.log('[SystemParametersForm] handleModuleChange: módulo não encontrado', { moduleId });
    }
  }, [solarModules, onFormChange]);


  const handleModuleAdded = useCallback(() => {
    refetchModules();
  }, [refetchModules]);

  const handleModuleSelected = useCallback((moduleId: string) => {
    // Wait for refetch to complete, then select the module
    refetchModules().then(() => {
      handleModuleChange(moduleId);
    });
  }, [refetchModules, handleModuleChange]);

  // Auto-select module quando há dados legados mas sem ID
  // CORREÇÃO DEFINITIVA: useRef + setTimeout para prevenir loop infinito
  // Executa SOMENTE UMA VEZ quando os dados necessários estão disponíveis
  useLayoutEffect(() => {
    
    
    // Guard: prevenir múltiplas execuções
    if (hasAutoSelected.current) {
      return;
    }

    // Guard: só executa se não tiver módulo selecionado mas tiver dados legados para restaurar
    if (systemData.moduloSelecionado || !systemData.modeloModulo || solarModules.length === 0) {
      return;
    }

    // Tentar encontrar o módulo pelo nome do modelo
    // Primeiro tenta busca exata
    let moduleByModel = solarModules.find((m: SolarModule) =>
      m.model === systemData.modeloModulo &&
      m.manufacturer.name === systemData.fabricanteModuloNome
    );

    // Se não encontrar, tenta busca parcial pelo modelo
    if (!moduleByModel && systemData.modeloModulo) {
      moduleByModel = solarModules.find((m: SolarModule) =>
        m.model.includes(systemData.modeloModulo!) ||
        systemData.modeloModulo!.includes(m.model)
      );
    }

    // Se ainda não encontrar, pega o primeiro módulo do fabricante
    if (!moduleByModel && systemData.fabricanteModuloNome) {
      moduleByModel = solarModules.find((m: SolarModule) => m.manufacturer.name === systemData.fabricanteModuloNome);
    }

    // Se encontrou um módulo, auto-preenche (batch update)
    if (moduleByModel) { 
      const legacyModule = mapSolarModuleToLegacy(moduleByModel);
      
      // CORREÇÃO: Usar setTimeout para quebrar o ciclo síncrono de atualizações
      setTimeout(() => {
        // Batch update: uma única chamada com todos os dados do módulo
        onFormChange('moduleData', {
          moduloSelecionado: moduleByModel.id,
          potenciaModulo: legacyModule.potenciaNominal,
          eficienciaModulo: legacyModule.eficiencia,
          tensaoModulo: legacyModule.voc,
          correnteModulo: legacyModule.impp,
          fabricanteModuloNome: legacyModule.fabricante,
          modeloModulo: legacyModule.modelo
        });
      }, 0);
      
      hasAutoSelected.current = true; // Marcar como executado para prevenir loops
    } else {
      console.log('[SystemParametersForm] useLayoutEffect: nenhum módulo encontrado');
    }
  }, [
    systemData.moduloSelecionado,
    systemData.modeloModulo,
    systemData.fabricanteModuloNome,
    solarModules.length, // Usar apenas o length em vez de todo o array
    onFormChange
  ]);
  return (
    <TooltipProvider>
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Settings className="w-5 h-5 text-purple-400" />
            Parâmetros do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parâmetros Gerais do Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Parâmetros Gerais</h3>
            
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
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                    <div className="space-y-2">
                      <Label htmlFor="fabricanteModulo">Fabricante do Módulo</Label>
                      <Select
                        value={systemData.fabricanteModulo || ''}
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
                         value={systemData.moduloSelecionado || ''}
                         onValueChange={handleModuleChange}
                         disabled={!systemData.fabricanteModulo}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Selecione o módulo" />
                         </SelectTrigger>
                         <SelectContent>
                           {availableModules.length > 0 ? (
                             availableModules.map((module: SolarModule): JSX.Element => {
                               const legacyModule = mapSolarModuleToLegacy(module);
                               return (
                                 <SelectItem key={module.id} value={module.id}>
                                   {module.model} - {legacyModule.potenciaNominal}W
                                 </SelectItem>
                               );
                             })
                           ) : (
                             <div className="p-2 text-sm text-gray-500 text-center">
                               {systemData.fabricanteModulo
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
              selectedInverters={systemData.selectedInverters || []}
              onInvertersChange={handleInvertersChange}
              onTotalPowerChange={handleTotalPowerChange}
              onTotalMpptChannelsChange={handleTotalMpptChannelsChange}
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
                    value={systemData.perdaSombreamento !== undefined ? systemData.perdaSombreamento : ''}
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
                    value={systemData.perdaMismatch !== undefined ? systemData.perdaMismatch : ''}
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
                    value={systemData.perdaCabeamento !== undefined ? systemData.perdaCabeamento : ''}
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
                    value={systemData.perdaSujeira !== undefined ? systemData.perdaSujeira : ''}
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
                    value={systemData.perdaOutras !== undefined ? systemData.perdaOutras : ''}
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
                    {eficienciaResultante}
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
                  value={systemData.vidaUtil || 25}
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
                  value={systemData.degradacaoAnual || 0.5}
                  onChange={(e) => onFormChange('degradacaoAnual', parseFloat(e.target.value) || 0.5)}
                  placeholder="0.5"
                />
              </div>
           </div>
          </div>

        </CardContent>
      </Card>

      {/* Modals */}
      <AddSolarModuleModal
        open={showModuleModal}
        onOpenChange={setShowModuleModal}
        onModuleAdded={handleModuleAdded}
        onModuleSelected={handleModuleSelected}
      />

    </TooltipProvider>
  );
};

export default SystemParametersForm;
