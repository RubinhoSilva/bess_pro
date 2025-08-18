import React, { useState, useCallback } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { 
  RotateCw, Move3D, Copy, Trash2, Settings, 
  Zap, Sun, Eye, EyeOff, Lock, Unlock,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ModuleData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: { width: number; height: number; depth: number };
  power: number;
  efficiency: number;
  tilt: number;
  azimuth: number;
  isSelected: boolean;
  isLocked: boolean;
  isVisible: boolean;
  shadingFactor: number;
}

interface ModuleContextMenuProps {
  module?: ModuleData;
  position: THREE.Vector3;
  visible: boolean;
  onClose: () => void;
  onModuleUpdate?: (moduleId: string, updates: Partial<ModuleData>) => void;
  onModuleDelete?: (moduleId: string) => void;
  onModuleDuplicate?: (moduleId: string) => void;
  onModuleMove?: (moduleId: string, newPosition: [number, number, number]) => void;
  onModuleRotate?: (moduleId: string, axis: 'x' | 'y' | 'z', degrees: number) => void;
}

export const ModuleContextMenu: React.FC<ModuleContextMenuProps> = ({
  module,
  position,
  visible,
  onClose,
  onModuleUpdate,
  onModuleDelete,
  onModuleDuplicate,
  onModuleMove,
  onModuleRotate
}) => {
  const [activeTab, setActiveTab] = useState<'transform' | 'properties' | 'performance'>('transform');
  const [tempValues, setTempValues] = useState({
    tilt: module?.tilt || 0,
    azimuth: module?.azimuth || 180,
    height: module?.position[1] || 0,
    power: module?.power || 550,
    efficiency: module?.efficiency || 22.5
  });

  if (!visible || !module) return null;

  // Handle property updates
  const handleUpdate = useCallback((updates: Partial<ModuleData>) => {
    if (onModuleUpdate && module) {
      onModuleUpdate(module.id, updates);
    }
  }, [onModuleUpdate, module]);

  // Apply temporary values
  const applyChanges = () => {
    handleUpdate({
      tilt: tempValues.tilt,
      azimuth: tempValues.azimuth,
      power: tempValues.power,
      efficiency: tempValues.efficiency,
      position: [module.position[0], tempValues.height, module.position[2]]
    });
    onClose();
  };

  // Cancel changes
  const cancelChanges = () => {
    setTempValues({
      tilt: module?.tilt || 0,
      azimuth: module?.azimuth || 180,
      height: module?.position[1] || 0,
      power: module?.power || 550,
      efficiency: module?.efficiency || 22.5
    });
    onClose();
  };

  // Quick rotation actions
  const quickRotate = (axis: 'x' | 'y' | 'z', degrees: number) => {
    if (onModuleRotate) {
      onModuleRotate(module.id, axis, degrees);
    }
  };

  // Move module
  const moveModule = (direction: 'up' | 'down' | 'north' | 'south' | 'east' | 'west', distance: number = 1) => {
    if (!onModuleMove) return;
    
    const currentPos = module.position;
    let newPosition: [number, number, number] = [...currentPos];
    
    switch (direction) {
      case 'up':
        newPosition[1] += distance;
        break;
      case 'down':
        newPosition[1] -= distance;
        break;
      case 'north':
        newPosition[2] += distance;
        break;
      case 'south':
        newPosition[2] -= distance;
        break;
      case 'east':
        newPosition[0] += distance;
        break;
      case 'west':
        newPosition[0] -= distance;
        break;
    }
    
    onModuleMove(module.id, newPosition);
  };

  // Calculate performance metrics
  const performanceMetrics = {
    effectivePower: module.power * (1 - module.shadingFactor * 0.3),
    shadingLoss: (module.shadingFactor * 30).toFixed(1),
    orientationScore: calculateOrientationScore(module.azimuth, module.tilt),
    annualGeneration: calculateAnnualGeneration(module.power, module.efficiency, module.shadingFactor)
  };

  return (
    <Html
      position={position.toArray()}
      portal={{ current: document.body }}
      zIndexRange={[1000, 1100]}
    >
      <div className="absolute z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl min-w-80 max-w-96 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3 border-b border-slate-600 bg-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-white font-medium text-sm">Módulo {module.id.split('-').pop()}</span>
              {module.isLocked && <Lock className="w-4 h-4 text-yellow-400" />}
            </div>
            <div className="flex items-center gap-1">
              <Badge variant={module.shadingFactor > 0.2 ? "destructive" : "default"} className="text-xs">
                {performanceMetrics.effectivePower.toFixed(0)}W
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                ×
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-600">
          {[
            { id: 'transform', label: 'Transform', icon: Move3D },
            { id: 'properties', label: 'Properties', icon: Settings },
            { id: 'performance', label: 'Performance', icon: Zap }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              size="sm"
              variant={activeTab === id ? "default" : "ghost"}
              onClick={() => setActiveTab(id as any)}
              className="flex-1 rounded-none h-8 text-xs"
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-3 max-h-80 overflow-y-auto">
          {/* Transform Tab */}
          {activeTab === 'transform' && (
            <div className="space-y-4">
              {/* Position Controls */}
              <div>
                <Label className="text-slate-300 text-xs font-medium">Posição</Label>
                <div className="grid grid-cols-3 gap-1 mt-2">
                  <Button size="sm" variant="outline" onClick={() => moveModule('north', 0.5)}>
                    ↑ N
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moveModule('up', 0.1)}>
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moveModule('east', 0.5)}>
                    → E
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moveModule('west', 0.5)}>
                    ← W
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moveModule('down', 0.1)}>
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moveModule('south', 0.5)}>
                    ↓ S
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Rotation Controls */}
              <div>
                <Label className="text-slate-300 text-xs font-medium">Rotação</Label>
                <div className="grid grid-cols-4 gap-1 mt-2">
                  <Button size="sm" variant="outline" onClick={() => quickRotate('y', -15)}>
                    ↶ -15°
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => quickRotate('y', 15)}>
                    ↷ +15°
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => quickRotate('x', -5)}>
                    ↻ X
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => quickRotate('x', 5)}>
                    ↺ X
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Precise Adjustments */}
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-300 text-xs">Inclinação: {tempValues.tilt}°</Label>
                  <Slider
                    value={[tempValues.tilt]}
                    onValueChange={(value) => setTempValues(prev => ({ ...prev, tilt: value[0] }))}
                    max={60}
                    min={0}
                    step={1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Azimute: {tempValues.azimuth}°</Label>
                  <Slider
                    value={[tempValues.azimuth]}
                    onValueChange={(value) => setTempValues(prev => ({ ...prev, azimuth: value[0] }))}
                    max={360}
                    min={0}
                    step={5}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Altura: {tempValues.height.toFixed(2)}m</Label>
                  <Slider
                    value={[tempValues.height]}
                    onValueChange={(value) => setTempValues(prev => ({ ...prev, height: value[0] }))}
                    max={5}
                    min={0}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs">Potência (W)</Label>
                  <Input
                    type="number"
                    value={tempValues.power}
                    onChange={(e) => setTempValues(prev => ({ 
                      ...prev, 
                      power: parseFloat(e.target.value) || 550 
                    }))}
                    className="h-7 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Eficiência (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={tempValues.efficiency}
                    onChange={(e) => setTempValues(prev => ({ 
                      ...prev, 
                      efficiency: parseFloat(e.target.value) || 22.5 
                    }))}
                    className="h-7 text-xs mt-1"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-slate-300 text-xs font-medium">Dimensões</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <div className="bg-slate-700/30 p-2 rounded">
                    <div className="text-slate-400">L</div>
                    <div className="text-white">{module.size.width}m</div>
                  </div>
                  <div className="bg-slate-700/30 p-2 rounded">
                    <div className="text-slate-400">A</div>
                    <div className="text-white">{module.size.height}m</div>
                  </div>
                  <div className="bg-slate-700/30 p-2 rounded">
                    <div className="text-slate-400">E</div>
                    <div className="text-white">{module.size.depth}m</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-xs">Visível</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdate({ isVisible: !module.isVisible })}
                    className="h-6 w-6 p-0"
                  >
                    {module.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-xs">Bloqueado</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdate({ isLocked: !module.isLocked })}
                    className="h-6 w-6 p-0"
                  >
                    {module.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-700/30 p-3 rounded">
                  <div className="text-slate-400 text-xs">Potência Efetiva</div>
                  <div className="text-white font-mono text-lg">
                    {performanceMetrics.effectivePower.toFixed(0)}W
                  </div>
                </div>
                <div className="bg-slate-700/30 p-3 rounded">
                  <div className="text-slate-400 text-xs">Perda por Sombra</div>
                  <div className={`font-mono text-lg ${
                    module.shadingFactor > 0.2 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {performanceMetrics.shadingLoss}%
                  </div>
                </div>
              </div>

              <Separator />

              {/* Orientation Analysis */}
              <div>
                <Label className="text-slate-300 text-xs font-medium">Análise de Orientação</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Score de Orientação</span>
                    <span className={`${
                      performanceMetrics.orientationScore > 80 ? 'text-green-400' :
                      performanceMetrics.orientationScore > 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {performanceMetrics.orientationScore}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Geração Anual Est.</span>
                    <span className="text-white">{performanceMetrics.annualGeneration.toFixed(0)} kWh</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Solar Analysis */}
              <div>
                <Label className="text-slate-300 text-xs font-medium">Análise Solar</Label>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-slate-400">Azimute</div>
                    <div className="text-white">{module.azimuth}°</div>
                    <div className="text-xs text-slate-500">
                      {module.azimuth === 180 ? 'Ótimo' : 
                       Math.abs(module.azimuth - 180) < 30 ? 'Bom' : 'Regular'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">Inclinação</div>
                    <div className="text-white">{module.tilt}°</div>
                    <div className="text-xs text-slate-500">
                      {module.tilt >= 15 && module.tilt <= 30 ? 'Ótimo' : 'Regular'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400">Sombra</div>
                    <div className="text-white">{(module.shadingFactor * 100).toFixed(0)}%</div>
                    <div className="text-xs text-slate-500">
                      {module.shadingFactor < 0.1 ? 'Mínima' : 
                       module.shadingFactor < 0.3 ? 'Moderada' : 'Alta'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-600 bg-slate-700/30">
          <div className="flex items-center justify-between">
            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onModuleDuplicate?.(module.id)}
                title="Duplicar módulo"
                className="h-7 w-7 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onModuleDelete?.(module.id)}
                title="Excluir módulo"
                className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {/* Apply/Cancel */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelChanges}
                className="h-7 text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={applyChanges}
                className="h-7 text-xs"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Html>
  );
};

// Helper functions
const calculateOrientationScore = (azimuth: number, tilt: number): number => {
  // Optimal: South-facing (180°) with 15-30° tilt
  const azimuthScore = 100 - Math.abs(azimuth - 180) * 2;
  const tiltScore = tilt >= 15 && tilt <= 30 ? 100 : 100 - Math.abs(tilt - 22.5) * 2;
  
  return Math.max(0, Math.min(100, (azimuthScore + tiltScore) / 2));
};

const calculateAnnualGeneration = (power: number, efficiency: number, shadingFactor: number): number => {
  // Simplified calculation: power * efficiency * sun hours * shading loss * days
  const effectivePower = power * (efficiency / 100) * (1 - shadingFactor * 0.3);
  const peakSunHours = 5.5; // Average for Brazil
  const daysPerYear = 365;
  
  return (effectivePower * peakSunHours * daysPerYear) / 1000; // Convert to kWh
};