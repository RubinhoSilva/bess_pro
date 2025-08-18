import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DollarSign, Percent } from 'lucide-react';

const FinancialForm = ({ formData, onFormChange, totalInvestment }) => {
    const handleNumberInputChange = (field, value) => {
        onFormChange(field, parseFloat(value) || 0);
    };

    return (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white"><DollarSign className="w-5 h-5 text-emerald-400" /> Custos do Projeto</CardTitle>
                <CardDescription>Insira os custos para calcular o investimento total.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="custoEquipamento">Custo Equipamento FV (R$)</Label>
                    <Input id="custoEquipamento" type="number" value={formData.custoEquipamento} onChange={(e) => handleNumberInputChange('custoEquipamento', e.target.value)} className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="custoMateriais">Custo Materiais CA (R$)</Label>
                    <Input id="custoMateriais" type="number" value={formData.custoMateriais} onChange={(e) => handleNumberInputChange('custoMateriais', e.target.value)} className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="custoMaoDeObra">Mão de Obra (R$)</Label>
                    <Input id="custoMaoDeObra" type="number" value={formData.custoMaoDeObra} onChange={(e) => handleNumberInputChange('custoMaoDeObra', e.target.value)} className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bdi" className="flex items-center gap-1">BDI <Percent className="w-3 h-3" /></Label>
                    <Input id="bdi" type="number" value={formData.bdi} onChange={(e) => handleNumberInputChange('bdi', e.target.value)} className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="p-3 bg-emerald-900/50 rounded-lg text-center mt-4">
                    <Label className="text-sm text-emerald-300">Investimento Total com BDI</Label>
                    <p className="text-xl font-bold text-white">{totalInvestment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default FinancialForm;