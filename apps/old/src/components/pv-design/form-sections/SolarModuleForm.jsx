import React, { useState } from 'react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const SolarModuleForm = ({ isOpen, onClose, onSaveSuccess }) => {
    const { user } = useNewAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome_modulo: '',
        fabricante: '',
        potencia: '',
        comprimento: '',
        largura: '',
        eficiencia: '',
        vmpp: '',
        impp: '',
        peso: '',
        observacoes_tecnicas: ''
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para cadastrar um módulo.' });
            return;
        }

        setIsLoading(true);
        const { error } = await supabase
            .from('modulos_solares')
            .insert({ ...formData, user_id: user.id });

        setIsLoading(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
        } else {
            toast({ title: 'Sucesso!', description: 'Módulo solar cadastrado.' });
            setFormData({
                nome_modulo: '', fabricante: '', potencia: '', comprimento: '', largura: '',
                eficiencia: '', vmpp: '', impp: '', peso: '', observacoes_tecnicas: ''
            });
            onSaveSuccess();
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Módulo Solar</DialogTitle>
                    <DialogDescription>Preencha os dados técnicos do módulo.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome_modulo">Nome do Módulo</Label>
                            <Input id="nome_modulo" value={formData.nome_modulo} onChange={handleChange} required className="bg-slate-700 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fabricante">Fabricante</Label>
                            <Input id="fabricante" value={formData.fabricante} onChange={handleChange} className="bg-slate-700 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="potencia">Potência (W)</Label>
                            <Input id="potencia" type="number" value={formData.potencia} onChange={handleChange} required className="bg-slate-700 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="eficiencia">Eficiência (%)</Label>
                            <Input id="eficiencia" type="number" step="0.01" value={formData.eficiencia} onChange={handleChange} className="bg-slate-700 border-slate-600" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="comprimento">Comprimento (mm)</Label>
                            <Input id="comprimento" type="number" value={formData.comprimento} onChange={handleChange} className="bg-slate-700 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="largura">Largura (mm)</Label>
                            <Input id="largura" type="number" value={formData.largura} onChange={handleChange} className="bg-slate-700 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vmpp">Vmpp (V)</Label>
                            <Input id="vmpp" type="number" step="0.01" value={formData.vmpp} onChange={handleChange} className="bg-slate-700 border-slate-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="impp">Impp (A)</Label>
                            <Input id="impp" type="number" step="0.01" value={formData.impp} onChange={handleChange} className="bg-slate-700 border-slate-600" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="peso">Peso (kg)</Label>
                            <Input id="peso" type="number" step="0.01" value={formData.peso} onChange={handleChange} className="bg-slate-700 border-slate-600" />
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                            <Label htmlFor="observacoes_tecnicas">Observações Técnicas</Label>
                            <Textarea id="observacoes_tecnicas" value={formData.observacoes_tecnicas} onChange={handleChange} className="bg-slate-700 border-slate-600" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Módulo
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default SolarModuleForm;