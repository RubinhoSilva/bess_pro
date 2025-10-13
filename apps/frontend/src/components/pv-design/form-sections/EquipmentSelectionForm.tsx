import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Package, Unplug, Plus, Trash2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { moduleService } from '@/services/ModuleService';
import { inverterService } from '@/services/InverterService';
import { manufacturerService } from '@/services/ManufacturerService';
import { SolarModule, Inverter } from '@bess-pro/shared';

interface EquipmentSelectionFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

interface SelectedModule {
  id: string;
  manufacturerId: string;
  moduleId: string;
  quantity: number;
}

interface SelectedInverter {
  id: string;
  manufacturerId: string;
  inverterId: string;
  quantity: number;
}

const EquipmentSelectionForm: React.FC<EquipmentSelectionFormProps> = ({ formData, onFormChange }) => {
  const { data: solarModuleManufacturers } = useQuery({
    queryKey: ['manufacturers', 'SOLAR_MODULE'],
    queryFn: () => manufacturerService.getManufacturers(),
    staleTime: 15 * 60 * 1000,
  });
  
  const { data: inverterManufacturers } = useQuery({
    queryKey: ['manufacturers', 'INVERTER'],
    queryFn: () => manufacturerService.getManufacturers(),
    staleTime: 15 * 60 * 1000,
  });
  const { data: solarModulesData, isLoading: loadingModules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => moduleService.getModules(),
    staleTime: 10 * 60 * 1000,
  });
  
  const { data: invertersData, isLoading: loadingInverters } = useQuery({
    queryKey: ['inverters'],
    queryFn: () => inverterService.getInverters(),
    staleTime: 10 * 60 * 1000,
  });

  const moduleManufacturers = solarModuleManufacturers?.manufacturers || [];
  const inverterManufacturersList = inverterManufacturers?.manufacturers || [];
  const solarModules = solarModulesData?.modules || [];
  const inverters = invertersData?.inverters || [];

  const selectedModules: SelectedModule[] = formData.selectedModules || [];
  const selectedInverters: SelectedInverter[] = formData.selectedInverters || [];

  const handleAddModule = () => {
    const newModule: SelectedModule = {
      id: crypto.randomUUID(),
      manufacturerId: '',
      moduleId: '',
      quantity: 1
    };
    onFormChange('selectedModules', [...selectedModules, newModule]);
  };

  const handleRemoveModule = (id: string) => {
    onFormChange('selectedModules', selectedModules.filter(m => m.id !== id));
  };

  const handleUpdateModule = (id: string, field: string, value: any) => {
    const updated = selectedModules.map(module => {
      if (module.id === id) {
        const updatedModule = { ...module, [field]: value };
        // Clear moduleId when manufacturer changes
        if (field === 'manufacturerId') {
          updatedModule.moduleId = '';
        }
        return updatedModule;
      }
      return module;
    });
    onFormChange('selectedModules', updated);

    // Auto-update form data when module is selected
    if (field === 'moduleId' && value) {
      const selectedModule = solarModules.find((m: any) => m.id === value);
      if (selectedModule && selectedModules.length === 1) {
        // Update main form fields if only one module type
        onFormChange('potenciaModulo', selectedModule.nominalPower);
        onFormChange('eficienciaModulo', selectedModule.specifications.efficiency);
        onFormChange('tensaoModulo', selectedModule.specifications.voc);
        onFormChange('correnteModulo', selectedModule.specifications.impp);
      }
    }
  };

  const handleAddInverter = () => {
    const newInverter: SelectedInverter = {
      id: crypto.randomUUID(),
      manufacturerId: '',
      inverterId: '',
      quantity: 1
    };
    onFormChange('selectedInverters', [...selectedInverters, newInverter]);
  };

  const handleRemoveInverter = (id: string) => {
    onFormChange('selectedInverters', selectedInverters.filter(i => i.id !== id));
  };

  const handleUpdateInverter = (id: string, field: string, value: any) => {
    const updated = selectedInverters.map(inverter => {
      if (inverter.id === id) {
        const updatedInverter = { ...inverter, [field]: value };
        // Clear inverterId when manufacturer changes
        if (field === 'manufacturerId') {
          updatedInverter.inverterId = '';
        }
        return updatedInverter;
      }
      return inverter;
    });
    onFormChange('selectedInverters', updated);

    // Auto-update form data when inverter is selected
    if (field === 'inverterId' && value) {
      const selectedInverter = inverters.find((i: any) => i.id === value);
      if (selectedInverter && selectedInverters.length === 1) {
        // Update main form fields if only one inverter type
        onFormChange('potenciaInversor', selectedInverter.power.ratedACPower);
        onFormChange('eficienciaInversor', selectedInverter.electrical.maxEfficiency);
        onFormChange('canaisMppt', selectedInverter.mppt.numberOfMppts);
      }
    }
  };

  const getTotalSystemPower = () => {
    return selectedModules.reduce((total, module) => {
      const moduleData = solarModules.find((m: any) => m.id === module.moduleId);
      return total + (moduleData ? moduleData.nominalPower * module.quantity : 0);
    }, 0) / 1000; // Convert to kW
  };

  const getTotalInverterCapacity = () => {
    return selectedInverters.reduce((total, inverter) => {
      const inverterData = inverters.find((i: any) => i.id === inverter.inverterId);
      return total + (inverterData ? inverterData.power.ratedACPower * inverter.quantity : 0);
    }, 0) / 1000; // Convert to kW
  };

  const getCompatibilityStatus = () => {
    const systemPower = getTotalSystemPower();
    const inverterCapacity = getTotalInverterCapacity();
    
    if (systemPower === 0 || inverterCapacity === 0) return null;
    
    const ratio = systemPower / inverterCapacity;
    if (ratio >= 0.8 && ratio <= 1.3) {
      return { status: 'good', message: 'Configuração compatível' };
    } else if (ratio < 0.8) {
      return { status: 'warning', message: 'Sistema subdimensionado - considere mais módulos' };
    } else {
      return { status: 'error', message: 'Sistema sobredimensionado - considere mais inversores ou menos módulos' };
    }
  };

  const compatibility = getCompatibilityStatus();

  return (
    <TooltipProvider>
      <Card className="bg-card border border-border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Seleção de Equipamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Módulos Solares */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Módulos Solares</h3>
              <Button
                type="button"
                onClick={handleAddModule}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Adicionar Módulo
              </Button>
            </div>
            
            {selectedModules.length > 0 && (
            <div className="space-y-4">
              {selectedModules.map((module) => {
              const moduleData = solarModules.find((m: any) => m.id === module.moduleId);
              const selectedManufacturer = moduleManufacturers.find((m: any) => m.id === module.manufacturerId);
              const availableModules = module.manufacturerId 
                ? solarModules.filter((m: any) => m.manufacturerId === module.manufacturerId)
                : [];

              return (
                <div key={module.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <Label>Fabricante</Label>
                      <Select 
                        value={module.manufacturerId} 
                        onValueChange={(value) => handleUpdateModule(module.id, 'manufacturerId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fabricante" />
                        </SelectTrigger>
                        <SelectContent>
                          {moduleManufacturers.map((manufacturer: any) => (
                            <SelectItem key={manufacturer.id} value={manufacturer.id}>
                              {manufacturer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label>Módulo</Label>
                      <Select 
                        value={module.moduleId} 
                        onValueChange={(value) => handleUpdateModule(module.id, 'moduleId', value)}
                        disabled={!module.manufacturerId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !module.manufacturerId ? "Selecione primeiro o fabricante" :
                            loadingModules ? "Carregando..." : 
                            "Selecione um módulo"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModules.map((mod: any) => (
                            <SelectItem key={mod.id} value={mod.id}>
                              {mod.modelo} - {mod.potenciaNominal}W
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label>Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        value={module.quantity}
                        onChange={(e) => handleUpdateModule(module.id, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <Button 
                      type="button" 
                      onClick={() => handleRemoveModule(module.id)} 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {moduleData && (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                         <div><strong>Eficiência:</strong> {moduleData.specifications.efficiency}%</div>
                         <div><strong>VmP:</strong> {moduleData.specifications.vmpp}V</div>
                         <div><strong>ImP:</strong> {moduleData.specifications.impp}A</div>
                         <div><strong>Células:</strong> {moduleData.specifications.numberOfCells}</div>
                       </div>
                       <div className="mt-2">
                         <strong>Potência Total:</strong> {(moduleData.nominalPower * module.quantity).toLocaleString()}W
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
            )}
          </div>

          {/* Inversores */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Inversores</h3>
              <Button
                type="button"
                onClick={handleAddInverter}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Adicionar Inversor
              </Button>
            </div>
            
            {selectedInverters.length > 0 && (
            <div className="space-y-4">
              {selectedInverters.map((inverter) => {
              const inverterData = inverters.find((i: any) => i.id === inverter.inverterId);
              const selectedInverterManufacturer = inverterManufacturersList.find((m: any) => m.id === inverter.manufacturerId);
              const availableInverters = inverter.manufacturerId 
                ? inverters.filter((i: any) => i.manufacturerId === inverter.manufacturerId)
                : [];

              return (
                <div key={inverter.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <Label>Fabricante</Label>
                      <Select 
                        value={inverter.manufacturerId} 
                        onValueChange={(value) => handleUpdateInverter(inverter.id, 'manufacturerId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fabricante" />
                        </SelectTrigger>
                        <SelectContent>
                          {inverterManufacturersList.map((manufacturer: any) => (
                            <SelectItem key={manufacturer.id} value={manufacturer.id}>
                              {manufacturer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label>Inversor</Label>
                      <Select 
                        value={inverter.inverterId} 
                        onValueChange={(value) => handleUpdateInverter(inverter.id, 'inverterId', value)}
                        disabled={!inverter.manufacturerId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !inverter.manufacturerId ? "Selecione primeiro o fabricante" :
                            loadingInverters ? "Carregando..." : 
                            "Selecione um inversor"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {availableInverters.map((inv: any) => (
                            <SelectItem key={inv.id} value={inv.id}>
                              {inv.modelo} - {(inv.potenciaSaidaCA / 1000).toFixed(1)}kW
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label>Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        value={inverter.quantity}
                        onChange={(e) => handleUpdateInverter(inverter.id, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <Button 
                      type="button" 
                      onClick={() => handleRemoveInverter(inverter.id)} 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {inverterData && (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                         <div><strong>Eficiência:</strong> {inverterData.electrical.maxEfficiency}%</div>
                         <div><strong>MPPTs:</strong> {inverterData.mppt.numberOfMppts}</div>
                         <div><strong>Tipo:</strong> {inverterData.electrical.gridType}</div>
                         <div><strong>Faixa MPPT:</strong> {inverterData.mppt.mpptRange}</div>
                       </div>
                       <div className="mt-2">
                         <strong>Capacidade Total:</strong> {((inverterData.power.ratedACPower * inverter.quantity) / 1000).toFixed(1)}kW
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
            )}
          </div>

          {/* Resumo de Compatibilidade */}
          {compatibility && (
            <div className={`p-4 rounded-lg ${
              compatibility.status === 'good' ? 'bg-green-50 border border-green-200' :
              compatibility.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Info className={`w-5 h-5 ${
                  compatibility.status === 'good' ? 'text-green-600' :
                  compatibility.status === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`} />
                <h4 className={`font-semibold ${
                  compatibility.status === 'good' ? 'text-green-800' :
                  compatibility.status === 'warning' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  Análise de Compatibilidade
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <strong>Potência dos Módulos:</strong> {getTotalSystemPower().toFixed(2)} kWp
                </div>
                <div>
                  <strong>Capacidade dos Inversores:</strong> {getTotalInverterCapacity().toFixed(1)} kW
                </div>
                <div>
                  <strong>Ratio DC/AC:</strong> {getTotalSystemPower() && getTotalInverterCapacity() 
                    ? (getTotalSystemPower() / getTotalInverterCapacity()).toFixed(2) 
                    : 'N/A'}
                </div>
              </div>
              <p className={
                compatibility.status === 'good' ? 'text-green-700' :
                compatibility.status === 'warning' ? 'text-yellow-700' :
                'text-red-700'
              }>
                {compatibility.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default EquipmentSelectionForm;