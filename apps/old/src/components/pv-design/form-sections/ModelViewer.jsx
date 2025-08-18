import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { TextureLoader } from 'three/src/loaders/TextureLoader.js';
import * as THREE from 'three';

const getCenterAndGround = (object) => {
    if (!object) return { center: new THREE.Vector3(), size: new THREE.Vector3() };
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return { center: new THREE.Vector3(), size: new THREE.Vector3() };

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const parentGroup = new THREE.Group();
    parentGroup.position.copy(center);
    object.position.sub(center);
    parentGroup.add(object);

    const parentBox = new THREE.Box3().setFromObject(parentGroup);
    if (!parentBox.isEmpty()) {
       parentGroup.position.y -= parentBox.min.y;
    }

    return { centeredModel: parentGroup, center: parentGroup.position.clone(), size };
};


const fitCameraToObject = (object, camera, controls) => {
    if (!object || !camera || !controls) return;

    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const sizeVec = box.getSize(new THREE.Vector3());
    let size = sizeVec.length();
    
    if (size === 0) size = 10;

    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(size / (2 * Math.tan(fov / 2))) * 1.5;

    camera.position.set(center.x, center.y + size * 0.5, center.z + cameraZ);
    controls.target.copy(center);
    camera.lookAt(center);
    controls.update();
};

const ModelViewer = ({ modelUrl, materialUrl, textureUrls, rotation, onModelReady, toast, onResetView }) => {
    const { scene, camera, controls } = useThree();
    const [model, setModel] = useState(null);
    const modelRef = useRef();

    const modelType = useMemo(() => modelUrl.split('?')[0].split('.').pop().toLowerCase(), [modelUrl]);

    const resetView = useCallback(() => {
        if (modelRef.current && camera && controls) {
            fitCameraToObject(modelRef.current, camera, controls);
        }
    }, [camera, controls]);

    useEffect(() => {
        if (onResetView) {
            onResetView.current = resetView;
        }
    }, [onResetView, resetView]);
    
    useFrame(() => {
        if (modelRef.current) {
             const targetQuaternion = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                    THREE.MathUtils.degToRad(rotation.x),
                    THREE.MathUtils.degToRad(rotation.y),
                    THREE.MathUtils.degToRad(rotation.z),
                    'XYZ'
                )
            );
            
            if (!modelRef.current.quaternion.equals(targetQuaternion)) {
                modelRef.current.quaternion.slerp(targetQuaternion, 0.2);
                modelRef.current.updateMatrixWorld(true);

                const parent = modelRef.current;
                
                const box = new THREE.Box3().setFromObject(parent);
                if (!box.isEmpty()) {
                    parent.position.y = parent.position.y - box.min.y;
                }
            }
        }
    });

    useEffect(() => {
        let currentModel;
        let isMounted = true;

        const loadModel = async () => {
            try {
                const manager = new THREE.LoadingManager();
                const textureLoader = new TextureLoader(manager);
                textureLoader.setCrossOrigin('anonymous');
                
                manager.setURLModifier((url) => {
                     const textureName = url.split('/').pop().split('?')[0];
                     const signedUrlData = textureUrls.find(t => t.name === textureName);
                     if (signedUrlData && signedUrlData.signedUrl) {
                         return signedUrlData.signedUrl;
                     }
                     return url;
                });

                if (modelType === 'obj') {
                    const mtlLoader = new MTLLoader(manager);
                    mtlLoader.setCrossOrigin('anonymous');
                    
                    const materials = await mtlLoader.loadAsync(materialUrl).catch(() => null);

                    const objLoader = new OBJLoader(manager);
                    objLoader.setCrossOrigin('anonymous');
                    if (materials) {
                        materials.preload();
                        objLoader.setMaterials(materials);
                    }
                    
                    currentModel = await objLoader.loadAsync(modelUrl);

                    if (!materials) {
                        toast({
                            variant: 'default',
                            title: 'Aviso de Textura',
                            description: 'Modelo .obj carregado sem textura (.mtl).',
                            className: 'bg-yellow-600 border-yellow-500 text-white'
                        });
                        const fallbackMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.5 });
                        currentModel.traverse((child) => {
                            if (child instanceof THREE.Mesh) child.material = fallbackMaterial;
                        });
                    }

                } else if (modelType === 'gltf' || modelType === 'glb') {
                    const gltfLoader = new GLTFLoader(manager);
                    gltfLoader.setCrossOrigin('anonymous');
                    const gltf = await gltfLoader.loadAsync(modelUrl);
                    currentModel = gltf.scene;
                } else if (modelType === 'fbx') {
                    const fbxLoader = new FBXLoader(manager);
                    fbxLoader.setCrossOrigin('anonymous');
                    currentModel = await fbxLoader.loadAsync(modelUrl);
                }

                if (isMounted && currentModel) {
                    currentModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    const { centeredModel, center } = getCenterAndGround(currentModel);
                    
                    setModel(centeredModel);
                    modelRef.current = centeredModel;
                    scene.add(centeredModel);
                    
                    setTimeout(() => fitCameraToObject(centeredModel, camera, controls), 100);

                    if (onModelReady) onModelReady(true, centeredModel, center);
                } else if (isMounted) {
                     throw new Error("O modelo carregado está vazio ou indefinido.");
                }

            } catch (error) {
                if (isMounted) {
                    toast({
                        variant: "destructive",
                        title: "Erro Crítico ao Carregar Modelo",
                        description: `Causa: ${error.message}`,
                    });
                    if (onModelReady) onModelReady(false, null, null);
                }
            }
        };

        if (modelUrl && materialUrl !== false) { 
            loadModel();
        }

        return () => {
            isMounted = false;
            if (modelRef.current) {
                scene.remove(modelRef.current);
                modelRef.current.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                        else child.material.dispose();
                    }
                });
            }
            setModel(null);
            modelRef.current = null;
        };
    }, [modelUrl, materialUrl, textureUrls, modelType, scene, camera, controls, onModelReady, toast]);

    return null;
};

export default ModelViewer;