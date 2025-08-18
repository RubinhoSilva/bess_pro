import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, X, Save, Settings, ArrowLeft } from 'lucide-react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { useToast } from '@/components/ui/use-toast';

const ModulePlacementPanel = ({ area, onUpdateAreaLayout, onClose }) => {
    const { user, supabase } = useNewAuth();
    const { toast } = useToast();
    const [modules, setModules] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState(area?.modulo_id || '');
    const [layoutConfig, setLayoutConfig] = useState({
        spacing_x: area?.layout_modulos?.spacing_x ?? 0.02,
        spacing_y: area?.layout_modulos?.spacing_y ?? 0.02,
        margin: area?.layout_modulos?.margin ?? 0.3,
        orientation: area?.layout_modulos?.orientation || 'portrait',
        numero_modulos: area?.layout_modulos?.numero_modulos || '',
        positions_overrides: area?.layout_modulos?.positions_overrides || [],
    });

    useEffect(() => {
        const fetchModules = async () => {
            if (!user) return;
            const { data, error } = await supabase.from('modulos_fotovoltaicos').select('*').eq('user_id', user.id);
            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao buscar módulos', description: error.message });
            } else {
                const testModule = {
                    id: 'test-module-id',
                    modelo: 'Módulo Padrão 550W',
                    largura_mm: 1134,
                    altura_mm: 2278,
                };
                setModules([testModule, ...data]);
            }
        };
        fetchModules();
    }, [user, supabase, toast]);

    const handleConfigChange = (field, value) => {
        const newConfig = { ...layoutConfig, [field]: value };
        if (field !== 'positions_overrides') {
            newConfig.positions_overrides = [];
        }
        setLayoutConfig(newConfig);
    };

    const handleSave = () => {
        const updatedLayout = {
            ...area,
            modulo_id: selectedModuleId,
            layout_modulos: {
                ...layoutConfig,
                numero_modulos: layoutConfig.numero_modulos ? parseInt(layoutConfig.numero_modulos, 10) : null,
            },
        };
        onUpdateAreaLayout(updatedLayout, true);
        toast({ title: 'Layout salvo com sucesso!' });
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            const updatedLayout = {
                ...area,
                modulo_id: selectedModuleId,
                layout_modulos: {
                    ...layoutConfig,
                    numero_modulos: layoutConfig.numero_modulos ? parseInt(layoutConfig.numero_modulos, 10) : null,
                },
            };
            onUpdateAreaLayout(updatedLayout, false);
        }, 500);

        return () => clearTimeout(handler);
    }, [selectedModuleId, layoutConfig, area, onUpdateAreaLayout]);

    return (
        <div className="absolute top-0 right-0 w-96 h-full bg-slate-900/80 backdrop-blur-sm border-l border-slate-700 p-4 flex flex-col z-20">
            <Card className="bg-transparent border-none shadow-none flex-grow flex flex-col">
                <CardHeader className="p-2 flex-row justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                        <Sun className="w-5 h-5 text-yellow-400" />
                        Inserir Módulos
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>
                <CardContent className="p-2 space-y-4 overflow-y-auto flex-grow">
                    <div className="p-3 bg-slate-800 rounded-lg">
                        <p className="text-sm font-semibold text-white">Área Selecionada:</p>
                        <p className="text-lg font-bold text-cyan-400">{area.nome}</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white">Módulo Fotovoltaico</Label>
                        <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                <SelectValue placeholder="Selecione um módulo" />
                            </SelectTrigger>
                            <SelectContent>
                                {modules.map(m => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.modelo} ({m.largura_mm}x{m.altura_mm}mm)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h4 className="font-semibold text-white flex items-center gap-2"><Settings className="w-4 h-4" /> Configurações do Grid</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Espaç. Horizontal (m)</Label>
                                <Input type="number" step="0.01" value={layoutConfig.spacing_x} onChange={e => handleConfigChange('spacing_x', parseFloat(e.target.value))} className="bg-slate-700 border-slate-600 h-8" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Espaç. Vertical (m)</Label>
                                <Input type="number" step="0.01" value={layoutConfig.spacing_y} onChange={e => handleConfigChange('spacing_y', parseFloat(e.target.value))} className="bg-slate-700 border-slate-600 h-8" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Margem de Segurança (m)</Label>
                                <Input type="number" step="0.1" value={layoutConfig.margin} onChange={e => handleConfigChange('margin', parseFloat(e.target.value))} className="bg-slate-700 border-slate-600 h-8" />
                            </div>
                             <div className="space-y-1">
                                <Label className="text-xs">Número de Módulos</Label>
                                <Input type="number" placeholder="Auto" value={layoutConfig.numero_modulos} onChange={e => handleConfigChange('numero_modulos', e.target.value)} className="bg-slate-700 border-slate-600 h-8" />
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <Label className="text-xs">Orientação</Label>
                            <RadioGroup value={layoutConfig.orientation} onValueChange={value => handleConfigChange('orientation', value)} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="portrait" id="portrait" />
                                    <Label htmlFor="portrait">Retrato</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="landscape" id="landscape" />
                                    <Label htmlFor="landscape">Paisagem</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                </CardContent>
                <div className="p-2 mt-auto space-y-2">
                    <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" /> Salvar Layout na Área
                    </Button>
                    <Button onClick={onClose} variant="outline" className="w-full border-slate-600 hover:bg-slate-700 hover:text-white">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Áreas
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ModulePlacementPanel;