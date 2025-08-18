import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Settings, FileText, BarChart, DollarSign, ArrowLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

const initialSettings = {
    show_introduction: true,
    show_technical_analysis: true,
    show_financial_analysis: true,
    show_cover_page: true,
    show_solar_advantages: true,
    show_technical_summary: true,
    show_equipment_details: true,
    show_generation_projection: true,
    show_investment_details: true,
    show_financial_indicators: true,
    show_payment_conditions: true,
};

const ProposalSettingsPage = () => {
    const { user, supabase, loading: authLoading } = useNewAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [settings, setSettings] = useState(initialSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('proposal_settings')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            toast({ variant: 'destructive', title: 'Erro ao carregar configurações', description: error.message });
        } else if (data) {
            setSettings(prev => ({ ...prev, ...data }));
        }
        setLoading(false);
    }, [user, supabase, toast]);

    useEffect(() => {
        if (!authLoading) {
            fetchSettings();
        }
    }, [authLoading, fetchSettings]);

    const handleToggle = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        
        const settingsToSave = { ...settings };
        delete settingsToSave.id;
        delete settingsToSave.created_at;

        const { error } = await supabase
            .from('proposal_settings')
            .upsert({ 
                user_id: user.id, 
                ...settingsToSave,
                updated_at: new Date().toISOString(),
             }, { onConflict: 'user_id' });

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
        } else {
            toast({ title: 'Sucesso!', description: 'Configurações da proposta salvas.' });
        }
        setSaving(false);
    };

    if (authLoading || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-900">
                <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen w-full bg-slate-900 pt-24 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl mx-auto px-4"
                >
                    <Card className="bg-slate-800/50 border-slate-700 text-white">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Settings className="w-8 h-8 text-blue-400" />
                                <div>
                                    <CardTitle className="text-3xl">Configurar Proposta</CardTitle>
                                    <CardDescription>Escolha quais seções e subseções incluir nas suas propostas.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <SectionConfigurator
                                title="Introdução e Vantagens"
                                description="Capa, vantagens da energia solar, etc."
                                icon={<FileText className="w-5 h-5 text-purple-400" />}
                                modalTitle="Configurar Seção: Introdução"
                                modalDescription="Habilite ou desabilite os componentes da introdução da proposta."
                            >
                                <SubSettingItem id="show_cover_page" label="Mostrar Página de Capa" checked={settings.show_cover_page} onToggle={(val) => handleToggle('show_cover_page', val)} />
                                <SubSettingItem id="show_solar_advantages" label="Mostrar Vantagens da Energia Solar" checked={settings.show_solar_advantages} onToggle={(val) => handleToggle('show_solar_advantages', val)} />
                            </SectionConfigurator>

                            <SectionConfigurator
                                title="Análise Técnica"
                                description="Dimensionamento, equipamentos, geração."
                                icon={<BarChart className="w-5 h-5 text-yellow-400" />}
                                modalTitle="Configurar Seção: Análise Técnica"
                                modalDescription="Habilite ou desabilite os componentes da análise técnica."
                            >
                                <SubSettingItem id="show_technical_summary" label="Mostrar Resumo Técnico" checked={settings.show_technical_summary} onToggle={(val) => handleToggle('show_technical_summary', val)} />
                                <SubSettingItem id="show_equipment_details" label="Mostrar Detalhes dos Equipamentos" checked={settings.show_equipment_details} onToggle={(val) => handleToggle('show_equipment_details', val)} />
                                <SubSettingItem id="show_generation_projection" label="Mostrar Projeção de Geração" checked={settings.show_generation_projection} onToggle={(val) => handleToggle('show_generation_projection', val)} />
                            </SectionConfigurator>

                            <SectionConfigurator
                                title="Análise Financeira"
                                description="Investimento, indicadores, pagamentos."
                                icon={<DollarSign className="w-5 h-5 text-green-400" />}
                                modalTitle="Configurar Seção: Análise Financeira"
                                modalDescription="Habilite ou desabilite os componentes da análise financeira."
                            >
                                <SubSettingItem id="show_investment_details" label="Mostrar Detalhes do Investimento" checked={settings.show_investment_details} onToggle={(val) => handleToggle('show_investment_details', val)} />
                                <SubSettingItem id="show_financial_indicators" label="Mostrar Indicadores Financeiros (VPL, TIR, Payback)" checked={settings.show_financial_indicators} onToggle={(val) => handleToggle('show_financial_indicators', val)} />
                                <SubSettingItem id="show_payment_conditions" label="Mostrar Condições de Pagamento" checked={settings.show_payment_conditions} onToggle={(val) => handleToggle('show_payment_conditions', val)} />
                            </SectionConfigurator>

                            <div className="flex justify-end pt-4 gap-4">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)} size="lg" className="bg-transparent hover:bg-slate-700 border-slate-600 text-white">
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    Voltar
                                </Button>
                                <Button onClick={handleSave} disabled={saving} size="lg" className="bg-blue-600 hover:bg-blue-700">
                                    {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                    Salvar Configurações
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

const SectionConfigurator = ({ icon, title, description, modalTitle, modalDescription, children }) => (
    <Dialog>
        <DialogTrigger asChild>
            <button
                type="button"
                className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border border-slate-600 hover:bg-slate-700 transition-colors duration-200 text-left"
            >
                <div className="flex items-start gap-4">
                    {icon}
                    <div>
                        <p className="text-lg font-semibold">{title}</p>
                        <p className="text-sm text-slate-400">{description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <Settings className="w-4 h-4" />
                    <ChevronRight className="w-5 h-5" />
                </div>
            </button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
                <DialogTitle>{modalTitle}</DialogTitle>
                <DialogDescription>{modalDescription}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                {children}
            </div>
            <DialogFooter>
                <Button onClick={() => {}} className="bg-blue-600 hover:bg-blue-700">Fechar</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

const SubSettingItem = ({ id, label, checked, onToggle }) => (
    <div className="flex items-center justify-between p-3 rounded-md bg-slate-700/50">
        <Label htmlFor={id} className="cursor-pointer">{label}</Label>
        <Switch id={id} checked={checked} onCheckedChange={onToggle} />
    </div>
);

export default ProposalSettingsPage;