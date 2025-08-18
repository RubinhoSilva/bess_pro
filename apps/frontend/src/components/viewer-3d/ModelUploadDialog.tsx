import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, FileUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ModelUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (url: string) => void;
}

export const ModelUploadDialog: React.FC<ModelUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['.gltf', '.glb'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      toast.error('Formato de arquivo não suportado. Use .gltf ou .glb');
      return;
    }

    setIsUploading(true);

    try {
      // Create a URL for the file (in a real app, you'd upload to a server)
      const fileUrl = URL.createObjectURL(file);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onUpload(fileUrl);
      toast.success('Modelo carregado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      toast.error('Erro ao carregar modelo 3D');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error('Por favor, insira uma URL válida');
      return;
    }

    try {
      new URL(urlInput); // Validate URL format
      onUpload(urlInput);
      toast.success('Modelo carregado com sucesso!');
      onClose();
      setUrlInput('');
    } catch {
      toast.error('URL inválida');
    }
  };

  const sampleModels = [
    {
      name: 'Casa Simples',
      url: '/models/simple-house.glb',
      description: 'Modelo básico de residência'
    },
    {
      name: 'Galpão Industrial',
      url: '/models/warehouse.glb',
      description: 'Estrutura industrial para análise'
    },
    {
      name: 'Telhado Complexo',
      url: '/models/complex-roof.glb',
      description: 'Telhado com múltiplas águas'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Carregar Modelo 3D
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="file" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">Arquivo</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="samples">Exemplos</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
              <FileUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Arraste um arquivo .gltf ou .glb aqui, ou clique para selecionar
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Selecionar Arquivo'
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".gltf,.glb"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
            <div className="text-xs text-slate-500">
              <strong>Formatos suportados:</strong> .gltf, .glb (recomendado)
              <br />
              <strong>Tamanho máximo:</strong> 50MB
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model-url">URL do Modelo 3D</Label>
              <Input
                id="model-url"
                type="url"
                placeholder="https://exemplo.com/modelo.glb"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleUrlSubmit}
              className="w-full"
            >
              <Link className="w-4 h-4 mr-2" />
              Carregar da URL
            </Button>
            <div className="text-xs text-slate-500">
              O modelo deve estar acessível publicamente via HTTPS
            </div>
          </TabsContent>

          <TabsContent value="samples" className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Experimente com estes modelos de exemplo:
            </p>
            <div className="grid gap-3">
              {sampleModels.map((model, index) => (
                <div 
                  key={index}
                  className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => {
                    onUpload(model.url);
                    onClose();
                  }}
                >
                  <div className="font-medium">{model.name}</div>
                  <div className="text-sm text-slate-500">{model.description}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};