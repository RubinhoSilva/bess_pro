import React, { useState, useCallback } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Grid3x3, Plus, Minus, RotateCw, Move3d } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Module3D {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: { width: number; height: number; depth: number };
}

interface ModuleVisualizerProps {
  selectedAreaId?: string;
  mountingAreas?: any[];
  onModulesChange?: (modules: Module3D[]) => void;
}

export const ModuleVisualizer: React.FC<ModuleVisualizerProps> = ({
  selectedAreaId,
  mountingAreas = [],
  onModulesChange
}) => {
  const [modules, setModules] = useState<Module3D[]>([]);
  const [moduleConfig, setModuleConfig] = useState({
    width: 2.0, // meters
    height: 1.2, // meters  
    depth: 0.04, // meters
    spacing: 0.02, // gap between modules
    tilt: 15 // degrees
  });
  const [gridConfig, setGridConfig] = useState({
    rows: 3,
    columns: 8
  });

  const selectedArea = mountingAreas.find(area => area.id === selectedAreaId);

  const generateModuleGrid = useCallback(() => {
    if (!selectedArea) return;

    const newModules: Module3D[] = [];
    const { width, height, depth, spacing, tilt } = moduleConfig;
    const { rows, columns } = gridConfig;

    // Calculate grid dimensions
    const gridWidth = columns * width + (columns - 1) * spacing;
    const gridHeight = rows * height + (rows - 1) * spacing;

    // Get area center (simplified - using first point as reference)
    const areaCenter = selectedArea.geometria[0] || { x: 0, y: 0, z: 0 };
    
    // Start position (top-left of grid)
    const startX = areaCenter.x - gridWidth / 2;
    const startZ = areaCenter.z - gridHeight / 2;
    const baseY = areaCenter.y + 0.1; // Slightly above the area

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = startX + col * (width + spacing) + width / 2;
        const z = startZ + row * (height + spacing) + height / 2;
        
        // Apply tilt rotation
        const y = baseY + Math.sin(tilt * Math.PI / 180) * depth;

        newModules.push({
          id: `module-${row}-${col}`,
          position: [x, y, z],
          rotation: [tilt * Math.PI / 180, 0, 0], // Convert to radians
          size: { width, height, depth }
        });
      }
    }

    setModules(newModules);
    if (onModulesChange) {
      onModulesChange(newModules);
    }
  }, [selectedArea, moduleConfig, gridConfig, onModulesChange]);

  const clearModules = () => {
    setModules([]);
    if (onModulesChange) {
      onModulesChange([]);
    }
  };

  const updateGridSize = (dimension: 'rows' | 'columns', delta: number) => {
    setGridConfig(prev => ({
      ...prev,
      [dimension]: Math.max(1, prev[dimension] + delta)
    }));
  };

  return (
    <>
      {/* Module Configuration UI */}
      <Html position={[10, 8, 0]} portal={{ current: document.body }}>
        <div className="absolute top-20 right-4 z-20">
          <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-4 backdrop-blur-sm w-72">
            <div className="flex items-center gap-2 mb-4">
              <Grid3x3 className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Módulos Solares</span>
            </div>

            {!selectedAreaId && (
              <div className="text-sm text-yellow-400 mb-4 p-2 bg-yellow-500/10 rounded">
                Selecione uma área de montagem para posicionar módulos
              </div>
            )}

            {selectedAreaId && (
              <div className="space-y-4">
                {/* Grid Configuration */}
                <div>
                  <Label className="text-slate-300 text-sm mb-2 block">
                    Configuração da Grade
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-slate-400">Linhas</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => updateGridSize('rows', -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-white text-sm w-8 text-center">
                          {gridConfig.rows}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => updateGridSize('rows', 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Colunas</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => updateGridSize('columns', -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-white text-sm w-8 text-center">
                          {gridConfig.columns}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => updateGridSize('columns', 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module Configuration */}
                <div>
                  <Label className="text-slate-300 text-sm mb-2 block">
                    Configuração do Módulo
                  </Label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-slate-400">Largura (m)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={moduleConfig.width}
                          onChange={(e) => setModuleConfig(prev => ({
                            ...prev,
                            width: parseFloat(e.target.value) || prev.width
                          }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Altura (m)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={moduleConfig.height}
                          onChange={(e) => setModuleConfig(prev => ({
                            ...prev,
                            height: parseFloat(e.target.value) || prev.height
                          }))}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Inclinação (°)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={moduleConfig.tilt}
                        onChange={(e) => setModuleConfig(prev => ({
                          ...prev,
                          tilt: parseFloat(e.target.value) || prev.tilt
                        }))}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={generateModuleGrid}
                    className="flex-1"
                  >
                    <Grid3x3 className="w-4 h-4 mr-1" />
                    Gerar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearModules}
                  >
                    Limpar
                  </Button>
                </div>

                {/* Stats */}
                {modules.length > 0 && (
                  <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-600">
                    <div>Total de módulos: {modules.length}</div>
                    <div>Potência estimada: {(modules.length * 0.55).toFixed(1)} kW</div>
                    <div>Área ocupada: {(gridConfig.rows * gridConfig.columns * moduleConfig.width * moduleConfig.height).toFixed(1)} m²</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Html>

      {/* 3D Module Visualization */}
      {modules.map((module) => (
        <mesh
          key={module.id}
          position={module.position}
          rotation={module.rotation}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[module.size.width, module.size.depth, module.size.height]} />
          <meshStandardMaterial 
            color="#1e3a8a"  // Dark blue for solar panels
            metalness={0.8}
            roughness={0.2}
          />
          
          {/* Module frame */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(module.size.width, module.size.depth, module.size.height)]} />
            <lineBasicMaterial color="#374151" />
          </lineSegments>
        </mesh>
      ))}
    </>
  );
};