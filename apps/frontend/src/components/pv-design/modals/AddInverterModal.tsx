import React, { useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inverterService } from '@/services/InverterService';
import { type CreateInverterRequest, ManufacturerType, Manufacturer } from '@bess-pro/shared';
import { toast } from 'react-hot-toast';

interface AddInverterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInverterAdded?: (inverter: any) => void;
  onInverterSelected?: (inverterId: string) => void;
}

const NETWORK_TYPES = [
  { value: 'monofasico-220v', label: 'Monofásico 220V' },
  { value: 'bifasico-220v', label: 'Bifásico 220V' },
  { value: 'trifasico-220v', label: 'Trifásico 220V' },
  { value: 'trifasico-380v', label: 'Trifásico 380V' },
];

const MANUFACTURERS = [
  'WEG',
  'Fronius',
  'SMA', 
  'ABB',
  'Sungrow',
  'Goodwe',
  'Growatt',
  'Huawei',
  'SolarEdge',
  'Enphase',
  'Canadian Solar',
  'Outro'
];

export function AddInverterModal({ open, onOpenChange, onInverterAdded, onInverterSelected }: AddInverterModalProps) {
  const [formData, setFormData] = useState<CreateInverterRequest>({
    manufacturerId: '',
    model: '',
    power: {
      ratedACPower: 0,
      maxPVPower: 0,
      shortCircuitVoltageMax: 0,
      maxInputCurrent: 0,
      maxApparentPower: 0,
    },
    mppt: {
      numberOfMppts: 0,
      stringsPerMppt: 0,
    },
    electrical: {
      maxEfficiency: 0,
      gridType: 'monofasico',
    },
    metadata: {
      warranty: 5,
      certifications: [],
      connectionType: 'on-grid',
    }
  });

  const [manufacturerName, setManufacturerName] = useState('');

  const queryClient = useQueryClient();
  
  const createInverter = useMutation({
    mutationFn: (data: CreateInverterRequest) => inverterService.createInverter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast.success('Inversor criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar inversor');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manufacturerName || !formData.model || !formData.power.ratedACPower) {
      toast.error('Preencha todos os campos obrigatórios');
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
          ratedACPower: 0,
          maxPVPower: 0,
          shortCircuitVoltageMax: 0,
          maxInputCurrent: 0,
          maxApparentPower: 0,
        },
        mppt: {
          numberOfMppts: 0,
          stringsPerMppt: 0,
        },
        electrical: {
          maxEfficiency: 0,
          gridType: 'monofasico',
        },
        metadata: {
          warranty: 5,
          certifications: [],
          connectionType: 'on-grid',
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
            Adicionar Novo Inversor
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do novo inversor que será adicionado ao banco de dados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fabricante *</Label>
              <Input 
                value={manufacturerName} 
                onChange={e => {
                  setManufacturerName(e.target.value);
                  setFormData(prev => ({ ...prev, manufacturerId: e.target.value }));
                }} 
                className="bg-background border-border" 
                placeholder="Ex: Fronius"
              />
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
              Adicionar Inversor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}