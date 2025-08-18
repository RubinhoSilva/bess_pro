import React from 'react';
import * as THREE from 'three';

interface MountingArea {
  id: string;
  name: string;
  geometria: Array<{ x: number; y: number; z: number }>;
  color?: string;
  opacity?: number;
}

interface AreaVisualizerProps {
  areas: MountingArea[];
  selectedAreaId?: string;
  onAreaClick?: (areaId: string) => void;
}

export const AreaVisualizer: React.FC<AreaVisualizerProps> = ({
  areas,
  selectedAreaId,
  onAreaClick
}) => {
  const createAreaGeometry = (points: Array<{ x: number; y: number; z: number }>) => {
    if (points.length < 3) return null;

    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].z); // Using x,z for horizontal plane
    
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].z);
    }
    
    shape.lineTo(points[0].x, points[0].z); // Close the shape
    
    return new THREE.ShapeGeometry(shape);
  };

  return (
    <>
      {areas.map((area) => {
        const geometry = createAreaGeometry(area.geometria);
        if (!geometry) return null;

        const isSelected = selectedAreaId === area.id;
        const color = area.color || (isSelected ? '#3b82f6' : '#10b981');
        const opacity = area.opacity || (isSelected ? 0.7 : 0.4);
        
        // Calculate center Y position from area points
        const avgY = area.geometria.reduce((sum, point) => sum + point.y, 0) / area.geometria.length;

        return (
          <group key={area.id}>
            {/* Area Surface */}
            <mesh
              position={[0, avgY + 0.01, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={() => onAreaClick && onAreaClick(area.id)}
            >
              <primitive object={geometry} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Area Border */}
            <lineLoop
              position={[0, avgY + 0.02, 0]}
            >
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={area.geometria.length}
                  array={new Float32Array(
                    area.geometria.flatMap(point => [point.x, point.y, point.z])
                  )}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={isSelected ? '#1e40af' : '#065f46'}
                linewidth={isSelected ? 3 : 2}
              />
            </lineLoop>

            {/* Area Label */}
            {isSelected && (
              <mesh
                position={[
                  area.geometria[0].x,
                  avgY + 1,
                  area.geometria[0].z
                ]}
              >
                <planeGeometry args={[2, 0.5]} />
                <meshBasicMaterial color="#1f2937" transparent opacity={0.8} />
              </mesh>
            )}

            {/* Corner Points */}
            {area.geometria.map((point, index) => (
              <mesh
                key={index}
                position={[point.x, point.y + 0.1, point.z]}
              >
                <sphereGeometry args={[isSelected ? 0.15 : 0.1]} />
                <meshBasicMaterial
                  color={isSelected ? '#ef4444' : '#6b7280'}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
};