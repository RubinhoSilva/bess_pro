import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MonthlyConsumptionForm = ({ formData, onMonthlyConsumptionChange }) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700 col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="text-white">Consumo Mensal (Grupo A)</CardTitle>
        <CardDescription className="text-slate-300">
          Insira o consumo de ponta e fora de ponta para cada mês.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {months.map((month, index) => (
            <div key={month} className="p-3 bg-slate-900/50 rounded-lg">
              <Label className="font-semibold text-white mb-2 block">{month}</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor={`consumoPonta-${index}`} className="text-xs text-slate-400">Ponta (kWh)</Label>
                  <Input
                    id={`consumoPonta-${index}`}
                    type="number"
                    placeholder="Ponta"
                    value={formData.consumoMensal[index].ponta}
                    onChange={(e) => onMonthlyConsumptionChange(index, 'ponta', e.target.value)}
                    className="bg-white/10 border-white/20 text-white mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`consumoForaPonta-${index}`} className="text-xs text-slate-400">Fora Ponta (kWh)</Label>
                  <Input
                    id={`consumoForaPonta-${index}`}
                    type="number"
                    placeholder="Fora Ponta"
                    value={formData.consumoMensal[index].foraPonta}
                    onChange={(e) => onMonthlyConsumptionChange(index, 'foraPonta', e.target.value)}
                    className="bg-white/10 border-white/20 text-white mt-1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyConsumptionForm;