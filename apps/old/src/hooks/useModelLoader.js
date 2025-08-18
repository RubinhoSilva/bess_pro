import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import * as THREE from 'three';

export const useModelLoader = (modelPath) => {
    const { toast } = useToast();
    const [signedUrls, setSignedUrls] = useState({ model: null, material: null, textures: [] });
    const [loadingUrl, setLoadingUrl] = useState(true);
    const [error, setError] = useState(null);
    const [modelLoaded, setModelLoaded] = useState(false);

    const handleModelReady = useCallback((isSuccess, model, center, setRotation, setGridPosition) => {
        if (isSuccess && model && center) {
            setModelLoaded(true);
            const euler = new THREE.Euler().setFromQuaternion(model.quaternion, 'XYZ');
            setRotation({
                x: THREE.MathUtils.radToDeg(euler.x),
                y: THREE.MathUtils.radToDeg(euler.y),
                z: THREE.MathUtils.radToDeg(euler.z),
            });
            setGridPosition(new THREE.Vector3(center.x, 0.01, center.z));
            toast({ title: 'Modelo 3D pronto!', description: 'Clique com o botão direito para ajustar a orientação.' });
        } else {
            setModelLoaded(false);
            setError("❗ Erro ao carregar o modelo. Verifique os arquivos.");
        }
    }, [toast]);

    useEffect(() => {
        const getUrls = async () => {
            if (!modelPath) {
                setLoadingUrl(false);
                return;
            }
            setLoadingUrl(true);
            setError(null);
            setModelLoaded(false);
            setSignedUrls({ model: null, material: null, textures: [] });

            try {
                const folderPath = modelPath.substring(0, modelPath.lastIndexOf('/'));
                const { data: fileList, error: listError } = await supabase.storage.from('besspro').list(folderPath);

                if (listError) throw listError;
                if (!fileList || fileList.length === 0) throw new Error(`Nenhum arquivo encontrado no caminho: ${folderPath}`);

                const mainModelFile = fileList.find(f => `${folderPath}/${f.name}` === modelPath);
                if (!mainModelFile) throw new Error("Arquivo do modelo principal não encontrado na pasta.");

                const pathsToSign = fileList.map(file => `${folderPath}/${file.name}`);
                const { data: signedUrlData, error: urlError } = await supabase.storage.from('besspro').createSignedUrls(pathsToSign, 3600);
                if (urlError) throw urlError;

                const modelUrlObject = signedUrlData.find(d => d.path === modelPath);
                if (!modelUrlObject || !modelUrlObject.signedUrl) throw new Error('Não foi possível obter a URL assinada para o modelo principal.');

                const mtlFile = fileList.find(f => f.name.toLowerCase().endsWith('.mtl'));
                const materialUrlObject = mtlFile ? signedUrlData.find(d => d.path === `${folderPath}/${mtlFile.name}`) : null;

                const textureFiles = fileList.filter(f => /\.(jpg|jpeg|png|gif|bmp|tga)$/i.test(f.name));
                const textureUrls = textureFiles.map(tf => {
                    const urlData = signedUrlData.find(d => d.path === `${folderPath}/${tf.name}`);
                    return { name: tf.name, signedUrl: urlData?.signedUrl };
                }).filter(t => t.signedUrl);

                setSignedUrls({
                    model: modelUrlObject.signedUrl,
                    material: materialUrlObject ? materialUrlObject.signedUrl : null,
                    textures: textureUrls
                });

            } catch (err) {
                const errorMessage = 'Não foi possível obter as URLs para o modelo. ' + err.message;
                setError(errorMessage);
                toast({ variant: 'destructive', title: 'Erro de Carregamento', description: errorMessage });
            } finally {
                setLoadingUrl(false);
            }
        };
        getUrls();
    }, [modelPath, toast]);

    return { signedUrls, loadingUrl, error, modelLoaded, handleModelReady, setError };
};