import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PlusCircle, Edit, Trash2, Upload, UserCog, Search, KeyRound, Loader2 } from 'lucide-react';

const UserManagementPage = () => {
    const { toast } = useToast();
    const { supabase } = useAuth();
    const [users, setUsers] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar usuários', description: error.message });
        } else {
            setUsers(data);
        }
        setLoading(false);
    }, [toast, supabase]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers, isDialogOpen]);

    const handleDeleteUser = async (userId) => {
        toast({
            title: 'Funcionalidade restrita',
            description: 'A exclusão de usuários deve ser feita por um administrador no painel do Supabase para garantir a integridade dos dados.',
            variant: 'destructive'
        });
    };

    const openUserForm = (user = null) => {
        setCurrentUser(user);
        setIsDialogOpen(true);
    };

    const filteredUsers = users.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen w-full bg-slate-900">
            <Header />
            <main className="pt-20">
                <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
                    >
                        <div>
                            <h1 className="text-4xl font-bold text-white flex items-center gap-3"><UserCog /> Gestão de Usuários</h1>
                            <p className="text-slate-300 mt-2">Adicione, edite e gerencie os usuários da plataforma.</p>
                        </div>
                        <Button onClick={() => openUserForm()} size="lg" className="mt-4 sm:mt-0 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                            <PlusCircle className="w-5 h-5 mr-2" /> Adicionar Usuário
                        </Button>
                    </motion.div>

                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-slate-800 border-slate-700"
                        />
                    </div>
                    
                    {loading ? (
                         <div className="flex justify-center items-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUsers.map(user => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="bg-slate-800/50 border-slate-700 h-full flex flex-col">
                                        <CardHeader>
                                            <div className="flex items-center gap-4">
                                                <img className="w-16 h-16 rounded-full bg-slate-700 object-cover" alt={`Logo for ${user.company || user.name}`} src={user.logo_url || `https://ui-avatars.com/api/?name=${user.name || 'A'}&background=random`} />
                                                <div>
                                                    <CardTitle className="text-lg text-amber-300">{user.name || 'Nome não definido'}</CardTitle>
                                                    <p className="text-sm text-slate-400">{user.company}</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow flex flex-col justify-between">
                                            <div>
                                                <p className="text-sm text-slate-300">{user.email}</p>
                                                <p className="text-sm text-slate-400 capitalize mt-1">Cargo: {user.role || 'Não definido'}</p>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <Button variant="outline" size="sm" className="w-full" onClick={() => openUserForm(user)}><Edit className="w-4 h-4 mr-2" /> Editar</Button>
                                                <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeleteUser(user.id)}><Trash2 className="w-4 h-4 mr-2" /> Deletar</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                    {!loading && filteredUsers.length === 0 && (
                        <p className="text-center p-8 text-slate-400">Nenhum usuário encontrado.</p>
                    )}
                </div>
            </main>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{currentUser ? 'Editar' : 'Adicionar'} Usuário</DialogTitle>
                    </DialogHeader>
                    <UserForm
                        user={currentUser}
                        onClose={() => {
                            setIsDialogOpen(false);
                            setCurrentUser(null);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

const UserForm = ({ user, onClose }) => {
    const { toast } = useToast();
    const { signUp, supabase } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '', name: '', company: '', role: 'vendedor', logo_url: '' });
    const [logoFile, setLogoFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                password: '',
                name: user.name || '',
                company: user.company || '',
                role: user.role || 'vendedor',
                logo_url: user.logo_url || ''
            });
        } else {
             setFormData({ email: '', password: '', name: '', company: '', role: 'vendedor', logo_url: '' });
        }
    }, [user]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
        }
    };

    const handleUpload = async () => {
        if (!logoFile) return formData.logo_url || null;
        if (!supabase) return null;
        setIsUploading(true);
        const fileName = `${Date.now()}_${logoFile.name}`;
        const { data, error } = await supabase.storage.from('logos').upload(fileName, logoFile);
        setIsUploading(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro no Upload', description: error.message });
            return null;
        }
        const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
        return publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const logoUrl = await handleUpload();
        if (logoFile && !logoUrl) {
            setIsLoading(false);
            return;
        }

        const dataToSave = { ...formData, logo_url: logoUrl };

        if (user) {
            const { error } = await supabase.from('profiles').update({
                name: dataToSave.name,
                company: dataToSave.company,
                role: dataToSave.role,
                logo_url: dataToSave.logo_url,
            }).eq('id', user.id);

            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
            } else {
                toast({ title: 'Sucesso!', description: 'Usuário atualizado.' });
                onClose();
            }
        } else {
            if (!formData.email || !formData.password) {
                toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Email e senha são necessários para criar um novo usuário.' });
                setIsLoading(false);
                return;
            }
            
            const { error } = await signUp(formData.email, formData.password, {
                name: formData.name,
                company: formData.company,
                role: formData.role,
                logo_url: logoUrl
            });

            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao criar usuário', description: error.message });
            } else {
                toast({ title: 'Sucesso!', description: 'Usuário criado. Um e-mail de confirmação foi enviado.' });
                onClose();
            }
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {!user && (
                 <>
                    <div className="space-y-2">
                        <label htmlFor="email">Email</label>
                        <Input id="email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className="bg-slate-700 border-slate-600" required />
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="password">Senha</label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input id="password" type="password" placeholder="Crie uma senha para o usuário" value={formData.password} onChange={e => handleChange('password', e.target.value)} className="bg-slate-700 border-slate-600 pl-10" required />
                        </div>
                    </div>
                 </>
            )}
            <div className="space-y-2">
                <label htmlFor="name">Nome</label>
                <Input id="name" value={formData.name} onChange={e => handleChange('name', e.target.value)} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
                <label htmlFor="company">Empresa</label>
                <Input id="company" value={formData.company} onChange={e => handleChange('company', e.target.value)} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
                <label htmlFor="role">Cargo</label>
                <select id="role" value={formData.role} onChange={e => handleChange('role', e.target.value)} className="w-full p-2 rounded bg-slate-700 border-slate-600">
                    <option value="vendedor">Vendedor</option>
                    <option value="diretor">Diretor</option>
                    <option value="gestor">Gestor</option>
                </select>
            </div>
            <div className="space-y-2">
                <label htmlFor="logo">Logo da Empresa</label>
                <Input id="logo" type="file" onChange={handleFileChange} className="bg-slate-700 border-slate-600 file:text-white" />
                {isUploading && <p className="text-xs text-amber-400">Enviando logo...</p>}
                {formData.logo_url && !logoFile && <img src={formData.logo_url} alt="Logo atual" className="w-20 h-20 mt-2 rounded object-cover" />}
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={isUploading || isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
            </div>
        </form>
    );
};

export default UserManagementPage;