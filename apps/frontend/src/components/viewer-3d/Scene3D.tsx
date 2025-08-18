import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, Plane, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { Compass3D } from './Compass3D';
import { ModelLoader } from './ModelLoader';
import { SunLight } from './SunLight';
import { MeasurementTool } from './MeasurementTool';
import { AreaVisualizer } from './AreaVisualizer';
import { LoadingFallback } from './LoadingFallback';

interface Scene3DProps {
  modelUrl?: string;
  activeTool?: 'none' | 'measure' | 'area' | 'modules' | 'upload';
  showGrid?: boolean;
  sunPosition?: { azimuth: number; elevation: number };
  onModelLoad?: (model: THREE.Object3D) => void;
  onMeasureComplete?: (measurement: any) => void;
  mountingAreas?: any[];
  selectedAreaId?: string;
  className?: string;
}

export const Scene3D: React.FC<Scene3DProps> = ({
  modelUrl,
  activeTool = 'none',
  showGrid = true,
  sunPosition = { azimuth: 180, elevation: 45 },
  onModelLoad,
  onMeasureComplete,
  mountingAreas = [],
  selectedAreaId,
  className = ""
}) => {
  const controlsRef = useRef<any>();
  const sceneRef = useRef<THREE.Scene>();
  const [isReady, setIsReady] = useState(false);
  const [cameraRotation, setCameraRotation] = useState(0);

  const handleResetToNorth = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      // Reset camera to north-facing position
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

  // Componente interno para capturar rotação da câmera
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
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Environment and Lighting */}
          <Environment preset="city" />
          <SunLight sunPosition={sunPosition} />
          
          {/* Sky */}
          <Sky
            distance={450000}
            sunPosition={[
              Math.cos(sunPosition.azimuth * Math.PI / 180) * Math.cos(sunPosition.elevation * Math.PI / 180),
              Math.sin(sunPosition.elevation * Math.PI / 180),
              Math.sin(sunPosition.azimuth * Math.PI / 180) * Math.cos(sunPosition.elevation * Math.PI / 180)
            ]}
            inclination={0}
            azimuth={0.25}
          />

          {/* Ground Plane */}
          <Plane 
            args={[100, 100]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -0.1, 0]}
            receiveShadow
          >
            <meshStandardMaterial color="#2d5a27" />
          </Plane>

          {/* Grid */}
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

          {/* Tools */}
          {activeTool === 'measure' && (
            <MeasurementTool onMeasureComplete={onMeasureComplete} />
          )}

          {/* Controls */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 0, 0]}
          />

          {/* Camera Rotation Tracker */}
          <CameraRotationTracker />
        </Suspense>
      </Canvas>

      {/* Compass Overlay */}
      <Compass3D 
        className="absolute top-4 right-4 z-10"
        rotation={cameraRotation}
        onResetToNorth={handleResetToNorth}
      />
    </div>
  );
};