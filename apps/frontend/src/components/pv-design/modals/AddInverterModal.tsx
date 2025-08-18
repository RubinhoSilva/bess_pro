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
  'Monofásico',
  'Bifásico',
  'Trifásico',
  'Híbrido'
];

const MANUFACTURERS = [
  'Fronius',
  'SMA',
  'ABB',
  'Growatt',
  'Huawei',
  'Sungrow',
  'Ginlong (Solis)',
  'GoodWe',
  'WEG',
  'Eltek',
  'Outro'
];

export function AddInverterModal({ open, onOpenChange, onInverterAdded, onInverterSelected }: AddInverterModalProps) {
  const [formData, setFormData] = useState<InverterInput>({
    fabricante: '',
    modelo: '',
    potenciaSaidaCA: 0,
    tipoRede: '',
    potenciaFvMax: 0,
    tensaoCcMax: 0,
    numeroMppt: 2,
    stringsPorMppt: 1,
    faixaMppt: '',
    correnteEntradaMax: 0,
    potenciaAparenteMax: 0,
    correnteSaidaMax: 0,
    tensaoSaidaNominal: '',
    frequenciaNominal: 60,
    eficienciaMax: 0,
    eficienciaEuropeia: 0,
    eficienciaMppt: 0,
    protecoes: [],
    certificacoes: [],
    grauProtecao: 'IP65',
    dimensoes: {
      larguraMm: 0,
      alturaMm: 0,
      profundidadeMm: 0,
    },
    pesoKg: 0,
    temperaturaOperacao: '-25°C a +60°C',
    garantiaAnos: 5,
    datasheetUrl: '',
    precoReferencia: 0,
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
        fabricante: '',
        modelo: '',
        potenciaSaidaCA: 0,
        tipoRede: '',
        potenciaFvMax: 0,
        tensaoCcMax: 0,
        numeroMppt: 2,
        stringsPorMppt: 1,
        faixaMppt: '',
        correnteEntradaMax: 0,
        potenciaAparenteMax: 0,
        correnteSaidaMax: 0,
        tensaoSaidaNominal: '',
        frequenciaNominal: 60,
        eficienciaMax: 0,
        eficienciaEuropeia: 0,
        eficienciaMppt: 0,
        protecoes: [],
        certificacoes: [],
        grauProtecao: 'IP65',
        dimensoes: {
          larguraMm: 0,
          alturaMm: 0,
          profundidadeMm: 0,
        },
        pesoKg: 0,
        temperaturaOperacao: '-25°C a +60°C',
        garantiaAnos: 5,
        datasheetUrl: '',
        precoReferencia: 0,
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
                  placeholder="ex: Primo 8.2-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="potenciaSaidaCA">Potência Saída CA (W) *</Label>
                <Input
                  id="potenciaSaidaCA"
                  type="number"
                  value={formData.potenciaSaidaCA || ''}
                  onChange={(e) => updateFormData('potenciaSaidaCA', parseFloat(e.target.value) || 0)}
                  placeholder="8200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoRede">Tipo de Rede *</Label>
                <Select onValueChange={(value) => updateFormData('tipoRede', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de rede" />
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORK_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="potenciaFvMax">Potência FV Máxima (W)</Label>
                <Input
                  id="potenciaFvMax"
                  type="number"
                  value={formData.potenciaFvMax || ''}
                  onChange={(e) => updateFormData('potenciaFvMax', parseFloat(e.target.value) || 0)}
                  placeholder="12300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tensaoCcMax">Tensão CC Máxima (V)</Label>
                <Input
                  id="tensaoCcMax"
                  type="number"
                  value={formData.tensaoCcMax || ''}
                  onChange={(e) => updateFormData('tensaoCcMax', parseFloat(e.target.value) || 0)}
                  placeholder="1000"
                />
              </div>
            </div>
          </div>

          {/* Especificações Técnicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Especificações Técnicas</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroMppt">Número de MPPT</Label>
                <Input
                  id="numeroMppt"
                  type="number"
                  value={formData.numeroMppt || ''}
                  onChange={(e) => updateFormData('numeroMppt', parseInt(e.target.value) || 2)}
                  placeholder="2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stringsPorMppt">Strings por MPPT</Label>
                <Input
                  id="stringsPorMppt"
                  type="number"
                  value={formData.stringsPorMppt || ''}
                  onChange={(e) => updateFormData('stringsPorMppt', parseInt(e.target.value) || 1)}
                  placeholder="2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faixaMppt">Faixa MPPT</Label>
                <Input
                  id="faixaMppt"
                  value={formData.faixaMppt || ''}
                  onChange={(e) => updateFormData('faixaMppt', e.target.value)}
                  placeholder="80V - 800V"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eficienciaMax">Eficiência Máxima (%)</Label>
                <Input
                  id="eficienciaMax"
                  type="number"
                  step="0.1"
                  value={formData.eficienciaMax || ''}
                  onChange={(e) => updateFormData('eficienciaMax', parseFloat(e.target.value) || 0)}
                  placeholder="96.8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eficienciaEuropeia">Eficiência Europeia (%)</Label>
                <Input
                  id="eficienciaEuropeia"
                  type="number"
                  step="0.1"
                  value={formData.eficienciaEuropeia || ''}
                  onChange={(e) => updateFormData('eficienciaEuropeia', parseFloat(e.target.value) || 0)}
                  placeholder="96.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tensaoSaidaNominal">Tensão Saída Nominal</Label>
                <Input
                  id="tensaoSaidaNominal"
                  value={formData.tensaoSaidaNominal || ''}
                  onChange={(e) => updateFormData('tensaoSaidaNominal', e.target.value)}
                  placeholder="220V / 380V"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequenciaNominal">Frequência Nominal (Hz)</Label>
                <Input
                  id="frequenciaNominal"
                  type="number"
                  value={formData.frequenciaNominal || 60}
                  onChange={(e) => updateFormData('frequenciaNominal', parseFloat(e.target.value) || 60)}
                  placeholder="60"
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
                  value={formData.dimensoes?.larguraMm || ''}
                  onChange={(e) => updateFormData('dimensoes', { larguraMm: parseInt(e.target.value) || 0 })}
                  placeholder="431"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alturaMm">Altura (mm)</Label>
                <Input
                  id="alturaMm"
                  type="number"
                  value={formData.dimensoes?.alturaMm || ''}
                  onChange={(e) => updateFormData('dimensoes', { alturaMm: parseInt(e.target.value) || 0 })}
                  placeholder="645"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profundidadeMm">Profundidade (mm)</Label>
                <Input
                  id="profundidadeMm"
                  type="number"
                  value={formData.dimensoes?.profundidadeMm || ''}
                  onChange={(e) => updateFormData('dimensoes', { profundidadeMm: parseInt(e.target.value) || 0 })}
                  placeholder="204"
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
                  placeholder="22.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="garantiaAnos">Garantia (anos)</Label>
                <Input
                  id="garantiaAnos"
                  type="number"
                  value={formData.garantiaAnos || 5}
                  onChange={(e) => updateFormData('garantiaAnos', parseInt(e.target.value) || 5)}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grauProtecao">Grau de Proteção</Label>
                <Input
                  id="grauProtecao"
                  value={formData.grauProtecao || ''}
                  onChange={(e) => updateFormData('grauProtecao', e.target.value)}
                  placeholder="IP65"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperaturaOperacao">Temperatura Operação</Label>
                <Input
                  id="temperaturaOperacao"
                  value={formData.temperaturaOperacao || ''}
                  onChange={(e) => updateFormData('temperaturaOperacao', e.target.value)}
                  placeholder="-25°C a +60°C"
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