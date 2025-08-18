import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, PackageCheck } from 'lucide-react';

const LoadModelDialog = ({ isOpen, onOpenChange, isLoading, models, onSearch, searchTerm, onLoad }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Abrir Modelo 3D Salvo</DialogTitle>
                    <DialogDescription>Selecione um modelo da sua biblioteca para carregar no projeto.</DialogDescription>
                </DialogHeader>
                <div className="relative pt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Buscar por nome ou descrição..."
                        value={searchTerm}
                        onChange={onSearch}
                        className="pl-10 bg-slate-800 border-slate-600"
                    />
                </div>
                <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : models.length > 0 ? (
                        models.map(model => (
                            <div key={model.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <PackageCheck className="w-8 h-8 text-green-500" />
                                    <div>
                                        <p className="font-semibold text-white">{model.name}</p>
                                        <p className="text-sm text-slate-400">{model.description || "Sem descrição"}</p>
                                        <p className="text-xs text-slate-500">Salvo em: {new Date(model.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <Button onClick={() => onLoad(model.model_path)}>Carregar</Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <p>Nenhum modelo encontrado.</p>
                            {searchTerm && <p className="text-sm">Tente um termo de busca diferente.</p>}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LoadModelDialog;