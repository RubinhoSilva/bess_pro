import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Calendar } from 'lucide-react';
import { vidaUtilOptions } from '@/lib/constants';

const EconomicFormSection = ({ formData, onSliderChange, onSelectChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Parâmetros Econômicos
          </CardTitle>
          <CardDescription className="text-slate-300">
            Ajuste as premissas financeiras e a vida útil do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-3">
            <Label className="text-white flex justify-between">
              <span>Taxa de Desconto (TMA)</span>
              <span className="font-bold text-blue-400">{formData.taxaDesconto.toFixed(1)}%</span>
            </Label>
            <Slider
              value={[formData.taxaDesconto]}
              onValueChange={(value) => onSliderChange('taxaDesconto', value)}
              max={20}
              min={5}
              step={0.5}
            />
          </div>
          <div className="space-y-3">
            <Label className="text-white flex justify-between">
              <span>Inflação de Energia</span>
              <span className="font-bold text-blue-400">{formData.inflacaoEnergia.toFixed(1)}%</span>
            </Label>
            <Slider
              value={[formData.inflacaoEnergia]}
              onValueChange={(value) => onSliderChange('inflacaoEnergia', value)}
              max={15}
              min={2}
              step={0.5}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vidaUtil" className="text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Vida Útil do Projeto (anos)
            </Label>
            <Select onValueChange={(value) => onSelectChange('vidaUtil', value)} defaultValue={String(formData.vidaUtil)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {vidaUtilOptions.map(opt => <SelectItem key={opt} value={String(opt)}>{opt} anos</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EconomicFormSection;