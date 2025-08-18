import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Fuel } from 'lucide-react';

const DieselFormSection = ({ formData, onInputChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full"
    >
      <Card className="bg-gradient-to-r from-gray-600/10 to-gray-800/10 border-gray-500/20 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Fuel className="w-5 h-5" />
            Gerador Diesel
          </CardTitle>
          <CardDescription className="text-gray-300">
            Configurações do sistema de backup a diesel
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="potenciaGeradorKva" className="text-white">Potência do Gerador (kVA)</Label>
            <Input id="potenciaGeradorKva" type="number" value={formData.potenciaGeradorKva} onChange={(e) => onInputChange('potenciaGeradorKva', e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatorPotencia" className="text-white">Fator de Potência (%)</Label>
            <Input id="fatorPotencia" type="number" min="0" max="100" value={formData.fatorPotencia} onChange={(e) => onInputChange('fatorPotencia', e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consumoCombustivel" className="text-white">Consumo Combustível (L/h)</Label>
            <Input id="consumoCombustivel" type="number" value={formData.consumoCombustivel} onChange={(e) => onInputChange('consumoCombustivel', e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="precoCombustivel" className="text-white">Preço do Combustível (R$/L)</Label>
            <Input id="precoCombustivel" type="number" step="0.01" value={formData.precoCombustivel} onChange={(e) => onInputChange('precoCombustivel', e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="custoImplantacaoGerador" className="text-white">Custo de Implantação (R$)</Label>
            <Input id="custoImplantacaoGerador" type="number" value={formData.custoImplantacaoGerador} onChange={(e) => onInputChange('custoImplantacaoGerador', e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DieselFormSection;