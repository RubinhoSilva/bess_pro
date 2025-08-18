import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { SlidersHorizontal, Database, Package, Unplug, PlusCircle, Trash2 } from 'lucide-react';
import { eficienciaSistemaOptions } from '@/lib/constants';
import EquipmentManager from '@/components/pv-design/EquipmentManager';
import { useNewAuth } from '@/contexts/NewAuthContext';

const SystemParametersForm = ({ formData, onFormChange }) => {
    const { user, supabase } = useNewAuth();
    const [modules, setModules] = useState([]);
    const [inverters, setInverters] = useState([]);

    const updateEquipmentLists = () => {
        if (user) {
            supabase.from('modulos_fotovoltaicos').select('*').eq('user_id', user.id).then(({ data }) => {
                if (data) setModules(data);
            });
        }
        setInverters(JSON.parse(localStorage.getItem('pvInverters') || '[]'));
    };

    useEffect(() => {
        updateEquipmentLists();
    }, [user, supabase]);

    const handleNumberInputChange = (field, value) => {
        onFormChange(field, parseFloat(value) || 0);
    };
    
    const handleNullableNumberInputChange = (field, value) => {
        onFormChange(field, value === '' ? null : parseFloat(value) || 0);
    };

    const handleModuleSelect = (id) => {
        onFormChange('selectedModuleId', id);
        const selected = modules.find(m => m.id === id);
        if (selected) {
            onFormChange('potenciaModulo', parseFloat(selected.potencia_nominal) || 0);
        }
    };

    const handleAddInverter = () => {
        const newInverter = { id: uuidv4(), selectedInverterId: '', quantity: 1 };
        onFormChange('inverters', [...formData.inverters, newInverter]);
    };

    const handleRemoveInverter = (id) => {
        onFormChange('inverters', formData.inverters.filter(inv => inv.id !== id));
    };

    const handleInverterChange = (id, field, value) => {
        const updatedInverters = formData.inverters.map(inv => {
            if (inv.id === id) {
                return { ...inv, [field]: value };
            }
            return inv;
        });
        onFormChange('inverters', updatedInverters);
    };

    return (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-purple-400" /> Parâmetros do Sistema</div>
                    <Dialog onOpenChange={(isOpen) => !isOpen && updateEquipmentLists()}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm"><Database className="w-4 h-4 mr-2" /> Gerenciar</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white">
                            <EquipmentManager onUpdate={updateEquipmentLists} />
                        </DialogContent>
                    </Dialog>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="select-module" className="text-white flex items-center gap-2"><Package className="w-4 h-4" /> Módulo Fotovoltaico</Label>
                        <Select onValueChange={handleModuleSelect} value={formData.selectedModuleId || ''}>
                            <SelectTrigger id="select-module" className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Selecione um Módulo" /></SelectTrigger>
                            <SelectContent>{modules.map(m => <SelectItem key={m.id} value={m.id}>{m.modelo}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="potenciaModulo" className="text-white">Potência do Módulo (Wp)</Label>
                        <Input id="potenciaModulo" type="number" value={formData.potenciaModulo || ''} onChange={(e) => handleNumberInputChange('potenciaModulo', e.target.value)} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="numeroModulos" className="text-white">Número de Módulos</Label>
                        <Input id="numeroModulos" type="number" placeholder="Auto (p/ consumo)" value={formData.numeroModulos ?? ''} onChange={(e) => handleNullableNumberInputChange('numeroModulos', e.target.value)} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="eficienciaSistema" className="text-white">Eficiência Geral do Sistema (%)</Label>
                        <Select onValueChange={(v) => handleNumberInputChange('eficienciaSistema', v)} value={String(formData.eficienciaSistema)}><SelectTrigger id="eficienciaSistema" className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger><SelectContent>{eficienciaSistemaOptions.map(opt => <SelectItem key={opt} value={String(opt)}>{opt}%</SelectItem>)}</SelectContent></Select>
                    </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                        <Label className="text-white flex items-center gap-2"><Unplug className="w-4 h-4" /> Inversores</Label>
                        <Button size="sm" variant="outline" onClick={handleAddInverter}><PlusCircle className="w-4 h-4 mr-2" /> Adicionar Inversor</Button>
                    </div>
                    {formData.inverters.map((inverterItem, index) => (
                        <div key={inverterItem.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-slate-700/50 rounded-md">
                            <div className="col-span-8 space-y-1">
                                <Label htmlFor={`inverter-select-${index}`} className="text-xs">Inversor {index + 1}</Label>
                                <Select 
                                    onValueChange={(val) => handleInverterChange(inverterItem.id, 'selectedInverterId', val)} 
                                    value={inverterItem.selectedInverterId}
                                >
                                    <SelectTrigger id={`inverter-select-${index}`} className="bg-slate-600 border-slate-500 text-white h-9"><SelectValue placeholder="Selecione um Inversor" /></SelectTrigger>
                                    <SelectContent>{inverters.map(i => <SelectItem key={i.id} value={i.id}>{i.nome} ({i.potencia_saida_ca} kW)</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-3 space-y-1">
                                <Label htmlFor={`inverter-qty-${index}`} className="text-xs">Qtd.</Label>
                                <Input 
                                    id={`inverter-qty-${index}`} 
                                    type="number" 
                                    value={inverterItem.quantity} 
                                    onChange={(e) => handleInverterChange(inverterItem.id, 'quantity', parseInt(e.target.value) || 1)} 
                                    className="bg-slate-600 border-slate-500 text-white h-9"
                                    min="1"
                                />
                            </div>
                            <div className="col-span-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={() => handleRemoveInverter(inverterItem.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default SystemParametersForm;