import React, { Suspense, useState, useEffect, useRef } from 'react';
import { OrbitControls, Sky, Plane } from '@react-three/drei';
import ModelViewer from '@/components/pv-design/form-sections/ModelViewer';
import MeasurementTool from '@/components/pv-design/form-sections/MeasurementTool';
import Compass from '@/components/pv-design/viewer-3d/Compass';
import Loader from '@/components/pv-design/viewer-3d/Loader';
import AzimuthGrid from '@/components/pv-design/viewer-3d/AzimuthGrid';
import MountingAreaVisualizer from '@/components/pv-design/viewer-3d/MountingAreaVisualizer';
import ModuleGridVisualizer from '@/components/pv-design/viewer-3d/ModuleGridVisualizer';
import * as THREE from 'three';

const Scene = ({ 
    signedUrls, 
    rotation, 
    activeTool, 
    onModelReady, 
    toast, 
    resetViewRef, 
    modelRef, 
    controlsRef, 
    onMeasureComplete,
    onResetToNorth,
    showGuideGrid,
    gridPosition,
    mountingAreas,
    selectedAreaId,
    hoveredAreaId,
    onUpdateAreaLayout,
    moduleInteraction,
    sunPosition,
    moduleDatabase,
}) => {
    const sunLightRef = useRef();
    const [orthoLock, setOrthoLock] = useState(false);
    const [lastOrthoAreaId, setLastOrthoAreaId] = useState(null);
    // Alinha a câmera ortogonalmente ao plano da área selecionada para edição de módulos
    useEffect(() => {
        // Alinha a câmera ao plano da área de montagem ao entrar no modo de inserção de módulos
        const isInsertMode = moduleInteraction.isInsertMode || moduleInteraction.isMoveMode;
        if (
            controlsRef.current &&
            mountingAreas &&
            selectedAreaId &&
            isInsertMode
        ) {
            const area = mountingAreas.find(a => a.id === selectedAreaId);
            if (!area || !area.geometria || area.geometria.length < 3) return;
            const points = area.geometria.map(p => new THREE.Vector3(p.x, p.y, p.z));
            const plane = new THREE.Plane().setFromCoplanarPoints(points[0], points[1], points[2]);
            const box = new THREE.Box3().setFromPoints(points);
            const center = box.getCenter(new THREE.Vector3());
            let normal = plane.normal.clone().normalize();
            // Garante que o normal aponte para cima (Y positivo)
            if (normal.y < 0) {
                normal = normal.multiplyScalar(-1);
            }
            let up = new THREE.Vector3(0, 1, 0);
            if (Math.abs(normal.dot(up)) > 0.95) {
                up = new THREE.Vector3(1, 0, 0);
            }
            const areaSize = box.getSize(new THREE.Vector3());
            const distance = Math.max(areaSize.x, areaSize.y, areaSize.z) * 2;
            const camPos = center.clone().add(normal.clone().multiplyScalar(distance));
            controlsRef.current.object.position.copy(camPos);
            controlsRef.current.target.copy(center);
            controlsRef.current.object.up.copy(up);
            controlsRef.current.update();
            setOrthoLock(true);
        } else if (!isInsertMode && orthoLock) {
            setOrthoLock(false);
        }
    }, [mountingAreas, selectedAreaId, moduleInteraction.isInsertMode, moduleInteraction.isMoveMode, controlsRef, orthoLock]);
    
    useEffect(() => {
        if (sunLightRef.current && sunPosition) {
            sunLightRef.current.position.copy(sunPosition);
        }
    }, [sunPosition]);

    return (
        <>
            <ambientLight intensity={sunPosition ? 0.3 : 1.2} />
            <hemisphereLight skyColor={0x87ceeb} groundColor={0x444444} intensity={sunPosition ? 0.5 : 1.5} />
            <directionalLight 
                ref={sunLightRef}
                color={0xffffff} 
                intensity={sunPosition ? 4.0 : 2.5} 
                position={sunPosition || [50, 50, 50]} 
                castShadow 
                shadow-mapSize-width={4096}
                shadow-mapSize-height={4096}
                shadow-camera-far={500}
                shadow-camera-left={-100}
                shadow-camera-right={100}
                shadow-camera-top={100}
                shadow-camera-bottom={-100}
            />
            {!sunPosition && <directionalLight color={0xffffff} intensity={1} position={[-50, 50, -50]} />}
            
            <Suspense fallback={<Loader />}>
                <Sky sunPosition={sunPosition || [100, 20, 100]} />
                <Plane args={[10000, 10000]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                    <meshStandardMaterial color="#6B8E23" />
                </Plane>

                {showGuideGrid && <AzimuthGrid position={gridPosition} rotation={rotation} radius={100} sectors={12} />}
                
                <ModelViewer 
                    modelUrl={signedUrls.model}
                    materialUrl={signedUrls.material !== null ? signedUrls.material : false}
                    textureUrls={signedUrls.textures}
                    rotation={rotation}
                    onModelReady={onModelReady}
                    toast={toast}
                    onResetView={resetViewRef}
                />

                <MountingAreaVisualizer 
                    areas={mountingAreas}
                    selectedAreaId={selectedAreaId}
                    hoveredAreaId={hoveredAreaId}
                />

                {mountingAreas.map(area => {
                    if (!area.modulo_id || !area.layout_modulos || area.id !== selectedAreaId) return null;
                    const moduleData = moduleDatabase[area.modulo_id];
                    if (!moduleData) return null;
                    return (
                        <ModuleGridVisualizer 
                            key={area.id} 
                            area={area} 
                            moduleData={moduleData}
                            onUpdateAreaLayout={onUpdateAreaLayout}
                            controlsRef={controlsRef}
                            selectedIndices={moduleInteraction.selectedIndices}
                            onSelect={moduleInteraction.handleSelectModule}
                            onHover={moduleInteraction.setHoveredModuleIndex}
                            hoveredIndex={moduleInteraction.hoveredModuleIndex}
                            onContextMenu={moduleInteraction.handleModuleContextMenu}
                            isMoveMode={moduleInteraction.isMoveMode}
                            onMoveEnd={moduleInteraction.handleMoveEnd}
                        />
                    );
                })}

                {activeTool === 'measure' && modelRef.current && (
                    <MeasurementTool 
                        targetModel={modelRef.current}
                        onMeasureComplete={onMeasureComplete}
                    />
                )}
                
                <Compass onDoubleClick={onResetToNorth} />
            </Suspense>
            
            <OrbitControls 
                ref={controlsRef} 
                makeDefault 
                enableZoom 
                enablePan 
                minDistance={0.1} 
                maxDistance={2000} 
                enabled={activeTool !== 'measure' && (!moduleInteraction.isMoveMode || orthoLock)} 
                enableRotate={false}
            />
        </>
    );
};

export default Scene;