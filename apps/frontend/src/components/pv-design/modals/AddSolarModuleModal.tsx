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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleService } from '@/services/ModuleService';
import { type CreateModuleRequest, CellType, CellTechnology } from '@bess-pro/shared';
import { toast } from 'react-hot-toast';

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
  const [formData, setFormData] = useState<CreateModuleRequest>({
    manufacturer: '',
    model: '',
    nominalPower: 0,
    specifications: {
      voc: 0,
      isc: 0,
      vmpp: 0,
      impp: 0,
      efficiency: 0,
      cellType: 'monocrystalline',
      numberOfCells: 0,
      technology: 'perc',
    },
    parameters: {
      temperature: {
        tempCoeffPmax: 0,
        tempCoeffVoc: 0,
        tempCoeffIsc: 0,
      },
      diode: {
        aRef: 1.8,
        iLRef: 0,
        iORef: 2.5e-12,
        rS: 0,
        rShRef: 0,
      },
      sapm: {
        a0: 0,
        a1: 0,
        a2: 0,
        a3: 0,
        a4: 0,
        b0: 0,
        b1: 0,
        b2: 0,
        b3: 0,
        b4: 0,
      },
      spectral: {
        am: 1.5,
        material: '',
        technology: '',
      },
      advanced: {
        alphaSc: 0,
        betaOc: 0,
        gammaR: 0,
      },
    },
    dimensions: {
      widthMm: 0,
      heightMm: 0,
      thicknessMm: 0,
      weightKg: 0,
    },
    metadata: {
      warranty: 25,
      certifications: [],
    }
  });

  // Temp string values for temperature coefficients (to allow free typing)
  const [tempCoefPmaxStr, setTempCoefPmaxStr] = useState<string>('');
  const [tempCoefVocStr, setTempCoefVocStr] = useState<string>('');
  const [tempCoefIscStr, setTempCoefIscStr] = useState<string>('');

  const queryClient = useQueryClient();
  
  const createModule = useMutation({
    mutationFn: (data: CreateModuleRequest) => moduleService.createModule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Módulo criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar módulo');
    },
  });

  // Auto-populate iLRef when isc changes
  useEffect(() => {
    if (formData.specifications.isc && formData.specifications.isc > 0 && (!formData.parameters.diode.iLRef || formData.parameters.diode.iLRef === 0)) {
      setFormData(prev => ({ 
        ...prev, 
        parameters: {
          ...prev.parameters,
          diode: {
            ...prev.parameters.diode,
            iLRef: prev.specifications.isc
          }
        }
      }));
    }
  }, [formData.specifications.isc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.manufacturer || !formData.model || !formData.nominalPower) {
      return;
    }

    // Convert temperature coefficient strings to numbers
    const dataToSave: CreateModuleRequest = {
      ...formData,
      parameters: {
        ...formData.parameters,
        temperature: {
          tempCoeffPmax: tempCoefPmaxStr ? parseFloat(tempCoefPmaxStr) / 100 || 0 : 0,
          tempCoeffVoc: tempCoefVocStr ? parseFloat(tempCoefVocStr) / 100 || 0 : 0,
          tempCoeffIsc: tempCoefIscStr ? parseFloat(tempCoefIscStr) / 100 || 0 : 0,
        },
        advanced: {
          alphaSc: tempCoefPmaxStr ? parseFloat(tempCoefPmaxStr) / 100 || 0 : 0,
          betaOc: tempCoefVocStr ? parseFloat(tempCoefVocStr) / 100 || 0 : 0,
          gammaR: tempCoefIscStr ? parseFloat(tempCoefIscStr) / 100 || 0 : 0,
        }
      }
    };

    try {
      const newModule = await createModule.mutateAsync(dataToSave);
      onModuleAdded?.(newModule);

      // Auto-select the newly added module
      if (onModuleSelected && newModule?.id) {
        onModuleSelected(newModule.id);
      }

      onOpenChange(false);

      // Reset form
      setFormData({
        manufacturer: '',
        model: '',
        nominalPower: 0,
        specifications: {
          voc: 0,
          isc: 0,
          vmpp: 0,
          impp: 0,
          efficiency: 0,
          cellType: 'monocrystalline',
          numberOfCells: 0,
          technology: 'perc',
        },
        parameters: {
          temperature: {
            tempCoeffPmax: 0,
            tempCoeffVoc: 0,
            tempCoeffIsc: 0,
          },
          diode: {
            aRef: 1.8,
            iLRef: 0,
            iORef: 2.5e-12,
            rS: 0,
            rShRef: 0,
          },
          sapm: {
            a0: 0,
            a1: 0,
            a2: 0,
            a3: 0,
            a4: 0,
            b0: 0,
            b1: 0,
            b2: 0,
            b3: 0,
            b4: 0,
          },
          spectral: {
            am: 1.5,
            material: '',
            technology: '',
          },
          advanced: {
            alphaSc: 0,
            betaOc: 0,
            gammaR: 0,
          },
        },
        dimensions: {
          widthMm: 0,
          heightMm: 0,
          thicknessMm: 0,
          weightKg: 0,
        },
        metadata: {
          warranty: 25,
          certifications: [],
        }
      });
      setTempCoefPmaxStr('');
      setTempCoefVocStr('');
      setTempCoefIscStr('');
    } catch (error) {
    }
  };

  const updateFormData = (section: string, field: string, value: any) => {
    setFormData(prev => {
      if (section === 'parameters') {
        // Handle nested parameters structure
        if (['aRef', 'iLRef', 'iORef', 'rS', 'rShRef'].includes(field)) {
          return {
            ...prev,
            parameters: {
              ...prev.parameters,
              diode: {
                ...prev.parameters.diode,
                [field]: value
              }
            }
          };
        } else if (['tempCoeffPmax', 'tempCoeffVoc', 'tempCoeffIsc'].includes(field)) {
          return {
            ...prev,
            parameters: {
              ...prev.parameters,
              temperature: {
                ...prev.parameters.temperature,
                [field]: value
              }
            }
          };
        }
      } else if (section && section !== '') {
        const sectionData = prev[section as keyof CreateModuleRequest];
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
                <Select onValueChange={(value) => updateFormData('', 'manufacturer', value)}>
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
                  value={formData.model}
                  onChange={(e) => updateFormData('', 'model', e.target.value)}
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
                  value={formData.nominalPower || ''}
                  onChange={(e) => updateFormData('', 'nominalPower', parseFloat(e.target.value) || 0)}
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
                  value={formData.specifications.efficiency || ''}
                  onChange={(e) => updateFormData('specifications', 'efficiency', parseFloat(e.target.value) || 0)}
                  placeholder="21.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoCelula">Tipo de Célula</Label>
                <Select onValueChange={(value) => updateFormData('specifications', 'cellType', value)}>
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
                  value={formData.specifications.numberOfCells || ''}
                  onChange={(e) => updateFormData('specifications', 'numberOfCells', parseInt(e.target.value) || 0)}
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
                  value={formData.specifications.vmpp || ''}
                  onChange={(e) => updateFormData('specifications', 'vmpp', parseFloat(e.target.value) || 0)}
                  placeholder="41.8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impp">Corrente de Máxima Potência (ImP)</Label>
                <Input
                  id="impp"
                  type="number"
                  step="0.1"
                  value={formData.specifications.impp || ''}
                  onChange={(e) => updateFormData('specifications', 'impp', parseFloat(e.target.value) || 0)}
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
                  value={formData.specifications.voc || ''}
                  onChange={(e) => updateFormData('specifications', 'voc', parseFloat(e.target.value) || 0)}
                  placeholder="49.8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isc">Corrente Curto-Circuito (Isc)</Label>
                <Input
                  id="isc"
                  type="number"
                  step="0.1"
                  value={formData.specifications.isc || ''}
                  onChange={(e) => updateFormData('specifications', 'isc', parseFloat(e.target.value) || 0)}
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
                  value={formData.parameters.diode.aRef || ''}
                  onChange={(e) => updateFormData('parameters', 'aRef', parseFloat(e.target.value) || 0)}
                  placeholder="1.8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iLRef">Corrente de Luz Fotogerada (A)</Label>
                <Input
                  id="iLRef"
                  type="number"
                  step="0.1"
                  value={formData.parameters.diode.iLRef || ''}
                  onChange={(e) => updateFormData('parameters', 'iLRef', parseFloat(e.target.value) || 0)}
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
                  value={formData.parameters.diode.iORef || ''}
                  onChange={(e) => updateFormData('parameters', 'iORef', parseFloat(e.target.value) || 0)}
                  placeholder="2.5e-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rS">Resistência série (ohms)</Label>
                <Input
                  id="rS"
                  type="number"
                  step="0.01"
                  value={formData.parameters.diode.rS || ''}
                  onChange={(e) => updateFormData('parameters', 'rS', parseFloat(e.target.value) || 0)}
                  placeholder="0.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rShRef">Resistência shunt (ohms)</Label>
                <Input
                  id="rShRef"
                  type="number"
                  step="1"
                  value={formData.parameters.diode.rShRef || ''}
                  onChange={(e) => updateFormData('parameters', 'rShRef', parseFloat(e.target.value) || 0)}
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
                  value={formData.dimensions.widthMm || ''}
                  onChange={(e) => updateFormData('dimensions', 'widthMm', parseInt(e.target.value) || 0)}
                  placeholder="1134"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alturaMm">Altura (mm)</Label>
                <Input
                  id="alturaMm"
                  type="number"
                  value={formData.dimensions.heightMm || ''}
                  onChange={(e) => updateFormData('dimensions', 'heightMm', parseInt(e.target.value) || 0)}
                  placeholder="2274"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="espessuraMm">Espessura (mm)</Label>
                <Input
                  id="espessuraMm"
                  type="number"
                  value={formData.dimensions.thicknessMm || ''}
                  onChange={(e) => updateFormData('dimensions', 'thicknessMm', parseInt(e.target.value) || 0)}
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
                  value={formData.dimensions.weightKg || ''}
                  onChange={(e) => updateFormData('dimensions', 'weightKg', parseFloat(e.target.value) || 0)}
                  placeholder="27.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="garantiaAnos">Garantia (anos)</Label>
                <Input
                  id="garantiaAnos"
                  type="number"
                  value={formData.metadata.warranty || 25}
                  onChange={(e) => updateFormData('metadata', 'warranty', parseInt(e.target.value) || 25)}
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
              disabled={createModule.isPending || !formData.manufacturer || !formData.model || !formData.nominalPower}
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