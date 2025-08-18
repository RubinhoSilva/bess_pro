import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Save, Loader2, Info, CheckCircle, XCircle, Wand2 } from 'lucide-react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import GoogleSolarModal from './GoogleSolarModal';

const GoogleApiForm = ({ onFormChange, setFormData }) => {
    const { toast } = useToast();
    const { supabase, user } = useNewAuth();
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [message, setMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchApiKey = async () => {
            if (!user) return;
            setIsLoading(true);
            setMessage('');
            const { data, error } = await supabase
                .from('google_credentials')
                .select('client_id')
                .eq('user_id', user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') { // Ignore 'single row not found'
                toast({ variant: "destructive", title: "Erro ao buscar chave", description: "Não foi possível carregar sua chave de API." });
            } else if (data) {
                setApiKey(data.client_id);
            } else {
                setMessage("Nenhuma chave de API foi cadastrada ainda.");
            }
            setIsLoading(false);
        };
        fetchApiKey();
    }, [user, supabase, toast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !apiKey) return;

        setIsSaving(true);
        setMessage('');
        const { error } = await supabase.from('google_credentials').upsert({
            user_id: user.id,
            client_id: apiKey, // The column is client_id now
        }, { onConflict: 'user_id' });
        
        setIsSaving(false);

        if (error) {
            toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível salvar a chave de API." });
        } else {
            toast({ title: "Chave salva com sucesso!", description: "Agora seu projeto poderá usar a API Google Solar." });
        }
    };

    const handleTestKey = async () => {
        if (!apiKey) return;
        setIsTesting(true);
        try {
            const { data, error } = await supabase.functions.invoke('test-google-solar-api', {
                body: { apiKey },
            });

            if (error) throw error;

            if (data.valid) {
                toast({
                    title: "Chave Válida!",
                    description: "Sua chave de API foi validada com sucesso.",
                    className: "bg-green-500 text-white",
                    icon: <CheckCircle className="h-5 w-5" />,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Chave Inválida",
                    description: data.error?.message || "A chave de API não é válida ou não tem as permissões necessárias.",
                    icon: <XCircle className="h-5 w-5" />,
                });
            }
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Erro ao Testar",
                description: "Não foi possível conectar ao serviço de validação. Tente novamente.",
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleDataCollected = (data) => {
        setFormData(prev => ({ ...prev, googleSolarData: data }));
        onFormChange('googleSolarData', data);
        toast({ title: "Dados coletados!", description: "Os dados do Google Solar foram recebidos e adicionados ao formulário." });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
        );
    }
    
    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                {message && (
                    <div className="flex items-center gap-3 text-sm text-yellow-300 bg-yellow-900/30 border border-yellow-700/50 p-3 rounded-md">
                        <Info className="h-5 w-5 flex-shrink-0" />
                        <span>{message}</span>
                    </div>
                )}
                <div>
                    <Label htmlFor="google-api-key" className="text-white">Informe sua chave da API Google Solar</Label>
                    <Input
                        id="google-api-key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Cole sua chave de API aqui"
                    />
                </div>
                <div className="flex justify-between items-center gap-2">
                    <Button type="button" onClick={() => setIsModalOpen(true)} disabled={!apiKey}>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Dimensionar com Google
                    </Button>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleTestKey} disabled={!apiKey || isTesting}>
                            {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Testar Chave
                        </Button>
                        <Button type="submit" disabled={isSaving || !apiKey}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Chave
                        </Button>
                    </div>
                </div>
            </form>
            <GoogleSolarModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                apiKey={apiKey}
                onDataCollected={handleDataCollected}
            />
        </>
    );
};

export default GoogleApiForm;