import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Zap, Cpu, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { inverterService } from '@/services/InverterService';
import { 
  Inverter, 
  SelectedInverter as SharedSelectedInverter,
  Manufacturer 
} from '@bess-pro/shared';
import { manufacturerService } from '@/services/ManufacturerService';

import { useMultipleMPPTCalculations } from '@/hooks/useMPPT';
import { AddInverterModal } from '../modals/AddInverterModal';

// Função auxiliar para mapear Inverter do shared para formato MPPT
const mapInverterToMPPTFormat = (inverter: Inverter) => {
  return {
    id: inverter.id,
    fabricante: inverter.manufacturer.name,
    modelo: inverter.model,
    potenciaSaidaCA: inverter.power.ratedACPower,
    potenciaFvMax: inverter.power.maxPVPower,
    tensaoCcMax: inverter.power.shortCircuitVoltageMax,
    numeroMppt: inverter.mppt.numberOfMppts,
    stringsPorMppt: inverter.mppt.stringsPerMppt,
    correnteEntradaMax: inverter.power.maxInputCurrent,
    faixaMpptMin: inverter.mppt.mpptRange ? parseInt(inverter.mppt.mpptRange.split('-')[0]) || 0 : 0,
    faixaMpptMax: inverter.mppt.mpptRange ? parseInt(inverter.mppt.mpptRange.split('-')[1]) || 0 : 0,
    tipoRede: inverter.electrical.gridType,
  };
};

interface MultipleInvertersSelectorProps {
  selectedInverters: SharedSelectedInverter[];
  onInvertersChange: (inverters: SharedSelectedInverter[]) => void;
  onTotalPowerChange: (totalPower: number) => void;
  onTotalMpptChannelsChange: (totalChannels: number) => void;
  // Props opcionais para MPPT calculations
  selectedModule?: {
    potenciaNominal: number;
    vocStc?: number;
    tempCoefVoc?: number;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  showMPPTLimits?: boolean;
}

export const MultipleInvertersSelector: React.FC<MultipleInvertersSelectorProps> = ({
  selectedInverters,
  onInvertersChange,
  onTotalPowerChange,
  onTotalMpptChannelsChange,
  selectedModule,
  coordinates,
  showMPPTLimits = false
}) => {
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>('');
  const [selectedInverterId, setSelectedInverterId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [showInverterModal, setShowInverterModal] = useState(false);
  
  const { data: invertersData, isLoading: loadingInverters } = useQuery({
    queryKey: ['inverters'],
    queryFn: () => inverterService.getInverters(),
    staleTime: 10 * 60 * 1000,
  });
  const { data: manufacturersData, isLoading: loadingManufacturers } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: () => manufacturerService.getManufacturers({}),
    staleTime: 15 * 60 * 1000,
  });
  // Calcular totais diretamente - movido para fora do componente para evitar recriação
  const calculateTotalPower = React.useCallback((inverters: SharedSelectedInverter[]) => {
    return inverters.reduce((total, selected) => total + (selected.inverter.power.ratedACPower * selected.quantity), 0);
  }, []);

  const calculateTotalMpptChannels = React.useCallback((inverters: SharedSelectedInverter[]) => {
    return inverters.reduce((total, selected) => total + (selected.inverter.mppt.numberOfMppts * selected.quantity), 0);
  }, []);

  const validateInverterSelection = (inverters: SharedSelectedInverter[]) => {
    const errors: string[] = [];
    
    if (inverters.length === 0) {
      errors.push('Selecione pelo menos um inversor');
    }
    
    // Validar potência total máxima (ex: 100kW para residencial)
    const totalPower = calculateTotalPower(inverters);
    if (totalPower > 100000) {
      errors.push('Potência total excede o limite máximo de 100kW');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Extrair arrays da resposta da API
  const invertersArray = invertersData?.inverters || [];
  const manufacturersArray = manufacturersData?.manufacturers || [];
  


  // Preparar dados para MPPT calculations
  const invertersForMPPT = selectedInverters.map((inv: SharedSelectedInverter) => 
    mapInverterToMPPTFormat(inv.inverter)
  );

  const defaultModule = {
    potenciaNominal: 540,
    vocStc: 49.7,
    tempCoefVoc: -0.27
  };

  const defaultCoordinates = {
    latitude: -15.7942,
    longitude: -47.8822
  };

  // Hook para calcular limites MPPT
  const moduleToUse = selectedModule && 
                     typeof selectedModule.vocStc === 'number' && 
                     typeof selectedModule.tempCoefVoc === 'number' 
    ? selectedModule 
    : defaultModule;
  
  const mpptLimits = useMultipleMPPTCalculations(
    invertersForMPPT,
    moduleToUse as { potenciaNominal: number; vocStc: number; tempCoefVoc: number; },
    coordinates || defaultCoordinates,
    showMPPTLimits && Boolean(selectedModule?.vocStc && selectedModule?.tempCoefVoc)
  );

  // Calcular totais sempre que selectedInverters mudar
  useEffect(() => {
    const totalPower = calculateTotalPower(selectedInverters);
    const totalMppt = calculateTotalMpptChannels(selectedInverters);
    
    onTotalPowerChange(totalPower);
    onTotalMpptChannelsChange(totalMppt);
  }, [selectedInverters, calculateTotalPower, calculateTotalMpptChannels]);

  const handleAddInverter = () => {
    if (!selectedInverterId || !selectedManufacturerId) return;

    const inverter = invertersArray.find((inv: Inverter) => inv.id === selectedInverterId);
    if (!inverter) return;

    const newSelectedInverter: SharedSelectedInverter = {
      inverter,
      quantity,
      selectedAt: new Date(),
    };
    
    const updatedList = [...selectedInverters, newSelectedInverter];
    
    onInvertersChange(updatedList);
    setSelectedManufacturerId('');
    setSelectedInverterId('');
    setQuantity(1);
  };

  const handleRemoveInverter = (id: string) => {
    const updatedList = selectedInverters.filter((inv: SharedSelectedInverter) => inv.inverter.id !== id);
    onInvertersChange(updatedList);
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const updatedList = selectedInverters.map((inv: SharedSelectedInverter) => 
      inv.inverter.id === id ? { ...inv, quantity: newQuantity } : inv
    );
    onInvertersChange(updatedList);
  };

  const validation = validateInverterSelection(selectedInverters);
  const totalPower = calculateTotalPower(selectedInverters);
  const totalMpptChannels = calculateTotalMpptChannels(selectedInverters);

  // Filtrar inversores por fabricante selecionado e inversores já selecionados
  const availableInverters = invertersArray.filter((inverter: Inverter) => {
    const notAlreadySelected = !selectedInverters.some(selected => selected.inverter.id === inverter.id);
    
    // Se não há fabricante selecionado, mostrar todos os inversores disponíveis
    if (!selectedManufacturerId) {
      return notAlreadySelected;
    }
    
    // Buscar o fabricante selecionado
    const selectedManufacturer = manufacturersArray.find((m: Manufacturer) => m.id === selectedManufacturerId);
    if (!selectedManufacturer) {
      return false;
    }
    
    // Filtrar por manufacturerId ou por nome do fabricante
    const matchesManufacturer = 
      inverter.manufacturer.id === selectedManufacturerId ||
      inverter.manufacturer.name === selectedManufacturer.name;
    
    return notAlreadySelected && matchesManufacturer;
  });



  // Reset seleção de inversor quando fabricante muda
  useEffect(() => {
    if (selectedManufacturerId && selectedInverterId && invertersArray.length > 0) {
      const selectedInverter = invertersArray.find((inv: Inverter) => inv.id === selectedInverterId);
      const selectedManufacturer = manufacturersArray.find((m: Manufacturer) => m.id === selectedManufacturerId);
      
      if (selectedInverter && selectedManufacturer) {
        // Verificar se o inversor pertence ao fabricante selecionado
        const belongsToManufacturer = 
          selectedInverter.manufacturer.id === selectedManufacturerId ||
          selectedInverter.manufacturer.name === selectedManufacturer.name;
          
        if (!belongsToManufacturer) {
          setSelectedInverterId('');
        }
      }
    }
  }, [selectedManufacturerId, invertersArray, manufacturersArray]);

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Zap className="w-5 h-5 text-yellow-400" />
              Configuração de Inversores
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowInverterModal(true)}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Adicionar Inversor
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de novo inversor */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border/50 rounded-lg bg-card/30">
            <div className="space-y-2">
              <Label>Fabricante</Label>
              <Select value={selectedManufacturerId} onValueChange={setSelectedManufacturerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fabricante" />
                </SelectTrigger>
                <SelectContent>
                  {loadingManufacturers ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : (
                    manufacturersArray.map((manufacturer: Manufacturer) => (
                      <SelectItem key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Inversor</Label>
              <Select 
                value={selectedInverterId} 
                onValueChange={(value) => {
                  setSelectedInverterId(value);
                }}
                disabled={!selectedManufacturerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedManufacturerId ? "Escolha um inversor" : "Selecione fabricante primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingInverters ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : availableInverters.length === 0 ? (
                    <SelectItem value="no-inverters" disabled>
                      {selectedManufacturerId ? "Nenhum inversor disponível" : "Selecione um fabricante"}
                    </SelectItem>
                  ) : (
                    availableInverters.map((inverter: Inverter) => (
                      <SelectItem key={inverter.id} value={inverter.id}>
                        {inverter.model} - {(inverter.power.ratedACPower / 1000).toFixed(1)}kW
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                placeholder="1"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleAddInverter}
                disabled={!selectedInverterId || !selectedManufacturerId || loadingInverters || loadingManufacturers}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Lista de inversores selecionados */}
          {selectedInverters.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-foreground">Inversores Selecionados</h4>
              {selectedInverters.map((selectedInverter) => {
                const inverter = selectedInverter.inverter;
                return (
                  <div key={inverter.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-background">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-sm">
                            {inverter.manufacturer.name} {inverter.model}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{(inverter.power.ratedACPower / 1000).toFixed(1)}kW</span>
                            <span className="flex items-center gap-1">
                              <Cpu className="w-3 h-3" />
                              {inverter.mppt.numberOfMppts} MPPTs
                            </span>
                            <span>{inverter.mppt.stringsPerMppt} strings/MPPT</span>
                            
                            {/* Display MPPT Limits */}
                            {showMPPTLimits && mpptLimits[inverter.id] && (
                              <span className="flex items-center gap-1 text-blue-600 font-medium">
                                {mpptLimits[inverter.id].isLoading ? (
                                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                                ) : mpptLimits[inverter.id].error ? (
                                  <span className="text-red-500">Erro MPPT</span>
                                ) : (
                                  <span>Máx: {mpptLimits[inverter.id].modulosTotal} módulos</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {((inverter.power.ratedACPower * selectedInverter.quantity) / 1000).toFixed(1)}kW total
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground font-medium">Qtd</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(inverter.id, selectedInverter.quantity - 1)}
                            disabled={selectedInverter.quantity <= 1}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{selectedInverter.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(inverter.id, selectedInverter.quantity + 1)}
                            disabled={selectedInverter.quantity >= 10}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveInverter(inverter.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}



          {/* Validação */}
          {!validation.isValid && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <AddInverterModal
        open={showInverterModal}
        onOpenChange={setShowInverterModal}
        onInverterAdded={() => {
          // Refetch inverters list after adding new one
          // The useInverters hook should handle this automatically
        }}
      />
    </div>
  );
};