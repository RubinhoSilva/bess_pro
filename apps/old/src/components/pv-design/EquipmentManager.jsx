import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Package, Unplug, Upload, Loader2 } from 'lucide-react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { v4 as uuidv4 } from 'uuid';

const EquipmentManager = ({ onUpdate }) => {
    const { toast } = useToast();
    const { user, supabase } = useNewAuth();
    const [modules, setModules] = useState([]);
    const [inverters, setInverters] = useState([]);
    const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
    const [isİnverterDialogOpen, setIsInverterDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const initialModuleState = {
        fabricante: '', modelo: '', potencia_nominal: '', largura_mm: '', altura_mm: '', espessura_mm: '',
        vmpp: '', impp: '', voc: '', isc: '', tipo_celula: '', eficiencia: '', numero_celulas: '',
        temp_coef_pmax: '', temp_coef_voc: '', temp_coef_isc: '', peso_kg: '', datasheet_url: ''
    };

    const initialInverterState = {
        nome: '', potencia_saida_ca: '', tipo_rede: '', potencia_fv_max: '', tensao_cc_max: '',
        numero_mppt: '', strings_por_mppt: '', faixa_mppt: '', corrente_entrada_max: '',
        potencia_aparente_max: '', corrente_saida_max: '', eficiencia_max: '', eficiencia_eu: ''
    };
    
    const [currentModule, setCurrentModule] = useState(null);
    const [currentInverter, setCurrentInverter] = useState(null);

    const fetchModules = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase.from('modulos_fotovoltaicos').select('*').eq('user_id', user.id);
        if (error) toast({ variant: 'destructive', title: 'Erro ao buscar módulos', description: error.message });
        else setModules(data);
        setIsLoading(false);
    }, [user, supabase, toast]);

    useEffect(() => {
        fetchModules();
        setInverters(JSON.parse(localStorage.getItem('pvInverters') || '[]'));
    }, [fetchModules]);

    const saveInverters = (newInverters) => {
        localStorage.setItem('pvInverters', JSON.stringify(newInverters));
        setInverters(newInverters);
        onUpdate();
    };

    const handleSaveModule = async () => {
        if (!currentModule || !currentModule.modelo || !currentModule.potencia_nominal) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Modelo e Potência são obrigatórios.' });
            return;
        }
        setIsLoading(true);

        const moduleDataToSave = { ...currentModule, user_id: user.id };
        
        // Convert empty strings to null for numeric fields
        for (const key in moduleDataToSave) {
            if (['potencia_nominal', 'largura_mm', 'altura_mm', 'espessura_mm', 'vmpp', 'impp', 'voc', 'isc', 'eficiencia', 'numero_celulas', 'temp_coef_pmax', 'temp_coef_voc', 'temp_coef_isc', 'peso_kg'].includes(key)) {
                if (moduleDataToSave[key] === '' || moduleDataToSave[key] === null) {
                    moduleDataToSave[key] = null;
                } else {
                    moduleDataToSave[key] = Number(moduleDataToSave[key]);
                }
            }
        }

        const { error } = await supabase.from('modulos_fotovoltaicos').upsert(moduleDataToSave);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar módulo', description: error.message });
        } else {
            toast({ title: 'Módulo salvo com sucesso!' });
            await fetchModules();
            onUpdate();
            setIsModuleDialogOpen(false);
            setCurrentModule(null);
        }
        setIsLoading(false);
    };

    const handleSaveInverter = () => {
        if (!currentInverter || !currentInverter.nome || !currentInverter.potencia_saida_ca) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Nome e Potência Nominal de Saída (CA) são obrigatórios.'});
            return;
        }
        let updatedInverters;
        if (currentInverter.id) {
            updatedInverters = inverters.map(i => i.id === currentInverter.id ? currentInverter : i);
        } else {
            updatedInverters = [...inverters, { ...currentInverter, id: Date.now().toString() }];
        }
        saveInverters(updatedInverters);
        setIsInverterDialogOpen(false);
        setCurrentInverter(null);
        toast({ title: 'Inversor salvo com sucesso!' });
    };

    const handleDeleteModule = async (id) => {
        setIsLoading(true);
        const { error } = await supabase.from('modulos_fotovoltaicos').delete().match({ id });
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir módulo', description: error.message });
        } else {
            toast({ title: 'Módulo excluído.' });
            await fetchModules();
            onUpdate();
        }
        setIsLoading(false);
    };

    const handleDeleteInverter = (id) => {
        saveInverters(inverters.filter(i => i.id !== id));
        toast({ title: 'Inversor excluído.' });
    };

    const handleModuleInputChange = (field, value) => {
        setCurrentModule(prev => ({ ...prev, [field]: value }));
    };

    const handleInverterInputChange = (field, value) => {
        setCurrentInverter(prev => ({ ...prev, [field]: value }));
    };

    const handleDatasheetUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        toast({ title: "Analisando datasheet...", description: "Aguarde enquanto a IA extrai os dados." });

        try {
            const filePath = `public/datasheets/${user.id}/${uuidv4()}/${file.name}`;
            const { error: uploadError } = await supabase.storage.from('besspro').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: functionData, error: functionError } = await supabase.functions.invoke('extract-datasheet-data', {
                body: { filePath },
            });

            if (functionError) throw functionError;
            
            setCurrentModule(prev => ({ ...prev, ...functionData.extracted_data }));
            toast({ title: "Dados extraídos com sucesso!", description: "Revise os campos e salve o módulo." });

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro na extração', description: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <DialogHeader>
                <DialogTitle>Gerenciador de Equipamentos</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <div className="flex items-center gap-2"><Package /> Módulos</div>
                            <Button size="sm" onClick={() => { setCurrentModule(initialModuleState); setIsModuleDialogOpen(true); }}><PlusCircle className="w-4 h-4 mr-2" /> Adicionar</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                        {isLoading ? <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin" /></div> :
                        modules.map(module => (
                            <div key={module.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                                <span>{module.modelo} ({module.potencia_nominal} Wp)</span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCurrentModule(module); setIsModuleDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteModule(module.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <div className="flex items-center gap-2"><Unplug /> Inversores</div>
                            <Button size="sm" onClick={() => { setCurrentInverter(initialInverterState); setIsInverterDialogOpen(true); }}><PlusCircle className="w-4 h-4 mr-2" /> Adicionar</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                        {inverters.map(inverter => (
                            <div key={inverter.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                                <span>{inverter.nome} ({inverter.potencia_saida_ca} kW)</span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCurrentInverter(inverter); setIsInverterDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteInverter(inverter.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{currentModule?.id ? 'Editar' : 'Adicionar'} Módulo Fotovoltaico</DialogTitle>
                        <DialogDescription>Insira os parâmetros técnicos ou extraia de um datasheet.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <Button asChild variant="outline" className="w-full" disabled={isUploading}>
                            <Label htmlFor="datasheet-upload" className="cursor-pointer">
                                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                {isUploading ? 'Analisando...' : 'Extrair Dados de Datasheet (PDF)'}
                                <Input id="datasheet-upload" type="file" accept=".pdf" className="sr-only" onChange={handleDatasheetUpload} />
                            </Label>
                        </Button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>Fabricante</Label><Input value={currentModule?.fabricante || ''} onChange={e => handleModuleInputChange('fabricante', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Modelo</Label><Input value={currentModule?.modelo || ''} onChange={e => handleModuleInputChange('modelo', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Potência (Wp)</Label><Input type="number" value={currentModule?.potencia_nominal || ''} onChange={e => handleModuleInputChange('potencia_nominal', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Largura (mm)</Label><Input type="number" value={currentModule?.largura_mm || ''} onChange={e => handleModuleInputChange('largura_mm', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Altura (mm)</Label><Input type="number" value={currentModule?.altura_mm || ''} onChange={e => handleModuleInputChange('altura_mm', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Espessura (mm)</Label><Input type="number" value={currentModule?.espessura_mm || ''} onChange={e => handleModuleInputChange('espessura_mm', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Vmpp (V)</Label><Input type="number" value={currentModule?.vmpp || ''} onChange={e => handleModuleInputChange('vmpp', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Impp (A)</Label><Input type="number" value={currentModule?.impp || ''} onChange={e => handleModuleInputChange('impp', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Voc (V)</Label><Input type="number" value={currentModule?.voc || ''} onChange={e => handleModuleInputChange('voc', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Isc (A)</Label><Input type="number" value={currentModule?.isc || ''} onChange={e => handleModuleInputChange('isc', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Tipo de Célula</Label><Input value={currentModule?.tipo_celula || ''} onChange={e => handleModuleInputChange('tipo_celula', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Eficiência (%)</Label><Input type="number" value={currentModule?.eficiencia || ''} onChange={e => handleModuleInputChange('eficiencia', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Nº de Células</Label><Input type="number" value={currentModule?.numero_celulas || ''} onChange={e => handleModuleInputChange('numero_celulas', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Coef. Temp Pmax (%/°C)</Label><Input type="number" value={currentModule?.temp_coef_pmax || ''} onChange={e => handleModuleInputChange('temp_coef_pmax', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Coef. Temp Voc (%/°C)</Label><Input type="number" value={currentModule?.temp_coef_voc || ''} onChange={e => handleModuleInputChange('temp_coef_voc', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Coef. Temp Isc (%/°C)</Label><Input type="number" value={currentModule?.temp_coef_isc || ''} onChange={e => handleModuleInputChange('temp_coef_isc', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" value={currentModule?.peso_kg || ''} onChange={e => handleModuleInputChange('peso_kg', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleSaveModule} disabled={isLoading || isUploading}>{isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Salvar Módulo</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isİnverterDialogOpen} onOpenChange={setIsInverterDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{currentInverter?.id ? 'Editar' : 'Adicionar'} Inversor</DialogTitle>
                        <DialogDescription>Insira os parâmetros técnicos do inversor.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Nome / Modelo</Label><Input value={currentInverter?.nome || ''} onChange={e => handleInverterInputChange('nome', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            <div className="space-y-2"><Label>Tipo de Rede</Label><Input placeholder="ex: 220V Trifásico" value={currentInverter?.tipo_rede || ''} onChange={e => handleInverterInputChange('tipo_rede', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold text-purple-300 mb-3 border-b border-slate-700 pb-2">Dados de Saída (CA)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>Potência Nominal (kW)</Label><Input type="number" value={currentInverter?.potencia_saida_ca || ''} onChange={e => handleInverterInputChange('potencia_saida_ca', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                                <div className="space-y-2"><Label>Potência Aparente Máx. (VA)</Label><Input type="number" value={currentInverter?.potencia_aparente_max || ''} onChange={e => handleInverterInputChange('potencia_aparente_max', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                                <div className="space-y-2"><Label>Corrente Máx. de Saída (A)</Label><Input type="number" value={currentInverter?.corrente_saida_max || ''} onChange={e => handleInverterInputChange('corrente_saida_max', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-yellow-300 mb-3 border-b border-slate-700 pb-2">Dados de Entrada (CC) / MPPT</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2"><Label>Máx. Potência FV (W)</Label><Input type="number" value={currentInverter?.potencia_fv_max || ''} onChange={e => handleInverterInputChange('potencia_fv_max', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                                <div className="space-y-2"><Label>Máx. Tensão CC (V)</Label><Input type="number" value={currentInverter?.tensao_cc_max || ''} onChange={e => handleInverterInputChange('tensao_cc_max', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                                <div className="space-y-2"><Label>Nº de MPPTs</Label><Input type="number" value={currentInverter?.numero_mppt || ''} onChange={e => handleInverterInputChange('numero_mppt', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                                <div className="space-y-2"><Label>Strings por MPPT</Label><Input type="number" value={currentInverter?.strings_por_mppt || ''} onChange={e => handleInverterInputChange('strings_por_mppt', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                                <div className="space-y-2 md:col-span-2"><Label>Faixa de Tensão MPPT (V)</Label><Input placeholder="ex: 60-550" value={currentInverter?.faixa_mppt || ''} onChange={e => handleInverterInputChange('faixa_mppt', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                                <div className="space-y-2 md:col-span-2"><Label>Corrente Máx. Entrada / MPPT (A)</Label><Input type="number" value={currentInverter?.corrente_entrada_max || ''} onChange={e => handleInverterInputChange('corrente_entrada_max', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-green-300 mb-3 border-b border-slate-700 pb-2">Eficiência</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Máxima Eficiência (%)</Label><Input type="number" value={currentInverter?.eficiencia_max || ''} onChange={e => handleInverterInputChange('eficiencia_max', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                                <div className="space-y-2"><Label>Eficiência Europeia (%)</Label><Input type="number" value={currentInverter?.eficiencia_eu || ''} onChange={e => handleInverterInputChange('eficiencia_eu', e.target.value)} className="bg-slate-700 border-slate-600" /></div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleSaveInverter}>Salvar Inversor</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EquipmentManager;