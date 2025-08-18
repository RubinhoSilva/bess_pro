import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Zap, AlertTriangle, CheckCircle, Scale, Unplug } from 'lucide-react';

const CableSizingResult = ({ results }) => {
    const { cableSizingResults } = results;

    if (!cableSizingResults || cableSizingResults.length === 0) {
        return (
            <Card className="bg-slate-800/50 border-slate-700 h-full">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-400" /> Resultado dos Circuitos CA
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-400 text-center py-8">Nenhum cálculo de circuito CA foi configurado ou salvo.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-slate-800/50 border-slate-700 h-full">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-400" /> Resultado dos Circuitos CA
                </CardTitle>
                <CardDescription className="text-slate-300">
                    Cálculos conforme NBR 5410 para cada inversor.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {cableSizingResults.map((res, index) => (
                    <div key={index} className="p-3 bg-slate-700/50 rounded-lg">
                        <h4 className="font-semibold text-purple-300 flex items-center gap-2 mb-2"><Unplug className="w-4 h-4" /> {res.inverterName}</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Corrente: <span className="font-mono">{res.correnteProjeto.toFixed(2)} A</span></div>
                            <div className="flex items-center gap-2"><Scale className="w-4 h-4 text-blue-400" /> Cabo: <span className="font-mono">{res.secaoMinimaCalculada} mm²</span></div>
                            <div className="flex items-center gap-2 col-span-2">
                                {res.isQuedaTensaoOk ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                                Queda de Tensão: <span className="font-mono">{res.quedaTensaoPercentual.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default CableSizingResult;