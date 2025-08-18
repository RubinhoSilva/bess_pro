import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Wrapper } from "@googlemaps/react-wrapper";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import ModelViewer from '@/components/pv-design/form-sections/ModelViewer';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';

const MapComponent = ({ center, zoom, onMapLoad, project }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && !window.mapInstance) {
            const map = new window.google.maps.Map(ref.current, {
                center,
                zoom,
                mapTypeId: 'satellite',
                disableDefaultUI: true,
                zoomControl: true,
                streetViewControl: true,
            });
            window.mapInstance = map;
            if (onMapLoad) onMapLoad(map);
        } else if (window.mapInstance) {
            window.mapInstance.setCenter(center);
            window.mapInstance.setZoom(zoom);
        }
    }, [center, zoom, onMapLoad]);

    return <div ref={ref} id="map" style={{ height: '100%', width: '100%' }} />;
};

function CanvasLoader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="text-center text-white bg-black/50 p-4 rounded-lg flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                {progress > 0 && <p className="font-bold">{Math.round(progress)}% carregado</p>}
                {progress === 0 && <p className="font-bold">Iniciando...</p>}
            </div>
        </Html>
    );
}

const GeoMapViewer = ({ project, apiKey, show3DModel }) => {
    const { toast } = useToast();
    const [signedUrls, setSignedUrls] = useState({ model: null, material: null, textures: [] });
    const [loadingUrls, setLoadingUrls] = useState(false);

    useEffect(() => {
        const getUrls = async () => {
            if (!project || !project.solar_api_data?.model_path) return;

            setLoadingUrls(true);
            const modelPath = project.solar_api_data.model_path;
            
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

                if (!modelUrlData || modelUrlData.error) throw new Error('Não foi possível obter a URL para o modelo principal.');
                
                setSignedUrls({
                    model: modelUrlData.signedUrl,
                    material: materialUrlData ? materialUrlData.signedUrl : null,
                    textures: textureUrlsData
                });
            } catch (err) {
                toast({ variant: 'destructive', title: 'Erro de Carregamento', description: 'Não foi possível obter as URLs para o modelo 3D. ' + err.message });
            } finally {
                setLoadingUrls(false);
            }
        };

        if (show3DModel) {
            getUrls();
        } else {
            setSignedUrls({ model: null, material: null, textures: [] });
        }
    }, [project, show3DModel, toast]);

    const defaultCenter = { lat: -14.235, lng: -51.9253 };
    const projectCenter = project?.coordinates ? { lat: project.coordinates.lat, lng: project.coordinates.lng } : defaultCenter;
    const zoom = project?.coordinates ? 19 : 4;

    if (!apiKey) {
        return <div className="flex items-center justify-center h-full bg-slate-800 text-white">Por favor, configure sua chave de API do Google Maps.</div>;
    }

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <Wrapper apiKey={apiKey} libraries={['places']}>
                <MapComponent center={projectCenter} zoom={zoom} project={project} />
            </Wrapper>
            {show3DModel && signedUrls.model && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <Canvas
                        gl={{ antialias: true, alpha: true }}
                        camera={{ position: [0, 50, 50], fov: 50 }}
                        onCreated={({ gl }) => {
                            gl.domElement.style.pointerEvents = 'auto';
                        }}
                    >
                        <ambientLight intensity={1.5} />
                        <directionalLight position={[10, 20, 5]} intensity={2.5} />
                        <Suspense fallback={<CanvasLoader />}>
                            <ModelViewer
                                modelUrl={signedUrls.model}
                                materialUrl={signedUrls.material !== null ? signedUrls.material : false}
                                textureUrls={signedUrls.textures}
                                toast={toast}
                            />
                        </Suspense>
                        <OrbitControls makeDefault />
                    </Canvas>
                </div>
            )}
            {show3DModel && loadingUrls && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                 </div>
            )}
        </div>
    );
};

export default GeoMapViewer;