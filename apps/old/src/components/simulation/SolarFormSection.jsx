import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Sun, MapPin, Save, Search, PlusCircle, Globe } from 'lucide-react';
import { eficienciaSistemaOptions, inversorOptions, overloadInversorOptions } from '@/lib/constants';
import { states } from '@/lib/brazil-locations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

const SolarFormSection = ({ formData, onInputChange, onSelectChange, onMonthlyIrradiationChange }) => {
  const [isAddingNewLocation, setIsAddingNewLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ state: '', city: '' });
  const [cities, setCities] = useState([]);
  const { toast } = useToast();
  
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  useEffect(() => {
    if (formData.estado) {
      const stateData = states.find(s => s.sigla === formData.estado);
      setCities(stateData ? stateData.cidades : []);
    } else {
      setCities([]);
    }
  }, [formData.estado]);

  const handleStateChange = (value) => {
    onSelectChange('estado', value);
    onSelectChange('cidade', '');
  };

  const handleAddNewLocation = () => {
    if (newLocation.state && newLocation.city) {
      onSelectChange('estado', newLocation.state);
      onSelectChange('cidade', newLocation.city);
      setIsAddingNewLocation(false);
      setNewLocation({ state: '', city: '' });
    } else {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor, preencha o estado e a cidade.",
      });
    }
  };

  const getDbKey = () => `irradiation_${formData.estado}_${formData.cidade}`;

  const saveIrradiationData = () => {
    if (!formData.estado || !formData.cidade) {
      toast({ variant: "destructive", title: "Localização não definida", description: "Selecione ou adicione um estado e cidade primeiro." });
      return;
    }
    try {
      localStorage.setItem(getDbKey(), JSON.stringify(formData.irradiacaoMensal));
      toast({ title: "Dados de Irradiação Salvos!", description: `Os dados para ${formData.cidade}, ${formData.estado} foram salvos.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível salvar os dados." });
    }
  };

  const loadIrradiationData = () => {
    if (!formData.estado || !formData.cidade) {
      toast({ variant: "destructive", title: "Localização não definida", description: "Selecione um estado e cidade para buscar." });
      return;
    }
    try {
      const savedData = localStorage.getItem(getDbKey());
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        onSelectChange('irradiacaoMensal', parsedData);
        toast({ title: "Dados de Irradiação Carregados!", description: `Dados para ${formData.cidade}, ${formData.estado} carregados com sucesso.` });
      } else {
        toast({ variant: "destructive", title: "Nenhum dado encontrado", description: `Não há dados salvos para ${formData.cidade}, ${formData.estado}.` });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Carregar", description: "Não foi possível carregar os dados." });
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="h-full"
    >
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sun className="w-5 h-5" />
            Sistema Solar Fotovoltaico
          </CardTitle>
          <CardDescription className="text-gray-300">
            Parâmetros do sistema de geração solar e localização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white flex items-center gap-2 mb-2"><MapPin className="w-4 h-4" /> Localização</Label>
            <div className="flex gap-2 items-center">
              <Select onValueChange={handleStateChange} value={formData.estado}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  {states.map(s => <SelectItem key={s.sigla} value={s.sigla}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => onSelectChange('cidade', value)} value={formData.cidade} disabled={!formData.estado}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Cidade" /></SelectTrigger>
                <SelectContent>
                  {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Dialog open={isAddingNewLocation} onOpenChange={setIsAddingNewLocation}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20"><PlusCircle className="w-5 h-5" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Adicionar Nova Localização</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-state" className="text-right">Estado</Label>
                      <Input id="new-state" value={newLocation.state} onChange={(e) => setNewLocation(p => ({ ...p, state: e.target.value }))} className="col-span-3 bg-slate-700 border-slate-600" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-city" className="text-right">Cidade</Label>
                      <Input id="new-city" value={newLocation.city} onChange={(e) => setNewLocation(p => ({ ...p, city: e.target.value }))} className="col-span-3 bg-slate-700 border-slate-600" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddNewLocation} className="bg-blue-500 hover:bg-blue-600">Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
             <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={saveIrradiationData} className="w-full bg-transparent text-white border-blue-500/50 hover:bg-blue-500/20"><Save className="w-4 h-4 mr-2" /> Salvar Irradiação</Button>
                <Button size="sm" variant="outline" onClick={loadIrradiationData} className="w-full bg-transparent text-white border-green-500/50 hover:bg-green-500/20"><Search className="w-4 h-4 mr-2" /> Buscar Irradiação</Button>
            </div>
          </div>
          <div>
            <Label className="text-white flex items-center gap-2 mb-2"><Globe className="w-4 h-4" /> Irradiação Solar Mensal (kWh/m²/dia)</Label>
            <div className="grid grid-cols-4 gap-2">
                {months.map((month, index) => (
                    <div key={month} className="space-y-1">
                        <Label htmlFor={`irradiacao-${month}`} className="text-xs text-gray-400">{month}</Label>
                        <Input 
                            id={`irradiacao-${month}`}
                            type="number"
                            step="0.1"
                            value={formData.irradiacaoMensal[index]}
                            onChange={(e) => onMonthlyIrradiationChange(index, e.target.value)}
                            className="bg-white/10 border-white/20 text-white h-8"
                        />
                    </div>
                ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="potenciaModulo" className="text-white">Potência do Módulo (W)</Label>
              <Input id="potenciaModulo" type="number" value={formData.potenciaModulo} onChange={(e) => onInputChange('potenciaModulo', e.target.value)} className="bg-white/10 border-white/20 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroModulos" className="text-white">Número de Módulos</Label>
              <Input id="numeroModulos" type="number" value={formData.numeroModulos} onChange={(e) => onInputChange('numeroModulos', e.target.value)} className="bg-white/10 border-white/20 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eficienciaSistema" className="text-white">Eficiência do Sistema (%)</Label>
              <Select onValueChange={(value) => onSelectChange('eficienciaSistema', parseInt(value, 10))} value={String(formData.eficienciaSistema)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {eficienciaSistemaOptions.map(opt => <SelectItem key={opt} value={String(opt)}>{opt}%</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inversorKw" className="text-white">Inversor (kW)</Label>
              <Select onValueChange={(value) => onSelectChange('inversorKw', parseInt(value, 10))} value={String(formData.inversorKw)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {inversorOptions.map(opt => <SelectItem key={opt} value={String(opt)}>{opt} kW</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="overloadInversor" className="text-white">Overload Inversor (%)</Label>
              <Select onValueChange={(value) => onSelectChange('overloadInversor', parseInt(value, 10))} value={String(formData.overloadInversor)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {overloadInversorOptions.map(opt => <SelectItem key={opt} value={String(opt)}>{opt}%</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custoImplantacaoSolar" className="text-white">Custo Implantação (R$)</Label>
              <Input id="custoImplantacaoSolar" type="number" value={formData.custoImplantacaoSolar} onChange={(e) => onInputChange('custoImplantacaoSolar', e.target.value)} className="bg-white/10 border-white/20 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SolarFormSection;