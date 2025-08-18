import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SunLightProps {
  sunPosition: { azimuth: number; elevation: number };
  intensity?: number;
  color?: string;
  castShadow?: boolean;
}

export const SunLight: React.FC<SunLightProps> = ({
  sunPosition,
  intensity = 3,
  color = '#ffffff',
  castShadow = true
}) => {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  // Calculate sun position in 3D space
  const sunVector = useMemo(() => {
    const azimuthRad = (sunPosition.azimuth - 180) * Math.PI / 180; // Adjust for Three.js coordinate system
    const elevationRad = sunPosition.elevation * Math.PI / 180;
    
    const x = Math.cos(elevationRad) * Math.sin(azimuthRad);
    const y = Math.sin(elevationRad);
    const z = Math.cos(elevationRad) * Math.cos(azimuthRad);
    
    return new THREE.Vector3(x, y, z).normalize().multiplyScalar(50);
  }, [sunPosition.azimuth, sunPosition.elevation]);

  // Calculate light intensity based on sun elevation
  const lightIntensity = useMemo(() => {
    const elevationFactor = Math.max(0, Math.sin(sunPosition.elevation * Math.PI / 180));
    return intensity * elevationFactor;
  }, [intensity, sunPosition.elevation]);

  // Calculate ambient intensity (lower when sun is low)
  const ambientIntensity = useMemo(() => {
    const elevationFactor = Math.max(0.1, Math.sin(sunPosition.elevation * Math.PI / 180));
    return 0.4 * elevationFactor;
  }, [sunPosition.elevation]);

  useFrame(() => {
    if (directionalLightRef.current) {
      directionalLightRef.current.position.copy(sunVector);
      directionalLightRef.current.target.position.set(0, 0, 0);
    }
  });

  return (
    <>
      {/* Directional Light (Sun) */}
      <directionalLight
        ref={directionalLightRef}
        color={color}
        intensity={lightIntensity}
        position={[sunVector.x, sunVector.y, sunVector.z]}
        castShadow={castShadow}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-bias={-0.001}
      />

      {/* Ambient Light (Sky illumination) */}
      <ambientLight
        ref={ambientLightRef}
        color={color}
        intensity={ambientIntensity}
      />

      {/* Additional hemisphere light for more natural lighting */}
      <hemisphereLight
        color="#87CEEB" // Sky blue
        groundColor="#8B4513" // Brown earth
        intensity={0.3}
      />

      {/* Sun Helper (visible sun sphere) */}
      {sunPosition.elevation > 0 && (
        <mesh position={[sunVector.x * 0.8, sunVector.y * 0.8, sunVector.z * 0.8]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#FDB813" />
        </mesh>
      )}
    </>
  );
};