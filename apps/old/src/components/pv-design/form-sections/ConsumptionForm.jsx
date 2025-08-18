import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Zap, PlusCircle, Trash2 } from 'lucide-react';

const EnergyBill = ({ bill, onBillChange, onRemoveBill }) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const [consumptionType, setConsumptionType] = useState('monthly');
    const [avgConsumption, setAvgConsumption] = useState(500);
    const [totalConsumption, setTotalConsumption] = useState(6000);

    const handleMonthlyChange = (index, value) => {
        const newValues = [...bill.consumoMensal];
        newValues[index] = parseFloat(value) || 0;
        onBillChange(bill.id, 'consumoMensal', newValues);
    };

    const handleAvgChange = (value) => {
        const avg = parseFloat(value) || 0;
        setAvgConsumption(avg);
        onBillChange(bill.id, 'consumoMensal', Array(12).fill(avg));
    };

    const handleTotalChange = (value) => {
        const total = parseFloat(value) || 0;
        setTotalConsumption(total);
        onBillChange(bill.id, 'consumoMensal', Array(12).fill(total / 12));
    };

    return (
        <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/30 space-y-4">
            <div className="flex justify-between items-center">
                <Input 
                    placeholder="Identificador da Conta (ex: Casa, Escritório)" 
                    value={bill.name}
                    onChange={(e) => onBillChange(bill.id, 'name', e.target.value)}
                    className="bg-white/10 border-white/20 text-white flex-grow"
                />
                <Button variant="ghost" size="icon" onClick={() => onRemoveBill(bill.id)} className="text-red-500 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
            <Tabs value={consumptionType} onValueChange={setConsumptionType} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-900/50">
                    <TabsTrigger value="monthly">Mensal</TabsTrigger>
                    <TabsTrigger value="average">Média</TabsTrigger>
                    <TabsTrigger value="total">Total</TabsTrigger>
                </TabsList>
                <TabsContent value="monthly" className="pt-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {months.map((month, index) => (
                            <div key={month} className="space-y-1">
                                <Label htmlFor={`consumo-${bill.id}-${month}`} className="text-xs text-gray-400">{month}</Label>
                                <Input id={`consumo-${bill.id}-${month}`} type="number" value={bill.consumoMensal[index]} onChange={(e) => handleMonthlyChange(index, e.target.value)} className="bg-white/10 border-white/20 text-white h-8" />
                            </div>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="average" className="pt-4">
                    <div className="space-y-2">
                        <Label htmlFor={`avg-consumption-${bill.id}`} className="text-white">Consumo Médio Mensal (kWh)</Label>
                        <Input id={`avg-consumption-${bill.id}`} type="number" value={avgConsumption} onChange={(e) => handleAvgChange(e.target.value)} className="bg-white/10 border-white/20 text-white" />
                    </div>
                </TabsContent>
                <TabsContent value="total" className="pt-4">
                    <div className="space-y-2">
                        <Label htmlFor={`total-consumption-${bill.id}`} className="text-white">Consumo Total Anual (kWh)</Label>
                        <Input id={`total-consumption-${bill.id}`} type="number" value={totalConsumption} onChange={(e) => handleTotalChange(e.target.value)} className="bg-white/10 border-white/20 text-white" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const ConsumptionForm = ({ formData, onFormChange }) => {
    const handleAddBill = () => {
        const newBill = {
            id: uuidv4(),
            name: `Conta ${formData.energyBills.length + 1}`,
            consumoMensal: Array(12).fill(0),
        };
        onFormChange('energyBills', [...formData.energyBills, newBill]);
    };

    const handleRemoveBill = (id) => {
        onFormChange('energyBills', formData.energyBills.filter(bill => bill.id !== id));
    };

    const handleBillChange = (id, field, value) => {
        const updatedBills = formData.energyBills.map(bill => 
            bill.id === id ? { ...bill, [field]: value } : bill
        );
        onFormChange('energyBills', updatedBills);
    };

    return (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white"><Zap className="w-5 h-5 text-yellow-400" /> Consumo de Energia</CardTitle>
                <CardDescription>Adicione uma ou mais contas de energia em kWh.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {formData.energyBills.map(bill => (
                    <EnergyBill 
                        key={bill.id}
                        bill={bill}
                        onBillChange={handleBillChange}
                        onRemoveBill={handleRemoveBill}
                    />
                ))}
                <Button variant="outline" onClick={handleAddBill} className="w-full bg-transparent text-white border-dashed border-green-500/50 hover:bg-green-500/10 hover:text-white">
                    <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Conta de Energia
                </Button>
            </CardContent>
        </Card>
    );
};

export default ConsumptionForm;