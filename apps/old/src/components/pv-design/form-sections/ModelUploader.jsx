import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Box as Cube, FolderOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ModelUploader = ({ onFileChange, onOpenLoadDialog, isUploading, uploadProgress, isEditing, onCancelEdit }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                    <Label htmlFor="model-upload">Carregar Novo Modelo</Label>
                    <div className="relative flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <Cube className="mx-auto h-12 w-12 text-slate-400" />
                        <p className="mt-2 text-sm text-slate-400">Arraste ou clique para carregar .obj, .gltf, .glb, .fbx.</p>
                        <Input id="model-upload" type="file" accept=".obj,.mtl,.gltf,.glb,.fbx,.jpg,.jpeg,.png" onChange={onFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading} multiple />
                    </div>
                </div>
                <div className="flex flex-col space-y-2">
                    <Label htmlFor="open-saved-model">Abrir Modelo Salvo</Label>
                    <Button id="open-saved-model" variant="outline" className="flex-1 border-slate-600 bg-slate-800 hover:bg-slate-700" onClick={onOpenLoadDialog}>
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-300">
                            <FolderOpen className="w-12 h-12" />
                            <span>Abrir Modelo 3D Salvo</span>
                        </div>
                    </Button>
                </div>
            </div>
            {isUploading && (
                <div className="w-full mt-2">
                    <div className="flex items-center text-sm text-blue-400 mb-1">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando modelo... ({Math.round(uploadProgress)}%)
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <motion.div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>
            )}
            {isEditing && (
                <Button variant="link" onClick={onCancelEdit}>Cancelar Edição</Button>
            )}
        </div>
    );
};

export default ModelUploader;