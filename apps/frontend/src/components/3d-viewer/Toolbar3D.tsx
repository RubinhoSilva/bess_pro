import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Grid3X3, 
  Eye, 
  EyeOff, 
  Sun, 
  Ruler, 
  Move3D, 
  RotateCcw, 
  Upload,
  Download,
  Settings,
  Layers,
  Home
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type Tool3D = 
  | 'select' 
  | 'measure' 
  | 'solar-area' 
  | 'shading-analysis' 
  | 'module-placement'
  | null;

interface Toolbar3DProps {
  activeTool: Tool3D;
  onToolSelect: (tool: Tool3D) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showAxes: boolean;
  onToggleAxes: () => void;
  showShadows: boolean;
  onToggleShadows: () => void;
  modelLoaded: boolean;
  onUploadModel: () => void;
  onDownloadModel: () => void;
  onResetView: () => void;
  onOpenSettings: () => void;
}

const ToolButton = ({ 
  active, 
  onClick, 
  icon: Icon, 
  tooltip, 
  disabled = false 
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  disabled?: boolean;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "default" : "outline"}
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={`w-10 h-10 p-0 ${active ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
        >
          <Icon className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const ToggleButton = ({ 
  active, 
  onClick, 
  activeIcon: ActiveIcon, 
  inactiveIcon: InactiveIcon, 
  tooltip 
}: {
  active: boolean;
  onClick: () => void;
  activeIcon: React.ComponentType<{ className?: string }>;
  inactiveIcon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={onClick}
          className={`w-10 h-10 p-0 ${active ? 'bg-green-100 border-green-300' : ''}`}
        >
          {active ? <ActiveIcon className="w-4 h-4" /> : <InactiveIcon className="w-4 h-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function Toolbar3D({
  activeTool,
  onToolSelect,
  showGrid,
  onToggleGrid,
  showAxes,
  onToggleAxes,
  showShadows,
  onToggleShadows,
  modelLoaded,
  onUploadModel,
  onDownloadModel,
  onResetView,
  onOpenSettings
}: Toolbar3DProps) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg border shadow-lg p-2">
      <div className="flex flex-col gap-2">
        {/* File Operations */}
        <div className="flex gap-1 pb-2 border-b">
          <ToolButton
            active={false}
            onClick={onUploadModel}
            icon={Upload}
            tooltip="Carregar Modelo 3D"
          />
          <ToolButton
            active={false}
            onClick={onDownloadModel}
            icon={Download}
            tooltip="Baixar Modelo"
            disabled={!modelLoaded}
          />
        </div>

        {/* Tools */}
        <div className="flex gap-1 pb-2 border-b">
          <ToolButton
            active={activeTool === 'select'}
            onClick={() => onToolSelect(activeTool === 'select' ? null : 'select')}
            icon={Move3D}
            tooltip="Ferramenta de Seleção"
          />
          <ToolButton
            active={activeTool === 'measure'}
            onClick={() => onToolSelect(activeTool === 'measure' ? null : 'measure')}
            icon={Ruler}
            tooltip="Ferramenta de Medição"
            disabled={!modelLoaded}
          />
          <ToolButton
            active={activeTool === 'solar-area'}
            onClick={() => onToolSelect(activeTool === 'solar-area' ? null : 'solar-area')}
            icon={Layers}
            tooltip="Definir Área Solar"
            disabled={!modelLoaded}
          />
          <ToolButton
            active={activeTool === 'shading-analysis'}
            onClick={() => onToolSelect(activeTool === 'shading-analysis' ? null : 'shading-analysis')}
            icon={Sun}
            tooltip="Análise de Sombreamento"
            disabled={!modelLoaded}
          />
        </div>

        {/* View Controls */}
        <div className="flex gap-1 pb-2 border-b">
          <ToggleButton
            active={showGrid}
            onClick={onToggleGrid}
            activeIcon={Grid3X3}
            inactiveIcon={Grid3X3}
            tooltip={showGrid ? "Ocultar Grade" : "Mostrar Grade"}
          />
          <ToggleButton
            active={showAxes}
            onClick={onToggleAxes}
            activeIcon={Eye}
            inactiveIcon={EyeOff}
            tooltip={showAxes ? "Ocultar Eixos" : "Mostrar Eixos"}
          />
          <ToggleButton
            active={showShadows}
            onClick={onToggleShadows}
            activeIcon={Sun}
            inactiveIcon={Sun}
            tooltip={showShadows ? "Desabilitar Sombras" : "Habilitar Sombras"}
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-1">
          <ToolButton
            active={false}
            onClick={onResetView}
            icon={Home}
            tooltip="Resetar Visualização"
          />
          <ToolButton
            active={false}
            onClick={() => onToolSelect(null)}
            icon={RotateCcw}
            tooltip="Limpar Seleção"
          />
          <ToolButton
            active={false}
            onClick={onOpenSettings}
            icon={Settings}
            tooltip="Configurações"
          />
        </div>
      </div>
    </div>
  );
}