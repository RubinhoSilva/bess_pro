import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';
import { supabase } from '@/lib/customSupabaseClient';
import { useKeyboardControls } from './useKeyboardControls';

export const useViewerState = (projectId, user) => {
    const { toast } = useToast();
    const [activeTool, setActiveTool] = useState(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
    const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 } });
    const [useAsTerrain, setUseAsTerrain] = useState(false);
    const [showGuideGrid, setShowGuideGrid] = useState(true);
    const [gridPosition, setGridPosition] = useState(new THREE.Vector3(0, 0.01, 0));
    const [mountingAreas, setMountingAreas] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState(null);
    const [hoveredAreaId, setHoveredAreaId] = useState(null);
    const [editingArea, setEditingArea] = useState(null);
    const [moduleDatabase, setModuleDatabase] = useState({});

    const [selectedModuleIndices, setSelectedModuleIndices] = useState([]);
    const [hoveredModuleIndex, setHoveredModuleIndex] = useState(null);
    const [moduleContextMenu, setModuleContextMenu] = useState({ isOpen: false, position: null });
    const [isMoveMode, setIsMoveMode] = useState(false);
    
    const [shadingAnalysis, setShadingAnalysis] = useState({
        sunPosition: null,
        results: null,
    });

    useEffect(() => {
        const fetchModules = async () => {
            const { data, error } = await supabase.from('modulos_fotovoltaicos').select('*');
            if (!error) {
                const testModule = {
                    id: 'test-module-id',
                    modelo: 'Módulo Padrão 550W',
                    largura_mm: 1134,
                    altura_mm: 2278,
                };
                const db = [testModule, ...data].reduce((acc, module) => {
                    acc[module.id] = module;
                    return acc;
                }, {});
                setModuleDatabase(db);
            }
        };
        fetchModules();
    }, [supabase]);

    const unimplementedFeatureToast = useCallback(() => {
        toast({
            title: "🚧 Funcionalidade em desenvolvimento!",
            description: "Esta ferramenta ainda não foi implementada.",
        });
    }, [toast]);

    const toggleTool = useCallback((tool, resetView) => {
        if (tool === 'terrain') {
            setUseAsTerrain(prev => !prev);
            toast({
                title: 'Modo Terreno',
                description: `O modelo agora está ${!useAsTerrain ? 'sendo' : 'não está mais'} usado como terreno.`,
            });
        } else if (tool === 'guide-grid') {
            setShowGuideGrid(prev => !prev);
        } else if (['measure', 'reset', 'module-area', 'shading', 'pvgis'].includes(tool)) {
            setActiveTool(prevTool => (prevTool === tool ? null : tool));
            if (tool === 'reset') {
                if (resetView) resetView();
                setActiveTool(null);
            }
        } else {
            unimplementedFeatureToast();
        }
    }, [toast, unimplementedFeatureToast, useAsTerrain]);

    const handleContextMenu = useCallback((event, modelLoaded) => {
        event.preventDefault();
        if (!modelLoaded || selectedAreaId) return;
        setContextMenu({ isOpen: true, position: { x: event.clientX, y: event.clientY } });
    }, [selectedAreaId]);

    const handleRotate = useCallback((axis, angle) => {
        const roundToNearest90 = (val) => Math.round(val / 90) * 90;
        setRotation(prev => {
            const newRotationValue = roundToNearest90(prev[axis]) + angle;
            return { ...prev, [axis]: newRotationValue };
        });
    }, []);

    const handleResetRotation = useCallback(() => {
        setRotation({ x: 0, y: 0, z: 0 });
    }, []);

    const handleMeasureComplete = useCallback((distance) => {
        toast({
            title: 'Medição Concluída',
            description: `A distância é ${distance.toFixed(2)} metros.`
        });
        setActiveTool(null);
    }, [toast]);

    const handleAreaSelectionComplete = useCallback((polygon) => {
        const newArea = {
            id: uuidv4(),
            nome: `Área de Montagem ${mountingAreas.length + 1}`,
            geometria: polygon.points.map(p => ({ x: p.x, y: p.y, z: p.z })),
            inclinacao: polygon.inclination,
            orientacao: polygon.orientation,
            area_util_m2: polygon.area,
            isLocal: true,
            layout_modulos: null,
            modulo_id: null,
        };
        setMountingAreas(prev => [...prev, newArea]);
        setActiveTool(null);
        toast({
            title: 'Área de Montagem Criada',
            description: `${newArea.nome} foi adicionada localmente.`,
        });
    }, [mountingAreas.length, toast]);

    const handleDeleteArea = useCallback(async (areaId) => {
        const areaToDelete = mountingAreas.find(area => area.id === areaId);
        if (areaToDelete && !areaToDelete.isLocal) {
            const { error } = await supabase.from('areas_montagem').delete().match({ id: areaId });
            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
                return;
            }
        }
        setMountingAreas(prev => prev.filter(area => area.id !== areaId));
        if (selectedAreaId === areaId) setSelectedAreaId(null);
        toast({ title: 'Área excluída com sucesso.' });
    }, [mountingAreas, selectedAreaId, toast]);

    const handleUpdateAreaName = useCallback(async (areaId, newName) => {
        const areaToUpdate = mountingAreas.find(area => area.id === areaId);
        if (areaToUpdate && !areaToUpdate.isLocal) {
            const { data, error } = await supabase
                .from('areas_montagem')
                .update({ nome: newName })
                .match({ id: areaId })
                .select();
            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
                return;
            }
            setMountingAreas(prev => prev.map(area => area.id === areaId ? data[0] : area));
        } else {
            setMountingAreas(prev => prev.map(area => area.id === areaId ? { ...area, nome: newName } : area));
        }
        toast({ title: 'Nome da área atualizado.' });
        setEditingArea(null);
    }, [mountingAreas, toast]);

    const handleUpdateAreaLayout = useCallback(async (updatedArea, shouldSave = false) => {
        setMountingAreas(prev => prev.map(area => area.id === updatedArea.id ? updatedArea : area));
        if (shouldSave) {
            const areaToSave = {
                project_id: projectId,
                user_id: user.id,
                ...updatedArea,
            };
            
            const { error } = await supabase.from('areas_montagem').upsert(areaToSave, { onConflict: 'id' });
            
            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao salvar layout', description: error.message });
            } else if (updatedArea.isLocal) {
                setMountingAreas(prev => prev.map(a => a.id === updatedArea.id ? { ...a, isLocal: false } : a));
            }
        }
    }, [toast, projectId, user]);

    const handleSelectArea = useCallback((areaId, controls) => {
        const newSelectedAreaId = selectedAreaId === areaId ? null : areaId;
        setSelectedAreaId(newSelectedAreaId);
        setSelectedModuleIndices([]);
        setHoveredModuleIndex(null);
        setIsMoveMode(false);
        setModuleContextMenu({ isOpen: false, position: null });

        const area = mountingAreas.find(a => a.id === areaId);
        if (area && controls) {
            const points = area.geometria.map(p => new THREE.Vector3(p.x, p.y, p.z));
            const box = new THREE.Box3().setFromPoints(points);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const cameraOffset = maxDim * 2;
            const newCamPos = new THREE.Vector3(center.x, center.y + cameraOffset, center.z);
            controls.object.position.copy(newCamPos);
            controls.target.copy(center);
            controls.update();
        }
    }, [mountingAreas, selectedAreaId]);

    const handleSelectModule = useCallback((index, isMultiSelect) => {
        setModuleContextMenu({ isOpen: false, position: null });
        setSelectedModuleIndices(prev => {
            if (isMultiSelect) {
                const newSelection = new Set(prev);
                if (newSelection.has(index)) {
                    newSelection.delete(index);
                } else {
                    newSelection.add(index);
                }
                return Array.from(newSelection);
            }
            return prev.includes(index) && prev.length === 1 ? [] : [index];
        });
    }, []);

    const handleModuleContextMenu = useCallback((event, index) => {
        event.nativeEvent.preventDefault();
        event.stopPropagation();
        if (!selectedModuleIndices.includes(index)) {
            setSelectedModuleIndices([index]);
        }
        setModuleContextMenu({ isOpen: true, position: { x: event.clientX, y: event.clientY } });
    }, [selectedModuleIndices]);

    const handleStartMove = useCallback(() => {
        setIsMoveMode(true);
        setModuleContextMenu({ isOpen: false, position: null });
    }, []);

    const handleMoveEnd = useCallback(() => {
        setIsMoveMode(false);
    }, []);

    const moveSelectedModules = useCallback((delta) => {
        const selectedArea = mountingAreas.find(a => a.id === selectedAreaId);
        if (!selectedArea || !selectedArea.layout_modulos || !selectedArea.layout_modulos.positions_overrides) return;
    
        const currentOverrides = selectedArea.layout_modulos.positions_overrides;
        if (currentOverrides.length === 0) return;
    
        const moduleData = moduleDatabase[selectedArea.modulo_id];
        if (!moduleData) return;
    
        const points = selectedArea.geometria.map(p => new THREE.Vector3(p.x, p.y, p.z));
        const plane = new THREE.Plane().setFromCoplanarPoints(points[0], points[1], points[2]);
        
        const upVector = Math.abs(plane.normal.y) > 0.999 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
        const matrix = new THREE.Matrix4().lookAt(new THREE.Vector3(), plane.normal, upVector);
        const invQuaternion = new THREE.Quaternion().setFromRotationMatrix(matrix).invert();
        const polygon2D = points.map(p => p.clone().applyQuaternion(invQuaternion)).map(p => new THREE.Vector2(p.x, p.y));
    
        const moduleWidth = (selectedArea.layout_modulos.orientation === 'portrait' ? moduleData.largura_mm : moduleData.altura_mm) / 1000;
        const moduleHeight = (selectedArea.layout_modulos.orientation === 'portrait' ? moduleData.altura_mm : moduleData.largura_mm) / 1000;
        
        let canMove = true;
        const tempNewPositions = {};
    
        for (const index of selectedModuleIndices) {
            if (currentOverrides[index]) {
                const currentPos = new THREE.Vector3(currentOverrides[index].x, currentOverrides[index].y, currentOverrides[index].z);
                const newPos = currentPos.clone().add(delta);
                plane.projectPoint(newPos, newPos);
                tempNewPositions[index] = newPos;
    
                const localPoint = newPos.clone().applyQuaternion(invQuaternion);
                if (!isPointInPolygon({ x: localPoint.x, y: localPoint.y }, polygon2D)) {
                    canMove = false;
                    break;
                }
    
                const newBox = new THREE.Box3().setFromCenterAndSize(newPos, new THREE.Vector3(moduleWidth, moduleHeight, 0.1));
    
                for (let i = 0; i < currentOverrides.length; i++) {
                    if (selectedModuleIndices.includes(i) || !currentOverrides[i]) continue;
                    
                    const otherPos = new THREE.Vector3(currentOverrides[i].x, currentOverrides[i].y, currentOverrides[i].z);
                    const otherBox = new THREE.Box3().setFromCenterAndSize(otherPos, new THREE.Vector3(moduleWidth, moduleHeight, 0.1));
    
                    if (newBox.intersectsBox(otherBox)) {
                        canMove = false;
                        break;
                    }
                }
                if (!canMove) break;
            }
        }
    
        if (canMove) {
            const finalNewOverrides = [...currentOverrides];
            selectedModuleIndices.forEach(index => {
                if (finalNewOverrides[index] && tempNewPositions[index]) {
                    const newPos = tempNewPositions[index];
                    finalNewOverrides[index] = { x: newPos.x, y: newPos.y, z: newPos.z };
                }
            });
            handleUpdateAreaLayout({
                ...selectedArea,
                layout_modulos: { ...selectedArea.layout_modulos, positions_overrides: finalNewOverrides }
            }, false);
        }
    }, [mountingAreas, selectedAreaId, selectedModuleIndices, handleUpdateAreaLayout, moduleDatabase]);

    useKeyboardControls(selectedModuleIndices.length > 0 && !isMoveMode, moveSelectedModules, mountingAreas.find(a => a.id === selectedAreaId));
    
    const closeAllPopups = useCallback(() => {
        setContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
        setModuleContextMenu({ isOpen: false, position: null });
        if (isMoveMode) {
            setIsMoveMode(false);
        }
    }, [isMoveMode]);

    return {
        activeTool, setActiveTool,
        rotation, setRotation,
        contextMenu, setContextMenu,
        useAsTerrain, setUseAsTerrain,
        showGuideGrid, setShowGuideGrid,
        gridPosition, setGridPosition,
        mountingAreas, setMountingAreas,
        selectedAreaId, setSelectedAreaId,
        hoveredAreaId, setHoveredAreaId,
        editingArea, setEditingArea,
        shadingAnalysis, setShadingAnalysis,
        moduleDatabase,
        toggleTool,
        handleContextMenu,
        handleRotate,
        handleResetRotation,
        handleMeasureComplete,
        handleAreaSelectionComplete,
        handleDeleteArea,
        handleUpdateAreaName,
        handleUpdateAreaLayout,
        handleSelectArea,
        closeAllPopups,
        moduleInteraction: {
            selectedIndices: selectedModuleIndices,
            hoveredModuleIndex,
            isMoveMode,
            moduleContextMenu,
            handleSelectModule,
            setHoveredModuleIndex,
            handleModuleContextMenu,
            handleStartMove,
            handleMoveEnd,
        },
    };
};

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