import React, { useState, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Ruler, X } from 'lucide-react';
import * as THREE from 'three';

interface MeasurementToolProps {
  onMeasureComplete?: (measurement: {
    distance: number;
    points: THREE.Vector3[];
    unit: string;
  }) => void;
}

export const MeasurementTool: React.FC<MeasurementToolProps> = ({
  onMeasureComplete
}) => {
  const { camera, gl, scene } = useThree();
  const [isActive, setIsActive] = useState(false);
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const [currentDistance, setCurrentDistance] = useState<number>(0);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const handleClick = (event: MouseEvent) => {
    if (!isActive) return;

    // Calculate mouse position in normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast from camera to find intersection
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const newPoints = [...points, point];
      setPoints(newPoints);

      if (newPoints.length === 2) {
        const distance = newPoints[0].distanceTo(newPoints[1]);
        setCurrentDistance(distance);
        
        if (onMeasureComplete) {
          onMeasureComplete({
            distance,
            points: newPoints,
            unit: 'm'
          });
        }
        
        // Reset for next measurement
        setTimeout(() => {
          setPoints([]);
          setCurrentDistance(0);
        }, 3000);
      }
    }
  };

  React.useEffect(() => {
    if (isActive) {
      gl.domElement.addEventListener('click', handleClick);
      return () => gl.domElement.removeEventListener('click', handleClick);
    }
  }, [isActive, points, gl.domElement]);

  return (
    <>
      {/* Measurement UI */}
      <Html position={[10, 10, 0]} portal={{ current: document.body }}>
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-slate-800/90 border border-slate-600 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-medium">Ferramenta de Medição</span>
              <button
                onClick={() => setIsActive(false)}
                className="ml-2 p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            
            {!isActive ? (
              <button
                onClick={() => setIsActive(true)}
                className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              >
                Ativar Medição
              </button>
            ) : (
              <div className="text-xs text-slate-300">
                {points.length === 0 && "Clique no primeiro ponto"}
                {points.length === 1 && "Clique no segundo ponto"}
                {points.length === 2 && (
                  <div className="text-green-400">
                    Distância: {currentDistance.toFixed(2)}m
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Html>

      {/* Measurement Points and Line */}
      {points.length > 0 && (
        <>
          {/* First Point */}
          <mesh position={[points[0].x, points[0].y, points[0].z]}>
            <sphereGeometry args={[0.1]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          
          {/* Second Point */}
          {points.length === 2 && (
            <>
              <mesh position={[points[1].x, points[1].y, points[1].z]}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color="#ff0000" />
              </mesh>
              
              {/* Measurement Line */}
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([
                      points[0].x, points[0].y, points[0].z,
                      points[1].x, points[1].y, points[1].z
                    ])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#ffff00" linewidth={2} />
              </line>
              
              {/* Distance Label */}
              <Html position={[
                (points[0].x + points[1].x) / 2,
                (points[0].y + points[1].y) / 2 + 0.5,
                (points[0].z + points[1].z) / 2
              ]}>
                <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                  {currentDistance.toFixed(2)}m
                </div>
              </Html>
            </>
          )}
        </>
      )}
    </>
  );
};