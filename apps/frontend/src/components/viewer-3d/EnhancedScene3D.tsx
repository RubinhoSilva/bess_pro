import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, Plane, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { Compass3D } from './Compass3D';
import { ModelLoader } from './ModelLoader';
import { SunLight } from './SunLight';
import { AreaVisualizer } from './AreaVisualizer';
import { LoadingFallback } from './LoadingFallback';
import { AdvancedModuleGridVisualizer } from './AdvancedModuleGridVisualizer';
import { AdvancedShadingAnalysisPanel } from './AdvancedShadingAnalysisPanel';
import { AdvancedMeasurementTool3D } from './AdvancedMeasurementTool3D';
import { AzimuthGrid } from './AzimuthGrid';
import { ModuleContextMenu } from './ModuleContextMenu';

interface EnhancedScene3DProps {
  modelUrl?: string;
  activeTool?: 'none' | 'measure' | 'area' | 'modules' | 'shading' | 'upload';
  showGrid?: boolean;
  showAzimuthGrid?: boolean;
  showAdvancedTools?: boolean;
  sunPosition?: { azimuth: number; elevation: number };
  latitude?: number;
  longitude?: number;
  onModelLoad?: (model: THREE.Object3D) => void;
  onMeasureComplete?: (measurement: any) => void;
  onModulesChange?: (modules: any[]) => void;
  mountingAreas?: any[];
  selectedAreaId?: string;
  className?: string;
}

export const EnhancedScene3D: React.FC<EnhancedScene3DProps> = ({
  modelUrl,
  activeTool = 'none',
  showGrid = true,
  showAzimuthGrid = false,
  showAdvancedTools = true,
  sunPosition = { azimuth: 180, elevation: 45 },
  latitude = -23.5505,
  longitude = -46.6333,
  onModelLoad,
  onMeasureComplete,
  onModulesChange,
  mountingAreas = [],
  selectedAreaId,
  className = ""
}) => {
  const controlsRef = useRef<any>();
  const sceneRef = useRef<THREE.Scene>();
  const [isReady, setIsReady] = useState(false);
  const [cameraRotation, setCameraRotation] = useState(0);
  const [modules, setModules] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState(new THREE.Vector3());
  const [contextMenuModule, setContextMenuModule] = useState<any>(null);
  const [shadingAnalysisActive, setShadingAnalysisActive] = useState(false);

  const handleResetToNorth = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(0, 10, 10);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const handleModelLoad = (model: THREE.Object3D) => {
    setIsReady(true);
    if (onModelLoad) {
      onModelLoad(model);
    }
  };

  const handleModulesChange = useCallback((newModules: any[]) => {
    setModules(newModules);
    if (onModulesChange) {
      onModulesChange(newModules);
    }
  }, [onModulesChange]);

  const handleModuleUpdate = useCallback((moduleId: string, updates: any) => {
    setModules(prev => prev.map(mod => 
      mod.id === moduleId ? { ...mod, ...updates } : mod
    ));
  }, []);

  const handleModuleDelete = useCallback((moduleId: string) => {
    setModules(prev => prev.filter(mod => mod.id !== moduleId));
    setSelectedModules(prev => prev.filter(id => id !== moduleId));
    setContextMenuVisible(false);
  }, []);

  const handleModuleDuplicate = useCallback((moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      const newModule = {
        ...module,
        id: `${module.id}-copy-${Date.now()}`,
        position: [module.position[0] + 2, module.position[1], module.position[2]] as [number, number, number]
      };
      setModules(prev => [...prev, newModule]);
    }
  }, [modules]);

  const handleModuleContextMenu = useCallback((moduleId: string, position: THREE.Vector3) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      setContextMenuModule(module);
      setContextMenuPosition(position.clone());
      setContextMenuVisible(true);
    }
  }, [modules]);

  const handleAzimuthClick = useCallback((azimuth: number) => {
    // Update selected modules to face this azimuth
    if (selectedModules.length > 0) {
      selectedModules.forEach(moduleId => {
        handleModuleUpdate(moduleId, { azimuth });
      });
    }
  }, [selectedModules, handleModuleUpdate]);

  // Component to track camera rotation
  const CameraRotationTracker = () => {
    const { camera } = useThree();
    
    useFrame(() => {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const angle = Math.atan2(direction.x, direction.z);
      setCameraRotation(-angle);
    });
    
    return null;
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          setContextMenuVisible(false);
          setShadingAnalysisActive(false);
          break;
        case 'g':
          if (event.ctrlKey) {
            event.preventDefault();
            // Toggle grid
          }
          break;
        case 'a':
          if (event.ctrlKey) {
            event.preventDefault();
            // Select all modules
            setSelectedModules(modules.map(m => m.id));
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedModules.length > 0) {
            selectedModules.forEach(id => handleModuleDelete(id));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modules, selectedModules, handleModuleDelete]);

  return (
    <div className={`w-full h-full relative ${className}`}>
      <Canvas
        shadows
        camera={{ 
          position: [10, 10, 10], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          preserveDrawingBuffer: true,
          antialias: true
        }}
        onCreated={({ scene }) => {
          sceneRef.current = scene;
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Enhanced Environment and Lighting */}
          <Environment preset="city" />
          <SunLight sunPosition={sunPosition} />
          
          {/* Enhanced Sky with dynamic sun position */}
          <Sky
            distance={450000}
            sunPosition={[
              Math.cos(sunPosition.azimuth * Math.PI / 180) * Math.cos(sunPosition.elevation * Math.PI / 180),
              Math.sin(sunPosition.elevation * Math.PI / 180),
              Math.sin(sunPosition.azimuth * Math.PI / 180) * Math.cos(sunPosition.elevation * Math.PI / 180)
            ]}
            inclination={0}
            azimuth={0.25}
            rayleigh={2}
            turbidity={4}
            mieCoefficient={0.005}
            mieDirectionalG={0.8}
          />

          {/* Enhanced Ground with realistic materials */}
          <Plane 
            args={[200, 200]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -0.1, 0]}
            receiveShadow
          >
            <meshStandardMaterial 
              color="#2d5a27" 
              roughness={0.8}
              metalness={0.1}
            />
          </Plane>

          {/* Standard Grid */}
          {showGrid && (
            <Grid
              args={[100, 100]}
              position={[0, 0, 0]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#6f6f6f"
              sectionSize={10}
              sectionThickness={1.5}
              sectionColor="#9d4b4b"
              fadeDistance={50}
              fadeStrength={1}
              infiniteGrid={false}
            />
          )}

          {/* Azimuth Grid for orientation */}
          {showAzimuthGrid && (
            <AzimuthGrid
              showGrid={showAzimuthGrid}
              showCardinals={true}
              showSunPath={false}
              sunPosition={sunPosition}
              onAzimuthClick={handleAzimuthClick}
            />
          )}

          {/* 3D Model */}
          {modelUrl && (
            <ModelLoader 
              url={modelUrl} 
              onLoad={handleModelLoad}
              castShadow
              receiveShadow
            />
          )}

          {/* Mounting Areas */}
          {mountingAreas.length > 0 && (
            <AreaVisualizer 
              areas={mountingAreas}
              selectedAreaId={selectedAreaId}
            />
          )}

          {/* Advanced Module Grid Visualizer */}
          {(activeTool === 'modules' || showAdvancedTools) && (
            <AdvancedModuleGridVisualizer
              selectedAreaId={selectedAreaId}
              mountingAreas={mountingAreas}
              sunPosition={sunPosition}
              onModulesChange={handleModulesChange}
              onSelectionChange={setSelectedModules}
            />
          )}

          {/* Advanced Measurement Tool */}
          {(activeTool === 'measure' || showAdvancedTools) && (
            <AdvancedMeasurementTool3D
              onMeasurementComplete={onMeasureComplete}
              onMeasurementUpdate={setMeasurements}
              existingMeasurements={measurements}
            />
          )}

          {/* Enhanced Controls with better limits */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={200}
            maxPolarAngle={Math.PI / 2.05}
            minPolarAngle={Math.PI / 8}
            target={[0, 0, 0]}
            dampingFactor={0.1}
            enableDamping={true}
            rotateSpeed={0.5}
            zoomSpeed={0.8}
            panSpeed={0.5}
          />

          {/* Camera Rotation Tracker */}
          <CameraRotationTracker />

          {/* Lighting enhancements */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[50, 50, 50]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={100}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
        </Suspense>
      </Canvas>

      {/* Advanced Shading Analysis Panel */}
      {(activeTool === 'shading' || shadingAnalysisActive) && (
        <AdvancedShadingAnalysisPanel
          modules={modules}
          latitude={latitude}
          longitude={longitude}
          onTimeChange={() => {}}
          onAnalysisUpdate={() => {}}
        />
      )}

      {/* Module Context Menu */}
      <ModuleContextMenu
        module={contextMenuModule}
        position={contextMenuPosition}
        visible={contextMenuVisible}
        onClose={() => setContextMenuVisible(false)}
        onModuleUpdate={handleModuleUpdate}
        onModuleDelete={handleModuleDelete}
        onModuleDuplicate={handleModuleDuplicate}
      />

      {/* Enhanced Compass Overlay */}
      <Compass3D 
        className="absolute top-4 right-4 z-10"
        rotation={cameraRotation}
        onResetToNorth={handleResetToNorth}
      />

      {/* Scene Information Panel */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 border border-slate-600 rounded-lg p-3 backdrop-blur-sm z-10 max-w-xs">
        <div className="text-white text-xs space-y-1">
          <div className="font-medium text-blue-400">Cena 3D Avançada</div>
          <div>Sol: {sunPosition.elevation.toFixed(1)}° elevação</div>
          <div>Azimute: {sunPosition.azimuth.toFixed(1)}°</div>
          <div>Áreas: {mountingAreas.length}</div>
          <div>Módulos: {modules.length}</div>
          <div>Medições: {measurements.length}</div>
          {selectedModules.length > 0 && (
            <div className="text-blue-400">
              {selectedModules.length} módulo(s) selecionado(s)
            </div>
          )}
          {contextMenuVisible && (
            <div className="text-green-400">Menu contextual ativo</div>
          )}
        </div>
      </div>

      {/* Performance Stats */}
      {modules.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 border border-slate-600 rounded-lg p-2 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4 text-xs text-white">
            <div>
              <span className="text-slate-400">Potência Total: </span>
              <span className="font-mono text-blue-400">
                {(modules.reduce((sum, mod) => sum + (mod.power || 550), 0) / 1000).toFixed(1)}kW
              </span>
            </div>
            <div>
              <span className="text-slate-400">Eficiência Média: </span>
              <span className="font-mono text-green-400">
                {modules.length > 0 ? 
                  (modules.reduce((sum, mod) => sum + (mod.efficiency || 22.5), 0) / modules.length).toFixed(1) : 0
                }%
              </span>
            </div>
            <div>
              <span className="text-slate-400">Sombreamento: </span>
              <span className="font-mono text-yellow-400">
                {modules.length > 0 ? 
                  (modules.reduce((sum, mod) => sum + (mod.shadingFactor || 0), 0) / modules.length * 100).toFixed(0) : 0
                }%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};