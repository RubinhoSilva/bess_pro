import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Battery } from 'lucide-react';
import { dodOptions, fatorPerdasOptions } from '@/lib/constants';

const BessFormSection = ({ formData, onInputChange, onSelectChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Battery className="w-5 h-5" />
            Parâmetros do Sistema BESS
          </CardTitle>
          <CardDescription className="text-gray-300">
            Configure as especificações do sistema de armazenamento
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="potenciaBateriaW" className="text-white">Potência da Bateria (W)</Label>
            <Input id="potenciaBateriaW" type="number" value={formData.potenciaBateriaW} onChange={(e) => onInputChange('potenciaBateriaW', e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dod" className="text-white">Profundidade de Descarga (%)</Label>
            <Select onValueChange={(value) => onSelectChange('dod', value)} defaultValue={String(formData.dod)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {dodOptions.map(opt => <SelectItem key={opt} value={String(opt)}>{opt}%</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatorPerdas" className="text-white">Fator de Correção de Perdas (%)</Label>
            <Select onValueChange={(value) => onSelectChange('fatorPerdas', value)} defaultValue={String(formData.fatorPerdas)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {fatorPerdasOptions.map(opt => <SelectItem key={opt} value={String(opt)}>{opt}%</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tensaoBateria" className="text-white">Tensão da Bateria (V)</Label>
            <Input id="tensaoBateria" type="number" value={formData.tensaoBateria} onChange={(e) => onInputChange('tensaoBateria', e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correnteBateria" className="text-white">Corrente da Bateria (Ah)</Label>
            <Input id="correnteBateria" type="number" value={formData.correnteBateria} onChange={(e) => onInputChange('correnteBateria', e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custoImplantacaoBess" className="text-white">Custo de Implantação (R$)</Label>
            <Input id="custoImplantacaoBess" type="number" value={formData.custoImplantacaoBess} onChange={(e) => onInputChange('custoImplantacaoBess', e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BessFormSection;