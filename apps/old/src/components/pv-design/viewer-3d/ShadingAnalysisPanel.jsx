import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { CloudSun, X, Play, BarChart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ShadingAnalysisPanel = ({ selectedArea, onRunAnalysis, onClose }) => {
    const { toast } = useToast();
    const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().split('T')[0]);
    const [timeOfDay, setTimeOfDay] = useState([12]);

    const hasModules = selectedArea && selectedArea.layout_modulos && selectedArea.modulo_id;

    const handleRunClick = () => {
        if (!hasModules) {
            toast({
                variant: 'destructive',
                title: 'Análise de Sombreamento Indisponível',
                description: 'É necessário primeiro inserir e salvar os módulos na área de montagem para realizar esta análise.',
            });
            return;
        }
        onRunAnalysis({ date: analysisDate, time: timeOfDay[0] });
    };

    return (
        <div className="absolute top-0 right-0 w-96 h-full bg-slate-900/80 backdrop-blur-sm border-l border-slate-700 p-4 flex flex-col z-20">
            <Card className="bg-transparent border-none shadow-none flex-grow flex flex-col">
                <CardHeader className="p-2 flex-row justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                        <CloudSun className="w-5 h-5 text-cyan-400" />
                        Análise de Sombreamento
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>
                <CardContent className="p-2 space-y-6 overflow-y-auto flex-grow">
                    <div className="p-3 bg-slate-800 rounded-lg">
                        <p className="text-sm font-semibold text-white">Área Selecionada:</p>
                        <p className="text-lg font-bold text-cyan-400">{selectedArea ? selectedArea.nome : 'Nenhuma'}</p>
                    </div>

                    <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h4 className="font-semibold text-white">Parâmetros da Simulação</h4>
                        <div className="space-y-2">
                            <Label className="text-white">Data da Análise</Label>
                            <Input
                                type="date"
                                value={analysisDate}
                                onChange={(e) => setAnalysisDate(e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white"
                                disabled={!hasModules}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Hora do Dia: {String(timeOfDay[0]).padStart(2, '0')}:00</Label>
                            <Slider
                                value={timeOfDay}
                                onValueChange={setTimeOfDay}
                                min={6}
                                max={18}
                                step={1}
                                className="my-4"
                                disabled={!hasModules}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button onClick={handleRunClick} disabled={!hasModules} className="bg-blue-600 hover:bg-blue-700">
                            <Play className="w-4 h-4 mr-2" />
                            Visualizar Sombra
                        </Button>
                        <Button disabled={!hasModules} variant="outline" className="border-slate-600 hover:bg-slate-700">
                            <BarChart className="w-4 h-4 mr-2" />
                            Gerar Relatório de Perdas
                        </Button>
                    </div>

                     {!hasModules && (
                        <div className="p-4 text-center bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
                            Selecione uma área de montagem e adicione módulos para habilitar a análise de sombreamento.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ShadingAnalysisPanel;