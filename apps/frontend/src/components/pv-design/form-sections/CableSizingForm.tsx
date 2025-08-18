import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Zap, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { installationMethods } from '@/lib/cableSizing';
import toast from 'react-hot-toast';

interface CableSizingFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

interface CableSizingConfig {
  inverterId: string;
  tipoLigacao: 'monofasico' | 'bifasico' | 'trifasico';
  tensaoCA: number;
  tipoCabo: 'pvc' | 'epr';
  distanciaCircuito: number;
  metodoInstalacao: string;
}

export default function CableSizingForm({ formData, onFormChange }: CableSizingFormProps) {
  const [selectedInverterId, setSelectedInverterId] = useState<string>('');
  const [currentParams, setCurrentParams] = useState<CableSizingConfig>({
    inverterId: '',
    tipoLigacao: 'trifasico',
    tensaoCA: 380,
    tipoCabo: 'pvc',
    distanciaCircuito: 20,
    metodoInstalacao: 'B1',
  });

  // Simula inversores configurados (em produção viria do formData.inverters)
  const configuredInverters = formData?.inverters || [
    { id: '1', selectedInverterId: 'inv1', quantity: 1, nome: 'Inversor 1 - 10kW' },
    { id: '2', selectedInverterId: 'inv2', quantity: 1, nome: 'Inversor 2 - 15kW' },
  ];

  useEffect(() => {
    if (selectedInverterId) {
      const existingParams = formData?.cableSizing?.find(
        (cs: CableSizingConfig) => cs.inverterId === selectedInverterId
      );
      
      if (existingParams) {
        setCurrentParams(existingParams);
      } else {
        setCurrentParams({
          inverterId: selectedInverterId,
          tipoLigacao: 'trifasico',
          tensaoCA: 380,
          tipoCabo: 'pvc',
          distanciaCircuito: 20,
          metodoInstalacao: 'B1',
        });
      }
    }
  }, [selectedInverterId, formData?.cableSizing]);

  const handleParamChange = (field: keyof CableSizingConfig, value: any) => {
    setCurrentParams(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCalculation = () => {
    if (!selectedInverterId) {
      toast.error('Selecione um inversor primeiro.');
      return;
    }

    const currentCableSizing = formData?.cableSizing || [];
    const updatedSizing = currentCableSizing.filter(
      (cs: CableSizingConfig) => cs.inverterId !== selectedInverterId
    );
    
    const newConfig = { ...currentParams, inverterId: selectedInverterId };
    onFormChange('cableSizing', [...updatedSizing, newConfig]);
    
    toast.success('Parâmetros salvos! Os dados do circuito para este inversor foram salvos.');
  };

  const isInverterConfigured = (inverterId: string) => {
    return formData?.cableSizing?.some((cs: CableSizingConfig) => cs.inverterId === inverterId);
  };

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Zap className="w-5 h-5 text-yellow-400" /> 
          Dimensionamento dos Circuitos CA
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure os parâmetros do circuito para cada inversor do projeto.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Selecione o Inversor para Configurar</Label>
          <Select onValueChange={setSelectedInverterId} value={selectedInverterId}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Selecione um inversor..." />
            </SelectTrigger>
            <SelectContent>
              {configuredInverters.length > 0 ? (
                configuredInverters.map((inv: any, index: number) => {
                  const isConfigured = isInverterConfigured(inv.id);
                  return (
                    <SelectItem key={inv.id} value={inv.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          Inversor {index + 1}: {inv.nome || `Inversor ${index + 1}`}
                        </span>
                        {isConfigured ? (
                          <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500 ml-2" />
                        )}
                      </div>
                    </SelectItem>
                  );
                })
              ) : (
                <SelectItem value="none" disabled>
                  Adicione inversores nos Parâmetros do Sistema primeiro
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedInverterId && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label className="text-slate-300">Tipo de Ligação</Label>
                <Select 
                  onValueChange={(v: 'monofasico' | 'bifasico' | 'trifasico') => 
                    handleParamChange('tipoLigacao', v)
                  } 
                  value={currentParams.tipoLigacao}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monofasico">Monofásico</SelectItem>
                    <SelectItem value="bifasico">Bifásico</SelectItem>
                    <SelectItem value="trifasico">Trifásico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Tensão (V)</Label>
                <Select 
                  onValueChange={(v) => handleParamChange('tensaoCA', Number(v))} 
                  value={String(currentParams.tensaoCA)}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="127">127V</SelectItem>
                    <SelectItem value="220">220V</SelectItem>
                    <SelectItem value="380">380V</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Isolação do Cabo</Label>
                <RadioGroup 
                  value={currentParams.tipoCabo} 
                  onValueChange={(v: 'pvc' | 'epr') => handleParamChange('tipoCabo', v)} 
                  className="flex space-x-4 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pvc" id="pvc" />
                    <Label htmlFor="pvc" className="text-slate-300">PVC (70°C)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="epr" id="epr" />
                    <Label htmlFor="epr" className="text-slate-300">EPR/XLPE (90°C)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Distância do Circuito (m)</Label>
                <Input 
                  type="number" 
                  value={currentParams.distanciaCircuito} 
                  onChange={(e) => handleParamChange('distanciaCircuito', Number(e.target.value))} 
                  className="bg-background border-border text-foreground" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Método de Instalação</Label>
              <Select 
                onValueChange={(v) => handleParamChange('metodoInstalacao', v)} 
                value={currentParams.metodoInstalacao}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {installationMethods.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSaveCalculation} 
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" /> 
              Salvar Cálculo para este Inversor
            </Button>
          </>
        )}

        {formData?.cableSizing?.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-slate-300 mb-2">
              Inversores Configurados ({formData.cableSizing.length})
            </h4>
            <div className="space-y-1">
              {formData.cableSizing.map((config: CableSizingConfig, index: number) => (
                <div key={config.inverterId} className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>
                    Inversor {index + 1}: {config.tipoLigacao}, {config.tensaoCA}V, 
                    {config.tipoCabo.toUpperCase()}, {config.distanciaCircuito}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}