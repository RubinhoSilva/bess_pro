import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Save, Search, PlusCircle, Satellite, Edit, Map, Trash2 } from 'lucide-react';
import { states } from '@/lib/brazil-locations';
import MapSelector from './MapSelector';

const StandardAnalysisForm = ({ formData, onFormChange }) => {
    const { toast } = useToast();
    const [cities, setCities] = useState([]);
    const [isAddingNewLocation, setIsAddingNewLocation] = useState(false);
    const [newLocation, setNewLocation] = useState({ state: '', city: '' });
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    const [isLoadingApi, setIsLoadingApi] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [sourceType, setSourceType] = useState('pvgis');

    useEffect(() => {
        if (formData.estado) {
            const stateData = states.find(s => s.sigla === formData.estado);
            setCities(stateData ? stateData.cidades : []);
        } else {
            setCities([]);
        }
    }, [formData.estado]);

    const handleStateChange = (value) => {
        onFormChange('estado', value);
        onFormChange('cidade', '');
    };

    const handleAddNewLocation = () => {
        if (newLocation.state && newLocation.city) {
            onFormChange('estado', newLocation.state);
            onFormChange('cidade', newLocation.city);
            setIsAddingNewLocation(false);
            setNewLocation({ state: '', city: '' });
        } else {
            toast({ variant: "destructive", title: "Campos incompletos" });
        }
    };

    const getDbKey = () => `irradiation_${formData.estado}_${formData.cidade}`;

    const saveIrradiationData = () => {
        if (!formData.estado || !formData.cidade) {
            toast({ variant: "destructive", title: "Localização não definida" });
            return;
        }
        localStorage.setItem(getDbKey(), JSON.stringify(formData.irradiacaoMensal));
        toast({ title: "Dados de Irradiação Salvos!" });
    };

    const loadIrradiationData = () => {
        if (!formData.estado || !formData.cidade) {
            toast({ variant: "destructive", title: "Localização não definida" });
            return;
        }
        const savedData = localStorage.getItem(getDbKey());
        if (savedData) {
            onFormChange('irradiacaoMensal', JSON.parse(savedData));
            toast({ title: "Dados de Irradiação Carregados!" });
        } else {
            toast({ variant: "destructive", title: "Nenhum dado encontrado" });
        }
    };
    
    const clearIrradiationData = () => {
        setLat('');
        setLon('');
        onFormChange('irradiacaoMensal', Array(12).fill(0));
        toast({ title: "Dados limpos", description: "Pronto para uma nova busca." });
    };

    const fetchPvgisData = async () => {
        if (!lat || !lon) {
            toast({ variant: 'destructive', title: 'Localização não selecionada', description: 'Por favor, selecione um ponto no mapa primeiro.' });
            return;
        }
        setIsLoadingApi(true);
        toast({ title: 'Buscando dados na API...', description: 'Isso pode levar alguns segundos.' });

        setTimeout(() => {
            try {
                const floatLat = parseFloat(lat);
                
                let baseIrradiation;
                let seasonVariation;

                if (floatLat > -5) {
                    baseIrradiation = 5.5;
                    seasonVariation = [0, 0.1, 0.2, 0.1, 0, -0.2, -0.3, -0.2, 0, 0.1, 0.1, 0];
                } else if (floatLat > -20) {
                    baseIrradiation = 6.0;
                    seasonVariation = [-0.5, -0.3, 0.1, 0.3, 0.5, 0.6, 0.5, 0.3, 0.1, -0.2, -0.4, -0.6];
                } else {
                    baseIrradiation = 4.8;
                    seasonVariation = [-1.2, -0.8, -0.2, 0.4, 0.8, 1.0, 0.9, 0.5, 0.1, -0.5, -0.9, -1.1];
                }

                const pvgisData = seasonVariation.map(v => parseFloat((baseIrradiation - v).toFixed(2)));

                onFormChange('irradiacaoMensal', pvgisData);
                toast({ title: 'Sucesso!', description: 'Dados de irradiação preenchidos com sucesso.' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro na Simulação', description: 'Ocorreu um erro ao simular a busca de dados.' });
            } finally {
                setIsLoadingApi(false);
            }
        }, 1500);
    };

    const handleMapSelect = (position) => {
        setLat(position.lat.toFixed(6));
        setLon(position.lng.toFixed(6));
        setIsMapOpen(false);
        toast({ title: 'Localização Selecionada!', description: `Lat: ${position.lat.toFixed(4)}, Lon: ${position.lng.toFixed(4)}` });
    };

    return (
        <div className="w-full space-y-4">
            <RadioGroup defaultValue="pvgis" onValueChange={setSourceType} className="flex gap-4 bg-slate-700/50 p-1 rounded-lg">
                <Label htmlFor="r_pvgis" className={`flex-1 text-center p-2 rounded-md cursor-pointer transition-colors ${sourceType === 'pvgis' ? 'bg-blue-600 text-white' : 'hover:bg-slate-600/50'}`}>
                    <RadioGroupItem value="pvgis" id="r_pvgis" className="sr-only" />
                    <div className="flex items-center justify-center gap-2"><Satellite className="w-4 h-4" /> Dados Irradiação PVGIS</div>
                </Label>
                <Label htmlFor="r_manual" className={`flex-1 text-center p-2 rounded-md cursor-pointer transition-colors ${sourceType === 'manual' ? 'bg-blue-600 text-white' : 'hover:bg-slate-600/50'}`}>
                    <RadioGroupItem value="manual" id="r_manual" className="sr-only" />
                    <div className="flex items-center justify-center gap-2"><Edit className="w-4 h-4" /> Entrada Manual</div>
                </Label>
            </RadioGroup>

            {sourceType === 'pvgis' && (
                <div className="pt-4 space-y-4">
                    <div>
                        <p className="text-sm text-slate-400 mb-2">Selecione a localização no mapa para buscar dados de irradiação solar (simulado).</p>
                        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full bg-transparent text-white border-blue-500/50 hover:bg-blue-500/20">
                                    <Map className="w-4 h-4 mr-2" />
                                    {lat && lon ? `Lat: ${lat}, Lon: ${lon}` : 'Selecionar Localização no Mapa'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                                <DialogHeader className="p-4">
                                    <DialogTitle>Selecione o Ponto no Mapa</DialogTitle>
                                </DialogHeader>
                                <div className="flex-grow">
                                    <MapSelector onSelect={handleMapSelect} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={fetchPvgisData} disabled={isLoadingApi || !lat || !lon} className="w-full">
                            {isLoadingApi ? (
                                <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Buscando...</div>
                            ) : (
                                <div className="flex items-center gap-2"><Search className="w-4 h-4" /> Buscar Dados</div>
                            )}
                        </Button>
                        <Button variant="outline" onClick={clearIrradiationData} className="bg-transparent text-white border-red-500/50 hover:bg-red-500/20">
                            <Trash2 className="w-4 h-4 mr-2" /> Limpar
                        </Button>
                    </div>
                </div>
            )}

            {sourceType === 'manual' && (
                <div className="pt-4 space-y-4">
                    <div className="flex gap-2 items-center">
                        <Select onValueChange={handleStateChange} value={formData.estado}><SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent>{states.map(s => <SelectItem key={s.sigla} value={s.sigla}>{s.nome}</SelectItem>)}</SelectContent></Select>
                        <Select onValueChange={(v) => onFormChange('cidade', v)} value={formData.cidade} disabled={!formData.estado}><SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Cidade" /></SelectTrigger><SelectContent>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                        <Dialog open={isAddingNewLocation} onOpenChange={setIsAddingNewLocation}><DialogTrigger asChild><Button variant="ghost" size="icon" className="text-white hover:bg-white/20"><PlusCircle className="w-5 h-5" /></Button></DialogTrigger><DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>Adicionar Nova Localização</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="new-state" className="text-right">Estado</Label><Input id="new-state" value={newLocation.state} onChange={(e) => setNewLocation(p => ({ ...p, state: e.target.value }))} className="col-span-3 bg-slate-700 border-slate-600" /></div><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="new-city" className="text-right">Cidade</Label><Input id="new-city" value={newLocation.city} onChange={(e) => setNewLocation(p => ({ ...p, city: e.target.value }))} className="col-span-3 bg-slate-700 border-slate-600" /></div></div><DialogFooter><Button onClick={handleAddNewLocation} className="bg-blue-500 hover:bg-blue-600">Salvar</Button></DialogFooter></DialogContent></Dialog>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={saveIrradiationData} className="w-full bg-transparent text-white border-blue-500/50 hover:bg-blue-500/20"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
                        <Button size="sm" variant="outline" onClick={loadIrradiationData} className="w-full bg-transparent text-white border-green-500/50 hover:bg-green-500/20"><Search className="w-4 h-4 mr-2" /> Buscar</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StandardAnalysisForm;