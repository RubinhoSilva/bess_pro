import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Html, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  Grid3x3, Plus, Minus, RotateCw, Move3d, Settings, 
  Sun, Zap, Calculator, Eye, EyeOff 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Module3D {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: { width: number; height: number; depth: number };
  efficiency: number;
  power: number;
  isSelected: boolean;
  isObstructed: boolean;
  shadingFactor: number;
  azimuth: number;
  tilt: number;
}

interface ModuleRow {
  id: string;
  modules: Module3D[];
  spacing: number;
  tilt: number;
  azimuth: number;
}

interface AdvancedModuleGridVisualizerProps {
  selectedAreaId?: string;
  mountingAreas?: any[];
  sunPosition?: { azimuth: number; elevation: number };
  onModulesChange?: (modules: Module3D[]) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const AdvancedModuleGridVisualizer: React.FC<AdvancedModuleGridVisualizerProps> = ({
  selectedAreaId,
  mountingAreas = [],
  sunPosition = { azimuth: 180, elevation: 45 },
  onModulesChange,
  onSelectionChange
}) => {
  const { camera, raycaster, mouse } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  
  const [modules, setModules] = useState<Module3D[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showOptimizations, setShowOptimizations] = useState(true);
  const [showShading, setShowShading] = useState(true);
  
  // Advanced configuration state
  const [config, setConfig] = useState({
    // Module specifications
    module: {
      width: 2.0,
      height: 1.2,
      depth: 0.04,
      power: 550, // Watts
      efficiency: 22.5 // %
    },
    // Grid configuration
    grid: {
      rows: 3,
      columns: 8,
      rowSpacing: 0.5, // space between rows
      moduleSpacing: 0.02, // space between modules in same row
      orientation: 'portrait' as 'portrait' | 'landscape'
    },
    // Installation parameters
    installation: {
      tilt: 15, // degrees
      azimuth: 180, // degrees (south = 180)
      minRowSpacing: 1.0, // minimum spacing to avoid shading
      installationHeight: 0.3, // height above roof
      rackingSystem: 'fixed' as 'fixed' | 'tracking'
    },
    // Optimization settings
    optimization: {
      avoidShading: true,
      optimizeSpacing: true,
      maximizePower: true,
      respectSetbacks: true,
      minEfficiency: 80 // %
    }
  });

  const selectedArea = mountingAreas.find(area => area.id === selectedAreaId);

  // Calculate optimized module spacing to avoid inter-row shading
  const calculateOptimalSpacing = useCallback((tilt: number, moduleHeight: number, sunElevation: number) => {
    if (sunElevation <= 0) return config.installation.minRowSpacing;
    
    // Shadow length formula: L = H / tan(sun_elevation)
    // where H is the height of the tilted module
    const moduleVerticalHeight = moduleHeight * Math.sin(tilt * Math.PI / 180);
    const shadowLength = moduleVerticalHeight / Math.tan(Math.max(sunElevation * Math.PI / 180, 0.1));
    
    // Add safety margin
    return Math.max(shadowLength * 1.2, config.installation.minRowSpacing);
  }, [config.installation.minRowSpacing]);

  // Calculate shading factor for each module
  const calculateShadingFactor = useCallback((module: Module3D, allModules: Module3D[]) => {
    if (!sunPosition || sunPosition.elevation <= 0) return 0;

    let shadingFactor = 0;
    const modulePos = new THREE.Vector3(...module.position);
    
    // Create sun direction vector
    const sunDir = new THREE.Vector3(
      Math.cos(sunPosition.elevation * Math.PI / 180) * Math.sin(sunPosition.azimuth * Math.PI / 180),
      Math.sin(sunPosition.elevation * Math.PI / 180),
      Math.cos(sunPosition.elevation * Math.PI / 180) * Math.cos(sunPosition.azimuth * Math.PI / 180)
    ).normalize();

    // Check obstruction from other modules
    allModules.forEach(otherModule => {
      if (otherModule.id === module.id) return;
      
      const otherPos = new THREE.Vector3(...otherModule.position);
      const distance = modulePos.distanceTo(otherPos);
      
      // Simple shading calculation - can be made more sophisticated
      if (distance < 10) { // within shading range
        const directionToOther = otherPos.clone().sub(modulePos).normalize();
        const shadowAlignment = directionToOther.dot(sunDir);
        
        if (shadowAlignment > 0.7) { // module is in shadow direction
          shadingFactor += Math.max(0, 1 - distance / 5) * 0.3;
        }
      }
    });

    return Math.min(shadingFactor, 0.8); // max 80% shading
  }, [sunPosition]);

  // Generate intelligent module grid
  const generateIntelligentGrid = useCallback(() => {
    if (!selectedArea) return;

    const newModules: Module3D[] = [];
    const { module: moduleSpec, grid, installation, optimization } = config;
    
    // Calculate area bounds
    const areaPoints = selectedArea.geometria;
    const bounds = areaPoints.reduce((acc: any, point: any) => {
      return {
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minZ: Math.min(acc.minZ, point.z),
        maxZ: Math.max(acc.maxZ, point.z)
      };
    }, { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });

    const areaWidth = bounds.maxX - bounds.minX;
    const areaHeight = bounds.maxZ - bounds.minZ;
    const areaCenter = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: selectedArea.geometria[0]?.y || 0,
      z: (bounds.minZ + bounds.maxZ) / 2
    };

    // Calculate module dimensions based on orientation
    const moduleWidth = grid.orientation === 'portrait' ? moduleSpec.width : moduleSpec.height;
    const moduleHeight = grid.orientation === 'portrait' ? moduleSpec.height : moduleSpec.width;

    // Calculate optimal row spacing
    const optimalRowSpacing = optimization.optimizeSpacing 
      ? calculateOptimalSpacing(installation.tilt, moduleHeight, sunPosition.elevation)
      : grid.rowSpacing;

    // Calculate grid layout
    const totalGridWidth = grid.columns * moduleWidth + (grid.columns - 1) * grid.moduleSpacing;
    const totalGridHeight = grid.rows * moduleHeight + (grid.rows - 1) * optimalRowSpacing;

    // Check if grid fits in area
    if (totalGridWidth > areaWidth || totalGridHeight > areaHeight) {
    }

    // Generate modules
    const startX = areaCenter.x - totalGridWidth / 2;
    const startZ = areaCenter.z - totalGridHeight / 2;

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.columns; col++) {
        const x = startX + col * (moduleWidth + grid.moduleSpacing) + moduleWidth / 2;
        const z = startZ + row * (moduleHeight + optimalRowSpacing) + moduleHeight / 2;
        const y = areaCenter.y + installation.installationHeight;

        // Apply tilt
        const tiltedY = y + Math.sin(installation.tilt * Math.PI / 180) * moduleSpec.depth / 2;

        const module: Module3D = {
          id: `module-${row}-${col}`,
          position: [x, tiltedY, z],
          rotation: [installation.tilt * Math.PI / 180, installation.azimuth * Math.PI / 180, 0],
          size: { width: moduleWidth, height: moduleHeight, depth: moduleSpec.depth },
          efficiency: moduleSpec.efficiency,
          power: moduleSpec.power,
          isSelected: false,
          isObstructed: false,
          shadingFactor: 0,
          azimuth: installation.azimuth,
          tilt: installation.tilt
        };

        newModules.push(module);
      }
    }

    // Calculate shading for all modules
    const modulesWithShading = newModules.map(module => ({
      ...module,
      shadingFactor: calculateShadingFactor(module, newModules),
    }));

    // Mark obstructed modules
    const finalModules = modulesWithShading.map(module => ({
      ...module,
      isObstructed: module.shadingFactor > 0.5,
      efficiency: module.efficiency * (1 - module.shadingFactor * 0.5)
    }));

    setModules(finalModules);
    if (onModulesChange) {
      onModulesChange(finalModules);
    }
  }, [selectedArea, config, sunPosition, calculateOptimalSpacing, calculateShadingFactor, onModulesChange]);

  // Handle module selection
  const handleModuleClick = useCallback((moduleId: string, event: any) => {
    event.stopPropagation();
    
    if (event.shiftKey) {
      // Add/remove from selection
      const newSelection = selectedModules.includes(moduleId)
        ? selectedModules.filter(id => id !== moduleId)
        : [...selectedModules, moduleId];
      setSelectedModules(newSelection);
      if (onSelectionChange) onSelectionChange(newSelection);
    } else {
      // Single selection
      const newSelection = [moduleId];
      setSelectedModules(newSelection);
      if (onSelectionChange) onSelectionChange(newSelection);
    }
  }, [selectedModules, onSelectionChange]);

  // Calculate grid statistics
  const gridStats = useMemo(() => {
    if (modules.length === 0) return null;

    const totalPower = modules.reduce((sum, mod) => sum + mod.power * (1 - mod.shadingFactor * 0.3), 0);
    const averageEfficiency = modules.reduce((sum, mod) => sum + mod.efficiency, 0) / modules.length;
    const obstructedCount = modules.filter(mod => mod.isObstructed).length;
    const totalArea = modules.length * config.module.width * config.module.height;

    return {
      totalModules: modules.length,
      totalPower: Math.round(totalPower),
      averageEfficiency: Math.round(averageEfficiency * 10) / 10,
      obstructedCount,
      obstructionPercentage: Math.round((obstructedCount / modules.length) * 100),
      totalArea: Math.round(totalArea * 10) / 10,
      powerDensity: Math.round((totalPower / totalArea) * 10) / 10
    };
  }, [modules, config.module]);

  // Module Component with enhanced features
  const ModuleComponent = ({ module }: { module: Module3D }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const isSelected = selectedModules.includes(module.id);
    
    // Color based on efficiency and shading
    const moduleColor = useMemo(() => {
      if (module.isObstructed && showShading) return '#dc2626'; // red
      if (module.shadingFactor > 0.2 && showShading) return '#f59e0b'; // yellow
      if (isSelected) return '#3b82f6'; // blue
      return '#1e3a8a'; // dark blue
    }, [module.isObstructed, module.shadingFactor, isSelected, showShading]);

    return (
      <group>
        {/* Main module */}
        <mesh
          ref={meshRef}
          position={module.position}
          rotation={module.rotation}
          castShadow
          receiveShadow
          onClick={(e) => handleModuleClick(module.id, e)}
        >
          <boxGeometry args={[module.size.width, module.size.depth, module.size.height]} />
          <meshStandardMaterial 
            color={moduleColor}
            metalness={0.8}
            roughness={0.2}
            transparent={module.shadingFactor > 0}
            opacity={module.shadingFactor > 0 ? 0.7 : 1}
          />
        </mesh>

        {/* Module frame */}
        <lineSegments
          position={module.position}
          rotation={module.rotation}
        >
          <edgesGeometry args={[new THREE.BoxGeometry(module.size.width, module.size.depth, module.size.height)]} />
          <lineBasicMaterial color={isSelected ? '#ffffff' : '#374151'} linewidth={isSelected ? 3 : 1} />
        </lineSegments>

        {/* Efficiency indicator */}
        {showOptimizations && (
          <Html
            position={[
              module.position[0],
              module.position[1] + 0.5,
              module.position[2]
            ]}
            center
          >
            <div className="bg-black/60 text-white text-xs px-1 py-0.5 rounded pointer-events-none">
              {Math.round(module.efficiency)}%
            </div>
          </Html>
        )}
      </group>
    );
  };

  return (
    <>
      {/* Configuration Panel */}
      <Html position={[15, 8, 0]} portal={{ current: document.body }}>
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-slate-800/95 border border-slate-600 rounded-lg backdrop-blur-sm w-80 max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 p-4 border-b border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">Módulos Solares Pro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowOptimizations(!showOptimizations)}
                  >
                    {showOptimizations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowShading(!showShading)}
                  >
                    <Sun className={`w-4 h-4 ${showShading ? 'text-yellow-400' : 'text-gray-400'}`} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4">
              {!selectedAreaId ? (
                <div className="text-sm text-yellow-400 mb-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="font-medium mb-1">Área necessária</div>
                  Selecione uma área de montagem para posicionar os módulos solares
                </div>
              ) : (
                <Tabs defaultValue="layout" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                    <TabsTrigger value="specs">Specs</TabsTrigger>
                    <TabsTrigger value="install">Install</TabsTrigger>
                    <TabsTrigger value="optimize">Optimize</TabsTrigger>
                  </TabsList>

                  {/* Layout Tab */}
                  <TabsContent value="layout" className="space-y-4">
                    <div>
                      <Label className="text-slate-300 text-sm">Configuração da Grade</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label className="text-xs text-slate-400">Linhas</Label>
                          <div className="flex items-center gap-1 mt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => setConfig(prev => ({
                                ...prev,
                                grid: { ...prev.grid, rows: Math.max(1, prev.grid.rows - 1) }
                              }))}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-white text-sm w-8 text-center">
                              {config.grid.rows}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => setConfig(prev => ({
                                ...prev,
                                grid: { ...prev.grid, rows: prev.grid.rows + 1 }
                              }))}
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
                              className="h-7 w-7 p-0"
                              onClick={() => setConfig(prev => ({
                                ...prev,
                                grid: { ...prev.grid, columns: Math.max(1, prev.grid.columns - 1) }
                              }))}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-white text-sm w-8 text-center">
                              {config.grid.columns}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => setConfig(prev => ({
                                ...prev,
                                grid: { ...prev.grid, columns: prev.grid.columns + 1 }
                              }))}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-300 text-sm">Espaçamento</Label>
                      <div className="space-y-2 mt-2">
                        <div>
                          <Label className="text-xs text-slate-400">Entre linhas (m)</Label>
                          <Slider
                            value={[config.grid.rowSpacing]}
                            onValueChange={(value) => setConfig(prev => ({
                              ...prev,
                              grid: { ...prev.grid, rowSpacing: value[0] }
                            }))}
                            max={3}
                            min={0.1}
                            step={0.1}
                            className="mt-1"
                          />
                          <div className="text-xs text-slate-400 mt-1">{config.grid.rowSpacing.toFixed(1)}m</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Specs Tab */}
                  <TabsContent value="specs" className="space-y-4">
                    <div>
                      <Label className="text-slate-300 text-sm">Especificações do Módulo</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label className="text-xs text-slate-400">Largura (m)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={config.module.width}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              module: { ...prev.module, width: parseFloat(e.target.value) || prev.module.width }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Altura (m)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={config.module.height}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              module: { ...prev.module, height: parseFloat(e.target.value) || prev.module.height }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Potência (W)</Label>
                          <Input
                            type="number"
                            step="10"
                            value={config.module.power}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              module: { ...prev.module, power: parseFloat(e.target.value) || prev.module.power }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Eficiência (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={config.module.efficiency}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              module: { ...prev.module, efficiency: parseFloat(e.target.value) || prev.module.efficiency }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Installation Tab */}
                  <TabsContent value="install" className="space-y-4">
                    <div>
                      <Label className="text-slate-300 text-sm">Parâmetros de Instalação</Label>
                      <div className="space-y-3 mt-2">
                        <div>
                          <Label className="text-xs text-slate-400">Inclinação: {config.installation.tilt}°</Label>
                          <Slider
                            value={[config.installation.tilt]}
                            onValueChange={(value) => setConfig(prev => ({
                              ...prev,
                              installation: { ...prev.installation, tilt: value[0] }
                            }))}
                            max={60}
                            min={0}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Azimute: {config.installation.azimuth}°</Label>
                          <Slider
                            value={[config.installation.azimuth]}
                            onValueChange={(value) => setConfig(prev => ({
                              ...prev,
                              installation: { ...prev.installation, azimuth: value[0] }
                            }))}
                            max={360}
                            min={0}
                            step={5}
                            className="mt-1"
                          />
                          <div className="text-xs text-slate-400 mt-1">
                            {config.installation.azimuth === 0 ? 'Norte' : 
                             config.installation.azimuth === 90 ? 'Leste' :
                             config.installation.azimuth === 180 ? 'Sul' :
                             config.installation.azimuth === 270 ? 'Oeste' : 'Personalizado'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Optimization Tab */}
                  <TabsContent value="optimize" className="space-y-4">
                    <div>
                      <Label className="text-slate-300 text-sm">Otimizações Automáticas</Label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-300">Evitar sombreamento</Label>
                          <Switch
                            checked={config.optimization.avoidShading}
                            onCheckedChange={(checked) => setConfig(prev => ({
                              ...prev,
                              optimization: { ...prev.optimization, avoidShading: checked }
                            }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-300">Otimizar espaçamento</Label>
                          <Switch
                            checked={config.optimization.optimizeSpacing}
                            onCheckedChange={(checked) => setConfig(prev => ({
                              ...prev,
                              optimization: { ...prev.optimization, optimizeSpacing: checked }
                            }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-300">Maximizar potência</Label>
                          <Switch
                            checked={config.optimization.maximizePower}
                            onCheckedChange={(checked) => setConfig(prev => ({
                              ...prev,
                              optimization: { ...prev.optimization, maximizePower: checked }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {/* Action Buttons */}
              {selectedAreaId && (
                <div className="flex gap-2 pt-4 border-t border-slate-600">
                  <Button
                    size="sm"
                    onClick={generateIntelligentGrid}
                    className="flex-1"
                  >
                    <Calculator className="w-4 h-4 mr-1" />
                    Gerar Grade
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setModules([])}
                  >
                    Limpar
                  </Button>
                </div>
              )}

              {/* Statistics */}
              {gridStats && (
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-700/50 p-2 rounded">
                      <div className="text-slate-400">Módulos</div>
                      <div className="text-white font-mono text-lg">{gridStats.totalModules}</div>
                    </div>
                    <div className="bg-slate-700/50 p-2 rounded">
                      <div className="text-slate-400">Potência</div>
                      <div className="text-white font-mono text-lg">{(gridStats.totalPower/1000).toFixed(1)}kW</div>
                    </div>
                    <div className="bg-slate-700/50 p-2 rounded">
                      <div className="text-slate-400">Eficiência</div>
                      <div className="text-white font-mono text-lg">{gridStats.averageEfficiency}%</div>
                    </div>
                    <div className="bg-slate-700/50 p-2 rounded">
                      <div className="text-slate-400">Área</div>
                      <div className="text-white font-mono text-lg">{gridStats.totalArea}m²</div>
                    </div>
                  </div>
                  
                  {gridStats.obstructedCount > 0 && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs">
                      <div className="text-red-400">
                        ⚠️ {gridStats.obstructedCount} módulos com sombreamento ({gridStats.obstructionPercentage}%)
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-xs space-y-1 text-slate-400">
                    <div>Densidade: {gridStats.powerDensity} W/m²</div>
                    {selectedModules.length > 0 && (
                      <div className="text-blue-400">
                        {selectedModules.length} módulos selecionados
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Html>

      {/* 3D Module Visualization */}
      <group ref={groupRef}>
        {modules.map((module) => (
          <ModuleComponent key={module.id} module={module} />
        ))}
      </group>
    </>
  );
};