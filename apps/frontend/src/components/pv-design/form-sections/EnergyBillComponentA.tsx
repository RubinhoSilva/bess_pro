import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus } from 'lucide-react';
import { EnergyBillA } from '@/types/energy-bill-types';

interface EnergyBillComponentAProps {
  bill: EnergyBillA;
  onUpdate: (bill: EnergyBillA) => void;
  onRemove: () => void;
}

export function EnergyBillComponentA({ bill, onUpdate, onRemove }: EnergyBillComponentAProps) {
  const [consumptionType, setConsumptionType] = useState<'monthly' | 'average'>('monthly');
  const [avgConsumoPonta, setAvgConsumoPonta] = useState(200);
  const [avgConsumoForaPonta, setAvgConsumoForaPonta] = useState(800);

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const updateConsumoPonta = (index: number, value: string) => {
    const newConsumoPonta = [...bill.consumoMensalPonta];
    newConsumoPonta[index] = parseFloat(value) || 0;
    onUpdate({ ...bill, consumoMensalPonta: newConsumoPonta });
  };

  const updateConsumoForaPonta = (index: number, value: string) => {
    const newConsumoForaPonta = [...bill.consumoMensalForaPonta];
    newConsumoForaPonta[index] = parseFloat(value) || 0;
    onUpdate({ ...bill, consumoMensalForaPonta: newConsumoForaPonta });
  };

  const updateName = (name: string) => {
    onUpdate({ ...bill, name });
  };

  const applyAveragePonta = () => {
    const newConsumoPonta = Array(12).fill(avgConsumoPonta);
    onUpdate({ ...bill, consumoMensalPonta: newConsumoPonta });
  };

  const applyAverageForaPonta = () => {
    const newConsumoForaPonta = Array(12).fill(avgConsumoForaPonta);
    onUpdate({ ...bill, consumoMensalForaPonta: newConsumoForaPonta });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          <Input
            value={bill.name}
            onChange={(e) => updateName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
            placeholder="Nome da conta"
          />
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={consumptionType} onValueChange={(value) => setConsumptionType(value as 'monthly' | 'average')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="average">Média</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="space-y-6">
            {/* Consumo Ponta */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-blue-700">Consumo Ponta (kWh)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {months.map((month, index) => (
                  <div key={month} className="space-y-1">
                    <Label htmlFor={`${bill.id}-ponta-${index}`} className="text-xs text-muted-foreground">
                      {month}
                    </Label>
                    <Input
                      id={`${bill.id}-ponta-${index}`}
                      type="number"
                      value={bill.consumoMensalPonta[index] || ''}
                      onChange={(e) => updateConsumoPonta(index, e.target.value)}
                      placeholder="kWh"
                      className="text-sm"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Consumo Fora Ponta */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-green-700">Consumo Fora Ponta (kWh)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {months.map((month, index) => (
                  <div key={month} className="space-y-1">
                    <Label htmlFor={`${bill.id}-fora-ponta-${index}`} className="text-xs text-muted-foreground">
                      {month}
                    </Label>
                    <Input
                      id={`${bill.id}-fora-ponta-${index}`}
                      type="number"
                      value={bill.consumoMensalForaPonta[index] || ''}
                      onChange={(e) => updateConsumoForaPonta(index, e.target.value)}
                      placeholder="kWh"
                      className="text-sm"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="average" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="avg-ponta">Consumo Médio Ponta (kWh)</Label>
                <div className="flex gap-2">
                  <Input
                    id="avg-ponta"
                    type="number"
                    value={avgConsumoPonta}
                    onChange={(e) => setAvgConsumoPonta(parseFloat(e.target.value) || 0)}
                    placeholder="kWh"
                    min="0"
                  />
                  <Button onClick={applyAveragePonta} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avg-fora-ponta">Consumo Médio Fora Ponta (kWh)</Label>
                <div className="flex gap-2">
                  <Input
                    id="avg-fora-ponta"
                    type="number"
                    value={avgConsumoForaPonta}
                    onChange={(e) => setAvgConsumoForaPonta(parseFloat(e.target.value) || 0)}
                    placeholder="kWh"
                    min="0"
                  />
                  <Button onClick={applyAverageForaPonta} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}