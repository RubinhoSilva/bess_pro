import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Ruler, 
  Square, 
  Grid3x3, 
  Upload, 
  Sun, 
  Layers3,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Viewer3DToolbarProps {
  activeTool: string;
  onToolChange: (tool: 'none' | 'measure' | 'area' | 'modules' | 'upload') => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onAddArea: () => void;
  sunPosition: { azimuth: number; elevation: number };
  className?: string;
}

export const Viewer3DToolbar: React.FC<Viewer3DToolbarProps> = ({
  activeTool,
  onToolChange,
  showGrid,
  onToggleGrid,
  onAddArea,
  sunPosition,
  className = ""
}) => {
  return (
    <div className={`bg-slate-800/90 border border-slate-600 rounded-lg p-2 backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-1">
        {/* Model Tools */}
        <div className="flex items-center gap-1">
          <Button
            variant={activeTool === 'upload' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('upload')}
            className="h-8 w-8 p-0"
            title="Carregar Modelo 3D"
          >
            <Upload className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleGrid}
            className="h-8 w-8 p-0"
            title={showGrid ? "Ocultar Grid" : "Mostrar Grid"}
          >
            {showGrid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-600" />

        {/* Measurement Tools */}
        <div className="flex items-center gap-1">
          <Button
            variant={activeTool === 'measure' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('measure')}
            className="h-8 w-8 p-0"
            title="Ferramenta de Medição"
          >
            <Ruler className="w-4 h-4" />
          </Button>
          
          <Button
            variant={activeTool === 'area' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('area')}
            className="h-8 w-8 p-0"
            title="Ferramenta de Áreas"
          >
            <Square className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddArea}
            className="h-8 w-8 p-0"
            title="Adicionar Área de Montagem"
          >
            <Layers3 className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-600" />

        {/* Module Tools */}
        <div className="flex items-center gap-1">
          <Button
            variant={activeTool === 'modules' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToolChange('modules')}
            className="h-8 w-8 p-0"
            title="Posicionamento de Módulos"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-slate-600" />

        {/* Solar Info */}
        <div className="flex items-center gap-2 px-2">
          <Sun className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-slate-300">
            {sunPosition.elevation.toFixed(0)}°
          </span>
        </div>
      </div>
      
      {/* Tool Instructions */}
      {activeTool !== 'none' && (
        <div className="mt-2 pt-2 border-t border-slate-600">
          <div className="text-xs text-slate-300">
            {activeTool === 'measure' && "Clique em dois pontos para medir distância"}
            {activeTool === 'area' && "Defina uma área de montagem clicando nos cantos"}
            {activeTool === 'modules' && "Posicione módulos solares na área selecionada"}
          </div>
        </div>
      )}
    </div>
  );
};