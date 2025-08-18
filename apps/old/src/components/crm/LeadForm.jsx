import React, { useState, useEffect } from 'react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const LeadForm = ({ lead, onClose, isCustomerForm = false }) => {
    const { user, supabase } = useNewAuth();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        company: '',
        client_type: 'B',
        stage: 'lead-recebido',
        responsible_id: '',
        tags: '',
        notes: '',
        energyBill: null
    });
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (lead) {
            setFormData({ 
                ...lead, 
                tags: lead.tags?.join(', ') || '' 
            });
        } else if (user) {
            setFormData(prev => ({ ...prev, responsible_id: user.id, stage: 'lead-recebido' }));
        }

        const fetchTeam = async () => {
            if (!supabase) return;
            // In a real app, team members would be fetched from the profiles table
            // For now, we'll just use the current user and placeholder
            if(user) {
                setTeam([{ id: user.id, name: user.email }]);
            }
        };

        fetchTeam();
    }, [lead, user, supabase]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleChange('energyBill', file);
            toast({ title: "Arquivo selecionado!", description: `${file.name}. O upload real ocorrerá ao salvar.` });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!supabase || !user) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação' });
            return;
        }
        setLoading(true);

        const { energyBill, ...leadData } = formData;
        
        // Remove id if it's not a valid UUID, for new leads
        if (leadData.id && typeof leadData.id !== 'string') {
            delete leadData.id;
        }

        const dataToSave = {
            ...leadData,
            user_id: user.id,
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        };
        
        try {
            let error;
            if (lead?.id) {
                // Update existing lead
                const { error: updateError } = await supabase
                    .from('leads')
                    .update(dataToSave)
                    .eq('id', lead.id);
                error = updateError;
            } else {
                // Create new lead
                const { error: insertError } = await supabase
                    .from('leads')
                    .insert(dataToSave);
                error = insertError;
            }

            if (error) throw error;
            
            toast({
                title: 'Sucesso!',
                description: `Lead ${lead?.id ? 'atualizado' : 'criado'} com sucesso.`,
            });
            onClose();

        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Erro ao salvar lead',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className="bg-slate-700 border-slate-600" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="company">Empresa (opcional)</Label>
                    <Input id="company" value={formData.company} onChange={e => handleChange('company', e.target.value)} className="bg-slate-700 border-slate-600" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className="bg-slate-700 border-slate-600" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} className="bg-slate-700 border-slate-600" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" value={formData.address} onChange={e => handleChange('address', e.target.value)} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="client_type">Tipo de Cliente</Label>
                    <Select value={formData.client_type} onValueChange={v => handleChange('client_type', v)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="A">Grupo A</SelectItem><SelectItem value="B">Grupo B</SelectItem></SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="responsible_id">Responsável</Label>
                     <Select value={formData.responsible_id} onValueChange={v => handleChange('responsible_id', v)} disabled={!user || user.role !== 'diretor'}>
                        <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Selecione um vendedor" /></SelectTrigger>
                        <SelectContent>
                            {user && <SelectItem value={user.id}>{user.email} (Eu)</SelectItem>}
                            {team.filter(t => user && t.id !== user.id).map(member => (
                                <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="energy-bill">Conta de Luz</Label>
                <Input id="energy-bill" type="file" onChange={handleFileChange} className="bg-slate-700 border-slate-600 file:text-white" />
                {formData.energyBill && typeof formData.energyBill === 'object' && <p className="text-xs text-slate-400">Arquivo selecionado: {formData.energyBill.name}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input id="tags" value={formData.tags} onChange={e => handleChange('tags', e.target.value)} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button type="submit" disabled={loading || !supabase}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                </Button>
            </div>
        </form>
    );
};

export default LeadForm;