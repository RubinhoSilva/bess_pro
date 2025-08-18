import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as THREE from 'three';
import toast from 'react-hot-toast';

interface ModelLoaderProps {
  url: string;
  onLoad?: (model: THREE.Object3D) => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export const ModelLoader: React.FC<ModelLoaderProps> = ({
  url,
  onLoad,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  castShadow = true,
  receiveShadow = true
}) => {
  const modelRef = useRef<THREE.Group>(null);
  const [error, setError] = useState<string | null>(null);

  // Configure DRACO loader for compressed models
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  try {
    const gltf = useLoader(GLTFLoader, url, (loader) => {
      loader.setDRACOLoader(dracoLoader);
    });

    useEffect(() => {
      if (gltf && modelRef.current) {
        const model = gltf.scene;
        
        // Configure shadows for all meshes in the model
        model.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = castShadow;
            child.receiveShadow = receiveShadow;
            
            // Ensure materials are properly configured
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  mat.needsUpdate = true;
                });
              } else {
                child.material.needsUpdate = true;
              }
            }
          }
        });

        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        if (onLoad) {
          onLoad(model);
        }

        toast.success('Modelo 3D carregado com sucesso!');
      }
    }, [gltf, onLoad, castShadow, receiveShadow]);

    return (
      <group 
        ref={modelRef}
        position={position}
        rotation={rotation}
        scale={scale}
      >
        <primitive object={gltf.scene} />
      </group>
    );
  } catch (error) {
    console.error('Erro ao carregar modelo 3D:', error);
    
    // Fallback: render a simple placeholder cube
    return (
      <group 
        position={position}
        rotation={rotation}
        scale={scale}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 0.2, 2]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        {/* Simple house-like structure as placeholder */}
        <mesh position={[0, 1, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 1.5, 1.8]} />
          <meshStandardMaterial color="#d2691e" />
        </mesh>
        <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
          <coneGeometry args={[1.5, 1, 4]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      </group>
    );
  }
};