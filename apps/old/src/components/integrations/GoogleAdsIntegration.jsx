import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Save, Loader2, Link, Info, CheckCircle, XCircle } from 'lucide-react';
import { useNewAuth } from '@/contexts/NewAuthContext';

const GoogleAdsIntegration = () => {
    const { toast } = useToast();
    const { supabase, user } = useNewAuth();
    const [credentials, setCredentials] = useState({ client_id: '', client_secret: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const fetchCredentials = async () => {
            if (!user) return;
            setIsLoading(true);
            
            const { data, error } = await supabase
                .from('google_credentials')
                .select('client_id, client_secret, refresh_token')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setCredentials({ client_id: data.client_id || '', client_secret: data.client_secret || '' });
                if (data.refresh_token) {
                    setIsConnected(true);
                }
            }
            
            setIsLoading(false);
        };
        fetchCredentials();
    }, [user, supabase]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setCredentials(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        
        const { error } = await supabase
            .from('google_credentials')
            .upsert({
                user_id: user.id,
                client_id: credentials.client_id,
                client_secret: credentials.client_secret,
            }, { onConflict: 'user_id' });

        setIsSaving(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível salvar as credenciais.' });
        } else {
            toast({ title: 'Credenciais salvas!', description: 'Pronto para conectar com o Google Ads.' });
        }
    };

    const handleConnect = () => {
        toast({
            title: '🚧 Em Desenvolvimento',
            description: "A conexão com o Google Ads será implementada em breve!",
        });
        // In a future step, this would initiate the OAuth2 flow.
        // For example: `window.location.href = getGoogleAuthUrl();`
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
        );
    }

    return (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <img src="https://www.gstatic.com/images/branding/product/1x/ads_48dp.png" alt="Google Ads" className="w-10 h-10" />
                    <div>
                        <CardTitle className="text-white text-2xl">Google Ads</CardTitle>
                        <CardDescription>Importe leads automaticamente das suas campanhas.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-3 text-sm text-blue-300 bg-blue-900/30 border border-blue-700/50 p-3 rounded-md">
                    <Info className="h-5 w-5 flex-shrink-0" />
                    <span>Para obter suas credenciais, crie um projeto no <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google Cloud Console</a>, ative a API do Google Ads e crie credenciais OAuth 2.0.</span>
                </div>
                
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="client_id">Client ID</Label>
                        <Input id="client_id" value={credentials.client_id} onChange={handleInputChange} className="bg-white/10 border-white/20" placeholder="Cole seu Client ID aqui" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client_secret">Client Secret</Label>
                        <Input id="client_secret" type="password" value={credentials.client_secret} onChange={handleInputChange} className="bg-white/10 border-white/20" placeholder="Cole seu Client Secret aqui" />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Credenciais
                        </Button>
                    </div>
                </form>

                <div className="border-t border-slate-700 pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-lg">Status da Conexão</h4>
                            {isConnected ? (
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Conectado</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-yellow-400">
                                    <XCircle className="w-5 h-5" />
                                    <span>Não Conectado</span>
                                </div>
                            )}
                        </div>
                        <Button onClick={handleConnect} disabled={!credentials.client_id || !credentials.client_secret}>
                           <Link className="w-4 h-4 mr-2" />
                            {isConnected ? 'Reconectar' : 'Conectar com Google Ads'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GoogleAdsIntegration;