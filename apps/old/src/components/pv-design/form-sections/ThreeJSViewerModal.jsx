import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress, Html, Grid } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import {
    Ruler, Crop, Box, Sun, Zap as Battery, GitBranch, CloudSun, Save, Undo, Redo, Upload, View, Search, MousePointer,
    Loader2, AlertTriangle, Home, TimerReset as CameraReset, Navigation
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SolarModuleForm from './SolarModuleForm';
import ModelViewer from './ModelViewer';
import MeasurementTool from './MeasurementTool';
import { supabase } from '@/lib/customSupabaseClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as THREE from 'three';
import { motion } from 'framer-motion';

function Loader() {
    const { active, progress, errors, item, loaded, total } = useProgress();
    return (
        <Html center>
            <div className="text-center text-slate-800 bg-white/60 backdrop-blur-md p-6 rounded-xl shadow-lg flex flex-col items-center w-64">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
                <p className="font-bold text-lg mb-2">Carregando Modelo 3D</p>
                <div className="w-full bg-slate-300 rounded-full h-2.5 mb-2">
                    <motion.div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${progress}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <p className="font-semibold text-xl">{Math.round(progress)}%</p>
                {item && <p className="text-xs text-slate-600 mt-2 truncate w-full">Carregando: {item}</p>}
                {errors.length > 0 && <p className="text-xs text-red-500 mt-1">Erros: {errors.length}</p>}
            </div>
        </Html>
    );
}

const Compass = ({ onDoubleClick, onClick }) => {
    const { camera } = useThree();
    const [rotation, setRotation] = useState(0);

    useFrame(() => {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const angle = Math.atan2(direction.x, direction.z);
        setRotation(-angle);
    });

    return (
        <Html as="div" wrapperClass="compass-wrapper" portal={{ current: document.body }}>
            <div 
                className="absolute top-4 right-4 w-16 h-16 cursor-pointer"
                style={{ top: 'calc(5vh + 4rem)', right: '1rem' }}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
            >
                <div className="w-full h-full bg-slate-800/50 border border-slate-600 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110">
                    <motion.div 
                        style={{ transform: `rotate(${rotation}rad)` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <Navigation className="w-8 h-8 text-red-500" />
                    </motion.div>
                    <div className="absolute top-[-2px] text-sm font-bold text-red-400">N</div>
                </div>
            </div>
        </Html>
    );
};

const ThreeJSViewerModal = ({ isOpen, onClose, modelPath }) => {
    const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
    const [activeTool, setActiveTool] = useState(null);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [signedUrls, setSignedUrls] = useState({ model: null, material: null, textures: [] });
    const [loadingUrl, setLoadingUrl] = useState(true);
    const [error, setError] = useState(null);
    const { toast } = useToast();
    const resetViewRef = useRef(null);
    const controlsRef = useRef();
    const [compassRotationIndex, setCompassRotationIndex] = useState(0);
    const modelRef = useRef();

    const unimplementedFeatureToast = () => {
        toast({
            title: "🚧 Funcionalidade em desenvolvimento!",
            description: "Esta ferramenta ainda não foi implementada.",
        });
    };

    const toggleTool = (tool) => {
        if (tool === 'measure' || tool === 'reset') {
             setActiveTool(prevTool => (prevTool === tool ? null : tool));
             if (tool === 'reset') {
                handleResetView();
                setActiveTool(null);
             }
        } else {
            unimplementedFeatureToast();
        }
    };
    
    const resetToNorth = useCallback(() => {
        if (controlsRef.current) {
            const controls = controlsRef.current;
            controls.target.set(0, 0, 0);
            controls.object.position.set(0, 0, 50);
            controls.update();
        }
    }, []);

    const rotateToNextCardinal = useCallback(() => {
        if (controlsRef.current) {
            const controls = controlsRef.current;
            const newIndex = (compassRotationIndex + 1) % 4;
            const rotations = [
                { x: 0, y: 0, z: 50 },    // North
                { x: 50, y: 0, z: 0 },    // East
                { x: 0, y: 0, z: -50 },   // South
                { x: -50, y: 0, z: 0 }    // West
            ];
            controls.object.position.set(rotations[newIndex].x, rotations[newIndex].y, rotations[newIndex].z);
            controls.target.set(0, 0, 0);
            controls.update();
            setCompassRotationIndex(newIndex);
        }
    }, [compassRotationIndex]);

    useEffect(() => {
        const getUrls = async () => {
            if (!modelPath) return;

            setLoadingUrl(true);
            setError(null);
            setModelLoaded(false);
            setSignedUrls({ model: null, material: null, textures: [] });
            
            try {
                const folderPath = modelPath.substring(0, modelPath.lastIndexOf('/'));
                const { data: fileList, error: listError } = await supabase.storage.from('besspro').list(folderPath);

                if (listError) throw listError;
                if (!fileList || fileList.length === 0) throw new Error("Nenhum arquivo encontrado na pasta do modelo.");

                const pathsToSign = fileList.map(file => `${folderPath}/${file.name}`);
                const { data, error: urlError } = await supabase.storage.from('besspro').createSignedUrls(pathsToSign, 3600);

                if (urlError) throw urlError;
                
                const mainModelFile = fileList.find(f => f.name === modelPath.split('/').pop());
                if (!mainModelFile) throw new Error("Arquivo do modelo principal não encontrado na lista.");

                const modelUrlData = data.find(d => d.signedUrl.includes(mainModelFile.name));

                const mtlFile = fileList.find(f => f.name.toLowerCase().endsWith('.mtl'));
                const materialUrlData = mtlFile ? data.find(d => d.signedUrl.includes(mtlFile.name)) : null;

                const textureFiles = fileList.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f.name));
                const textureUrlsData = textureFiles.map(tf => {
                    const urlData = data.find(d => d.signedUrl.includes(tf.name));
                    return { name: tf.name, signedUrl: urlData?.signedUrl };
                }).filter(t => t.signedUrl);

                if (!modelUrlData || modelUrlData.error) {
                    throw new Error('Não foi possível obter a URL para o modelo principal.');
                }
                
                setSignedUrls({
                    model: modelUrlData.signedUrl,
                    material: materialUrlData ? materialUrlData.signedUrl : null,
                    textures: textureUrlsData
                });

            } catch (err) {
                console.error("Get URL Error:", err)
                const errorMessage = 'Não foi possível obter as URLs para o modelo. ' + err.message;
                setError(errorMessage);
                toast({ variant: 'destructive', title: 'Erro de Carregamento', description: errorMessage });
            } finally {
                setLoadingUrl(false);
            }
        };
        if (isOpen) {
            getUrls();
        }
    }, [isOpen, modelPath, toast]);

    const handleModelReady = useCallback((isSuccess, model) => {
        if (isSuccess) {
            setModelLoaded(true);
            modelRef.current = model;
            toast({ title: 'Modelo 3D pronto!', description: 'Agora você pode interagir com o modelo.' });
        } else {
            setModelLoaded(false);
            modelRef.current = null;
            setError("❗ Erro ao carregar o modelo. Verifique os arquivos e a iluminação.");
        }
    }, [toast]);
    
    const handleClose = () => {
        setActiveTool(null);
        setModelLoaded(false);
        setSignedUrls({ model: null, material: null, textures: [] });
        setLoadingUrl(true);
        setError(null);
        onClose();
    };
    
    const handleResetView = () => {
        if (resetViewRef.current) {
            resetViewRef.current();
        }
    };

    const leftDockTools = [
        { id: 'roof', icon: <Home />, tooltip: "Adicionar nova superfície de telhado para instalação dos módulos." },
        { id: 'module-area', icon: <Crop />, tooltip: "Delimitar área onde os painéis solares serão instalados." },
        { id: 'obstacles', icon: <Box />, tooltip: "Inserir objetos que causam sombreamento (ex: chaminés, caixas d'água, árvores)." },
        { id: 'pv-modules', icon: <Sun />, tooltip: "Selecionar e posicionar os painéis solares na área definida." },
        { id: 'inverters', icon: <Battery />, tooltip: "Planejar conexão dos módulos com inversores e sistemas de armazenamento (BESS)." },
        { id: 'wiring', icon: <GitBranch />, tooltip: "Visualizar e planejar esquemas de ligação elétrica entre os componentes." },
        { id: 'measure', icon: <Ruler />, tooltip: "Ferramenta para medir distâncias, ângulos ou áreas no modelo 3D." },
        { id: 'shading', icon: <CloudSun />, tooltip: "Visualizar áreas sombreadas conforme horário do dia." },
    ];

    const topBarTools = [
        { id: 'save', icon: <Save />, tooltip: "Salvar Projeto" },
        { id: 'undo', icon: <Undo />, tooltip: "Desfazer" },
        { id: 'redo', icon: <Redo />, tooltip: "Refazer" },
        { id: 'export', icon: <Upload />, tooltip: "Exportar Layout" },
        { id: 'view-mode', icon: <View />, tooltip: "Visualização 2D / 3D" },
        { id: 'reset', icon: <CameraReset />, tooltip: "Resetar visão da câmera" },
        { id: 'zoom', icon: <Search />, tooltip: "Zoom" },
        { id: 'orbit', icon: <MousePointer />, tooltip: "Orbit Controls" },
    ];

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-full w-full h-full flex flex-col p-0 bg-slate-900/90 backdrop-blur-sm border-slate-700 text-white">
                    <div className="flex flex-1 overflow-hidden relative">
                        <TooltipProvider>
                            <div className="absolute top-0 left-0 h-full z-10 p-2">
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-2 flex flex-col items-center gap-4 border border-slate-700">
                                    {leftDockTools.map(tool => (
                                        <ToolButton 
                                            key={tool.id}
                                            icon={tool.icon} 
                                            onClick={() => toggleTool(tool.id)} 
                                            isActive={activeTool === tool.id} 
                                            disabled={!modelLoaded} 
                                            tooltip={tool.tooltip} 
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 p-2">
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-2 flex items-center gap-4 border border-slate-700">
                                    {topBarTools.map(tool => (
                                        <ToolButton 
                                            key={tool.id}
                                            icon={tool.icon} 
                                            onClick={() => toggleTool(tool.id)} 
                                            isActive={activeTool === tool.id} 
                                            disabled={!modelLoaded} 
                                            tooltip={tool.tooltip} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </TooltipProvider>

                        <div className={`flex-1 relative ${activeTool === 'measure' ? 'cursor-crosshair' : ''}`}>
                            {loadingUrl && <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>}
                            {error && <div className="flex flex-col items-center justify-center h-full text-red-400"><AlertTriangle className="w-8 h-8 mb-2" /><p>{error}</p></div>}
                            {!loadingUrl && !error && signedUrls.model && (
                                <Canvas gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={[1, 2]} shadows>
                                    <color attach="background" args={['#1e293b']} />
                                    <ambientLight intensity={1.5} />
                                    <hemisphereLight skyColor={0xffffff} groundColor={0x444444} intensity={1} />
                                    <directionalLight color={0xffffff} intensity={2.5} position={[10, 20, 15]} castShadow />
                                    <Suspense fallback={<Loader />}>
                                        <Grid
                                            position={[0, 0.01, 0]}
                                            args={[100, 100]}
                                            cellSize={1}
                                            cellThickness={1}
                                            cellColor="#666"
                                            sectionSize={5}
                                            sectionThickness={1.5}
                                            sectionColor="#0ea5e9"
                                            fadeDistance={50}
                                            fadeStrength={1}
                                            infiniteGrid
                                        />
                                        <ModelViewer 
                                            modelUrl={signedUrls.model}
                                            materialUrl={signedUrls.material !== null ? signedUrls.material : false}
                                            textureUrls={signedUrls.textures}
                                            onModelReady={handleModelReady}
                                            toast={toast}
                                            onResetView={resetViewRef}
                                        />
                                        {activeTool === 'measure' && modelRef.current && (
                                            <MeasurementTool 
                                                targetModel={modelRef.current}
                                                onMeasureComplete={(distance) => {
                                                    toast({
                                                        title: 'Medição Concluída',
                                                        description: `A distância é ${distance.toFixed(2)} metros.`
                                                    });
                                                    setActiveTool(null);
                                                }}
                                            />
                                        )}
                                        <Compass onDoubleClick={resetToNorth} onClick={rotateToNextCardinal} />
                                    </Suspense>
                                    <OrbitControls ref={controlsRef} makeDefault enableZoom enablePan minDistance={0.1} maxDistance={1000} enabled={activeTool !== 'measure'} />
                                </Canvas>
                           )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <SolarModuleForm isOpen={isModuleFormOpen} onClose={() => setIsModuleFormOpen(false)} onSaveSuccess={() => {}} />
        </>
    );
};

const ToolButton = ({ icon, onClick, isActive, disabled, tooltip }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button 
                variant="ghost" 
                size="icon"
                className={`w-12 h-12 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors ${isActive ? 'bg-blue-600 text-white' : ''} disabled:opacity-50 disabled:cursor-not-allowed`} 
                onClick={onClick} 
                disabled={disabled}
            >
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </Button>
        </TooltipTrigger>
        <TooltipContent side="right"><p>{tooltip}</p></TooltipContent>
    </Tooltip>
);

export default ThreeJSViewerModal;