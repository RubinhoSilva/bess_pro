import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Crop, Box, Mountain, CloudSun, Save, Undo, Redo, Upload, View, TimerReset as CameraReset, Search, MousePointer, X, Grid3x3 as Grid3d, Ruler } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ToolButton = ({ icon, onClick, isActive, disabled, tooltip, side = "right" }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button 
                variant="ghost" 
                size="icon"
                className={`w-12 h-12 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors ${isActive ? 'bg-blue-600 text-white' : ''} disabled:opacity-50 disabled:cursor-not-allowed`} 
                onClick={onClick} 
                disabled={disabled}
            >
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </Button>
        </TooltipTrigger>
        <TooltipContent side={side}><p>{tooltip}</p></TooltipContent>
    </Tooltip>
);

const Toolbar = ({ activeTool, toggleTool, modelLoaded, useAsTerrain, showGuideGrid, project, onSaveProject }) => {
    const navigate = useNavigate();

    const leftDockTools = [
        { id: 'measure', icon: <Ruler />, tooltip: "Medir distância entre dois pontos." },
        { id: 'module-area', icon: <Crop />, tooltip: "Delimitar área onde os painéis solares serão instalados." },
        { id: 'shading', icon: <CloudSun />, tooltip: "Analisar sombreamento na área selecionada.", disabled: !project?.project_data?.location },
        { id: 'obstacles', icon: <Box />, tooltip: "Inserir objetos que causam sombreamento." },
        { id: 'terrain', icon: <Mountain />, tooltip: "Usar modelo 3D como modelo de terreno." },
        { id: 'guide-grid', icon: <Grid3d />, tooltip: "Mostrar/Ocultar grade de orientação." },
    ];

    const topBarTools = [
        { id: 'save', icon: <Save />, tooltip: "Salvar Projeto", action: onSaveProject },
        { id: 'undo', icon: <Undo />, tooltip: "Desfazer" },
        { id: 'redo', icon: <Redo />, tooltip: "Refazer" },
        { id: 'export', icon: <Upload />, tooltip: "Exportar Layout" },
        { id: 'view-mode', icon: <View />, tooltip: "Visualização 2D / 3D" },
        { id: 'reset', icon: <CameraReset />, tooltip: "Resetar visão da câmera" },
        { id: 'zoom', icon: <Search />, tooltip: "Zoom" },
        { id: 'orbit', icon: <MousePointer />, tooltip: "Orbit Controls" },
    ];

    const handleToolClick = (tool) => {
        if (tool.action) {
            tool.action();
        } else {
            toggleTool(tool.id);
        }
    };

    const isToolActive = (toolId) => {
        if (toolId === 'terrain') return useAsTerrain;
        if (toolId === 'guide-grid') return showGuideGrid;
        return activeTool === toolId;
    };

    const isToolDisabled = (toolId) => {
        const tool = leftDockTools.find(t => t.id === toolId);
        if (tool && tool.disabled) return true;
        return !modelLoaded && !['reset', 'orbit', 'guide-grid', 'save'].includes(toolId);
    };

    return (
        <TooltipProvider>
            <div className="absolute top-4 left-4 z-10">
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-2 flex flex-col items-center gap-4 border border-slate-700">
                    {leftDockTools.map(tool => (
                        <ToolButton 
                            key={tool.id}
                            icon={tool.icon} 
                            onClick={() => handleToolClick(tool)} 
                            isActive={isToolActive(tool.id)}
                            disabled={isToolDisabled(tool.id)}
                            tooltip={tool.tooltip} 
                        />
                    ))}
                </div>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-2 flex items-center gap-4 border border-slate-700">
                    {topBarTools.map(tool => (
                        <ToolButton 
                            key={tool.id}
                            icon={tool.icon} 
                            onClick={() => handleToolClick(tool)} 
                            isActive={activeTool === tool.id} 
                            disabled={isToolDisabled(tool.id)}
                            tooltip={tool.tooltip}
                            side="bottom"
                        />
                    ))}
                </div>
            </div>
            
            <div className="absolute top-4 right-4 z-10">
                 <Button variant="ghost" size="icon" className="w-12 h-12 text-slate-300 hover:bg-red-500/20 hover:text-white" onClick={() => navigate(-1)}>
                    <X className="w-6 h-6" />
                 </Button>
            </div>
        </TooltipProvider>
    );
};

export default Toolbar;