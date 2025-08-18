import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TrendingUp } from 'lucide-react';

interface EconomicParametersFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
}

export default function EconomicParametersForm({ formData, onFormChange }: EconomicParametersFormProps) {
  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TrendingUp className="w-5 h-5 text-green-400" /> 
          Parâmetros Econômicos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxaDesconto">Taxa de Desconto (%)</Label>
            <Input 
              id="taxaDesconto" 
              type="number" 
              step="0.1" 
              value={formData.taxaDesconto || 8} 
              onChange={(e) => onFormChange('taxaDesconto', parseFloat(e.target.value) || 8)} 
              className="bg-background border-border text-foreground" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inflacaoEnergia">Inflação Energia (%)</Label>
            <Input 
              id="inflacaoEnergia" 
              type="number" 
              step="0.1" 
              value={formData.inflacaoEnergia || 4.5} 
              onChange={(e) => onFormChange('inflacaoEnergia', parseFloat(e.target.value) || 4.5)} 
              className="bg-background border-border text-foreground" 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vidaUtil">Vida Útil do Sistema (anos)</Label>
            <Input 
              id="vidaUtil" 
              type="number" 
              value={formData.vidaUtil || 25} 
              onChange={(e) => onFormChange('vidaUtil', parseInt(e.target.value) || 25)} 
              className="bg-background border-border text-foreground" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custoFioB">Custo Fio B (R$/kWh)</Label>
            <Input 
              id="custoFioB" 
              type="number" 
              step="0.01" 
              value={formData.custoFioB || ((formData.tarifaEnergiaB || 0.8) * 0.3)} 
              onChange={(e) => onFormChange('custoFioB', parseFloat(e.target.value) || 0)} 
              className="bg-background border-border text-foreground" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}