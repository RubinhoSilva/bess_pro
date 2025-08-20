import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Zap, PlusCircle, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ConsumptionFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

interface EnergyBill {
  id: string;
  name: string;
  consumoMensal: number[];
}

const EnergyBillComponent: React.FC<{
  bill: EnergyBill;
  onBillChange: (id: string, field: string, value: any) => void;
  onRemoveBill: (id: string) => void;
}> = ({ bill, onBillChange, onRemoveBill }) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [consumptionType, setConsumptionType] = useState<'monthly' | 'average' | 'total'>('monthly');
  const [avgConsumption, setAvgConsumption] = useState(500);
  const [totalConsumption, setTotalConsumption] = useState(6000);

  const handleMonthlyChange = (index: number, value: string) => {
    const newValues = [...bill.consumoMensal];
    newValues[index] = parseFloat(value) || 0;
    onBillChange(bill.id, 'consumoMensal', newValues);
  };

  const handleAvgChange = (value: string) => {
    const avg = parseFloat(value) || 0;
    setAvgConsumption(avg);
    onBillChange(bill.id, 'consumoMensal', Array(12).fill(avg));
  };

  const handleTotalChange = (value: string) => {
    const total = parseFloat(value) || 0;
    setTotalConsumption(total);
    onBillChange(bill.id, 'consumoMensal', Array(12).fill(total / 12));
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-muted space-y-4">
      <div className="flex justify-between items-center">
        <Input 
          placeholder="Identificador da Conta (ex: Casa, Escritório)" 
          value={bill.name}
          onChange={(e) => onBillChange(bill.id, 'name', e.target.value)}
          className="flex-grow mr-2"
        />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onRemoveBill(bill.id)} 
          className="text-red-500 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <Tabs value={consumptionType} onValueChange={(value) => setConsumptionType(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="average">Média</TabsTrigger>
          <TabsTrigger value="total">Total Anual</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {months.map((month, index) => (
              <div key={index} className="space-y-1">
                <Label htmlFor={`${bill.id}-month-${index}`} className="text-xs">
                  {month}
                </Label>
                <Input
                  id={`${bill.id}-month-${index}`}
                  type="number"
                  placeholder="kWh"
                  value={bill.consumoMensal[index] || ''}
                  onChange={(e) => handleMonthlyChange(index, e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="average" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${bill.id}-avg`}>Consumo Médio Mensal (kWh)</Label>
            <Input
              id={`${bill.id}-avg`}
              type="number"
              placeholder="500"
              value={avgConsumption}
              onChange={(e) => handleAvgChange(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Será aplicado o mesmo valor para todos os meses
            </p>
          </div>
        </TabsContent>

        <TabsContent value="total" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${bill.id}-total`}>Consumo Total Anual (kWh)</Label>
            <Input
              id={`${bill.id}-total`}
              type="number"
              placeholder="6000"
              value={totalConsumption}
              onChange={(e) => handleTotalChange(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Será dividido igualmente pelos 12 meses ({(totalConsumption / 12).toFixed(0)} kWh/mês)
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Resumo */}
      {bill.consumoMensal.some(val => val > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-700">
          <div className="text-sm space-y-1 text-gray-800 dark:text-gray-200">
            <div className="flex justify-between">
              <span>Total Anual:</span>
              <span className="font-semibold">{bill.consumoMensal.reduce((a, b) => a + b, 0).toFixed(0)} kWh</span>
            </div>
            <div className="flex justify-between">
              <span>Média Mensal:</span>
              <span className="font-semibold">{(bill.consumoMensal.reduce((a, b) => a + b, 0) / 12).toFixed(0)} kWh</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ConsumptionForm: React.FC<ConsumptionFormProps> = ({ formData, onFormChange }) => {
  const energyBills = formData.energyBills || [];

  const addNewBill = () => {
    const newBill: EnergyBill = {
      id: uuidv4(),
      name: `Conta ${energyBills.length + 1}`,
      consumoMensal: Array(12).fill(0)
    };
    
    const updatedBills = [...energyBills, newBill];
    onFormChange('energyBills', updatedBills);
  };

  const updateBill = (id: string, field: string, value: any) => {
    const updatedBills = energyBills.map((bill: EnergyBill) => 
      bill.id === id ? { ...bill, [field]: value } : bill
    );
    onFormChange('energyBills', updatedBills);
  };

  const removeBill = (id: string) => {
    const updatedBills = energyBills.filter((bill: EnergyBill) => bill.id !== id);
    onFormChange('energyBills', updatedBills);
  };

  // Calcular totais
  const totalAnualConsumption = energyBills.reduce((total: number, bill: EnergyBill) => {
    return total + bill.consumoMensal.reduce((a: number, b: number) => a + b, 0);
  }, 0);

  const monthlyTotals = Array(12).fill(0);
  energyBills.forEach((bill: EnergyBill) => {
    bill.consumoMensal.forEach((consumption: number, index: number) => {
      monthlyTotals[index] += consumption;
    });
  });

  return (
    <Card className="bg-card border border-border shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Zap className="w-5 h-5 text-amber-500" /> 
          Consumo de Energia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Configure uma ou mais contas de energia para dimensionar o sistema.
          </p>
          <Button 
            onClick={addNewBill} 
            variant="outline" 
            size="sm"
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Adicionar Conta
          </Button>
        </div>

        {energyBills.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma conta de energia adicionada.</p>
            <p className="text-sm">Clique em "Adicionar Conta" para começar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {energyBills.map((bill: EnergyBill) => (
              <EnergyBillComponent
                key={bill.id}
                bill={bill}
                onBillChange={updateBill}
                onRemoveBill={removeBill}
              />
            ))}
          </div>
        )}

        {/* Resumo Total */}
        {totalAnualConsumption > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">Resumo Total do Consumo</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-600 dark:text-green-400 font-medium">Total Anual</div>
                <div className="text-xl font-bold text-green-800 dark:text-green-200">{totalAnualConsumption.toFixed(0)}</div>
                <div className="text-xs text-green-600 dark:text-green-400">kWh/ano</div>
              </div>
              <div className="text-center">
                <div className="text-green-600 dark:text-green-400 font-medium">Média Mensal</div>
                <div className="text-xl font-bold text-green-800 dark:text-green-200">{(totalAnualConsumption / 12).toFixed(0)}</div>
                <div className="text-xs text-green-600 dark:text-green-400">kWh/mês</div>
              </div>
              <div className="text-center">
                <div className="text-green-600 dark:text-green-400 font-medium">Média Diária</div>
                <div className="text-xl font-bold text-green-800 dark:text-green-200">{(totalAnualConsumption / 365).toFixed(0)}</div>
                <div className="text-xs text-green-600 dark:text-green-400">kWh/dia</div>
              </div>
              <div className="text-center">
                <div className="text-green-600 dark:text-green-400 font-medium">Pico Mensal</div>
                <div className="text-xl font-bold text-green-800 dark:text-green-200">{Math.max(...monthlyTotals).toFixed(0)}</div>
                <div className="text-xs text-green-600 dark:text-green-400">kWh/mês</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsumptionForm;