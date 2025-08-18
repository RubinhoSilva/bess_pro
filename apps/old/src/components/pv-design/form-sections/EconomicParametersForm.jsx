import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { DollarSign, Percent, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const EconomicParametersForm = ({ formData, onFormChange }) => {
    return (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white"><DollarSign className="w-5 h-5 text-green-400" /> Parâmetros Econômicos</CardTitle>
                <CardDescription>Ajuste as premissas financeiras do projeto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="vidaUtil" className="flex items-center gap-2 text-white"><TrendingUp className="w-4 h-4" /> Vida Útil do Projeto (anos)</Label>
                    <div className="flex items-center gap-4">
                        <Slider
                            id="vidaUtil"
                            min={5}
                            max={30}
                            step={1}
                            value={[formData.vidaUtil]}
                            onValueChange={(value) => onFormChange('vidaUtil', value[0])}
                        />
                        <Input
                            type="number"
                            value={formData.vidaUtil}
                            onChange={(e) => onFormChange('vidaUtil', Number(e.target.value))}
                            className="w-24 bg-slate-700/80 border-slate-600 text-white text-center"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="taxaDesconto" className="flex items-center gap-2 text-white"><Percent className="w-4 h-4" /> Taxa de Desconto Anual (%)</Label>
                    <div className="flex items-center gap-4">
                        <Slider
                            id="taxaDesconto"
                            min={0}
                            max={20}
                            step={0.5}
                            value={[formData.taxaDesconto]}
                            onValueChange={(value) => onFormChange('taxaDesconto', value[0])}
                        />
                        <Input
                            type="number"
                            step="0.5"
                            value={formData.taxaDesconto}
                            onChange={(e) => onFormChange('taxaDesconto', Number(e.target.value))}
                            className="w-24 bg-slate-700/80 border-slate-600 text-white text-center"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="inflacaoEnergia" className="flex items-center gap-2 text-white"><TrendingUp className="w-4 h-4" /> Inflação Energética Anual (%)</Label>
                    <div className="flex items-center gap-4">
                        <Slider
                            id="inflacaoEnergia"
                            min={0}
                            max={15}
                            step={0.5}
                            value={[formData.inflacaoEnergia]}
                            onValueChange={(value) => onFormChange('inflacaoEnergia', value[0])}
                        />
                        <Input
                            type="number"
                            step="0.5"
                            value={formData.inflacaoEnergia}
                            onChange={(e) => onFormChange('inflacaoEnergia', Number(e.target.value))}
                            className="w-24 bg-slate-700/80 border-slate-600 text-white text-center"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Label htmlFor="custoFioB" className="flex items-center gap-2 text-white cursor-help">
                                    <DollarSign className="w-4 h-4" /> Custo do Fio B (R$/kWh)
                                </Label>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Valor da componente TUSD Fio B da tarifa, encontrado na fatura de energia.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Input
                        id="custoFioB"
                        type="number"
                        step="0.01"
                        value={formData.custoFioB}
                        onChange={(e) => onFormChange('custoFioB', Number(e.target.value))}
                        className="bg-slate-700/80 border-slate-600 text-white"
                        placeholder="Ex: 0.05"
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default EconomicParametersForm;