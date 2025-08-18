import React, { useState, useMemo, useCallback } from 'react';
import { Scene3D } from './Scene3D';
import { Viewer3DToolbar } from './Viewer3DToolbar';
import { ModelUploadDialog } from './ModelUploadDialog';
import * as SunCalc from 'suncalc';

interface Viewer3DProps {
  className?: string;
  latitude?: number;
  longitude?: number;
  initialModelUrl?: string;
  onMeasurement?: (measurement: any) => void;
  onAreaCreate?: (area: any) => void;
  onAreaSelect?: (areaId: string) => void;
}

type Tool = 'none' | 'measure' | 'area' | 'modules' | 'upload';

export const Viewer3D: React.FC<Viewer3DProps> = ({
  className = "",
  latitude = -23.5505, // São Paulo default
  longitude = -46.6333,
  initialModelUrl,
  onMeasurement,
  onAreaCreate,
  onAreaSelect
}) => {
  const [activeTool, setActiveTool] = useState<Tool>('none');
  const [modelUrl, setModelUrl] = useState<string | undefined>(initialModelUrl);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedAreaId, setSelectedAreaId] = useState<string>();
  const [mountingAreas, setMountingAreas] = useState<any[]>([]);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);

  // Calculate sun position based on current date and location
  const sunPosition = useMemo(() => {
    const now = new Date();
    const sunPos = SunCalc.getPosition(now, latitude, longitude);
    
    return {
      azimuth: (sunPos.azimuth * 180 / Math.PI) + 180, // Convert to degrees and adjust
      elevation: Math.max(0, sunPos.altitude * 180 / Math.PI) // Ensure non-negative
    };
  }, [latitude, longitude]);

  const handleToolChange = useCallback((tool: Tool) => {
    setActiveTool(activeTool === tool ? 'none' : tool);
    
    if (tool === 'upload') {
      setIsModelDialogOpen(true);
      setActiveTool('none');
    }
  }, [activeTool]);

  const handleModelUpload = useCallback((url: string) => {
    setModelUrl(url);
    setIsModelDialogOpen(false);
  }, []);

  const handleMeasureComplete = useCallback((measurement: any) => {
    if (onMeasurement) {
      onMeasurement(measurement);
    }
  }, [onMeasurement]);

  const handleAreaSelect = useCallback((areaId: string) => {
    setSelectedAreaId(areaId);
    if (onAreaSelect) {
      onAreaSelect(areaId);
    }
  }, [onAreaSelect]);

  const handleAddArea = useCallback(() => {
    const newArea = {
      id: `area-${Date.now()}`,
      name: `Área ${mountingAreas.length + 1}`,
      geometria: [
        { x: -5, y: 0, z: -5 },
        { x: 5, y: 0, z: -5 },
        { x: 5, y: 0, z: 5 },
        { x: -5, y: 0, z: 5 }
      ],
      color: '#10b981',
      opacity: 0.4
    };
    
    const newAreas = [...mountingAreas, newArea];
    setMountingAreas(newAreas);
    setSelectedAreaId(newArea.id);
    
    if (onAreaCreate) {
      onAreaCreate(newArea);
    }
  }, [mountingAreas, onAreaCreate]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Main 3D Scene */}
      <Scene3D
        modelUrl={modelUrl}
        activeTool={activeTool}
        showGrid={showGrid}
        sunPosition={sunPosition}
        onMeasureComplete={handleMeasureComplete}
        mountingAreas={mountingAreas}
        selectedAreaId={selectedAreaId}
        className="w-full h-full"
      />

      {/* Toolbar */}
      <Viewer3DToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onAddArea={handleAddArea}
        sunPosition={sunPosition}
        className="absolute top-4 left-4 z-10"
      />

      {/* Model Upload Dialog */}
      <ModelUploadDialog
        isOpen={isModelDialogOpen}
        onClose={() => setIsModelDialogOpen(false)}
        onUpload={handleModelUpload}
      />

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 border border-slate-600 rounded-lg p-3 backdrop-blur-sm z-10">
        <div className="text-white text-xs space-y-1">
          <div>Sol: {sunPosition.elevation.toFixed(1)}° elevação</div>
          <div>Azimute: {sunPosition.azimuth.toFixed(1)}°</div>
          <div>Áreas: {mountingAreas.length}</div>
          {selectedAreaId && (
            <div className="text-blue-400">Área selecionada: {selectedAreaId}</div>
          )}
        </div>
      </div>
    </div>
  );
};