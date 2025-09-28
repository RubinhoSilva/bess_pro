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
import { useCreateInverter, type InverterInput } from '@/hooks/equipment-hooks';

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
  const [formData, setFormData] = useState<InverterInput>({
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

  const createInverter = useCreateInverter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fabricante || !formData.modelo || !formData.potenciaSaidaCA) {
      return;
    }

    try {
      const newInverter = await createInverter.mutateAsync(formData);
      onInverterAdded?.(newInverter);
      
      // Auto-select the newly added inverter
      if (onInverterSelected && newInverter?.id) {
        onInverterSelected(newInverter.id);
      }
      
      onOpenChange(false);
      
      // Reset form
      setFormData({
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
    } catch (error) {
      console.error('Erro ao criar inversor:', error);
    }
  };

  const updateFormData = (field: keyof InverterInput, value: any) => {
    if (field === 'dimensoes') {
      setFormData(prev => ({ ...prev, dimensoes: { ...prev.dimensoes, ...value } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
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
                value={formData.fabricante || ''} 
                onChange={e => updateFormData('fabricante', e.target.value)} 
                className="bg-background border-border" 
                placeholder="Ex: Fronius"
              />
            </div>
            <div className="space-y-2">
              <Label>Modelo *</Label>
              <Input 
                value={formData.modelo || ''} 
                onChange={e => updateFormData('modelo', e.target.value)} 
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
                  value={formData.potenciaSaidaCA || ''} 
                  onChange={e => updateFormData('potenciaSaidaCA', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="8200"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Rede *</Label>
                <Select
                  value={formData.tipoRede || ''}
                  onValueChange={value => updateFormData('tipoRede', value)}
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
                  value={formData.potenciaFvMax || ''} 
                  onChange={e => updateFormData('potenciaFvMax', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="12300"
                />
              </div>
              <div className="space-y-2">
                <Label>Tensão CC Máx (V)</Label>
                <Input 
                  type="number" 
                  value={formData.tensaoCcMax || ''} 
                  onChange={e => updateFormData('tensaoCcMax', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label>Número de MPPTs</Label>
                <Input 
                  type="number" 
                  value={formData.numeroMppt || ''} 
                  onChange={e => updateFormData('numeroMppt', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantidade de strings por MPPT</Label>
                <Input 
                  type="number" 
                  value={formData.stringsPorMppt || ''} 
                  onChange={e => updateFormData('stringsPorMppt', parseInt(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label>Eficiência Máx (%)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={formData.eficienciaMax || ''} 
                  onChange={e => updateFormData('eficienciaMax', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="97.1"
                />
              </div>
              <div className="space-y-2">
                <Label>Corrente Entrada Máx (A)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={formData.correnteEntradaMax || ''} 
                  onChange={e => updateFormData('correnteEntradaMax', parseFloat(e.target.value) || 0)} 
                  className="bg-background border-border" 
                  placeholder="18.5"
                />
              </div>
              <div className="space-y-2">
                <Label>Potência Aparente Máx (VA)</Label>
                <Input 
                  type="number" 
                  value={formData.potenciaAparenteMax || ''} 
                  onChange={e => updateFormData('potenciaAparenteMax', parseFloat(e.target.value) || 0)} 
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
              disabled={createInverter.isPending || !formData.fabricante || !formData.modelo || !formData.potenciaSaidaCA}
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