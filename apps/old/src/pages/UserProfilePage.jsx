import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, Upload, UserCog, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isEqual } from 'lodash';

const UserProfilePage = () => {
    const { user, profile, supabase, refreshProfile, loading: authLoading } = useNewAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '', company: '', cnpj: '', address: '', city: '',
        state: '', phone: '', email: '', website: '', logo_url: '',
    });
    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isExitAlertOpen, setIsExitAlertOpen] = useState(false);

    const initialFormData = useRef(null);

    useEffect(() => {
        if (profile) {
            const initialData = {
                name: profile.name || '',
                company: profile.company || '',
                cnpj: profile.cnpj || '',
                address: profile.address || '',
                city: profile.city || '',
                state: profile.state || '',
                phone: profile.phone || '',
                email: profile.email || user?.email || '',
                website: profile.website || '',
                logo_url: profile.logo_url || '',
            };
            setFormData(initialData);
            initialFormData.current = initialData;
            if (profile.logo_url) {
                setPreviewUrl(profile.logo_url);
            }
        } else if (user) {
            const initialData = { ...formData, email: user.email };
            setFormData(initialData);
            initialFormData.current = initialData;
        }
    }, [profile, user]);

    useEffect(() => {
        if (initialFormData.current) {
            const changed = !isEqual(initialFormData.current, formData) || logoFile !== null;
            setHasUnsavedChanges(changed);
        }
    }, [formData, logoFile]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const resetUnsavedChanges = (newProfileData) => {
        initialFormData.current = newProfileData;
        setLogoFile(null);
        setHasUnsavedChanges(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        let newLogoUrl = formData.logo_url;

        if (logoFile) {
            const fileExt = logoFile.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, logoFile, { cacheControl: '3600', upsert: true });

            if (uploadError) {
                toast({ variant: 'destructive', title: 'Erro no Upload', description: uploadError.message });
                setLoading(false);
                return;
            }

            const { data: urlData } = supabase.storage.from('logos').getPublicUrl(filePath);
            newLogoUrl = urlData.publicUrl;
        }

        const profileData = {
            id: user.id,
            name: formData.name,
            company: formData.company,
            cnpj: formData.cnpj,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            logo_url: newLogoUrl,
            updated_at: new Date(),
        };

        const { error } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao Salvar', description: error.message });
        } else {
            toast({ title: 'Sucesso!', description: 'Seu perfil foi atualizado.' });
            await refreshProfile();
            const updatedProfileData = { ...formData, logo_url: newLogoUrl };
            resetUnsavedChanges(updatedProfileData);
        }
        setLoading(false);
    };

    const handleExit = () => {
        if (hasUnsavedChanges) {
            setIsExitAlertOpen(true);
        } else {
            navigate(-1);
        }
    };

    if (authLoading && !profile) {
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
                    className="max-w-4xl mx-auto px-4"
                >
                    <Card className="bg-slate-800/50 border-slate-700 text-white">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <UserCog className="w-8 h-8 text-blue-400" />
                                <div>
                                    <CardTitle className="text-3xl">Meu Perfil</CardTitle>
                                    <CardDescription>Atualize suas informações pessoais e da empresa.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-1 flex flex-col items-center space-y-4 pt-6">
                                    <Label>Logotipo da Empresa</Label>
                                    <div className="w-48 h-32 rounded-lg bg-white flex items-center justify-center overflow-hidden border-2 border-slate-600 p-1">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview do logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <Upload className="w-16 h-16 text-slate-500" />
                                        )}
                                    </div>
                                    <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                        <label htmlFor="logo-upload" className="cursor-pointer">
                                            <Upload className="w-4 h-4 mr-2" />
                                            Trocar Logo
                                            <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </label>
                                    </Button>
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Seu Nome</Label>
                                            <Input id="name" value={formData.name} onChange={handleInputChange} className="bg-white/10 border-white/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">E-mail</Label>
                                            <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-white/10 border-white/20" />
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="phone">Telefone</Label>
                                            <Input id="phone" value={formData.phone} onChange={handleInputChange} className="bg-white/10 border-white/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Site</Label>
                                            <Input id="website" value={formData.website} onChange={handleInputChange} className="bg-white/10 border-white/20" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="company">Nome da Empresa</Label>
                                            <Input id="company" value={formData.company} onChange={handleInputChange} className="bg-white/10 border-white/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cnpj">CNPJ</Label>
                                            <Input id="cnpj" value={formData.cnpj} onChange={handleInputChange} className="bg-white/10 border-white/20" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Endereço (Rua, Número, Bairro)</Label>
                                        <Input id="address" value={formData.address} onChange={handleInputChange} className="bg-white/10 border-white/20" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">Cidade</Label>
                                            <Input id="city" value={formData.city} onChange={handleInputChange} className="bg-white/10 border-white/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">Estado</Label>
                                            <Input id="state" value={formData.state} onChange={handleInputChange} className="bg-white/10 border-white/20" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4 gap-4">
                                        <Button type="button" variant="outline" onClick={handleExit} size="lg" className="bg-transparent hover:bg-slate-700 border-slate-600 text-white">
                                            <ArrowLeft className="w-5 h-5 mr-2" />
                                            Voltar
                                        </Button>
                                        <Button type="submit" disabled={loading || !hasUnsavedChanges} size="lg" className="bg-blue-600 hover:bg-blue-700">
                                            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                            Salvar Alterações
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
            <AlertDialog open={isExitAlertOpen} onOpenChange={setIsExitAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você tem alterações que não foram salvas. Tem certeza que deseja sair?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700">Continuar Editando</AlertDialogCancel>
                        <AlertDialogAction onClick={() => navigate(-1)} className="bg-red-600 hover:bg-red-700">Sair sem Salvar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default UserProfilePage;