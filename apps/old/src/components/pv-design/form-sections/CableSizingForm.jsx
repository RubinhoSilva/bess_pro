import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Zap, Save, CheckCircle } from 'lucide-react';
import { installationMethods } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';

const CableSizingForm = ({ formData, onFormChange }) => {
    const { toast } = useToast();
    const [allInverters, setAllInverters] = useState([]);
    const [selectedInverterId, setSelectedInverterId] = useState('');
    const [currentParams, setCurrentParams] = useState({
        tipoLigacao: 'trifasico',
        tensaoCA: 380,
        tipoCabo: 'pvc',
        distanciaCircuito: 20,
        metodoInstalacao: 'B1',
    });

    useEffect(() => {
        setAllInverters(JSON.parse(localStorage.getItem('pvInverters') || '[]'));
    }, [formData.inverters]);

    useEffect(() => {
        if (selectedInverterId) {
            const existingParams = formData.cableSizing.find(cs => cs.inverterId === selectedInverterId);
            if (existingParams) {
                setCurrentParams(existingParams);
            } else {
                setCurrentParams({
                    inverterId: selectedInverterId,
                    tipoLigacao: 'trifasico',
                    tensaoCA: 380,
                    tipoCabo: 'pvc',
                    distanciaCircuito: 20,
                    metodoInstalacao: 'B1',
                });
            }
        }
    }, [selectedInverterId, formData.cableSizing]);

    const handleParamChange = (field, value) => {
        setCurrentParams(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveCalculation = () => {
        if (!selectedInverterId) {
            toast({ variant: 'destructive', title: 'Selecione um inversor primeiro.' });
            return;
        }
        const updatedSizing = formData.cableSizing.filter(cs => cs.inverterId !== selectedInverterId);
        onFormChange('cableSizing', [...updatedSizing, { ...currentParams, inverterId: selectedInverterId }]);
        toast({ title: 'Parâmetros salvos!', description: 'Os dados do circuito para este inversor foram salvos.' });
    };

    const configuredInverters = formData.inverters.filter(inv => inv.selectedInverterId);

    return (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white"><Zap className="w-5 h-5 text-yellow-400" /> Dimensionamento dos Circuitos CA</CardTitle>
                <CardDescription>Configure os parâmetros do circuito para cada inversor do projeto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Selecione o Inversor para Configurar</Label>
                    <Select onValueChange={setSelectedInverterId} value={selectedInverterId}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Selecione um inversor..." />
                        </SelectTrigger>
                        <SelectContent>
                            {configuredInverters.length > 0 ? configuredInverters.map((inv, index) => {
                                const details = allInverters.find(i => i.id === inv.selectedInverterId);
                                const isConfigured = formData.cableSizing.some(cs => cs.inverterId === inv.id);
                                return (
                                    <SelectItem key={inv.id} value={inv.id}>
                                        <div className="flex items-center justify-between w-full">
                                            <span>Inversor {index + 1}: {details?.nome || 'Não encontrado'}</span>
                                            {isConfigured && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        </div>
                                    </SelectItem>
                                );
                            }) : <SelectItem value="none" disabled>Adicione e selecione inversores nos Parâmetros do Sistema.</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>

                {selectedInverterId && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-600">
                            <div className="space-y-2">
                                <Label>Tipo de Ligação</Label>
                                <Select onValueChange={(v) => handleParamChange('tipoLigacao', v)} value={currentParams.tipoLigacao}>
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monofasico">Monofásico</SelectItem>
                                        <SelectItem value="bifasico">Bifásico</SelectItem>
                                        <SelectItem value="trifasico">Trifásico</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tensão (V)</Label>
                                <Select onValueChange={(v) => handleParamChange('tensaoCA', Number(v))} value={String(currentParams.tensaoCA)}>
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="127">127V</SelectItem>
                                        <SelectItem value="220">220V</SelectItem>
                                        <SelectItem value="380">380V</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Isolação do Cabo</Label>
                                <RadioGroup value={currentParams.tipoCabo} onValueChange={(v) => handleParamChange('tipoCabo', v)} className="flex space-x-4 pt-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="pvc" id="pvc" /><Label htmlFor="pvc">PVC (70°C)</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="epr" id="epr" /><Label htmlFor="epr">EPR/XLPE (90°C)</Label></div>
                                </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <Label>Distância do Circuito (m)</Label>
                                <Input type="number" value={currentParams.distanciaCircuito} onChange={(e) => handleParamChange('distanciaCircuito', Number(e.target.value))} className="bg-slate-700 border-slate-600 text-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Método de Instalação</Label>
                            <Select onValueChange={(v) => handleParamChange('metodoInstalacao', v)} value={currentParams.metodoInstalacao}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent>{installationMethods.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSaveCalculation} className="w-full mt-4"><Save className="w-4 h-4 mr-2" /> Salvar Cálculo para este Inversor</Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default CableSizingForm;