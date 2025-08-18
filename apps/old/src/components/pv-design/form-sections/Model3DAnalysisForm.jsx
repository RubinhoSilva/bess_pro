import React, { useState, useCallback, useEffect } from 'react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Box as Cube, Loader2, Trash2, DraftingCompass, Save, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LocationModal from './LocationModal';
import ModelUploader from './ModelUploader';
import SaveModelDialog from './SaveModelDialog';
import LoadModelDialog from './LoadModelDialog';
import { useProject } from '@/contexts/ProjectContext';

const Model3DAnalysisForm = ({ formData, onFormChange, onProjectUpdate }) => {
    const { toast } = useToast();
    const { user } = useNewAuth();
    const navigate = useNavigate();
    const { currentProject, isProjectSaved } = useProject();

    const [isUploading, setIsUploading] = useState(false);
    const [isOpeningViewer, setIsOpeningViewer] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveModelName, setSaveModelName] = useState('');
    const [saveModelDescription, setSaveModelDescription] = useState('');

    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [savedModels, setSavedModels] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isEditingModel, setIsEditingModel] = useState(false);

    useEffect(() => {
        const fetchSavedModels = async () => {
            if (!user || !currentProject.id) return;
            setIsLoadingModels(true);
            try {
                const { data, error } = await supabase
                    .from('models_3d')
                    .select('id, name, description, model_path, created_at')
                    .eq('user_id', user.id)
                    .eq('project_id', currentProject.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setSavedModels(data);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Erro ao Carregar Modelos",
                    description: `Não foi possível buscar seus modelos salvos: ${error.message}`,
                });
            } finally {
                setIsLoadingModels(false);
            }
        };

        if (isLoadModalOpen) {
            fetchSavedModels();
        }
    }, [isLoadModalOpen, user, toast, currentProject.id]);

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleUpload(Array.from(files));
        }
    };

    const handleOpenViewerClick = () => {
        if (formData.modelo3dUrl) {
            setIsLocationModalOpen(true);
        } else {
            toast({
                variant: "destructive",
                title: "Nenhum modelo selecionado",
                description: "Por favor, carregue ou selecione um modelo 3D primeiro.",
            });
        }
    };

    const handleLocationSelected = (updatedProject) => {
        setIsLocationModalOpen(false);
        setIsOpeningViewer(true);
        
        if (onProjectUpdate) {
            onProjectUpdate(updatedProject);
        }

        const modelUrl = formData.modelo3dUrl;
        const encodedUrl = btoa(modelUrl);
        const projectId = updatedProject.id;
        
        navigate(`/viewer-3d?model=${encodedUrl}&projectId=${projectId}`);
    };

    const handleUpload = useCallback(async (files) => {
        if (!isProjectSaved()) {
            toast({
                variant: 'destructive',
                title: 'Salve o Projeto Primeiro',
                description: 'É necessário salvar o projeto antes de carregar um modelo 3D.',
            });
            return;
        }

        if (files.length === 0 || !user) return;

        const modelFile = files.find(f => /\.(obj|gltf|glb|fbx)$/i.test(f.name));
        
        if (!modelFile) {
            toast({
                variant: 'destructive',
                title: 'Arquivo principal ausente',
                description: 'Por favor, selecione um arquivo .obj, .gltf, .glb ou .fbx.',
            });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const folderPath = `private/3d_models/${user.id}/${currentProject.id}/${uuidv4()}`;

        const filesToUpload = files.map(file => ({
            file,
            path: `${folderPath}/${file.name}`
        }));
        
        try {
            for (let i = 0; i < filesToUpload.length; i++) {
                const { file, path } = filesToUpload[i];
                const { error: uploadError } = await supabase.storage
                    .from('besspro')
                    .upload(path, file, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    throw new Error(`Falha no upload do arquivo ${file.name}: ${uploadError.message}`);
                }
                
                setUploadProgress(((i + 1) / filesToUpload.length) * 100);
            }

            const mainModelPath = `${folderPath}/${modelFile.name}`;

            onFormChange('modelo3dUrl', mainModelPath);
            setIsEditingModel(false);
            toast({
                title: 'Upload Concluído!',
                description: 'Seu modelo 3D e texturas foram carregados com sucesso.',
            });
        } catch (error) {
            console.error('Erro no upload do modelo 3D:', error);
            toast({
                variant: 'destructive',
                title: 'Erro no Upload',
                description: 'Não foi possível carregar o modelo. ' + error.message,
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, [user, onFormChange, toast, currentProject.id, isProjectSaved]);

    const handleRemoveModel = async () => {
        if (!formData.modelo3dUrl) return;
        
        try {
            const folderPath = formData.modelo3dUrl.substring(0, formData.modelo3dUrl.lastIndexOf('/'));
            const { data: fileList, error: listError } = await supabase.storage.from('besspro').list(folderPath);

            if (listError) throw listError;
            
            const filesToRemove = fileList.map(file => `${folderPath}/${file.name}`);

            if (filesToRemove.length > 0) {
                 const { error } = await supabase.storage.from('besspro').remove(filesToRemove);
                if (error) throw error;
            }

            onFormChange('modelo3dUrl', '');
            toast({ title: 'Modelo removido com sucesso.' });
        } catch(error) {
            console.error('Error removing model:', error);
            toast({ variant: 'destructive', title: 'Erro ao remover modelo.', description: error.message });
        }
    };

    const handleSaveModel = async () => {
        if (!saveModelName || !formData.modelo3dUrl) {
            toast({
                variant: "destructive",
                title: "Erro de Validação",
                description: "O nome do modelo é obrigatório.",
            });
            return;
        }
        if (!currentProject.id) {
            toast({
                variant: "destructive",
                title: "Projeto não salvo",
                description: "Salve o projeto antes de salvar um modelo.",
            });
            return;
        }
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('models_3d')
                .insert({
                    user_id: user.id,
                    project_id: currentProject.id,
                    name: saveModelName,
                    description: saveModelDescription,
                    model_path: formData.modelo3dUrl,
                });
            if (error) throw error;
            toast({
                title: "Sucesso!",
                description: "Seu modelo 3D foi salvo com sucesso.",
            });
            setIsSaveModalOpen(false);
            setSaveModelName('');
            setSaveModelDescription('');
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: `Não foi possível salvar o modelo: ${error.message}`,
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleLoadModel = (path) => {
        onFormChange('modelo3dUrl', path);
        setIsLoadModalOpen(false);
        setIsEditingModel(false);
        toast({
            title: "Modelo Carregado!",
            description: "O modelo 3D salvo foi carregado no projeto.",
        });
    };

    const filteredModels = savedModels.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="pt-4 space-y-4 border-t border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-200">Análise com Modelo 3D</h3>
            
            {(!formData.modelo3dUrl || isEditingModel) ? (
                <ModelUploader 
                    onFileChange={handleFileChange}
                    onOpenLoadDialog={() => setIsLoadModalOpen(true)}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    isEditing={isEditingModel}
                    onCancelEdit={() => setIsEditingModel(false)}
                />
            ) : (
                <div className="space-y-4">
                    <div className="p-3 bg-slate-800 rounded-lg flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Cube className="w-6 h-6 text-green-400" />
                         <p className="font-medium">Modelo 3D Carregado.</p>
                       </div>
                       <div className="flex items-center gap-2">
                           <Button variant="ghost" size="icon" onClick={() => setIsEditingModel(true)} title="Editar Modelo 3D">
                                <Edit className="w-4 h-4 text-slate-400 hover:text-white"/>
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => setIsSaveModalOpen(true)} title="Salvar Modelo na Biblioteca">
                               <Save className="w-4 h-4 text-blue-400 hover:text-blue-300"/>
                           </Button>
                           <Button variant="ghost" size="icon" onClick={handleRemoveModel} title="Remover Modelo do Projeto">
                               <Trash2 className="w-4 h-4 text-red-500 hover:text-red-400"/>
                           </Button>
                       </div>
                    </div>
                    <Button onClick={handleOpenViewerClick} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500" disabled={isOpeningViewer}>
                        {isOpeningViewer ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Abrindo...
                            </>
                        ) : (
                            <>
                                <DraftingCompass className="w-4 h-4 mr-2" />
                                Abrir Visualizador 3D
                            </>
                        )}
                    </Button>
                </div>
            )}

            {isLocationModalOpen && (
                <LocationModal
                    project={formData}
                    isOpen={isLocationModalOpen}
                    onClose={() => setIsLocationModalOpen(false)}
                    onConfirm={handleLocationSelected}
                />
            )}
             
            <SaveModelDialog 
                isOpen={isSaveModalOpen}
                onOpenChange={setIsSaveModalOpen}
                onSave={handleSaveModel}
                isSaving={isSaving}
                modelName={saveModelName}
                setModelName={setSaveModelName}
                modelDescription={saveModelDescription}
                setModelDescription={setSaveModelDescription}
            />

            <LoadModelDialog 
                isOpen={isLoadModalOpen}
                onOpenChange={setIsLoadModalOpen}
                isLoading={isLoadingModels}
                models={filteredModels}
                onSearch={(e) => setSearchTerm(e.target.value)}
                searchTerm={searchTerm}
                onLoad={handleLoadModel}
            />
        </div>
    );
};

export default Model3DAnalysisForm;