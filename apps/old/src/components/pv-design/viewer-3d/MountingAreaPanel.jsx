import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Edit, Trash2, Eye } from 'lucide-react';

const MountingAreaPanel = ({ areas, selectedAreaId, onSelectArea, onDeleteArea, onEditArea, onHoverArea }) => {

    return (
        <div className="w-80 h-screen bg-slate-900/80 backdrop-blur-sm border-l border-slate-700 p-4 flex flex-col">
            <Card className="bg-transparent border-none shadow-none flex-grow flex flex-col">
                <CardHeader className="p-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                        <Layers className="w-5 h-5 text-cyan-400" />
                        Áreas de Montagem
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-2 overflow-y-auto flex-grow">
                    {areas.length === 0 ? (
                        <div className="text-center text-slate-400 py-10">
                            <p>Nenhuma área de montagem definida.</p>
                            <p className="text-sm mt-2">Use a ferramenta <span className="font-bold text-cyan-300">Delimitar Área</span> para começar.</p>
                        </div>
                    ) : (
                        areas.map((area) => (
                            <div 
                                key={area.id} 
                                className={`p-3 rounded-lg border transition-colors cursor-pointer
                                    ${selectedAreaId === area.id ? 'bg-blue-600/30 border-blue-400' : 'bg-slate-800/70 border-slate-700 hover:border-cyan-500'}
                                `}
                                onClick={() => onSelectArea(area.id)}
                                onMouseEnter={() => onHoverArea(area.id)}
                                onMouseLeave={() => onHoverArea(null)}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-white truncate pr-2">{area.nome}</span>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onSelectArea(area.id); }}><Eye className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEditArea(area); }}><Edit className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); onDeleteArea(area.id); }}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 mt-2">
                                    <p>Área: {area.area_util_m2?.toFixed(2) || 'N/A'} m²</p>
                                    <p>Inclinação: {area.inclinacao?.toFixed(1) || 'N/A'}°</p>
                                    <p>Orientação: {area.orientacao?.toFixed(1) || 'N/A'}°</p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MountingAreaPanel;