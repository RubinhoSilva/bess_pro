import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  PlusCircle, Edit, Trash2, Package, Unplug, Loader2, Search, Lock
} from 'lucide-react';
import { 
  useModuleData
} from '@/store/module-store';
import { 
  useInverterData,
  useInverterStore
} from '@/store/inverter-store';
import { 
  useModuleStore
} from '@/store/module-store';
import { 
  useManufacturerStore
} from '@/store/manufacturer-store';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { 
  useModuleForm, 
  useInverterForm,
  type UseModuleFormOptions,
  type UseInverterFormOptions
} from '@/hooks/equipment';
import { SolarModule, Inverter } from '@bess-pro/shared';

interface EquipmentManagerProps {
  onUpdate?: () => void;
}

export const EquipmentManagerRefactored: React.FC<EquipmentManagerProps> = ({ onUpdate }) => {
  const { toast } = useToast();
  const { executeWithErrorHandling } = useErrorHandler();
  
  console.log('🔥 Toast disponível:', typeof toast, toast);
  
  // Teste do toast
  React.useEffect(() => {
    console.log('🧪 Testando toast...');
    toast({
      title: 'Teste Toast',
      description: 'Se você está vendo isso, o toast está funcionando!'
    });
  }, [toast]);
  
  // Store data
  const modules = useModuleData();
  const inverters = useInverterData();
  const { removeModule } = useModuleStore();
  const { removeInverter } = useInverterStore();
  const { manufacturers } = useManufacturerStore();
  
  // State
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isInverterDialogOpen, setIsInverterDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentModule, setCurrentModule] = useState<SolarModule | null>(null);
  const [currentInverter, setCurrentInverter] = useState<Inverter | null>(null);

  // Form hooks
  const moduleFormOptions: UseModuleFormOptions = {
    mode: currentModule ? 'edit' : 'create',
    onSuccess: (data) => {
      console.log('🎉 EquipmentManagerRefactored onSuccess chamado', { data, currentModule });
      toast({ 
        title: currentModule ? 'Módulo atualizado com sucesso!' : 'Módulo criado com sucesso!',
        description: 'Operação realizada com sucesso!'
      });
      setIsModuleDialogOpen(false);
      setCurrentModule(null);
      onUpdate?.();
    },
    onError: (error) => {
      console.log('💥 EquipmentManagerRefactored onError chamado', { error: error.message, stack: error.stack });
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar módulo',
        description: error.message
      });
    }
  };

  const inverterFormOptions: UseInverterFormOptions = {
    mode: currentInverter ? 'edit' : 'create',
    onSuccess: (data) => {
      toast({ title: currentInverter ? 'Inversor atualizado com sucesso!' : 'Inversor criado com sucesso!' });
      setIsInverterDialogOpen(false);
      setCurrentInverter(null);
      onUpdate?.();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar inversor',
        description: error.message
      });
    }
  };

  const {
    form: moduleForm,
    isSubmitting: isSubmittingModule,
    onSubmit: handleModuleSubmit
  } = useModuleForm(moduleFormOptions);

  const {
    form: inverterForm,
    isSubmitting: isSubmittingInverter,
    onSubmit: handleInverterSubmit
  } = useInverterForm(inverterFormOptions);

  // Filter data based on search
  const filteredModules = modules.filter((module: any) =>
    module.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInverters = inverters.filter((inverter: any) =>
    inverter.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inverter.manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleEditModule = (module: any) => {
    // Verificar se é um equipamento público
    if ((module as any).userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser editado',
        description: 'Este é um equipamento público do sistema e não pode ser modificado. Você pode criar uma cópia com suas próprias especificações.'
      });
      return;
    }

    setCurrentModule(module);
    
    // Reset form with module data - convert from SolarModule to FormData
    moduleForm.reset({
      fabricante: module.manufacturer.name,
      modelo: module.model,
      potenciaNominal: module.nominalPower,
      vmpp: module.specifications.vmpp || 0,
      impp: module.specifications.impp || 0,
      voc: module.specifications.voc,
      isc: module.specifications.isc,
      eficiencia: module.specifications.efficiency,
      numeroCelulas: module.specifications.numberOfCells || 0,
      tipoCelula: module.specifications.cellType,
      tempCoefPmax: module.parameters.temperature.tempCoeffPmax,
      tempCoefVoc: module.parameters.temperature.tempCoeffVoc,
      tempCoefIsc: module.parameters.temperature.tempCoeffIsc,
      aRef: module.parameters.diode.aRef,
      iLRef: module.parameters.diode.iLRef,
      iORef: module.parameters.diode.iORef,
      rS: module.parameters.diode.rS,
      rShRef: module.parameters.diode.rShRef,
      larguraMm: module.dimensions.widthMm,
      alturaMm: module.dimensions.heightMm,
      espessuraMm: module.dimensions.thicknessMm,
      pesoKg: module.dimensions.weightKg,
      garantiaAnos: module.metadata.warranty,
      certificacoes: module.metadata.certifications,
      datasheetUrl: module.metadata.datasheetUrl,
      isPublic: module.isPublic
    } as any);

    setIsModuleDialogOpen(true);
  };

  const handleEditInverter = (inverter: any) => {
    // Verificar se é um equipamento público
    if ((inverter as any).userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser editado',
        description: 'Este é um equipamento público do sistema e não pode ser modificado. Você pode criar uma cópia com suas próprias especificações.'
      });
      return;
    }

    setCurrentInverter(inverter);
    
    // Reset form with inverter data - simplified mapping
    inverterForm.reset({
      fabricante: inverter.manufacturer.name,
      modelo: inverter.model,
      potenciaSaidaCA: (inverter as any).potenciaSaidaCA || 0,
      tipoRede: (inverter as any).tipoRede || 'On-Grid',
      potenciaFvMax: (inverter as any).potenciaFvMax || 0,
      tensaoCcMax: (inverter as any).tensaoCcMax || 0,
      numeroMppt: (inverter as any).numeroMppt || 1,
      stringsPorMppt: (inverter as any).stringsPorMppt || 1,
      eficienciaMax: (inverter as any).eficienciaMax || 95,
      correnteEntradaMax: (inverter as any).correnteEntradaMax || 0,
      potenciaAparenteMax: (inverter as any).potenciaAparenteMax || 0,
      correnteSaidaMax: (inverter as any).correnteSaidaMax || 0,
      tensaoSaidaNominal: (inverter as any).tensaoSaidaNominal || 220,
      frequenciaNominal: (inverter as any).frequenciaNominal || 60,
      certificacoes: (inverter as any).certificacoes || [],
      grauProtecao: (inverter as any).grauProtecao || 'IP65',
      pesoKg: (inverter as any).pesoKg || 0,
      garantiaAnos: (inverter as any).garantiaAnos || 10,
      datasheetUrl: (inverter as any).datasheetUrl || '',
      precoReferencia: (inverter as any).precoReferencia || 0
    } as any);

    setIsInverterDialogOpen(true);
  };

  const handleNewModule = () => {
    setCurrentModule(null);
    moduleForm.reset();
    setIsModuleDialogOpen(true);
  };

  const handleNewInverter = () => {
    setCurrentInverter(null);
    inverterForm.reset();
    setIsInverterDialogOpen(true);
  };

  const handleDeleteModule = async (module: any) => {
    // Verificar se é um equipamento público
    if ((module as any).userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser excluído',
        description: 'Este é um equipamento público do sistema e não pode ser removido.'
      });
      return;
    }

    await executeWithErrorHandling(async () => {
      removeModule(module.id);
      toast({ title: 'Módulo excluído.' });
      onUpdate?.();
    }, {
      operation: 'delete-module',
      context: { 
        modelName: module.model,
        manufacturer: module.manufacturer.name 
      }
    });
  };

  const handleDeleteInverter = async (inverter: any) => {
    // Verificar se é um equipamento público
    if ((inverter as any).userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser excluído',
        description: 'Este é um equipamento público do sistema e não pode ser removido.'
      });
      return;
    }

    await executeWithErrorHandling(async () => {
      removeInverter(inverter.id);
      toast({ title: 'Inversor excluído.' });
      onUpdate?.();
    }, {
      operation: 'delete-inverter',
      context: { 
        modelName: inverter.model,
        manufacturer: inverter.manufacturer.name 
      }
    });
  };

  // Form submission handlers
  const handleSaveModule = moduleForm.handleSubmit(handleModuleSubmit);
  const handleSaveInverter = inverterForm.handleSubmit(handleInverterSubmit);

  const manufacturersList = manufacturers.map((m: any) => ({
    id: m.id,
    name: m.name
  }));

  return (
    <div className="space-y-6">
      {/* Search and New Buttons */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar equipamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleNewModule} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Novo Módulo
        </Button>
        <Button onClick={handleNewInverter} variant="outline" className="flex items-center gap-2">
          <Unplug className="h-4 w-4" />
          Novo Inversor
        </Button>
      </div>

      {/* Modules Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Módulos Solares ({filteredModules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredModules.map((module) => (
              <div key={module.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{module.model}</div>
                  <div className="text-sm text-gray-600">
                    {module.manufacturer.name} • {(module as any).potenciaNominal || module.nominalPower}W • {(module as any).eficiencia || module.specifications?.efficiency}%
                  </div>
                  {(module as any).userId === 'public-equipment-system' && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                      <Lock className="h-3 w-3" />
                      Equipamento público
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditModule(module)}
                    disabled={(module as any).userId === 'public-equipment-system'}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteModule(module)}
                    disabled={(module as any).userId === 'public-equipment-system'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inverters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Unplug className="h-5 w-5" />
            Inversores ({filteredInverters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredInverters.map((inverter) => (
              <div key={inverter.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{inverter.model}</div>
                  <div className="text-sm text-gray-600">
                    {inverter.manufacturer.name} • {(inverter as any).potenciaSaidaCA || (inverter as any).power?.rated}W • {(inverter as any).eficienciaMax || (inverter as any).efficiency?.peak}%
                  </div>
                  {(inverter as any).userId === 'public-equipment-system' && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                      <Lock className="h-3 w-3" />
                      Equipamento público
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditInverter(inverter)}
                    disabled={(inverter as any).userId === 'public-equipment-system'}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteInverter(inverter)}
                    disabled={(inverter as any).userId === 'public-equipment-system'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Module Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentModule ? 'Editar Módulo Solar' : 'Novo Módulo Solar'}
            </DialogTitle>
            <DialogDescription>
              Preencha as especificações técnicas do módulo solar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label htmlFor="manufacturerId">Fabricante</Label>
              <Select
                value={moduleForm.watch('manufacturerId')}
                onValueChange={(value) => moduleForm.setValue('manufacturerId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fabricante" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturersList.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="model"
                {...moduleForm.register('model')}
                placeholder="Ex: JK300M-72"
              />
              {moduleForm.formState.errors.model && (
                <p className="text-sm text-red-600">{moduleForm.formState.errors.model.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nominalPower">Potência Nominal (W)</Label>
              <Input
                id="nominalPower"
                type="number"
                {...moduleForm.register('nominalPower', { valueAsNumber: true })}
                placeholder="Ex: 550"
              />
              {moduleForm.formState.errors.nominalPower && (
                <p className="text-sm text-red-600">{moduleForm.formState.errors.nominalPower.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="efficiency">Eficiência (%)</Label>
              <Input
                id="efficiency"
                type="number"
                step="0.1"
                {...moduleForm.register('efficiency', { valueAsNumber: true })}
                placeholder="Ex: 21.5"
              />
              {moduleForm.formState.errors.efficiency && (
                <p className="text-sm text-red-600">{moduleForm.formState.errors.efficiency.message}</p>
              )}
            </div>

            {/* Electrical Specifications */}
            <div className="space-y-2">
              <Label htmlFor="vmpp">VmPP (V)</Label>
              <Input
                id="vmpp"
                type="number"
                step="0.1"
                {...moduleForm.register('vmpp', { valueAsNumber: true })}
                placeholder="Ex: 41.2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impp">ImPP (A)</Label>
              <Input
                id="impp"
                type="number"
                step="0.1"
                {...moduleForm.register('impp', { valueAsNumber: true })}
                placeholder="Ex: 13.35"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voc">Voc (V)</Label>
              <Input
                id="voc"
                type="number"
                step="0.1"
                {...moduleForm.register('voc', { valueAsNumber: true })}
                placeholder="Ex: 49.8"
              />
              {moduleForm.formState.errors.voc && (
                <p className="text-sm text-red-600">{moduleForm.formState.errors.voc.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="isc">Isc (A)</Label>
              <Input
                id="isc"
                type="number"
                step="0.1"
                {...moduleForm.register('isc', { valueAsNumber: true })}
                placeholder="Ex: 14.23"
              />
            </div>

            {/* Temperature Coefficients */}
            <div className="space-y-2">
              <Label htmlFor="tempCoefPmax">Coef. Temp. Pmax (%/°C)</Label>
              <Input
                id="tempCoefPmax"
                type="number"
                step="0.01"
                {...moduleForm.register('tempCoeffPmax', { valueAsNumber: true })}
                placeholder="Ex: -0.35"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempCoeffVoc">Coef. Temp. Voc (%/°C)</Label>
              <Input
                id="tempCoeffVoc"
                type="number"
                step="0.01"
                {...moduleForm.register('tempCoeffVoc', { valueAsNumber: true })}
                placeholder="Ex: -0.28"
              />
            </div>

            {/* Physical Dimensions */}
            <div className="space-y-2">
              <Label htmlFor="widthMm">Largura (mm)</Label>
              <Input
                id="widthMm"
                type="number"
                {...moduleForm.register('widthMm', { valueAsNumber: true })}
                placeholder="Ex: 2279"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heightMm">Altura (mm)</Label>
              <Input
                id="heightMm"
                type="number"
                {...moduleForm.register('heightMm', { valueAsNumber: true })}
                placeholder="Ex: 1134"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightKg">Peso (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                step="0.1"
                {...moduleForm.register('weightKg', { valueAsNumber: true })}
                placeholder="Ex: 21.8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty">Garantia (anos)</Label>
              <Input
                id="warranty"
                type="number"
                {...moduleForm.register('warranty', { valueAsNumber: true })}
                placeholder="Ex: 25"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModuleDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveModule}
              disabled={isSubmittingModule}
            >
              {isSubmittingModule && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentModule ? 'Atualizar' : 'Criar'} Módulo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inverter Dialog */}
      <Dialog open={isInverterDialogOpen} onOpenChange={setIsInverterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentInverter ? 'Editar Inversor' : 'Novo Inversor'}
            </DialogTitle>
            <DialogDescription>
              Preencha as especificações técnicas do inversor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label htmlFor="inverter-manufacturerId">Fabricante</Label>
              <Select
                value={inverterForm.watch('manufacturerId')}
                onValueChange={(value) => inverterForm.setValue('manufacturerId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fabricante" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturersList.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                {...moduleForm.register('model')}
                placeholder="Ex: SPR-M20-470-COM"
              />
              {moduleForm.formState.errors.model && (
                <p className="text-sm text-red-500">
                  {moduleForm.formState.errors.model.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratedACPower">Potência Saída CA (W)</Label>
              <Input
                id="ratedACPower"
                type="number"
                {...inverterForm.register('ratedACPower', { valueAsNumber: true })}
                placeholder="Ex: 50000"
              />
              {inverterForm.formState.errors.ratedACPower && (
                <p className="text-sm text-red-600">{inverterForm.formState.errors.ratedACPower.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gridType">Tipo de Rede</Label>
              <Select
                value={inverterForm.watch('gridType')}
                onValueChange={(value) => inverterForm.setValue('gridType', value as 'monofasico' | 'bifasico' | 'trifasico')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monofasico">Monofásico</SelectItem>
                  <SelectItem value="bifasico">Bifásico</SelectItem>
                  <SelectItem value="trifasico">Trifásico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DC Specifications */}
            <div className="space-y-2">
              <Label htmlFor="maxPVPower">Potência FV Máxima (W)</Label>
              <Input
                id="maxPVPower"
                type="number"
                {...inverterForm.register('maxPVPower', { valueAsNumber: true })}
                placeholder="Ex: 65000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortCircuitVoltageMax">Tensão CC Máxima (V)</Label>
              <Input
                id="shortCircuitVoltageMax"
                type="number"
                {...inverterForm.register('shortCircuitVoltageMax', { valueAsNumber: true })}
                placeholder="Ex: 1100"
              />
              {inverterForm.formState.errors.shortCircuitVoltageMax && (
                <p className="text-sm text-red-600">{inverterForm.formState.errors.shortCircuitVoltageMax.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfMppts">Número de MPPTs</Label>
              <Input
                id="numberOfMppts"
                type="number"
                {...inverterForm.register('numberOfMppts', { valueAsNumber: true })}
                placeholder="Ex: 8"
              />
              {inverterForm.formState.errors.numberOfMppts && (
                <p className="text-sm text-red-600">{inverterForm.formState.errors.numberOfMppts.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stringsPerMppt">Strings por MPPT</Label>
              <Input
                id="stringsPerMppt"
                type="number"
                {...inverterForm.register('stringsPerMppt', { valueAsNumber: true })}
                placeholder="Ex: 2"
              />
              {inverterForm.formState.errors.stringsPerMppt && (
                <p className="text-sm text-red-600">{inverterForm.formState.errors.stringsPerMppt.message}</p>
              )}
            </div>

            {/* Efficiency */}
            <div className="space-y-2">
              <Label htmlFor="maxEfficiency">Eficiência Máxima (%)</Label>
              <Input
                id="maxEfficiency"
                type="number"
                step="0.1"
                {...inverterForm.register('maxEfficiency', { valueAsNumber: true })}
                placeholder="Ex: 98.6"
              />
              {inverterForm.formState.errors.maxEfficiency && (
                <p className="text-sm text-red-600">{inverterForm.formState.errors.maxEfficiency.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxInputCurrent">Corrente Entrada Máxima (A)</Label>
              <Input
                id="maxInputCurrent"
                type="number"
                step="0.1"
                {...inverterForm.register('maxInputCurrent', { valueAsNumber: true })}
                placeholder="Ex: 64"
              />
            </div>

            {/* Physical */}
            <div className="space-y-2">
              <Label htmlFor="warranty">Garantia (anos)</Label>
              <Input
                id="warranty"
                type="number"
                {...inverterForm.register('warranty', { valueAsNumber: true })}
                placeholder="Ex: 10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInverterDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveInverter}
              disabled={isSubmittingInverter}
            >
              {isSubmittingInverter && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentInverter ? 'Atualizar' : 'Criar'} Inversor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentManagerRefactored;