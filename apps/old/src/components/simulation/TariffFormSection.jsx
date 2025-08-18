import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Zap } from 'lucide-react';
import MonthlyConsumptionForm from './MonthlyConsumptionForm';

const TariffFormSection = ({ formData, onInputChange, onMonthlyConsumptionChange, onSelectChange }) => {
  const [grupoTarifario, setGrupoTarifario] = useState(formData.grupoTarifario);

  const handleGrupoChange = (value) => {
    setGrupoTarifario(value);
    onSelectChange('grupoTarifario', value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="col-span-1 lg:col-span-2"
    >
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5" />
            Tarifas e Consumo
          </CardTitle>
          <CardDescription className="text-gray-300">
            Selecione o grupo tarifário e insira os dados de consumo e tarifas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-white">Grupo Tarifário</Label>
            <RadioGroup
              value={grupoTarifario}
              onValueChange={handleGrupoChange}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A" id="g-a" className="text-cyan-400 border-cyan-400" />
                <Label htmlFor="g-a" className="text-white">Grupo A</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="B" id="g-b" className="text-cyan-400 border-cyan-400" />
                <Label htmlFor="g-b" className="text-white">Grupo B</Label>
              </div>
            </RadioGroup>
          </div>

          {grupoTarifario === 'A' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tarifaPonta" className="text-white">Tarifa Ponta (R$/kWh)</Label>
                <Input id="tarifaPonta" type="number" step="0.01" value={formData.tarifaPonta} onChange={(e) => onInputChange('tarifaPonta', e.target.value)} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifaForaPonta" className="text-white">Tarifa Fora Ponta (R$/kWh)</Label>
                <Input id="tarifaForaPonta" type="number" step="0.01" value={formData.tarifaForaPonta} onChange={(e) => onInputChange('tarifaForaPonta', e.target.value)} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demandaPonta" className="text-white">Demanda Ponta (R$/kW)</Label>
                <Input id="demandaPonta" type="number" step="0.1" value={formData.demandaPonta} onChange={(e) => onInputChange('demandaPonta', e.target.value)} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demandaContratada" className="text-white">Demanda Contratada (kW)</Label>
                <Input id="demandaContratada" type="number" step="1" value={formData.demandaContratada} onChange={(e) => onInputChange('demandaContratada', e.target.value)} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horasPonta" className="text-white">Horas de Ponta/dia</Label>
                <Input id="horasPonta" type="number" value={formData.horasPonta} onChange={(e) => onInputChange('horasPonta', e.target.value)} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasMes" className="text-white">Dias Úteis/mês</Label>
                <Input id="diasMes" type="number" value={formData.diasMes} onChange={(e) => onInputChange('diasMes', e.target.value)} className="bg-white/10 border-white/20 text-white" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="tarifaPonta" className="text-white">Tarifa (R$/kWh)</Label>
                <Input id="tarifaPonta" type="number" step="0.01" value={formData.tarifaPonta} onChange={(e) => onInputChange('tarifaPonta', e.target.value)} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consumoPonta" className="text-white">Consumo Mensal (kWh)</Label>
                <Input id="consumoPonta" type="number" value={formData.consumoPonta} onChange={(e) => onInputChange('consumoPonta', e.target.value)} className="bg-white/10 border-white/20 text-white" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {grupoTarifario === 'A' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <MonthlyConsumptionForm formData={formData} onMonthlyConsumptionChange={onMonthlyConsumptionChange} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default TariffFormSection;