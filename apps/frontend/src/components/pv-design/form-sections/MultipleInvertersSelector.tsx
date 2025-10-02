import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Zap, Cpu, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SelectedInverter } from '@/contexts/DimensioningContext';
import { useInverters, useManufacturersList, Inverter, ManufacturerType } from '@/hooks/equipment-hooks';
import { useMultipleInverters } from '@/hooks/multiple-inverters-hooks';
import { useMultipleMPPTCalculations } from '@/hooks/useMPPT';
import { AddInverterModal } from '../modals/AddInverterModal';

interface MultipleInvertersSelectorProps {
  selectedInverters: SelectedInverter[];
  onInvertersChange: (inverters: SelectedInverter[]) => void;
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
  
  const { data: invertersData, isLoading: loadingInverters } = useInverters({});
  const { data: manufacturersData, isLoading: loadingManufacturers } = useManufacturersList({ type: ManufacturerType.INVERTER });
  const {
    addInverter,
    calculateTotalPower,
    calculateTotalMpptChannels,
    validateInverterSelection
  } = useMultipleInverters();

  // Extrair arrays da resposta da API
  const invertersArray = invertersData?.inverters || [];
  const manufacturersArray = manufacturersData || [];
  
  // Debug temporário - logs iniciais
  if (selectedManufacturerId && invertersArray.length > 0 && manufacturersArray.length > 0) {
    console.log('🔍 Debug - Fabricante ID selecionado:', selectedManufacturerId);
    console.log('🔍 Debug - Fabricantes disponíveis:', manufacturersArray.map((m: any) => ({ id: m.id, name: m.name })));
    console.log('🔍 Debug - Primeiro inversor:', {
      id: invertersArray[0]?.id,
      fabricante: invertersArray[0]?.fabricante,
      manufacturerId: invertersArray[0]?.manufacturerId,
      modelo: invertersArray[0]?.modelo
    });
  }

  // Preparar dados para MPPT calculations
  const invertersForMPPT = selectedInverters.map((inv: SelectedInverter) => ({
    id: inv.id,
    fabricante: inv.fabricante,
    modelo: inv.modelo,
    potenciaSaidaCA: inv.potenciaSaidaCA,
    tensaoCcMax: inv.tensaoCcMax,
    numeroMppt: inv.numeroMppt,
    stringsPorMppt: inv.stringsPorMppt,
    correnteEntradaMax: (inv as any).correnteEntradaMax || 0,
    faixaMpptMin: (inv as any).faixaMpptMin || 0,
    faixaMpptMax: (inv as any).faixaMpptMax || 0,
    tipoRede: (inv as any).tipoRede || ''
  }));

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
  }, [selectedInverters, calculateTotalPower, calculateTotalMpptChannels, onTotalPowerChange, onTotalMpptChannelsChange]);

  const handleAddInverter = () => {
    if (!selectedInverterId || !selectedManufacturerId) return;

    const inverter = invertersArray.find((inv: any) => inv.id === selectedInverterId);
    if (!inverter) return;

    const newSelectedInverter = addInverter(inverter, quantity);
    const updatedList = [...selectedInverters, newSelectedInverter];
    
    onInvertersChange(updatedList);
    setSelectedManufacturerId('');
    setSelectedInverterId('');
    setQuantity(1);
  };

  const handleRemoveInverter = (id: string) => {
    const updatedList = selectedInverters.filter((inv: SelectedInverter) => inv.id !== id);
    onInvertersChange(updatedList);
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const updatedList = selectedInverters.map((inv: SelectedInverter) => 
      inv.id === id ? { ...inv, quantity: newQuantity } : inv
    );
    onInvertersChange(updatedList);
  };

  const validation = validateInverterSelection(selectedInverters);
  const totalPower = calculateTotalPower(selectedInverters);
  const totalMpptChannels = calculateTotalMpptChannels(selectedInverters);

  // Filtrar inversores por fabricante selecionado e inversores já selecionados
  const availableInverters = invertersArray.filter((inverter: any) => {
    const notAlreadySelected = !selectedInverters.some(selected => selected.inverterId === inverter.id);
    
    // Se não há fabricante selecionado, mostrar todos os inversores disponíveis
    if (!selectedManufacturerId) {
      return notAlreadySelected;
    }
    
    // Buscar o fabricante selecionado
    const selectedManufacturer = manufacturersArray.find((m: any) => m.id === selectedManufacturerId);
    if (!selectedManufacturer) {
      return false;
    }
    
    // Filtrar por manufacturerId se disponível, senão por nome do fabricante
    const matchesManufacturer = 
      inverter.manufacturerId === selectedManufacturerId ||
      inverter.fabricante === selectedManufacturer.name;
    
    return notAlreadySelected && matchesManufacturer;
  });

  // Debug do estado após availableInverters ser declarado
  useEffect(() => {
    console.log('🔍 Estado atual:', {
      selectedManufacturerId,
      selectedInverterId,
      availableInverters: availableInverters.length,
      totalInverters: invertersArray.length
    });
  }, [selectedManufacturerId, selectedInverterId, availableInverters.length, invertersArray.length]);

  // Reset seleção de inversor quando fabricante muda
  useEffect(() => {
    if (selectedManufacturerId && selectedInverterId && invertersArray.length > 0) {
      const selectedInverter = invertersArray.find((inv: any) => inv.id === selectedInverterId);
      const selectedManufacturer = manufacturersArray.find((m: any) => m.id === selectedManufacturerId);
      
      if (selectedInverter && selectedManufacturer) {
        // Verificar se o inversor pertence ao fabricante selecionado
        const belongsToManufacturer = 
          selectedInverter.manufacturerId === selectedManufacturerId ||
          selectedInverter.fabricante === selectedManufacturer.name;
          
        if (!belongsToManufacturer) {
          console.log('🔄 Resetando seleção de inversor - não pertence ao fabricante selecionado');
          setSelectedInverterId('');
        }
      }
    }
  }, [selectedManufacturerId, invertersArray, manufacturersArray]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
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
                    manufacturersArray.map((manufacturer: any) => (
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
                  console.log('🔧 Selecionando inversor:', value);
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
                    availableInverters.map((inverter: any) => (
                      <SelectItem key={inverter.id} value={inverter.id}>
                        {inverter.modelo} - {(inverter.potenciaSaidaCA / 1000).toFixed(1)}kW
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
              <h4 className="font-medium text-sm text-gray-700">Inversores Selecionados</h4>
              {selectedInverters.map((inverter) => (
                <div key={inverter.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-sm">
                          {inverter.fabricante} {inverter.modelo}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                          <span>{(inverter.potenciaSaidaCA / 1000).toFixed(1)}kW</span>
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3" />
                            {inverter.numeroMppt} MPPTs
                          </span>
                          <span>{inverter.stringsPorMppt} strings/MPPT</span>
                          
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
                          {((inverter.potenciaSaidaCA * inverter.quantity) / 1000).toFixed(1)}kW total
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500 font-medium">Qtd</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(inverter.id, inverter.quantity - 1)}
                          disabled={inverter.quantity <= 1}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{inverter.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(inverter.id, inverter.quantity + 1)}
                          disabled={inverter.quantity >= 10}
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
              ))}
            </div>
          )}

          {/* Resumo total */}
          {selectedInverters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {(totalPower / 1000).toFixed(1)} kW
                </p>
                <p className="text-sm text-gray-600">Potência Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {totalMpptChannels}
                </p>
                <p className="text-sm text-gray-600">Capacidade de Strings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {selectedInverters.reduce((sum, inv) => sum + inv.quantity, 0)}
                </p>
                <p className="text-sm text-gray-600">Total de Unidades</p>
              </div>
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