import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { inverterService } from '@/services/InverterService';
import { manufacturerService } from '@/services/ManufacturerService';
import { type CreateInverterRequest, ManufacturerType, Manufacturer } from '@bess-pro/shared';
import { useToast } from '@/components/ui/use-toast';
import { CalculationConstants } from '@/constants/CalculationConstants';

interface AddInverterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInverterAdded?: (inverter: any) => void;
  onInverterSelected?: (inverterId: string) => void;
  initialData?: any; // Dados iniciais para modo de edição
}

const NETWORK_TYPES = [
  { value: 'monofasico-220v', label: 'Monofásico 220V' },
  { value: 'bifasico-220v', label: 'Bifásico 220V' },
  { value: 'trifasico-220v', label: 'Trifásico 220V' },
  { value: 'trifasico-380v', label: 'Trifásico 380V' },
];


export function AddInverterModal({ open, onOpenChange, onInverterAdded, onInverterSelected, initialData }: AddInverterModalProps) {
  const { toast } = useToast();
  
  // Buscar fabricantes da API
  const { data: manufacturersData, isLoading: loadingManufacturers } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturerService.getManufacturers({}),
    staleTime: 15 * 60 * 1000,
  });
  
  const manufacturers = manufacturersData?.manufacturers || [];
  const [formData, setFormData] = useState<CreateInverterRequest>({
    manufacturerId: '',
    model: '',
    power: {
      ratedACPower: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_POWER_W,
      maxPVPower: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_PV_MAX_W,
      shortCircuitVoltageMax: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_DC_MAX_V,
      maxInputCurrent: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_INPUT_MAX_A,
      maxApparentPower: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_APPARENT_POWER_VA,
    },
    mppt: {
      numberOfMppts: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_MPPT_COUNT,
      stringsPerMppt: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_STRINGS_PER_MPPT,
    },
    electrical: {
      maxEfficiency: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_EFFICIENCY,
      gridType: CalculationConstants.FORM_DEFAULTS.INVERTER_FORM.DEFAULT_GRID_TYPE as any,
    },
    metadata: {
      warranty: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_WARRANTY_YEARS,
      certifications: [...CalculationConstants.FORM_DEFAULTS.INVERTER_FORM.DEFAULT_CERTIFICATIONS],
      connectionType: CalculationConstants.FORM_DEFAULTS.INVERTER_FORM.DEFAULT_CONNECTION_TYPE,
    }
  });

  const [manufacturerName, setManufacturerName] = useState('');

  // Carregar dados iniciais no modo de edição
  useEffect(() => {
    if (initialData) {

      // Mapear dados iniciais para o formulário
      const mappedData = {
        manufacturerId: initialData.manufacturer?.id || initialData.manufacturer || '',
        model: initialData.model || '',
        power: {
          ratedACPower: initialData.power?.ratedACPower || CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_POWER_W,
          maxPVPower: initialData.power?.maxPVPower || CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_PV_MAX_W,
          shortCircuitVoltageMax: initialData.power?.shortCircuitVoltageMax || CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_DC_MAX_V,
          maxInputCurrent: initialData.power?.maxInputCurrent || CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_INPUT_MAX_A,
          maxApparentPower: initialData.power?.maxApparentPower || CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_APPARENT_POWER_VA,
        },
        mppt: {
          numberOfMppts: initialData.mppt?.numberOfMppts || CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_MPPT_COUNT,
          stringsPerMppt: initialData.mppt?.stringsPerMppt || CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_STRINGS_PER_MPPT,
        },
        electrical: {
          maxEfficiency: initialData.electrical?.maxEfficiency || CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_EFFICIENCY,
          gridType: initialData.electrical?.gridType || CalculationConstants.FORM_DEFAULTS.INVERTER_FORM.DEFAULT_GRID_TYPE,
        },
        metadata: {
          warranty: initialData.metadata?.warranty || CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_WARRANTY_YEARS,
          certifications: initialData.metadata?.certifications || CalculationConstants.FORM_DEFAULTS.INVERTER_FORM.DEFAULT_CERTIFICATIONS,
          connectionType: initialData.metadata?.connectionType || CalculationConstants.FORM_DEFAULTS.INVERTER_FORM.DEFAULT_CONNECTION_TYPE,
        }
      };

      setFormData(mappedData);
      
      // Para o inversor, precisamos definir o manufacturerName também
      if (initialData.manufacturer) {
        setManufacturerName(initialData.manufacturer.name || initialData.manufacturer);
      }
    }
  }, [initialData]);

  const queryClient = useQueryClient();
  
  const createInverter = useMutation({
    mutationFn: (data: CreateInverterRequest) => inverterService.createInverter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast({
        title: "Sucesso",
        description: "Inversor criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || 'Erro ao criar inversor',
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manufacturerName || !formData.model || !formData.power.ratedACPower) {
      toast({
        title: "Erro",
        description: 'Preencha todos os campos obrigatórios',
        variant: "destructive",
      });
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        manufacturerId: manufacturerName
      };
      const newInverter = await createInverter.mutateAsync(dataToSubmit);
      onInverterAdded?.(newInverter);
      
      // Auto-select the newly added inverter
      if (onInverterSelected && newInverter?.id) {
        onInverterSelected(newInverter.id);
      }
      
      onOpenChange(false);
      
      // Reset form
      setFormData({
        manufacturerId: '',
        model: '',
        power: {
          ratedACPower: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_POWER_W,
          maxPVPower: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_PV_MAX_W,
          shortCircuitVoltageMax: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_DC_MAX_V,
          maxInputCurrent: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_INPUT_MAX_A,
          maxApparentPower: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_APPARENT_POWER_VA,
        },
        mppt: {
          numberOfMppts: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_MPPT_COUNT,
          stringsPerMppt: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_STRINGS_PER_MPPT,
        },
        electrical: {
          maxEfficiency: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_EFFICIENCY,
          gridType: CalculationConstants.FORM_DEFAULTS.INVERTER_FORM.DEFAULT_GRID_TYPE as any,
        },
        metadata: {
          warranty: CalculationConstants.INVERTER_DEFAULTS.DEFAULT_INVERTER_WARRANTY_YEARS,
          certifications: [...CalculationConstants.FORM_DEFAULTS.INVERTER_FORM.DEFAULT_CERTIFICATIONS],
          connectionType: CalculationConstants.FORM_DEFAULTS.INVERTER_FORM.DEFAULT_CONNECTION_TYPE,
        }
      });
    } catch (error) {
    }
  };

  const updateFormData = (section: string, field: string, value: any) => {
    setFormData(prev => {
      if (section) {
        const sectionData = prev[section as keyof CreateInverterRequest];
        if (sectionData && typeof sectionData === 'object') {
          return {
            ...prev,
            [section]: {
              ...sectionData,
              [field]: value
            }
          };
        }
      }
      return { ...prev, [field]: value };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {initialData ? 'Editar Inversor' : 'Adicionar Novo Inversor'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Edite as informações do inversor.'
              : 'Preencha as informações do novo inversor que será adicionado ao banco de dados.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fabricante *</Label>
              <Select
                value={formData.manufacturerId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, manufacturerId: value }));
                  setManufacturerName(manufacturers.find(m => m.id === value)?.name || '');
                }}
                disabled={loadingManufacturers}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder={loadingManufacturers ? "Carregando..." : "Selecione o fabricante"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingManufacturers ? (
                    <SelectItem value="loading" disabled>Carregando fabricantes...</SelectItem>
                  ) : manufacturers.length === 0 ? (
                    <SelectItem value="no-manufacturers" disabled>Nenhum fabricante encontrado</SelectItem>
                  ) : (
                    manufacturers.map((manufacturer: any) => (
                      <SelectItem key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modelo *</Label>
              <Input 
                value={formData.model || ''} 
                onChange={e => updateFormData('', 'model', e.target.value)} 
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
                  value={formData.power.ratedACPower || ''} 
                  onChange={e => updateFormData('power', 'ratedACPower', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="8200"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Rede *</Label>
                <Select
                  value={formData.electrical.gridType || ''}
                  onValueChange={value => updateFormData('electrical', 'gridType', value)}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione o tipo de rede" />
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORK_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Potência FV Máx (W)</Label>
                <Input 
                  type="number" 
                  value={formData.power.maxPVPower || ''} 
                  onChange={e => updateFormData('power', 'maxPVPower', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="12300"
                />
              </div>
              <div className="space-y-2">
                <Label>Tensão CC Máx (V)</Label>
                <Input 
                  type="number" 
                  value={formData.power.shortCircuitVoltageMax || ''} 
                  onChange={e => updateFormData('power', 'shortCircuitVoltageMax', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label>Número de MPPTs</Label>
                <Input 
                  type="number" 
                  value={formData.mppt.numberOfMppts || ''} 
                  onChange={e => updateFormData('mppt', 'numberOfMppts', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantidade de strings por MPPT</Label>
                <Input 
                  type="number" 
                  value={formData.mppt.stringsPerMppt || ''} 
                  onChange={e => updateFormData('mppt', 'stringsPerMppt', parseInt(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label>Eficiência Máx (%)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={formData.electrical.maxEfficiency || ''} 
                  onChange={e => updateFormData('electrical', 'maxEfficiency', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="97.1"
                />
              </div>
              <div className="space-y-2">
                <Label>Corrente Entrada Máx (A)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={formData.power.maxInputCurrent || ''} 
                  onChange={e => updateFormData('power', 'maxInputCurrent', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="18.5"
                />
              </div>
              <div className="space-y-2">
                <Label>Potência Aparente Máx (VA)</Label>
                <Input 
                  type="number" 
                  value={formData.power.maxApparentPower || ''} 
                  onChange={e => updateFormData('power', 'maxApparentPower', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="8200"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createInverter.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createInverter.isPending || !formData.manufacturerId || !formData.model || !formData.power.ratedACPower}
            >
              {createInverter.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialData ? 'Atualizar Inversor' : 'Adicionar Inversor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}