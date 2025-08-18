import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ModelRotationTool from '@/components/pv-design/form-sections/ModelRotationTool';
import * as THREE from 'three';
import SunCalc from 'suncalc';
import Scene from '@/components/pv-design/viewer-3d/Scene';
import Toolbar from '@/components/pv-design/viewer-3d/Toolbar';
import AreaSelectionTool from '@/components/pv-design/form-sections/AreaSelectionTool';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { useViewerState } from '@/hooks/useViewerState';
import { useModelLoader } from '@/hooks/useModelLoader';
import ViewerPanels from '@/components/pv-design/viewer-3d/ViewerPanels';
import ModuleContextMenu from '@/components/pv-design/viewer-3d/ModuleContextMenu';
import { supabase } from '@/lib/customSupabaseClient';

const Model3DViewerPage = () => {
    const [searchParams] = useSearchParams();
    const { user } = useNewAuth();
    const { toast } = useToast();

    const [modelPath, setModelPath] = useState(null);
    const [project, setProject] = useState(null);
    const [projectId, setProjectId] = useState(null);

    const resetViewRef = useRef(null);
    const controlsRef = useRef();
    const modelRef = useRef();

    useEffect(() => {
        const encodedModelPath = searchParams.get('model');
        const projId = searchParams.get('projectId');
        setProjectId(projId);

        if (projId) {
            const fetchProject = async () => {
                const { data, error } = await supabase.from('projects').select('*').eq('id', projId).single();
                if (error) {
                    toast({ variant: 'destructive', title: 'Erro ao buscar projeto', description: error.message });
                } else {
                    setProject(data);
                }
            };
            fetchProject();
        }

        if (encodedModelPath) {
            try {
                setModelPath(atob(encodedModelPath));
            } catch (e) {
                toast({ variant: "destructive", title: "Erro", description: "A URL do modelo fornecida é inválida." });
            }
        }
    }, [searchParams, toast]);

    const { signedUrls, loadingUrl, error, modelLoaded, handleModelReady } = useModelLoader(modelPath);
    
    const viewerState = useViewerState(projectId, user);
    const {
        activeTool, rotation, contextMenu, useAsTerrain, showGuideGrid, gridPosition,
        mountingAreas, selectedAreaId, hoveredAreaId, editingArea, shadingAnalysis,
        toggleTool, handleContextMenu, handleRotate, handleResetRotation,
        handleMeasureComplete, handleAreaSelectionComplete, setRotation, setGridPosition,
        handleUpdateAreaLayout, moduleInteraction, closeAllPopups, setShadingAnalysis, setMountingAreas,
        moduleDatabase,
    } = viewerState;

    // Fetch mounting areas when project is loaded
    useEffect(() => {
        if (projectId && supabase) {
            const fetchMountingAreas = async () => {
                const { data, error } = await supabase
                    .from('areas_montagem')
                    .select('*')
                    .eq('project_id', projectId);
                if (!error) {
                    setMountingAreas(data);
                }
            };
            fetchMountingAreas();
        }
    }, [projectId, supabase, setMountingAreas]);

    const onModelReady = useCallback((isSuccess, model, center) => {
        if (isSuccess) {
            modelRef.current = model;
        } else {
            modelRef.current = null;
        }
        handleModelReady(isSuccess, model, center, setRotation, setGridPosition);
    }, [handleModelReady, setRotation, setGridPosition]);

    const handleResetView = useCallback(() => {
        if (resetViewRef.current) {
            resetViewRef.current();
        }
    }, []);

    const resetToNorth = useCallback(() => {
        if (controlsRef.current && modelRef.current) {
            const controls = controlsRef.current;
            const model = modelRef.current;
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const cameraDistance = maxDim * 1.5;
            controls.object.position.set(center.x, center.y + cameraDistance, center.z);
            controls.target.copy(center);
            controls.update();
        }
    }, []);
    
    const handleRunShadingAnalysis = useCallback((params) => {
        if (!project?.project_data?.location) {
            toast({ variant: 'destructive', title: 'Localização não definida', description: 'Por favor, use a ferramenta de localização para definir as coordenadas do projeto.' });
            return;
        }

        const { latitude, longitude } = project.project_data.location;
        const { date, time } = params;
        const analysisTime = new Date(`${date}T${String(time).padStart(2, '0')}:00:00`);

        const sunPositionData = SunCalc.getPosition(analysisTime, latitude, longitude);

        const distance = 1000;
        const sunPositionVec = new THREE.Vector3();
        sunPositionVec.setFromSphericalCoords(
            distance,
            Math.PI / 2 - sunPositionData.altitude,
            sunPositionData.azimuth + Math.PI
        );
        setShadingAnalysis({ ...shadingAnalysis, sunPosition: sunPositionVec });
        toast({ title: 'Visualização de Sombra Ativada', description: `Sombra para ${analysisTime.toLocaleString('pt-BR')}`});
    }, [project, shadingAnalysis, setShadingAnalysis, toast]);
    
    const handleCloseShadingPanel = () => {
        viewerState.setActiveTool(null);
        setShadingAnalysis({ ...shadingAnalysis, sunPosition: null });
    };

    const handleSaveProject = async () => {
        if (!project || !user) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Projeto ou usuário não carregado.' });
            return;
        }

        // 1. Save all mounting areas
        const areasToSave = mountingAreas.map(area => ({
            ...area,
            project_id: projectId,
            user_id: user.id,
        }));

        const { error: areaError } = await supabase.from('areas_montagem').upsert(areasToSave);

        if (areaError) {
            toast({ variant: 'destructive', title: 'Erro ao salvar áreas', description: areaError.message });
            return;
        }

        // 2. Update project with any other relevant data
        // For now, we just save the areas, but this can be expanded
        const updatedProjectData = {
            ...project.project_data,
            // You can add more data here if needed, e.g., model rotation
            viewer_rotation: rotation,
        };
        
        const { error: projectError } = await supabase
            .from('projects')
            .update({ project_data: updatedProjectData })
            .eq('id', projectId);

        if (projectError) {
            toast({ variant: 'destructive', title: 'Erro ao salvar projeto', description: projectError.message });
            return;
        }

        toast({ title: 'Projeto Salvo!', description: 'Todas as alterações no visualizador foram salvas com sucesso.' });
    };

    const getCursorStyle = () => {
        if (activeTool === 'module-area' || activeTool === 'measure') {
            return 'cursor-crosshair';
        }
        return 'cursor-grab';
    };

    return (
        <div className="w-screen h-screen bg-slate-900 text-white flex" onClick={closeAllPopups}>
            <div className="flex-grow h-full relative">
                <Toolbar
                    activeTool={activeTool}
                    toggleTool={(tool) => toggleTool(tool, handleResetView)}
                    modelLoaded={modelLoaded}
                    useAsTerrain={useAsTerrain}
                    showGuideGrid={showGuideGrid}
                    project={project}
                    onSaveProject={handleSaveProject}
                />

                <div
                    className={`w-full h-full ${getCursorStyle()}`}
                    onContextMenu={(e) => handleContextMenu(e, modelLoaded)}
                >
                    {loadingUrl && <div className="flex items-center justify-center h-full"><Loader2 className="w-12 h-12 animate-spin text-blue-500" /></div>}
                    {error && <div className="flex flex-col items-center justify-center h-full text-red-400"><AlertTriangle className="w-12 h-12 mb-4" /><p className="text-lg">{error}</p></div>}
                    {!loadingUrl && !error && signedUrls.model && (
                        <Canvas gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={[1, 1.5]} shadows camera={{ position: [0, 50, 150], fov: 50 }}>
                            <Scene
                                signedUrls={signedUrls}
                                rotation={rotation}
                                activeTool={activeTool}
                                onModelReady={onModelReady}
                                toast={toast}
                                resetViewRef={resetViewRef}
                                modelRef={modelRef}
                                controlsRef={controlsRef}
                                onMeasureComplete={handleMeasureComplete}
                                onResetToNorth={resetToNorth}
                                showGuideGrid={showGuideGrid}
                                gridPosition={gridPosition}
                                mountingAreas={mountingAreas}
                                selectedAreaId={selectedAreaId}
                                hoveredAreaId={hoveredAreaId}
                                onUpdateAreaLayout={handleUpdateAreaLayout}
                                moduleInteraction={moduleInteraction}
                                sunPosition={shadingAnalysis.sunPosition}
                                moduleDatabase={moduleDatabase}
                            />
                            <AreaSelectionTool
                                isEnabled={activeTool === 'module-area' && modelLoaded}
                                targetModel={modelRef.current}
                                onSelectionComplete={handleAreaSelectionComplete}
                            />
                        </Canvas>
                    )}
                </div>

                <ModelRotationTool
                    isOpen={contextMenu.isOpen}
                    position={contextMenu.position}
                    onClose={() => viewerState.setContextMenu({ ...contextMenu, isOpen: false })}
                    onRotate={handleRotate}
                    onReset={handleResetRotation}
                />
                {moduleInteraction.moduleContextMenu.isOpen && (
                    <ModuleContextMenu
                        position={moduleInteraction.moduleContextMenu.position}
                        onClose={closeAllPopups}
                        onMove={moduleInteraction.handleStartMove}
                    />
                )}
            </div>
            <ViewerPanels 
                {...viewerState} 
                project={project} 
                controlsRef={controlsRef}
                onRunShadingAnalysis={handleRunShadingAnalysis}
                onCloseShadingPanel={handleCloseShadingPanel}
            />
        </div>
    );
};

export default Model3DViewerPage;