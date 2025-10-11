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
import { 
  useSolarModules, 
  useCreateSolarModule, 
  useUpdateSolarModule, 
  useDeleteSolarModule,
  useInverters,
  useCreateInverter,
  useUpdateInverter,
  useDeleteInverter,
  useManufacturersList,
  type SolarModule,
  type Inverter,
  type SolarModuleInput,
  type InverterInput,
  ManufacturerType
} from '@/hooks/legacy-equipment-hooks';

interface EquipmentManagerProps {
  onUpdate?: () => void;
}

export const EquipmentManager: React.FC<EquipmentManagerProps> = ({ onUpdate }) => {
  const { toast } = useToast();
  
  // State
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isInverterDialogOpen, setIsInverterDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Current editing items
  const [currentModule, setCurrentModule] = useState<SolarModule | null>(null);
  const [currentInverter, setCurrentInverter] = useState<Inverter | null>(null);

  // Temp string values for temperature coefficients (to allow free typing)
  const [tempCoefPmaxStr, setTempCoefPmaxStr] = useState<string>('');
  const [tempCoefVocStr, setTempCoefVocStr] = useState<string>('');
  const [tempCoefIscStr, setTempCoefIscStr] = useState<string>('');

  // Form states
  const [moduleForm, setModuleForm] = useState<SolarModuleInput>({
    manufacturerId: '',
    fabricante: '', 
    modelo: '', 
    potenciaNominal: 0,
    eficiencia: 0,
    vmpp: 0,
    impp: 0,
    voc: 0,
    isc: 0,
    tipoCelula: '',
    numeroCelulas: 0,
    tempCoefPmax: 0,
    tempCoefVoc: 0,
    tempCoefIsc: 0,
    aRef: 1.8,
    iLRef: 0,
    iORef: 2.5e-12,
    rS: 0,
    rShRef: 0,
    garantiaAnos: 25,
    larguraMm: 0,
    alturaMm: 0,
    espessuraMm: 0,
    pesoKg: 0,
  });
  
  const [inverterForm, setInverterForm] = useState<InverterInput>({
    manufacturerId: '',
    fabricante: '',
    modelo: '', 
    potenciaSaidaCA: 0, 
    tipoRede: '',
    potenciaFvMax: 0,
    tensaoCcMax: 0,
    numeroMppt: 0,
    stringsPorMppt: 0,
    eficienciaMax: 0,
    correnteEntradaMax: 0,
    potenciaAparenteMax: 0,
  });
  
  // API Hooks
  const { data: modulesData, isLoading: loadingModules } = useSolarModules({ search: searchTerm, pageSize: 50 });
  const { data: invertersData, isLoading: loadingInverters } = useInverters({ search: searchTerm, pageSize: 50 });
  const { data: moduleManufacturers } = useManufacturersList({ type: ManufacturerType.SOLAR_MODULE });
  const { data: inverterManufacturers } = useManufacturersList({ type: ManufacturerType.INVERTER });
  
  const createModuleMutation = useCreateSolarModule();
  const updateModuleMutation = useUpdateSolarModule();
  const deleteModuleMutation = useDeleteSolarModule();
  
  const createInverterMutation = useCreateInverter();
  const updateInverterMutation = useUpdateInverter();
  const deleteInverterMutation = useDeleteInverter();
  
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
    if (!moduleForm.modelo || !moduleForm.fabricante || moduleForm.potenciaNominal <= 0) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Fabricante, Modelo e Potência são obrigatórios.'
      });
      return;
    }

    // Convert temperature coefficient strings to numbers
    const dataToSave = {
      ...moduleForm,
      tempCoefPmax: tempCoefPmaxStr ? parseFloat(tempCoefPmaxStr) || 0 : 0,
      tempCoefVoc: tempCoefVocStr ? parseFloat(tempCoefVocStr) || 0 : 0,
      tempCoefIsc: tempCoefIscStr ? parseFloat(tempCoefIscStr) || 0 : 0,
    };

    try {
      if (currentModule) {
        await updateModuleMutation.mutateAsync({ id: currentModule.id, ...dataToSave });
      } else {
        await createModuleMutation.mutateAsync(dataToSave);
      }
      
      setIsModuleDialogOpen(false);
      setCurrentModule(null);
      setModuleForm({
        manufacturerId: '',
        fabricante: '',
        modelo: '',
        potenciaNominal: 0,
        eficiencia: 0,
        vmpp: 0,
        impp: 0,
        voc: 0,
        isc: 0,
        tipoCelula: '',
        numeroCelulas: 0,
        tempCoefPmax: 0,
        tempCoefVoc: 0,
        tempCoefIsc: 0,
        aRef: 1.8,
        iLRef: 0,
        iORef: 2.5e-12,
        rS: 0,
        rShRef: 0,
        garantiaAnos: 25,
        larguraMm: 0,
        alturaMm: 0,
        espessuraMm: 0,
        pesoKg: 0,
      });
      setTempCoefPmaxStr('');
      setTempCoefVocStr('');
      setTempCoefIscStr('');
      onUpdate?.();
    } catch (error) {
      // Error handling is done in the hooks with toast
    }
  };

  const handleSaveInverter = async () => {
    if (!inverterForm.fabricante || !inverterForm.modelo || inverterForm.potenciaSaidaCA <= 0) {
      toast({ 
        variant: 'destructive', 
        title: 'Campos obrigatórios', 
        description: 'Fabricante, Modelo e Potência Nominal de Saída (CA) são obrigatórios.'
      });
      return;
    }
    
    try {
      if (currentInverter) {
        await updateInverterMutation.mutateAsync({ id: currentInverter.id, ...inverterForm });
        toast({ title: 'Inversor atualizado com sucesso!' });
      } else {
        await createInverterMutation.mutateAsync(inverterForm);
        toast({ title: 'Inversor criado com sucesso!' });
      }
      
      setIsInverterDialogOpen(false);
      setCurrentInverter(null);
      setInverterForm({ 
        manufacturerId: '',
        fabricante: '', 
        modelo: '', 
        potenciaSaidaCA: 0, 
        tipoRede: '',
        potenciaFvMax: 0,
        tensaoCcMax: 0,
        numeroMppt: 0,
        stringsPorMppt: 0,
        eficienciaMax: 0,
        correnteEntradaMax: 0,
        potenciaAparenteMax: 0,
      });
      onUpdate?.();
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Verifique os dados e tente novamente.';
      toast({ 
        variant: 'destructive',
        title: 'Erro ao salvar inversor', 
        description: errorMessage
      });
    }
  };

  const handleDeleteModule = async (module: SolarModule) => {
    // Verificar se é um equipamento público
    if (module.userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser excluído',
        description: 'Este é um equipamento público do sistema e não pode ser removido.'
      });
      return;
    }

    try {
      await deleteModuleMutation.mutateAsync(module.id);
      toast({ title: 'Módulo excluído.' });
      onUpdate?.();
    } catch (error) {
      toast({ 
        variant: 'destructive',
        title: 'Erro ao excluir módulo', 
        description: 'Tente novamente.' 
      });
    }
  };

  const handleDeleteInverter = async (inverter: Inverter) => {
    // Verificar se é um equipamento público
    if (inverter.userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser excluído',
        description: 'Este é um equipamento público do sistema e não pode ser removido.'
      });
      return;
    }

    try {
      await deleteInverterMutation.mutateAsync(inverter.id);
      toast({ title: 'Inversor excluído.' });
      onUpdate?.();
    } catch (error) {
      toast({ 
        variant: 'destructive',
        title: 'Erro ao excluir inversor', 
        description: 'Tente novamente.' 
      });
    }
  };

  const handleEditModule = (module: SolarModule) => {
    // Verificar se é um equipamento público
    if (module.userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser editado',
        description: 'Este é um equipamento público do sistema e não pode ser modificado. Você pode criar uma cópia com suas próprias especificações.'
      });
      return;
    }

    setCurrentModule(module);
    setModuleForm({
      manufacturerId: module.manufacturerId || '',
      fabricante: module.fabricante,
      modelo: module.modelo,
      potenciaNominal: module.potenciaNominal,
      larguraMm: module.larguraMm,
      alturaMm: module.alturaMm,
      espessuraMm: module.espessuraMm,
      vmpp: module.vmpp,
      impp: module.impp,
      voc: module.voc,
      isc: module.isc,
      tipoCelula: module.tipoCelula,
      eficiencia: module.eficiencia,
      numeroCelulas: module.numeroCelulas,
      tempCoefPmax: module.tempCoefPmax,
      tempCoefVoc: module.tempCoefVoc,
      tempCoefIsc: module.tempCoefIsc,
      aRef: module.aRef || 1.8,
      iLRef: module.iLRef || module.isc || 0,
      iORef: module.iORef || 2.5e-12,
      rS: module.rS || 0,
      rShRef: module.rShRef || 0,
      pesoKg: module.pesoKg,
      datasheetUrl: module.datasheetUrl,
      certificacoes: module.certificacoes,
      garantiaAnos: module.garantiaAnos,
      tolerancia: module.tolerancia || 0
    });

    // Populate temperature coefficient strings
    setTempCoefPmaxStr(module.tempCoefPmax?.toString() || '');
    setTempCoefVocStr(module.tempCoefVoc?.toString() || '');
    setTempCoefIscStr(module.tempCoefIsc?.toString() || '');

    setIsModuleDialogOpen(true);
  };

  const handleEditInverter = (inverter: Inverter) => {
    // Verificar se é um equipamento público
    if (inverter.userId === 'public-equipment-system') {
      toast({
        variant: 'destructive',
        title: 'Equipamento público não pode ser editado',
        description: 'Este é um equipamento público do sistema e não pode ser modificado. Você pode criar uma cópia com suas próprias especificações.'
      });
      return;
    }

    setCurrentInverter(inverter);
    setInverterForm({
      manufacturerId: inverter.manufacturerId || '',
      fabricante: inverter.fabricante,
      modelo: inverter.modelo,
      potenciaSaidaCA: inverter.potenciaSaidaCA,
      tipoRede: inverter.tipoRede,
      potenciaFvMax: inverter.potenciaFvMax,
      tensaoCcMax: inverter.tensaoCcMax,
      numeroMppt: inverter.numeroMppt,
      stringsPorMppt: inverter.stringsPorMppt,
      faixaMppt: inverter.faixaMppt,
      correnteEntradaMax: inverter.correnteEntradaMax,
      potenciaAparenteMax: inverter.potenciaAparenteMax,
      correnteSaidaMax: inverter.correnteSaidaMax,
      tensaoSaidaNominal: inverter.tensaoSaidaNominal,
      frequenciaNominal: inverter.frequenciaNominal,
      eficienciaMax: inverter.eficienciaMax,
      eficienciaEuropeia: inverter.eficienciaEuropeia,
      eficienciaMppt: inverter.eficienciaMppt,
      protecoes: inverter.protecoes,
      certificacoes: inverter.certificacoes,
      grauProtecao: inverter.grauProtecao,
      dimensoes: inverter.dimensoes,
      pesoKg: inverter.pesoKg,
      temperaturaOperacao: inverter.temperaturaOperacao,
      garantiaAnos: inverter.garantiaAnos,
      datasheetUrl: inverter.datasheetUrl,
      precoReferencia: inverter.precoReferencia
    });
    setIsInverterDialogOpen(true);
  };

  const handleNewModule = () => {
    setCurrentModule(null);
    setModuleForm({
      manufacturerId: '',
      fabricante: '',
      modelo: '',
      potenciaNominal: 0,
      eficiencia: 0,
      vmpp: 0,
      impp: 0,
      voc: 0,
      isc: 0,
      tipoCelula: '',
      numeroCelulas: 0,
      tempCoefPmax: 0,
      tempCoefVoc: 0,
      tempCoefIsc: 0,
      aRef: 1.8,
      iLRef: 0,
      iORef: 2.5e-12,
      rS: 0,
      rShRef: 0,
      garantiaAnos: 25,
      larguraMm: 0,
      alturaMm: 0,
      espessuraMm: 0,
      pesoKg: 0,
    });
    setTempCoefPmaxStr('');
    setTempCoefVocStr('');
    setTempCoefIscStr('');
    setIsModuleDialogOpen(true);
  };

  const handleNewInverter = () => {
    setCurrentInverter(null);
    setInverterForm({ 
      manufacturerId: '',
      fabricante: '', 
      modelo: '', 
      potenciaSaidaCA: 0, 
      tipoRede: '',
      potenciaFvMax: 0,
      tensaoCcMax: 0,
      numeroMppt: 0,
      stringsPorMppt: 0,
      eficienciaMax: 0,
      correnteEntradaMax: 0,
      potenciaAparenteMax: 0,
    });
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
              modules.map((module: any) => {
                const isPublic = module.userId === 'public-equipment-system';
                return (
                  <div key={module.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{module.fabricante} {module.modelo}</span>
                        <span className="text-sm text-slate-400">({module.potenciaNominal}W)</span>
                        {isPublic && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            <Lock className="w-3 h-3" />
                            <span>Público</span>
                          </div>
                        )}
                      </div>
                      {module.tipoCelula && (
                        <span className="text-xs text-slate-500 block">{module.tipoCelula}</span>
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
              inverters.map((inverter: any) => {
                const isPublic = inverter.userId === 'public-equipment-system';
                return (
                  <div key={inverter.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{inverter.fabricante} {inverter.modelo}</span>
                        <span className="text-sm text-slate-400">({inverter.potenciaSaidaCA}W)</span>
                        {isPublic && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            <Lock className="w-3 h-3" />
                            <span>Público</span>
                          </div>
                        )}
                      </div>
                      {inverter.tipoRede && (
                        <span className="text-xs text-slate-500 block">{inverter.tipoRede}</span>
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
                    value={moduleForm.fabricante || ''} 
                    onValueChange={(value) => setModuleForm(prev => ({ ...prev, fabricante: value }))}
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
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Input
                    id="modelo"
                    value={moduleForm.modelo}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, modelo: e.target.value }))}
                    placeholder="ex: Tiger Pro 72HC 550W"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="potenciaNominal">Potência Nominal (W) *</Label>
                  <Input
                    id="potenciaNominal"
                    type="number"
                    value={moduleForm.potenciaNominal || ''}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, potenciaNominal: parseFloat(e.target.value) || 0 }))}
                    placeholder="550"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eficiencia">Eficiência (%)</Label>
                  <Input
                    id="eficiencia"
                    type="number"
                    step="0.1"
                    value={moduleForm.eficiencia || ''}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, eficiencia: parseFloat(e.target.value) || 0 }))}
                    placeholder="21.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoCelula">Tipo de Célula</Label>
                  <Select onValueChange={(value) => setModuleForm(prev => ({ ...prev, tipoCelula: value }))}>
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
                    value={moduleForm.numeroCelulas || ''}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, numeroCelulas: parseInt(e.target.value) || 0 }))}
                    placeholder="144"
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
                    placeholder="41.8"
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
                    placeholder="13.16"
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
                    placeholder="49.8"
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
                    placeholder="13.90"
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
                      placeholder="-0.40"
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
                      placeholder="-0.27"
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
                      placeholder="0.048"
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
                    placeholder="1.8"
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
                    placeholder="13.90"
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
                    placeholder="2.5e-12"
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
                    placeholder="0.5"
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
                    placeholder="500"
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
                    value={moduleForm.larguraMm || ''}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, larguraMm: parseInt(e.target.value) || 0 }))}
                    placeholder="1134"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alturaMm">Altura (mm)</Label>
                  <Input
                    id="alturaMm"
                    type="number"
                    value={moduleForm.alturaMm || ''}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, alturaMm: parseInt(e.target.value) || 0 }))}
                    placeholder="2274"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="espessuraMm">Espessura (mm)</Label>
                  <Input
                    id="espessuraMm"
                    type="number"
                    value={moduleForm.espessuraMm || ''}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, espessuraMm: parseInt(e.target.value) || 0 }))}
                    placeholder="35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pesoKg">Peso (kg)</Label>
                  <Input
                    id="pesoKg"
                    type="number"
                    step="0.1"
                    value={moduleForm.pesoKg || ''}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, pesoKg: parseFloat(e.target.value) || 0 }))}
                    placeholder="27.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="garantiaAnos">Garantia (anos)</Label>
                  <Input
                    id="garantiaAnos"
                    type="number"
                    value={moduleForm.garantiaAnos || 25}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, garantiaAnos: parseInt(e.target.value) || 25 }))}
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
                  value={inverterForm.fabricante || ''} 
                  onValueChange={(value) => setInverterForm(prev => ({ ...prev, fabricante: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fabricante" />
                  </SelectTrigger>
                  <SelectContent>
                    {inverterManufacturersList.map((manufacturer: any) => (
                      <SelectItem key={manufacturer.id} value={manufacturer.name}>
                        {manufacturer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Input 
                  value={inverterForm.modelo || ''} 
                  onChange={e => setInverterForm(prev => ({ ...prev, modelo: e.target.value }))} 
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
                    value={inverterForm.potenciaSaidaCA || ''} 
                    onChange={e => setInverterForm(prev => ({ ...prev, potenciaSaidaCA: parseFloat(e.target.value) || 0 }))} 
                    className="bg-background border-border" 
                    placeholder="8200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Rede *</Label>
                  <Select
                    value={inverterForm.tipoRede || ''}
                    onValueChange={value => setInverterForm(prev => ({ ...prev, tipoRede: value }))}
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
                    value={inverterForm.potenciaFvMax || ''} 
                    onChange={e => setInverterForm(prev => ({ ...prev, potenciaFvMax: parseFloat(e.target.value) || 0 }))} 
                    className="bg-background border-border" 
                    placeholder="12300"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tensão CC Máx (V)</Label>
                  <Input 
                    type="number" 
                    value={inverterForm.tensaoCcMax || ''} 
                    onChange={e => setInverterForm(prev => ({ ...prev, tensaoCcMax: parseFloat(e.target.value) || 0 }))} 
                    className="bg-background border-border" 
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número de MPPTs</Label>
                  <Input 
                    type="number" 
                    value={inverterForm.numeroMppt || ''} 
                    onChange={e => setInverterForm(prev => ({ ...prev, numeroMppt: parseInt(e.target.value) || 0 }))} 
                    className="bg-background border-border" 
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade de strings por MPPT</Label>
                  <Input 
                    type="number" 
                    value={inverterForm.stringsPorMppt || ''} 
                    onChange={e => setInverterForm(prev => ({ ...prev, stringsPorMppt: parseInt(e.target.value) || 0 }))} 
                    className="bg-background border-border" 
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eficiência Máx (%)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={inverterForm.eficienciaMax || ''} 
                    onChange={e => setInverterForm(prev => ({ ...prev, eficienciaMax: parseFloat(e.target.value) || 0 }))} 
                    className="bg-background border-border" 
                    placeholder="97.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Corrente Entrada Máx (A)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={inverterForm.correnteEntradaMax || ''} 
                    onChange={e => setInverterForm(prev => ({ ...prev, correnteEntradaMax: parseFloat(e.target.value) || 0 }))} 
                    className="bg-background border-border" 
                    placeholder="18.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Potência Aparente Máx (VA)</Label>
                  <Input 
                    type="number" 
                    value={inverterForm.potenciaAparenteMax || ''} 
                    onChange={e => setInverterForm(prev => ({ ...prev, potenciaAparenteMax: parseFloat(e.target.value) || 0 }))} 
                    className="bg-background border-border" 
                    placeholder="8200"
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