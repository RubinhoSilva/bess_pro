import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const EditAreaDialog = ({ area, isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (area) {
            setName(area.nome);
        }
    }, [area]);

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsLoading(true);
        await onSave(area.id, name);
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle>Editar Nome da Área</DialogTitle>
                    <DialogDescription>
                        Dê um nome descritivo para esta área de montagem.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="area-name">Nome da Área</Label>
                    <Input
                        id="area-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-slate-700 border-slate-600 mt-2"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditAreaDialog;