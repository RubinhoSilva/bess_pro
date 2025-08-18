import React, { useState, useEffect } from 'react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const LeadAlertForm = ({ lead, onClose }) => {
    const { user, supabase } = useNewAuth();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        alert_date: format(new Date(), "yyyy-MM-dd"),
        alert_time: format(new Date(), "HH:mm"),
        message: '',
    });
    const [loading, setLoading] = useState(false);
    
    if (!lead) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <p>Carregando dados do lead...</p>
            </div>
        );
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!supabase || !user || !lead) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação ou dados' });
            return;
        }
        setLoading(true);

        const alertDateTime = new Date(`${formData.alert_date}T${formData.alert_time}`);

        const dataToSave = {
            user_id: user.id,
            lead_id: lead.id,
            alert_time: alertDateTime.toISOString(),
            message: formData.message,
        };
        
        try {
            const { error } = await supabase.from('alerts').insert(dataToSave);
            if (error) throw error;
            
            toast({
                title: 'Sucesso!',
                description: 'Alerta criado com sucesso.',
            });
            onClose();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Erro ao criar alerta',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <div>
                <p className="text-lg font-semibold text-purple-300">{lead.name}</p>
                <p className="text-sm text-slate-400">Criar um lembrete para este lead.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="alert_date">Data do Alerta</Label>
                    <Input id="alert_date" type="date" value={formData.alert_date} onChange={e => handleChange('alert_date', e.target.value)} required className="bg-slate-700 border-slate-600" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="alert_time">Hora do Alerta</Label>
                    <Input id="alert_time" type="time" value={formData.alert_time} onChange={e => handleChange('alert_time', e.target.value)} required className="bg-slate-700 border-slate-600" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="message">Mensagem / Observação</Label>
                <Textarea id="message" value={formData.message} onChange={e => handleChange('message', e.target.value)} required placeholder="Ex: Ligar para discutir a proposta" className="bg-slate-700 border-slate-600" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Alerta
                </Button>
            </div>
        </form>
    );
};

export default LeadAlertForm;