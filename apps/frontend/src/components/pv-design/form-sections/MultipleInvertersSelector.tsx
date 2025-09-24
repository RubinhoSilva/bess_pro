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
import { useInverters, Inverter } from '@/hooks/equipment-hooks';
import { useMultipleInverters } from '@/hooks/multiple-inverters-hooks';
import { AddInverterModal } from '../modals/AddInverterModal';

interface MultipleInvertersSelectorProps {
  selectedInverters: SelectedInverter[];
  onInvertersChange: (inverters: SelectedInverter[]) => void;
  onTotalPowerChange: (totalPower: number) => void;
  onTotalMpptChannelsChange: (totalChannels: number) => void;
}

export const MultipleInvertersSelector: React.FC<MultipleInvertersSelectorProps> = ({
  selectedInverters,
  onInvertersChange,
  onTotalPowerChange,
  onTotalMpptChannelsChange
}) => {
  const [selectedInverterId, setSelectedInverterId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [showInverterModal, setShowInverterModal] = useState(false);
  
  const { data: inverters = [], isLoading: loadingInverters } = useInverters({});
  const {
    addInverter,
    calculateTotalPower,
    calculateTotalMpptChannels,
    validateInverterSelection
  } = useMultipleInverters();

  // Calcular totais sempre que selectedInverters mudar
  useEffect(() => {
    const totalPower = calculateTotalPower(selectedInverters);
    const totalMppt = calculateTotalMpptChannels(selectedInverters);
    
    onTotalPowerChange(totalPower);
    onTotalMpptChannelsChange(totalMppt);
  }, [selectedInverters, calculateTotalPower, calculateTotalMpptChannels, onTotalPowerChange, onTotalMpptChannelsChange]);

  const handleAddInverter = () => {
    if (!selectedInverterId) return;

    const inverter = inverters.find(inv => inv.id === selectedInverterId);
    if (!inverter) return;

    const newSelectedInverter = addInverter(inverter, quantity);
    const updatedList = [...selectedInverters, newSelectedInverter];
    
    onInvertersChange(updatedList);
    setSelectedInverterId('');
    setQuantity(1);
  };

  const handleRemoveInverter = (id: string) => {
    const updatedList = selectedInverters.filter(inv => inv.id !== id);
    onInvertersChange(updatedList);
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const updatedList = selectedInverters.map(inv => 
      inv.id === id ? { ...inv, quantity: newQuantity } : inv
    );
    onInvertersChange(updatedList);
  };

  const validation = validateInverterSelection(selectedInverters);
  const totalPower = calculateTotalPower(selectedInverters);
  const totalMpptChannels = calculateTotalMpptChannels(selectedInverters);

  // Filtrar inversores já selecionados para evitar duplicação
  const availableInverters = inverters.filter(inverter => 
    !selectedInverters.some(selected => selected.inverterId === inverter.id)
  );

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
            <div className="space-y-2">
              <Label>Selecionar Inversor</Label>
              <Select value={selectedInverterId} onValueChange={setSelectedInverterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um inversor" />
                </SelectTrigger>
                <SelectContent>
                  {loadingInverters ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : (
                    availableInverters.map(inverter => (
                      <SelectItem key={inverter.id} value={inverter.id}>
                        {inverter.fabricante} {inverter.modelo} - {(inverter.potenciaSaidaCA / 1000).toFixed(1)}kW
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
                disabled={!selectedInverterId || loadingInverters}
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
                <p className="text-sm text-gray-600">Canais MPPT</p>
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