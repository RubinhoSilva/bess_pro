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
import { useCreateSolarModule, type SolarModuleInput } from '@/hooks/equipment-hooks';

interface AddSolarModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModuleAdded?: (module: any) => void;
  onModuleSelected?: (moduleId: string) => void;
}

const CELL_TYPES = [
  'Monocristalino',
  'Policristalino',
  'Perc',
  'HJT',
  'TOPCon',
  'Bifacial'
];

const MANUFACTURERS = [
  'Jinko Solar',
  'Canadian Solar',
  'Trina Solar',
  'Risen Energy',
  'JA Solar',
  'LONGi Solar',
  'BYD',
  'GCL',
  'Hanwha Q CELLS',
  'First Solar',
  'Outro'
];

export function AddSolarModuleModal({ open, onOpenChange, onModuleAdded, onModuleSelected }: AddSolarModuleModalProps) {
  const [formData, setFormData] = useState<SolarModuleInput>({
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

  const createModule = useCreateSolarModule();

  // Auto-populate iLRef when isc changes
  useEffect(() => {
    if (formData.isc && formData.isc > 0 && (!formData.iLRef || formData.iLRef === 0)) {
      setFormData(prev => ({ ...prev, iLRef: prev.isc }));
    }
  }, [formData.isc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fabricante || !formData.modelo || !formData.potenciaNominal) {
      return;
    }

    try {
      const newModule = await createModule.mutateAsync(formData);
      onModuleAdded?.(newModule);
      
      // Auto-select the newly added module
      if (onModuleSelected && newModule?.id) {
        onModuleSelected(newModule.id);
      }
      
      onOpenChange(false);
      
      // Reset form
      setFormData({
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
    } catch (error) {
    }
  };

  const updateFormData = (field: keyof SolarModuleInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Novo Módulo Solar
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do novo módulo solar que será adicionado ao banco de dados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fabricante">Fabricante *</Label>
                <Select onValueChange={(value) => updateFormData('fabricante', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fabricante" />
                  </SelectTrigger>
                  <SelectContent>
                    {MANUFACTURERS.map(manufacturer => (
                      <SelectItem key={manufacturer} value={manufacturer}>
                        {manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo *</Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={(e) => updateFormData('modelo', e.target.value)}
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
                  value={formData.potenciaNominal || ''}
                  onChange={(e) => updateFormData('potenciaNominal', parseFloat(e.target.value) || 0)}
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
                  value={formData.eficiencia || ''}
                  onChange={(e) => updateFormData('eficiencia', parseFloat(e.target.value) || 0)}
                  placeholder="21.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoCelula">Tipo de Célula</Label>
                <Select onValueChange={(value) => updateFormData('tipoCelula', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de célula" />
                  </SelectTrigger>
                  <SelectContent>
                    {CELL_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroCelulas">Número de Células</Label>
                <Input
                  id="numeroCelulas"
                  type="number"
                  value={formData.numeroCelulas || ''}
                  onChange={(e) => updateFormData('numeroCelulas', parseInt(e.target.value) || 0)}
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
                  value={formData.vmpp || ''}
                  onChange={(e) => updateFormData('vmpp', parseFloat(e.target.value) || 0)}
                  placeholder="41.8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impp">Corrente de Máxima Potência (ImP)</Label>
                <Input
                  id="impp"
                  type="number"
                  step="0.1"
                  value={formData.impp || ''}
                  onChange={(e) => updateFormData('impp', parseFloat(e.target.value) || 0)}
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
                  value={formData.voc || ''}
                  onChange={(e) => updateFormData('voc', parseFloat(e.target.value) || 0)}
                  placeholder="49.8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isc">Corrente Curto-Circuito (Isc)</Label>
                <Input
                  id="isc"
                  type="number"
                  step="0.1"
                  value={formData.isc || ''}
                  onChange={(e) => updateFormData('isc', parseFloat(e.target.value) || 0)}
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
                    value={formData.tempCoefPmax || ''}
                    onChange={(e) => updateFormData('tempCoefPmax', e.target.value)}
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
                    value={formData.tempCoefVoc || ''}
                    onChange={(e) => updateFormData('tempCoefVoc', e.target.value)}
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
                    value={formData.tempCoefIsc || ''}
                    onChange={(e) => updateFormData('tempCoefIsc', e.target.value)}
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
                  value={formData.aRef || ''}
                  onChange={(e) => updateFormData('aRef', parseFloat(e.target.value) || 0)}
                  placeholder="1.8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iLRef">Corrente de Luz Fotogerada (A)</Label>
                <Input
                  id="iLRef"
                  type="number"
                  step="0.1"
                  value={formData.iLRef || ''}
                  onChange={(e) => updateFormData('iLRef', parseFloat(e.target.value) || 0)}
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
                  value={formData.iORef || ''}
                  onChange={(e) => updateFormData('iORef', parseFloat(e.target.value) || 0)}
                  placeholder="2.5e-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rS">Resistência série (ohms)</Label>
                <Input
                  id="rS"
                  type="number"
                  step="0.01"
                  value={formData.rS || ''}
                  onChange={(e) => updateFormData('rS', parseFloat(e.target.value) || 0)}
                  placeholder="0.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rShRef">Resistência shunt (ohms)</Label>
                <Input
                  id="rShRef"
                  type="number"
                  step="1"
                  value={formData.rShRef || ''}
                  onChange={(e) => updateFormData('rShRef', parseFloat(e.target.value) || 0)}
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
                  value={formData.larguraMm || ''}
                  onChange={(e) => updateFormData('larguraMm', parseInt(e.target.value) || 0)}
                  placeholder="1134"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alturaMm">Altura (mm)</Label>
                <Input
                  id="alturaMm"
                  type="number"
                  value={formData.alturaMm || ''}
                  onChange={(e) => updateFormData('alturaMm', parseInt(e.target.value) || 0)}
                  placeholder="2274"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="espessuraMm">Espessura (mm)</Label>
                <Input
                  id="espessuraMm"
                  type="number"
                  value={formData.espessuraMm || ''}
                  onChange={(e) => updateFormData('espessuraMm', parseInt(e.target.value) || 0)}
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
                  value={formData.pesoKg || ''}
                  onChange={(e) => updateFormData('pesoKg', parseFloat(e.target.value) || 0)}
                  placeholder="27.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="garantiaAnos">Garantia (anos)</Label>
                <Input
                  id="garantiaAnos"
                  type="number"
                  value={formData.garantiaAnos || 25}
                  onChange={(e) => updateFormData('garantiaAnos', parseInt(e.target.value) || 25)}
                  placeholder="25"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createModule.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createModule.isPending || !formData.fabricante || !formData.modelo || !formData.potenciaNominal}
            >
              {createModule.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar Módulo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}