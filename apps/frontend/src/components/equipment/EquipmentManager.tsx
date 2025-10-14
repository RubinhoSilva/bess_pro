import React, { useState, useEffect } from 'react';
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
  DialogTrigger, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  PlusCircle, Edit, Trash2, Package, Unplug, Loader2, Search, Lock, Info 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleService } from '@/services/ModuleService';
import { inverterService } from '@/services/InverterService';
import { manufacturerService } from '@/services/ManufacturerService';
import { 
  type SolarModule,
  type Inverter,
  type CreateModuleRequest,
  type CreateInverterRequest,
  type UpdateModuleRequest,
  type UpdateInverterRequest,
  type Manufacturer,
  type GridType
} from '@bess-pro/shared';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface EquipmentManagerProps {
  onUpdate?: () => void;
}

// Interfaces para formulários planos (para facilitar o uso no frontend)
interface InverterFormData {
  manufacturerId: string;
  manufacturer: string;
  model: string;
  ratedACPower: number;
  gridType: GridType;
  maxPVPower: number;
  maxDCVoltage?: number;
  numberOfMppts: number;
  stringsPerMppt: number;
  maxEfficiency: number;
  maxInputCurrent: number;
  maxApparentPower: number;
  shortCircuitVoltageMax: number;
  warranty: number;
  connectionType: 'on-grid' | 'off-grid' | 'hybrid';
}

interface ModuleFormData {
  manufacturerId: string;
  manufacturer: string;
  model: string;
  nominalPower: number;
  efficiency: number;
  vmpp: number;
  impp: number;
  voc: number;
  isc: number;
  cellType: string;
  numberOfCells: number;
  tempCoefPmax: number;
  tempCoefVoc: number;
  tempCoefIsc: number;
  aRef: number;
  iLRef: number;
  iORef: number;
  rS: number;
  rShRef: number;
  warranty: number;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  weightKg: number;
}



// Funções de transformação
const transformModuleFormToRequest = (form: ModuleFormData): CreateModuleRequest => ({
  manufacturer: form.manufacturerId,
  model: form.model,
  nominalPower: form.nominalPower,
  specifications: {
    vmpp: form.vmpp || undefined,
    impp: form.impp || undefined,
    voc: form.voc,
    isc: form.isc,
    efficiency: form.efficiency || undefined,
    cellType: form.cellType as any || 'monocrystalline',
    numberOfCells: form.numberOfCells || undefined,
    technology: 'perc' as any
  },
  parameters: {
    temperature: {
      tempCoeffPmax: form.tempCoefPmax,
      tempCoeffVoc: form.tempCoefVoc,
      tempCoeffIsc: form.tempCoefIsc
    },
    diode: {
      aRef: form.aRef,
      iLRef: form.iLRef,
      iORef: form.iORef,
      rShRef: form.rShRef,
      rS: form.rS
    },
    sapm: {},
    spectral: {},
    advanced: {}
  },
  dimensions: {
    widthMm: form.widthMm,
    heightMm: form.heightMm,
    thicknessMm: form.thicknessMm,
    weightKg: form.weightKg
  },
  metadata: {
    warranty: form.warranty,
    certifications: [],
    userId: undefined
  },
  teamId: '' // Will be set by service
});

const transformInverterFormToRequest = (form: InverterFormData, existingInverter?: Inverter): CreateInverterRequest => {
  console.log('Transforming inverter form to request:', form, existingInverter);
  return {
  manufacturer: {
      id: form.manufacturerId,
      name: form.manufacturer,
      type: 'INVERTER' as const,
      contact: {},
      business: {},
      certifications: [],
      metadata: {
        specialties: [],
        markets: [],
        qualityStandards: []
      },
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
  model: form.model,
  power: {
    ratedACPower: form.ratedACPower,
    maxPVPower: form.maxPVPower,
    shortCircuitVoltageMax: form.maxDCVoltage,
    maxInputCurrent: form.maxInputCurrent || 0,
    maxApparentPower: form.maxApparentPower
  },
  mppt: {
    numberOfMppts: form.numberOfMppts,
    stringsPerMppt: form.stringsPerMppt
  },
  electrical: {
    maxEfficiency: form.maxEfficiency,
    gridType: form.gridType as any
  },
  metadata: {
    warranty: 25,
    certifications: [],
    connectionType: 'on-grid'
  }
  };
};

export const EquipmentManager: React.FC<EquipmentManagerProps> = ({ onUpdate }) => {
  const { toast } = useToast();
  const { executeWithErrorHandling, error, isError } = useErrorHandler();
  
  // State
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isInverterDialogOpen, setIsInverterDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Current editing items
  const [currentModule, setCurrentModule] = useState<SolarModule | null>(null);
  const [currentInverter, setCurrentInverter] = useState<Inverter | null>(null);

  // Temp string values for temperature coefficients (to allow free typing)
  const [tempCoefPmaxStr, setTempCoefPmaxStr] = useState<string>('-0.40');
  const [tempCoefVocStr, setTempCoefVocStr] = useState<string>('-0.27');
  const [tempCoefIscStr, setTempCoefIscStr] = useState<string>('0.048');

  // Form states
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({
    manufacturerId: '',
    manufacturer: '',
    model: '',
    nominalPower: 550,
    efficiency: 21.5,
    vmpp: 41.8,
    impp: 13.16,
    voc: 49.8,
    isc: 13.90,
    cellType: 'monosi',
    numberOfCells: 144,
    tempCoefPmax: -0.40,
    tempCoefVoc: -0.27,
    tempCoefIsc: 0.048,
    aRef: 1.8,
    iLRef: 13.5,
    iORef: 2.5e-12,
    rS: 0.3,
    rShRef: 500,
    warranty: 25,
    widthMm: 2279,
    heightMm: 1134,
    thicknessMm: 35,
    weightKg: 21.2,
  });
  
  const [inverterForm, setInverterForm] = useState<InverterFormData>({
    manufacturerId: '',
    manufacturer: '',
    model: '', 
    ratedACPower: 8000, 
    gridType: 'trifasico',
    maxPVPower: 12000,
    maxDCVoltage: 1000,
    numberOfMppts: 2,
    stringsPerMppt: 3,
    maxEfficiency: 97.5,
    maxInputCurrent: 18.5,
    maxApparentPower: 8200,
    shortCircuitVoltageMax: 1000,
    warranty: 5,
    connectionType: 'on-grid',
  });
  
  const queryClient = useQueryClient();
  
  // API Hooks - usando serviços diretamente
  const { data: modulesData, isLoading: loadingModules } = useQuery({
    queryKey: ['modules', { searchTerm }],
    queryFn: () => moduleService.getModules({ searchTerm }),
    staleTime: 10 * 60 * 1000,
  });
  
  const { data: invertersData, isLoading: loadingInverters } = useQuery({
    queryKey: ['inverters', { searchTerm }],
    queryFn: () => inverterService.getInverters({ searchTerm }),
    staleTime: 10 * 60 * 1000,
  });
  
  const { data: moduleManufacturers } = useQuery({
    queryKey: ['manufacturers', 'module'],
    queryFn: () => manufacturerService.getManufacturers({}),
    staleTime: 15 * 60 * 1000,
  });
  
  const { data: inverterManufacturers } = useQuery({
    queryKey: ['manufacturers', 'inverter'],
    queryFn: () => manufacturerService.getManufacturers({}),
    staleTime: 15 * 60 * 1000,
  });
  
  const createModuleMutation = useMutation({
    mutationFn: (data: CreateModuleRequest) => moduleService.createModule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast({ title: 'Módulo criado com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Erro ao criar módulo', variant: 'destructive' });
    },
  });
  
  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateModuleRequest> }) => 
      moduleService.updateModule(id, data as UpdateModuleRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast({ title: 'Módulo atualizado com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Erro ao atualizar módulo', variant: 'destructive' });
    },
  });
  
  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => moduleService.deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast({ title: 'Módulo excluído com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Erro ao excluir módulo', variant: 'destructive' });
    },
  });
  
  const createInverterMutation = useMutation({
    mutationFn: (data: CreateInverterRequest) => inverterService.createInverter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast({ title: 'Inversor criado com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Erro ao criar inversor', variant: 'destructive' });
    },
  });
  
  const updateInverterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateInverterRequest> }) => 
      inverterService.updateInverter(id, data as UpdateInverterRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast({ title: 'Inversor atualizado com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Erro ao atualizar inversor', variant: 'destructive' });
    },
  });
  
  const deleteInverterMutation = useMutation({
    mutationFn: (id: string) => inverterService.deleteInverter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast({ title: 'Inversor excluído com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: error.message || 'Erro ao excluir inversor', variant: 'destructive' });
    },
  });
  
  const modules = modulesData?.modules || [];
  const inverters = invertersData?.inverters || [];
  const moduleManufacturersList = moduleManufacturers?.manufacturers || [];
  const inverterManufacturersList = inverterManufacturers?.manufacturers || [];

  // Auto-populate iLRef when isc changes
  useEffect(() => {
    if (moduleForm.isc && moduleForm.isc > 0 && (!moduleForm.iLRef || moduleForm.iLRef === 0)) {
      setModuleForm(prev => ({ ...prev, iLRef: prev.isc }));
    }
  }, [moduleForm.isc]);

  // Handlers
  const handleSaveModule = async () => {
    if (!moduleForm.model || !moduleForm.manufacturer || moduleForm.nominalPower <= 0) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Fabricante, Modelo e Potência são obrigatórios.'
      });
      return;
    }

    // Convert temperature coefficient strings to numbers and create request
    const formWithTempCoeffs = {
      ...moduleForm,
      tempCoefPmax: tempCoefPmaxStr ? parseFloat(tempCoefPmaxStr) || 0 : 0,
      tempCoefVoc: tempCoefVocStr ? parseFloat(tempCoefVocStr) || 0 : 0,
      tempCoefIsc: tempCoefIscStr ? parseFloat(tempCoefIscStr) || 0 : 0,
    };

    const dataToSave = transformModuleFormToRequest(formWithTempCoeffs);

    await executeWithErrorHandling(async () => {
      if (currentModule) {
        await updateModuleMutation.mutateAsync({ id: currentModule.id, data: dataToSave as UpdateModuleRequest });
      } else {
        await createModuleMutation.mutateAsync(dataToSave);
      }
      
      setIsModuleDialogOpen(false);
      setCurrentModule(null);
       setModuleForm({
         manufacturerId: '',
         manufacturer: '',
         model: '',
         nominalPower: 550,
         efficiency: 21.5,
         vmpp: 41.8,
         impp: 13.16,
         voc: 49.8,
         isc: 13.90,
         cellType: 'monosi',
         numberOfCells: 144,
         tempCoefPmax: -0.40,
         tempCoefVoc: -0.27,
         tempCoefIsc: 0.048,
         aRef: 1.8,
         iLRef: 13.5,
         iORef: 2.5e-12,
         rS: 0.3,
         rShRef: 500,
         widthMm: 2279,
         heightMm: 1134,
         thicknessMm: 35,
         weightKg: 21.2,
         warranty: 25
       });
      setTempCoefPmaxStr('-0.40');
      setTempCoefVocStr('-0.27');
      setTempCoefIscStr('0.048');
      onUpdate?.();
    }, {
      operation: 'save-module',
      context: { 
        isEdit: !!currentModule,
        modelName: moduleForm.model,
        manufacturer: moduleForm.manufacturer 
      }
    });
  };

  const handleSaveInverter = async () => {

    console.log('Saving inverter with form data:', inverterForm, 'Current inverter:', currentInverter);
    
    const dataToSave = transformInverterFormToRequest(inverterForm, currentInverter || undefined);

    console.log('Transformed inverter data to save:', dataToSave);
    
    await executeWithErrorHandling(async () => {
      if (currentInverter) {
        console.log('Updating inverter with data:', dataToSave);
        await updateInverterMutation.mutateAsync({ id: currentInverter.id, data: dataToSave as UpdateInverterRequest });
        toast({ title: 'Inversor atualizado com sucesso!' });
      } else {
        await createInverterMutation.mutateAsync(dataToSave);
        toast({ title: 'Inversor criado com sucesso!' });
      }
      
      setIsInverterDialogOpen(false);
      setCurrentInverter(null);
setInverterForm({ 
         manufacturerId: '',
         manufacturer: '',
         model: '', 
         ratedACPower: 8000, 
         gridType: 'trifasico',
          maxPVPower: 12000,
          maxDCVoltage: 1000,
          numberOfMppts: 2,
          stringsPerMppt: 3,
          maxEfficiency: 97.5,
          maxInputCurrent: 18.5,
          maxApparentPower: 8200,
          shortCircuitVoltageMax: 1000,
          warranty: 5,
          connectionType: 'on-grid',
        });
      onUpdate?.();
    }, {
      operation: 'save-inverter',
      context: { 
        isEdit: !!currentInverter,
        modelName: inverterForm.model,
        manufacturerId: inverterForm.manufacturerId
      }
    });
  };

  const handleDeleteModule = async (module: SolarModule) => {
    // Verificar se é um equipamento público
    if (module.metadata.userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser excluído',
        description: 'Este é um equipamento público do sistema e não pode ser removido.'
      });
      return;
    }

    await executeWithErrorHandling(async () => {
      await deleteModuleMutation.mutateAsync(module.id);
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

  const handleDeleteInverter = async (inverter: Inverter) => {
    // Verificar se é um equipamento público
    if (inverter.metadata.userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser excluído',
        description: 'Este é um equipamento público do sistema e não pode ser removido.'
      });
      return;
    }

    await executeWithErrorHandling(async () => {
      await deleteInverterMutation.mutateAsync(inverter.id);
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

  const handleEditModule = (module: SolarModule) => {
    // Verificar se é um equipamento público
    if (module.metadata.userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser editado',
        description: 'Este é um equipamento público do sistema e não pode ser modificado. Você pode criar uma cópia com suas próprias especificações.'
      });
      return;
    }

    setCurrentModule(module);
    setModuleForm({
      manufacturerId: module.manufacturer.id || '',
      manufacturer: module.manufacturer.name,
      model: module.model,
      nominalPower: module.nominalPower,
      widthMm: module.dimensions?.widthMm || 0,
      heightMm: module.dimensions?.heightMm || 0,
      thicknessMm: module.dimensions?.thicknessMm || 0,
      vmpp: module.specifications.vmpp || 0,
      impp: module.specifications.impp || 0,
      voc: module.specifications.voc,
      isc: module.specifications.isc,
      cellType: module.specifications.cellType,
      efficiency: module.specifications.efficiency || 0,
      numberOfCells: module.specifications.numberOfCells || 0,
      tempCoefPmax: module.parameters.temperature.tempCoeffPmax,
      tempCoefVoc: module.parameters.temperature.tempCoeffVoc,
      tempCoefIsc: module.parameters.temperature.tempCoeffIsc,
      aRef: module.parameters.diode.aRef || 1.8,
      iLRef: module.parameters.diode.iLRef || module.specifications.isc || 0,
      iORef: module.parameters.diode.iORef || 2.5e-12,
      rS: module.parameters.diode.rS || 0,
      rShRef: module.parameters.diode.rShRef || 0,
      weightKg: module.dimensions?.weightKg || 0,
      warranty: module.metadata.warranty || 25,
    });

    // Populate temperature coefficient strings
    setTempCoefPmaxStr(module.parameters.temperature.tempCoeffPmax?.toString() || '');
    setTempCoefVocStr(module.parameters.temperature.tempCoeffVoc?.toString() || '');
    setTempCoefIscStr(module.parameters.temperature.tempCoeffIsc?.toString() || '');

    setIsModuleDialogOpen(true);
  };

  const handleEditInverter = (inverter: Inverter) => {
    // Verificar se é um equipamento público
    if (inverter.metadata.userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser editado',
        description: 'Este é um equipamento público do sistema e não pode ser modificado. Você pode criar uma cópia com suas próprias especificações.'
      });
      return;
    }

    setCurrentInverter(inverter);
    setInverterForm({
      manufacturerId: inverter.manufacturer.id,
      manufacturer: inverter.manufacturer.name,
      model: inverter.model,
      ratedACPower: inverter.power.ratedACPower,
      gridType: inverter.electrical.gridType,
      maxPVPower: inverter.power.maxPVPower,
      maxDCVoltage: inverter.power.shortCircuitVoltageMax,
      numberOfMppts: inverter.mppt.numberOfMppts,
      stringsPerMppt: inverter.mppt.stringsPerMppt,
      maxEfficiency: inverter.electrical.maxEfficiency,
      maxInputCurrent: inverter.power.maxInputCurrent,
      maxApparentPower: inverter.power.maxApparentPower,
      shortCircuitVoltageMax: inverter.power.shortCircuitVoltageMax,
      warranty: inverter.metadata.warranty || 5,
      connectionType: inverter.metadata.connectionType || 'on-grid',
    });
    setIsInverterDialogOpen(true);
  };

  const handleNewModule = () => {
    setCurrentModule(null);
    const defaultModuleForm: ModuleFormData = {
      manufacturerId: '',
      manufacturer: '',
      model: '',
      nominalPower: 550,
      efficiency: 21.2,
      vmpp: 41.8,
      impp: 13.16,
      voc: 49.8,
      isc: 13.90,
      cellType: 'Monocristalino',
      numberOfCells: 144,
      tempCoefPmax: -0.40,
      tempCoefVoc: -0.27,
      tempCoefIsc: 0.048,
      aRef: 1.8,
      iLRef: 13.90,
      iORef: 2.5e-12,
      rS: 0.5,
      rShRef: 500,
      widthMm: 1134,
      heightMm: 2274,
      thicknessMm: 35,
      weightKg: 27.5,
      warranty: 25
    };
    setModuleForm(defaultModuleForm);
    setTempCoefPmaxStr('-0.40');
    setTempCoefVocStr('-0.27');
    setTempCoefIscStr('0.048');
    setIsModuleDialogOpen(true);
  };

  const handleNewInverter = () => {
    setCurrentInverter(null);
const defaultInverterForm: InverterFormData = {
      manufacturerId: '',
      manufacturer: '',
      model: '', 
      ratedACPower: 8000, 
      gridType: 'trifasico',
      maxPVPower: 12000,
      maxDCVoltage: 1000,
      numberOfMppts: 2,
      stringsPerMppt: 3,
      maxEfficiency: 97.5,
      maxInputCurrent: 18.5,
      maxApparentPower: 8200,
      shortCircuitVoltageMax: 1000,
      warranty: 5,
      connectionType: 'on-grid',
    };
    setInverterForm(defaultInverterForm);
    setIsInverterDialogOpen(true);
  };

  const isLoading = loadingModules || loadingInverters ||
                   createModuleMutation.isPending || updateModuleMutation.isPending || 
                   createInverterMutation.isPending || updateInverterMutation.isPending;

  return (
    <div data-testid="equipment-manager">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar equipamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" /> Módulos Solares ({modules.length})
              </div>
              <Button 
                size="sm" 
                onClick={handleNewModule}
                data-action="add-module"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : modules.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Nenhum módulo cadastrado</p>
            ) : (
              modules.map((module: SolarModule) => {
                const isPublic = module.teamId === 'public-equipment-system';
                return (
                  <div key={module.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{module.manufacturer.name} {module.model}</span>
                        <span className="text-sm text-slate-400">({module.nominalPower}W)</span>
                        {isPublic && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            <Lock className="w-3 h-3" />
                            <span>Público</span>
                          </div>
                        )}
                      </div>
                      {module.specifications.cellType && (
                        <span className="text-xs text-slate-500 block">{module.specifications.cellType}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditModule(module)}
                        disabled={isPublic}
                        title={isPublic ? 'Equipamento público não pode ser editado' : 'Editar módulo'}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500" 
                        onClick={() => handleDeleteModule(module)}
                        disabled={isPublic}
                        title={isPublic ? 'Equipamento público não pode ser excluído' : 'Excluir módulo'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Unplug className="w-5 h-5" /> Inversores ({inverters.length})
              </div>
              <Button 
                size="sm" 
                onClick={handleNewInverter}
                data-action="add-inverter"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : inverters.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Nenhum inversor cadastrado</p>
            ) : (
              inverters.map((inverter: Inverter) => {
                const isPublic = inverter.teamId === 'public-equipment-system';
                return (
                  <div key={inverter.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{inverter.manufacturer.name} {inverter.model}</span>
                        <span className="text-sm text-slate-400">({inverter.power.ratedACPower}W)</span>
                        {isPublic && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            <Lock className="w-3 h-3" />
                            <span>Público</span>
                          </div>
                        )}
                      </div>
                      {inverter.electrical.gridType && (
                        <span className="text-xs text-slate-500 block">{inverter.electrical.gridType}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditInverter(inverter)}
                        disabled={isPublic}
                        title={isPublic ? 'Equipamento público não pode ser editado' : 'Editar inversor'}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500" 
                        onClick={() => handleDeleteInverter(inverter)}
                        disabled={isPublic}
                        title={isPublic ? 'Equipamento público não pode ser excluído' : 'Excluir inversor'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Módulos */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent className="bg-background border-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentModule?.id ? 'Editar' : 'Adicionar'} Módulo Fotovoltaico</DialogTitle>
            <DialogDescription>Insira os parâmetros técnicos ou extraia de um datasheet.</DialogDescription>
          </DialogHeader>
          <form className="space-y-6">
            <div className="space-y-6 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              
                <div className="space-y-2">
                  <Label htmlFor="fabricante">Fabricante *</Label>
                  <Select 
                    value={moduleForm.manufacturer || ''} 
                    onValueChange={(value) => {
                      const selectedManufacturer = moduleManufacturersList.find((m: any) => m.name === value);
                      setModuleForm(prev => ({ 
                        ...prev, 
                        manufacturer: value,
                        manufacturerId: selectedManufacturer?.id || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fabricante" />
                    </SelectTrigger>
                    <SelectContent>
                      {moduleManufacturersList.map((manufacturer: any) => (
                        <SelectItem key={manufacturer.id} value={manufacturer.name}>
                          {manufacturer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={moduleForm.model}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="ex: Tiger Pro 72HC 550W"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nominalPower">Potência Nominal (W) *</Label>
                  <Input
                    id="nominalPower"
                    type="number"
                    value={moduleForm.nominalPower || ''}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, nominalPower: parseFloat(e.target.value) || 0 }))}
                    placeholder="550 (ex: 550Wp)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="efficiency">Eficiência (%)</Label>
                  <Input
                    id="efficiency"
                    type="number"
                    step="0.1"
                    value={moduleForm.efficiency || ''}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, efficiency: parseFloat(e.target.value) || 0 }))}
                    placeholder="21.2 (ex: 21.2%)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoCelula">Tipo de Célula</Label>
                  <Select onValueChange={(value) => setModuleForm(prev => ({ ...prev, cellType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de célula" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monocristalino">Monocristalino</SelectItem>
                      <SelectItem value="Policristalino">Policristalino</SelectItem>
                      <SelectItem value="Perc">Perc</SelectItem>
                      <SelectItem value="HJT">HJT</SelectItem>
                      <SelectItem value="TOPCon">TOPCon</SelectItem>
                      <SelectItem value="Bifacial">Bifacial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroCelulas">Número de Células</Label>
                  <Input
                    id="numeroCelulas"
                    type="number"
                    value={moduleForm.numberOfCells || ''}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, numberOfCells: parseInt(e.target.value) || 0 }))}
                    placeholder="144 (células)"
                  />
                </div>
              </div>
            </div>

            {/* Especificações Elétricas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Especificações Elétricas</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vmpp">Tensão de Máxima Potência (VmP)</Label>
                   <Input
                     id="vmpp"
                     type="number"
                     step="0.1"
                     value={moduleForm.vmpp || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, vmpp: parseFloat(e.target.value) || 0 }))}
                     placeholder="41.8 (V)"
                   />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impp">Corrente de Máxima Potência (ImP)</Label>
                   <Input
                     id="impp"
                     type="number"
                     step="0.1"
                     value={moduleForm.impp || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, impp: parseFloat(e.target.value) || 0 }))}
                     placeholder="13.16 (A)"
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voc">Tensão de Circuito Aberto (Voc)</Label>
                   <Input
                     id="voc"
                     type="number"
                     step="0.1"
                     value={moduleForm.voc || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, voc: parseFloat(e.target.value) || 0 }))}
                     placeholder="49.8 (V)"
                   />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isc">Corrente Curto-Circuito (Isc)</Label>
                   <Input
                     id="isc"
                     type="number"
                     step="0.1"
                     value={moduleForm.isc || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, isc: parseFloat(e.target.value) || 0 }))}
                     placeholder="13.90 (A)"
                   />
                </div>
              </div>

              {/* Coeficientes de Temperatura */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempCoefPmax">Coeficiente de Temperatura (Pmax)</Label>
                  <div className="relative">
                     <Input
                       id="tempCoefPmax"
                       type="text"
                       value={tempCoefPmaxStr}
                       onChange={(e) => setTempCoefPmaxStr(e.target.value)}
                       placeholder="-0.40 (%/°C)"
                     />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempCoefVoc">Coeficiente de Temperatura (Voc)</Label>
                  <div className="relative">
                     <Input
                       id="tempCoefVoc"
                       type="text"
                       value={tempCoefVocStr}
                       onChange={(e) => setTempCoefVocStr(e.target.value)}
                       placeholder="-0.27 (%/°C)"
                     />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempCoefIsc">Coeficiente de Temperatura (Isc)</Label>
                  <div className="relative">
                     <Input
                       id="tempCoefIsc"
                       type="text"
                       value={tempCoefIscStr}
                       onChange={(e) => setTempCoefIscStr(e.target.value)}
                       placeholder="0.048 (%/°C)"
                     />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parâmetros do modelo de diodo único */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Parâmetros do modelo de diodo único</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aRef">Fator de Idealidade</Label>
                   <Input
                     id="aRef"
                     type="number"
                     step="0.1"
                     value={moduleForm.aRef || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, aRef: parseFloat(e.target.value) || 0 }))}
                     placeholder="1.8 (fator de idealidade)"
                   />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iLRef">Corrente de Luz Fotogerada (A)</Label>
                   <Input
                     id="iLRef"
                     type="number"
                     step="0.1"
                     value={moduleForm.iLRef || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, iLRef: parseFloat(e.target.value) || 0 }))}
                     placeholder="13.90 (A - corrente de luz)"
                   />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="iORef">Corrente de Saturação do Diodo (A)</Label>
                   <Input
                     id="iORef"
                     type="number"
                     step="1e-15"
                     value={moduleForm.iORef || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, iORef: parseFloat(e.target.value) || 0 }))}
                     placeholder="2.5e-12 (A - saturação)"
                   />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rS">Resistência série (ohms)</Label>
                   <Input
                     id="rS"
                     type="number"
                     step="0.01"
                     value={moduleForm.rS || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, rS: parseFloat(e.target.value) || 0 }))}
                     placeholder="0.5 (Ω - resistência série)"
                   />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rShRef">Resistência shunt (ohms)</Label>
                   <Input
                     id="rShRef"
                     type="number"
                     step="1"
                     value={moduleForm.rShRef || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, rShRef: parseFloat(e.target.value) || 0 }))}
                     placeholder="500 (Ω - resistência shunt)"
                   />
                </div>
              </div>
            </div>

            {/* Dimensões e Físicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dimensões e Características Físicas</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="larguraMm">Largura (mm)</Label>
                   <Input
                     id="larguraMm"
                     type="number"
                     value={moduleForm.widthMm || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, widthMm: parseInt(e.target.value) || 0 }))}
                     placeholder="1134 (mm)"
                   />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alturaMm">Altura (mm)</Label>
                   <Input
                     id="alturaMm"
                     type="number"
                     value={moduleForm.heightMm || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, heightMm: parseInt(e.target.value) || 0 }))}
                     placeholder="2274 (mm)"
                   />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thicknessMm">Espessura (mm)</Label>
                   <Input
                     id="thicknessMm"
                     type="number"
                     value={moduleForm.thicknessMm || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, thicknessMm: parseInt(e.target.value) || 0 }))}
                     placeholder="35 (mm)"
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weightKg">Peso (kg)</Label>
                   <Input
                     id="weightKg"
                     type="number"
                     step="0.1"
                     value={moduleForm.weightKg || ''}
                     onChange={(e) => setModuleForm(prev => ({ ...prev, weightKg: parseFloat(e.target.value) || 0 }))}
                     placeholder="27.5 (kg)"
                   />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty">Garantia (anos)</Label>
                  <Input
                    id="warranty"
                    type="number"
                    value={moduleForm.warranty || 25}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, warranty: parseInt(e.target.value) || 25 }))}
                    placeholder="25"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveModule} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} 
                Salvar Módulo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Inversores */}
      <Dialog open={isInverterDialogOpen} onOpenChange={setIsInverterDialogOpen}>
        <DialogContent className="bg-background border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle>{currentInverter?.id ? 'Editar' : 'Adicionar'} Inversor</DialogTitle>
            <DialogDescription>Insira os parâmetros técnicos do inversor.</DialogDescription>
          </DialogHeader>
          <form className="space-y-6">
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fabricante *</Label>
                <Select 
                  value={inverterForm.manufacturerId } 
                  onValueChange={(value) => {
                    setInverterForm(prev => ({ 
                      ...prev, 
                      manufacturerId: value,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fabricante" />
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
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Input 
                  value={inverterForm.model || ''} 
                  onChange={e => setInverterForm(prev => ({ ...prev, model: e.target.value }))} 
                  className="bg-background border-border" 
                  placeholder="Ex: Primo 8.2-1"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-primary mb-3 border-b border-border pb-2">
                Características Principais
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Potência Nominal CA (W) *</Label>
                   <Input 
                     type="number" 
                     value={inverterForm.ratedACPower || ''} 
                     onChange={e => setInverterForm(prev => ({ ...prev, ratedACPower: parseFloat(e.target.value) || 0 }))} 
                     className="bg-background border-border" 
                     placeholder="8000 (W)"
                   />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Rede *</Label>
                  <Select
                    value={inverterForm.gridType || ''}
                    onValueChange={value => setInverterForm(prev => ({ ...prev, gridType: value as GridType }))}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione o tipo de rede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monofasico-220v">Monofásico 220V</SelectItem>
                      <SelectItem value="bifasico-220v">Bifásico 220V</SelectItem>
                      <SelectItem value="trifasico-220v">Trifásico 220V</SelectItem>
                      <SelectItem value="trifasico-380v">Trifásico 380V</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Potência FV Máx (W)</Label>
                   <Input 
                     type="number" 
                     value={inverterForm.maxPVPower || ''} 
                     onChange={e => setInverterForm(prev => ({ ...prev, maxPVPower: parseFloat(e.target.value) || 0 }))} 
                     className="bg-background border-border" 
                     placeholder="12000 (W)"
                   />
                </div>
                <div className="space-y-2">
                  <Label>Tensão CC Máx (V)</Label>
                   <Input 
                     type="number" 
                     value={inverterForm.shortCircuitVoltageMax || ''} 
                     onChange={e => setInverterForm(prev => ({ ...prev, shortCircuitVoltageMax: parseFloat(e.target.value) || 0 }))} 
                     className="bg-background border-border" 
                     placeholder="1000 (V)"
                   />
                </div>
                <div className="space-y-2">
                  <Label>Número de MPPTs</Label>
                   <Input 
                     type="number" 
                     value={inverterForm.numberOfMppts || ''} 
                     onChange={e => setInverterForm(prev => ({ ...prev, numberOfMppts: parseInt(e.target.value) || 0 }))} 
                     className="bg-background border-border" 
                     placeholder="2 (MPPTs)"
                   />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade de strings por MPPT</Label>
                   <Input 
                     type="number" 
                     value={inverterForm.stringsPerMppt || ''} 
                     onChange={e => setInverterForm(prev => ({ ...prev, stringsPerMppt: parseInt(e.target.value) || 0 }))} 
                     className="bg-background border-border" 
                     placeholder="3 (strings/MPPT)"
                   />
                </div>
                <div className="space-y-2">
                  <Label>Eficiência Máx (%)</Label>
                   <Input 
                     type="number" 
                     step="0.1"
                     value={inverterForm.maxEfficiency || ''} 
                     onChange={e => setInverterForm(prev => ({ ...prev, maxEfficiency: parseFloat(e.target.value) || 0 }))} 
                     className="bg-background border-border" 
                     placeholder="97.5 (%)"
                   />
                </div>
                 <div className="space-y-2">
                   <Label>Corrente Entrada Máx (A)</Label>
                   <Input 
                     type="number" 
                     step="0.1"
                     value={inverterForm.maxInputCurrent || ''} 
                     onChange={e => setInverterForm(prev => ({ ...prev, maxInputCurrent: parseFloat(e.target.value) || 0 }))} 
                     className="bg-background border-border" 
                     placeholder="18.5 (A)"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Potência Aparente Máx (VA)</Label>
                   <Input 
                     type="number" 
                     value={inverterForm.maxApparentPower || ''} 
                     onChange={e => setInverterForm(prev => ({ ...prev, maxApparentPower: parseFloat(e.target.value) || 0 }))} 
                     className="bg-background border-border" 
                     placeholder="8200 (VA)"
                   />
                 </div>
              </div>
            </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveInverter} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} 
                Salvar Inversor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentManager;