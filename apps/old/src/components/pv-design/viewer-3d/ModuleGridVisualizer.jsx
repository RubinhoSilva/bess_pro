import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

// Caminho local para a textura enviada pelo usuário
const newModuleTextureUrl = '/module_texture.png';

const isPointInPolygon = (point, vs) => {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

const checkCollision = (movedModule, otherModules) => {
    if (!movedModule) return false;
    const movedBox = new THREE.Box3().setFromObject(movedModule);
    for (const other of otherModules) {
        if (!other) continue;
        const otherBox = new THREE.Box3().setFromObject(other);
        if (movedBox.intersectsBox(otherBox)) {
            return true;
        }
    }
    return false;
};

const ModuleGridVisualizer = ({
  area,
  moduleData,
  onUpdateAreaLayout,
  controlsRef,
  selectedIndices,
  onSelect,
  onHover,
  hoveredIndex,
  onContextMenu,
  isMoveMode,
  onMoveEnd,
}) => {
    const { scene } = useThree();
    const [moduleTexture, setModuleTexture] = useState(null);
    const [modules, setModules] = useState([]);
    // Estados para seleção múltipla por laço
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectStart, setSelectStart] = useState(null);
    const [selectEnd, setSelectEnd] = useState(null);
    // Estados para movimentação de módulo
    const [isDragging, setIsDragging] = useState(false);
    const [dragIndex, setDragIndex] = useState(null);
    const transformControlsRef = useRef(null);
    const groupRef = useRef(new THREE.Group());
    const initialPositionsRef = useRef(new Map());
    const initialGroupCenterRef = useRef(new THREE.Vector3());
    const planeRef = useRef(new THREE.Plane());
    const polygon2DRef = useRef([]);
    const meshesRef = useRef([]);

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
            newModuleTextureUrl,
            (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                setModuleTexture(texture);
            },
            undefined,
            () => {
                const canvas = document.createElement('canvas');
                canvas.width = 256; canvas.height = 256;
                const context = canvas.getContext('2d');
                context.fillStyle = '#1a2238'; context.fillRect(0, 0, 256, 256);
                context.strokeStyle = '#9da9ff'; context.lineWidth = 2;
                for (let i = 0; i < 8; i++) {
                    context.beginPath(); context.moveTo(i * 32, 0); context.lineTo(i * 32, 256); context.stroke();
                    context.beginPath(); context.moveTo(0, i * 32); context.lineTo(256, i * 32); context.stroke();
                }
                setModuleTexture(new THREE.CanvasTexture(canvas));
            }
        );
    }, []);

    useEffect(() => {
        // Validação dos dados
        if (!area) {
            setModules([]);
            return;
        }
        if (!area.geometria || area.geometria.length < 3) {
            setModules([]);
            return;
        }
        if (!moduleData || !area.layout_modulos || !moduleTexture) {
            setModules([]);
            return;
        }
        const { layout_modulos: layout, geometria } = area;
        const { largura_mm, altura_mm } = moduleData;
        if (!largura_mm || !altura_mm) {
            setModules([]);
            return;
        }
        const moduleWidth = (layout.orientation === 'portrait' ? largura_mm : altura_mm) / 1000;
        const moduleHeight = (layout.orientation === 'portrait' ? altura_mm : largura_mm) / 1000;
        const points = geometria.map(p => new THREE.Vector3(p.x, p.y, p.z));
        const plane = new THREE.Plane().setFromCoplanarPoints(points[0], points[1], points[2]);
        planeRef.current.copy(plane);
        const normal = plane.normal.clone();
        const upVector = Math.abs(normal.y) > 0.999 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
        const matrix = new THREE.Matrix4().lookAt(new THREE.Vector3(), normal, upVector);
        const localQuaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);
        const invQuaternion = localQuaternion.clone().invert();
        const localPoints = points.map(p => p.clone().applyQuaternion(invQuaternion));
        polygon2DRef.current = localPoints.map(p => new THREE.Vector2(p.x, p.y));
        const localBbox = new THREE.Box3().setFromPoints(localPoints);
        const gridWidth = localBbox.max.x - localBbox.min.x - 2 * layout.margin;
        const gridHeight = localBbox.max.y - localBbox.min.y - 2 * layout.margin;
        if (gridWidth <= 0 || gridHeight <= 0) {
            setModules([]);
            return;
        }
        const numCols = Math.floor((gridWidth + layout.spacing_x) / (moduleWidth + layout.spacing_x));
        const numRows = Math.floor((gridHeight + layout.spacing_y) / (moduleHeight + layout.spacing_y));
        if (numCols <= 0 || numRows <= 0) {
            setModules([]);
            return;
        }
        const maxModules = numCols * numRows;
        const modulesToPlace = (layout.numero_modulos > 0 && layout.numero_modulos <= maxModules) ? layout.numero_modulos : maxModules;
        const startX = localBbox.min.x + layout.margin + moduleWidth / 2;
        const startY = localBbox.min.y + layout.margin + moduleHeight / 2;
        const instances = [];
        for (let i = 0; i < modulesToPlace; i++) {
            const row = Math.floor(i / numCols);
            const col = i % numCols;
            const localX = startX + col * (moduleWidth + layout.spacing_x);
            const localY = startY + row * (moduleHeight + layout.spacing_y);
            const moduleCenterLocal = new THREE.Vector2(localX, localY);
            if (!isPointInPolygon(moduleCenterLocal, polygon2DRef.current)) continue;
            let localPos = new THREE.Vector3(localX, localY, localBbox.min.z);
            const worldPos = localPos.clone().applyQuaternion(localQuaternion);
            const ray = new THREE.Ray(worldPos.clone().add(normal.clone().multiplyScalar(20)), normal.clone().negate());
            const intersection = new THREE.Vector3();
            if (ray.intersectPlane(plane, intersection)) {
                instances.push({ position: intersection, quaternion: localQuaternion, width: moduleWidth, height: moduleHeight });
            }
        }
        if (layout.positions_overrides && layout.positions_overrides.length > 0) {
            const overriddenInstances = instances.map((inst, index) => {
                const override = layout.positions_overrides[index];
                if (override) {
                    return { ...inst, position: new THREE.Vector3(override.x, override.y, override.z) };
                }
                return inst;
            });
            setModules(overriddenInstances);
        } else {
            setModules(instances);
        }
    }, [area, moduleData, moduleTexture]);
    
    const transformObject = useMemo(() => {
        if (!isMoveMode || selectedIndices.length === 0 || modules.length === 0) {
            if (groupRef.current.parent) {
                groupRef.current.parent.remove(groupRef.current);
            }
            return null;
        }

        scene.add(groupRef.current);
        
        const center = new THREE.Vector3();
        initialPositionsRef.current.clear();
        
        selectedIndices.forEach(index => {
            const module = modules[index];
            if (module) {
                center.add(module.position);
                initialPositionsRef.current.set(index, module.position.clone());
            }
        });
        center.divideScalar(selectedIndices.length);
        
        groupRef.current.position.copy(center);
        groupRef.current.quaternion.copy(modules[selectedIndices[0]].quaternion);
        
        initialGroupCenterRef.current.copy(center);
        
        return groupRef.current;
    }, [isMoveMode, selectedIndices, modules, scene]);
    
    const handleObjectChange = useCallback(() => {
        if (!transformObject || !transformControlsRef.current) return;
    
        const newGroupCenter = transformObject.position.clone();
        const delta = newGroupCenter.clone().sub(initialGroupCenterRef.current);
        const invQuaternion = modules[0].quaternion.clone().invert();
        
        let allModulesInBounds = true;
        let collisionDetected = false;

        const otherModuleMeshes = meshesRef.current.filter((_, i) => !selectedIndices.includes(i));

        selectedIndices.forEach(index => {
            const initialPos = initialPositionsRef.current.get(index);
            if (initialPos) {
                const newPos = initialPos.clone().add(delta);
                const projectedPos = new THREE.Vector3();
                planeRef.current.projectPoint(newPos, projectedPos);

                const localPoint = projectedPos.clone().applyQuaternion(invQuaternion);
                if (!isPointInPolygon({x: localPoint.x, y: localPoint.y}, polygon2DRef.current)) {
                    allModulesInBounds = false;
                }

                if (meshesRef.current[index]) {
                    const tempMesh = meshesRef.current[index].clone();
                    tempMesh.position.copy(projectedPos);
                    if (checkCollision(tempMesh, otherModuleMeshes)) {
                        collisionDetected = true;
                    }
                }
            }
        });

        if (!allModulesInBounds || collisionDetected) {
            transformObject.position.copy(initialGroupCenterRef.current); 
        }
    }, [transformObject, modules, selectedIndices]);

    const handleTransformEnd = useCallback(() => {
        if (!transformObject) return;

        const newGroupCenter = transformObject.position.clone();
        const delta = newGroupCenter.sub(initialGroupCenterRef.current);

        const currentOverrides = area.layout_modulos.positions_overrides && area.layout_modulos.positions_overrides.length > 0 
            ? [...area.layout_modulos.positions_overrides]
            : modules.map(m => ({ x: m.position.x, y: m.position.y, z: m.position.z }));

        selectedIndices.forEach(index => {
            const initialPos = initialPositionsRef.current.get(index);
            if (initialPos) {
                const newPos = initialPos.clone().add(delta);
                const projectedPos = new THREE.Vector3();
                planeRef.current.projectPoint(newPos, projectedPos);
                
                if (currentOverrides[index]) {
                    currentOverrides[index] = { x: projectedPos.x, y: projectedPos.y, z: projectedPos.z };
                }
            }
        });

        const updatedLayout = {
            ...area,
            layout_modulos: { ...area.layout_modulos, positions_overrides: currentOverrides },
        };
        onUpdateAreaLayout(updatedLayout, false);
        onMoveEnd();
    }, [transformObject, area, modules, selectedIndices, onUpdateAreaLayout, onMoveEnd]);

    const handleDragStart = () => controlsRef.current && (controlsRef.current.enabled = false);
    const handleDragEnd = () => {
        handleTransformEnd();
        controlsRef.current && (controlsRef.current.enabled = true);
    };

    if (!moduleTexture) return null;
    if (!modules.length) {
        return (
            <Html>
                <div style={{color: 'red', background: 'white', padding: 12, borderRadius: 8}}>
                    Nenhum módulo pode ser inserido: verifique os dados da área, margens, espaçamentos ou dimensões do módulo.
                </div>
            </Html>
        );
    }

    // Função para converter coordenadas de tela para mundo
    const screenToWorld = (x, y) => {
        const { size, camera } = useThree();
        const ndc = new THREE.Vector2(
            (x / size.width) * 2 - 1,
            -(y / size.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(ndc, camera);
        const plane = planeRef.current;
        const intersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersection)) {
            return intersection;
        }
        return null;
    };

    // Mouse handlers para seleção múltipla e movimentação
    const handlePointerDown = (e) => {
        if (e.button !== 0) return;
        // Se clicar em módulo, inicia drag
        const intersected = e.object && e.object.type === 'Mesh' ? e.object : null;
        if (intersected) {
            const idx = meshesRef.current.findIndex(m => m === intersected);
            if (idx !== -1) {
                setIsDragging(true);
                setDragIndex(idx);
                e.stopPropagation();
                return;
            }
        }
        // Se não, inicia seleção múltipla
        setIsSelecting(true);
        setSelectStart({ x: e.clientX, y: e.clientY });
        setSelectEnd(null);
    };
    const handlePointerMove = (e) => {
        if (isDragging && dragIndex !== null) {
            // Movimenta módulo arrastado
            const { size, camera } = useThree();
            const ndc = new THREE.Vector2(
                (e.clientX / size.width) * 2 - 1,
                -(e.clientY / size.height) * 2 + 1
            );
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(ndc, camera);
            const plane = planeRef.current;
            const intersection = new THREE.Vector3();
            if (raycaster.ray.intersectPlane(plane, intersection)) {
                setModules(prev => prev.map((mod, idx) => idx === dragIndex ? { ...mod, position: intersection } : mod));
            }
            return;
        }
        if (isSelecting) {
            setSelectEnd({ x: e.clientX, y: e.clientY });
        }
    };
    const handlePointerUp = (e) => {
        if (isDragging) {
            setIsDragging(false);
            setDragIndex(null);
            return;
        }
        if (!isSelecting || !selectStart || !selectEnd) {
            setIsSelecting(false);
            setSelectStart(null);
            setSelectEnd(null);
            return;
        }
        // Calcula área de seleção em tela
        const minX = Math.min(selectStart.x, selectEnd.x);
        const maxX = Math.max(selectStart.x, selectEnd.x);
        const minY = Math.min(selectStart.y, selectEnd.y);
        const maxY = Math.max(selectStart.y, selectEnd.y);
        // Seleciona módulos cujas projeções estão dentro do retângulo
        const selected = [];
        modules.forEach((mod, idx) => {
            const pos = mod.position.clone();
            const { size, camera } = useThree();
            const vector = pos.project(camera);
            const screenX = ((vector.x + 1) / 2) * size.width;
            const screenY = ((-vector.y + 1) / 2) * size.height;
            if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
                selected.push(idx);
            }
        });
        onSelect(selected);
        setIsSelecting(false);
        setSelectStart(null);
        setSelectEnd(null);
    };

    // Renderização do retângulo de seleção
    const renderSelectionBox = () => {
        if (!isSelecting || !selectStart || !selectEnd) return null;
        const left = Math.min(selectStart.x, selectEnd.x);
        const top = Math.min(selectStart.y, selectEnd.y);
        const width = Math.abs(selectEnd.x - selectStart.x);
        const height = Math.abs(selectEnd.y - selectStart.y);
        return (
            <Html style={{ pointerEvents: 'none' }}>
                <div style={{
                    position: 'fixed',
                    left,
                    top,
                    width,
                    height,
                    border: '2px dashed #00ffff',
                    background: 'rgba(0,255,255,0.1)',
                    zIndex: 1000,
                }} />
            </Html>
        );
    };

    return (
        <group
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {modules.map((mod, index) => (
                <mesh
                    ref={el => meshesRef.current[index] = el}
                    key={`${area.id}-${index}`}
                    position={mod.position}
                    quaternion={mod.quaternion}
                    onPointerOver={(e) => { e.stopPropagation(); onHover(index); }}
                    onPointerOut={() => onHover(null)}
                    onContextMenu={(e) => onContextMenu(e, index)}
                >
                    <planeGeometry args={[mod.width, mod.height]} />
                    <meshStandardMaterial
                        map={moduleTexture}
                        side={THREE.DoubleSide}
                        emissive={selectedIndices.includes(index) ? '#00ffff' : (hoveredIndex === index ? '#ffff00' : '#000000')}
                        emissiveIntensity={0.6}
                    />
                </mesh>
            ))}
            {renderSelectionBox()}
        </group>
    );
};

export default ModuleGridVisualizer;