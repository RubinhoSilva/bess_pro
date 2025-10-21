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
import { moduleService } from '@/services/ModuleService';
import { manufacturerService } from '@/services/ManufacturerService';
import { type CreateModuleRequest, CellType, CellTechnology } from '@bess-pro/shared';
import { useToast } from '@/components/ui/use-toast';
import { CalculationConstants } from '@/constants/CalculationConstants';

interface AddSolarModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModuleAdded?: (module: any) => void;
  onModuleSelected?: (moduleId: string) => void;
  initialData?: any; // Dados iniciais para modo de edição
}

const CELL_TYPES = [
  { value: 'monocrystalline', label: 'Monocristalino' },
  { value: 'policrystalline', label: 'Policristalino' },
  { value: 'perc', label: 'PERC' },
  { value: 'hjt', label: 'HJT' },
  { value: 'topcon', label: 'TOPCon' },
  { value: 'bifacial', label: 'Bifacial' }
];


export function AddSolarModuleModal({ open, onOpenChange, onModuleAdded, onModuleSelected, initialData }: AddSolarModuleModalProps) {
  const { toast } = useToast();
  
  // Buscar fabricantes da API
  const { data: manufacturersData, isLoading: loadingManufacturers } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturerService.getManufacturers({}),
    staleTime: 15 * 60 * 1000,
  });
  
  const manufacturers = manufacturersData?.manufacturers || [];
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
      cellType: CalculationConstants.FORM_DEFAULTS.MODULE_FORM.DEFAULT_CELL_TYPE,
      numberOfCells: 0,
      technology: CalculationConstants.FORM_DEFAULTS.MODULE_FORM.DEFAULT_CELL_TECHNOLOGY,
    },
    parameters: {
      temperature: {
        tempCoeffPmax: 0,
        tempCoeffVoc: 0,
        tempCoeffIsc: 0,
      },
      diode: {
        aRef: CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_A_REF,
        iLRef: CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_IL_REF_A,
        iORef: CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_IO_REF_A,
        rS: CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_RS_OHM,
        rShRef: CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_RSH_REF_OHM,
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
        alphaSc: Math.abs(CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_PMAX) / 100, // Converter %/°C para /°C
        betaOc: CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_VOC / 100, // Converter %/°C para /°C
        gammaR: CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_ISC / 100, // Converter %/°C para /°C
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
    },
    teamId: '', // Will be set by service
  });

  // Temp string values for temperature coefficients (to allow free typing)
  const [tempCoefPmaxStr, setTempCoefPmaxStr] = useState<string>(
    (CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_PMAX).toString()
  );
  const [tempCoefVocStr, setTempCoefVocStr] = useState<string>(
    (CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_VOC).toString()
  );
  const [tempCoefIscStr, setTempCoefIscStr] = useState<string>(
    (CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_ISC).toString()
  );

  // Carregar dados iniciais no modo de edição
  useEffect(() => {
    if (initialData) {
      // Mapear dados iniciais para o formulário
      const mappedData = {
        manufacturer: initialData.manufacturer?.id || initialData.manufacturer || '',
        model: initialData.model || '',
        nominalPower: initialData.nominalPower || 0,
        specifications: {
          voc: initialData.specifications?.voc || 0,
          isc: initialData.specifications?.isc || 0,
          vmpp: initialData.specifications?.vmpp || 0,
          impp: initialData.specifications?.impp || 0,
          efficiency: initialData.specifications?.efficiency || 0,
          cellType: initialData.specifications?.cellType || CalculationConstants.FORM_DEFAULTS.MODULE_FORM.DEFAULT_CELL_TYPE,
          numberOfCells: initialData.specifications?.numberOfCells || 0,
          technology: initialData.specifications?.technology || CalculationConstants.FORM_DEFAULTS.MODULE_FORM.DEFAULT_CELL_TECHNOLOGY,
        },
        parameters: {
          temperature: {
            tempCoeffPmax: initialData.parameters?.temperature?.tempCoeffPmax || 0,
            tempCoeffVoc: initialData.parameters?.temperature?.tempCoeffVoc || 0,
            tempCoeffIsc: initialData.parameters?.temperature?.tempCoeffIsc || 0,
          },
          diode: {
            aRef: initialData.parameters?.diode?.aRef || CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_A_REF,
            iLRef: initialData.parameters?.diode?.iLRef || CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_IL_REF_A,
            iORef: initialData.parameters?.diode?.iORef || CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_IO_REF_A,
            rS: initialData.parameters?.diode?.rS || CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_RS_OHM,
            rShRef: initialData.parameters?.diode?.rShRef || CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_RSH_REF_OHM,
          },
          sapm: {
            a0: initialData.parameters?.sapm?.a0 || 0,
            a1: initialData.parameters?.sapm?.a1 || 0,
            a2: initialData.parameters?.sapm?.a2 || 0,
            a3: initialData.parameters?.sapm?.a3 || 0,
            a4: initialData.parameters?.sapm?.a4 || 0,
            b0: initialData.parameters?.sapm?.b0 || 0,
            b1: initialData.parameters?.sapm?.b1 || 0,
            b2: initialData.parameters?.sapm?.b2 || 0,
            b3: initialData.parameters?.sapm?.b3 || 0,
            b4: initialData.parameters?.sapm?.b4 || 0,
          },
          spectral: {
            am: initialData.parameters?.spectral?.am || 1.5,
            material: initialData.parameters?.spectral?.material || '',
            technology: initialData.parameters?.spectral?.technology || '',
          },
          advanced: {
            alphaSc: initialData.parameters?.advanced?.alphaSc || Math.abs(CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_PMAX) / 100,
            betaOc: initialData.parameters?.advanced?.betaOc || CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_VOC / 100,
            gammaR: initialData.parameters?.advanced?.gammaR || CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_ISC / 100,
          },
        },
        dimensions: {
          widthMm: initialData.dimensions?.widthMm || 0,
          heightMm: initialData.dimensions?.heightMm || 0,
          thicknessMm: initialData.dimensions?.thicknessMm || 0,
          weightKg: initialData.dimensions?.weightKg || 0,
        },
        metadata: {
          warranty: initialData.metadata?.warranty || 25,
          certifications: initialData.metadata?.certifications || [],
        },
        teamId: '', // Will be set by service
      };

      setFormData(mappedData);

      // Carregar coeficientes de temperatura como strings
      if (initialData.parameters?.temperature) {
        setTempCoefPmaxStr((initialData.parameters.temperature.tempCoeffPmax * 100).toString());
        setTempCoefVocStr((initialData.parameters.temperature.tempCoeffVoc * 100).toString());
        setTempCoefIscStr((initialData.parameters.temperature.tempCoeffIsc * 100).toString());
      }
    }
  }, [initialData]);

  const queryClient = useQueryClient();
  
  const createModule = useMutation({
    mutationFn: (data: CreateModuleRequest) => moduleService.createModule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast({
        title: "Sucesso",
        description: "Módulo criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || 'Erro ao criar módulo',
        variant: "destructive",
      });
    },
  });

  const updateModule = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateModuleRequest }) => moduleService.updateModule(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast({
        title: "Sucesso",
        description: "Módulo atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || 'Erro ao atualizar módulo',
        variant: "destructive",
      });
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
          tempCoeffPmax: tempCoefPmaxStr ? Math.abs(parseFloat(tempCoefPmaxStr)) / 100 : Math.abs(CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_PMAX) / 100,
          tempCoeffVoc: tempCoefVocStr ? parseFloat(tempCoefVocStr) / 100 : CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_VOC / 100,
          tempCoeffIsc: tempCoefIscStr ? parseFloat(tempCoefIscStr) / 100 : CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_ISC / 100,
        },
        advanced: {
          alphaSc: tempCoefPmaxStr ? Math.abs(parseFloat(tempCoefPmaxStr)) / 100 : Math.abs(CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_PMAX) / 100,
          betaOc: tempCoefVocStr ? parseFloat(tempCoefVocStr) / 100 : CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_VOC / 100,
          gammaR: tempCoefIscStr ? parseFloat(tempCoefIscStr) / 100 : CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_ISC / 100,
        }
      }
    };

    try {
      let result;
      
      if (initialData?.id) {
        // Modo de edição - usar PUT
        result = await updateModule.mutateAsync({
          id: initialData.id,
          data: dataToSave
        });
      } else {
        // Modo de criação - usar POST
        result = await createModule.mutateAsync(dataToSave);
      }
      
      onModuleAdded?.(result);

      // Auto-select the module (newly added or updated)
      if (onModuleSelected && result?.id) {
        onModuleSelected(result.id);
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
          cellType: CalculationConstants.FORM_DEFAULTS.MODULE_FORM.DEFAULT_CELL_TYPE,
          numberOfCells: 0,
          technology: CalculationConstants.FORM_DEFAULTS.MODULE_FORM.DEFAULT_CELL_TECHNOLOGY,
        },
        parameters: {
          temperature: {
            tempCoeffPmax: 0,
            tempCoeffVoc: 0,
            tempCoeffIsc: 0,
          },
          diode: {
            aRef: CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_A_REF,
            iLRef: CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_IL_REF_A,
            iORef: CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_IO_REF_A,
            rS: CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_RS_OHM,
            rShRef: CalculationConstants.MODULE_DETAILS.DEFAULT_MODULE_RSH_REF_OHM,
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
            alphaSc: Math.abs(CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_PMAX) / 100,
            betaOc: CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_VOC / 100,
            gammaR: CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_ISC / 100,
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
        },
        teamId: '', // Will be set by service
      });
      setTempCoefPmaxStr((CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_PMAX).toString());
      setTempCoefVocStr((CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_VOC).toString());
      setTempCoefIscStr((CalculationConstants.MODULE_DETAILS.DEFAULT_TEMP_COEF_ISC).toString());
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
            {initialData ? 'Editar Módulo Solar' : 'Adicionar Novo Módulo Solar'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Edite as informações do módulo solar.'
              : 'Preencha as informações do novo módulo solar que será adicionado ao banco de dados.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fabricante">Fabricante *</Label>
                <Select
                  value={formData.manufacturer}
                  onValueChange={(value) => updateFormData('', 'manufacturer', value)}
                  disabled={loadingManufacturers}
                >
                  <SelectTrigger>
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
                <Select
                  value={formData.specifications.cellType}
                  onValueChange={(value) => updateFormData('specifications', 'cellType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de célula" />
                  </SelectTrigger>
                  <SelectContent>
                    {CELL_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
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
              disabled={createModule.isPending || updateModule.isPending || !formData.manufacturer || !formData.model || !formData.nominalPower}
            >
              {(createModule.isPending || updateModule.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialData ? 'Atualizar Módulo' : 'Adicionar Módulo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}