
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle, Zap, LayoutDashboard, UserCog, Settings, Gem, Braces } from 'lucide-react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
    const { session, signOut, profile } = useNewAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const userName = profile?.name || session?.user?.email || 'Usuário';
    const userInitial = userName.charAt(0).toUpperCase();

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/bem-vindo');
        } catch (error) {
            console.error('Erro ao sair:', error.message);
            toast({
                variant: "destructive",
                title: "Erro ao Sair",
                description: "Não foi possível encerrar a sessão. Tentando redirecionar.",
            });
            navigate('/bem-vindo');
        }
    };

    return (
        <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-lg border-b border-slate-700"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                         <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/select-service')}>
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white hidden sm:block">BESS Pro</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Button onClick={() => navigate('/crm')} variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-700/50 hover:text-white hidden sm:flex items-center">
                           <LayoutDashboard className="mr-2 w-4 h-4" />
                            CRM
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 focus-visible:ring-0 focus-visible:ring-offset-0">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={profile?.logo_url} alt={userName} className="bg-white object-contain" />
                                        <AvatarFallback className="bg-slate-700 text-white">{userInitial}</AvatarFallback>
                                    </Avatar>
                                   <span className="text-white font-medium hidden md:inline">{userName}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-white">
                                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                <DropdownMenuItem onSelect={() => navigate('/profile')} className="cursor-pointer focus:bg-slate-700">
                                    <UserCog className="mr-2 h-4 w-4" />
                                    <span>Meu Perfil</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => navigate('/proposal-settings')} className="cursor-pointer focus:bg-slate-700">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Configurar Proposta</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => navigate('/integrations')} className="cursor-pointer focus:bg-slate-700">
                                    <Braces className="mr-2 h-4 w-4" />
                                    <span>Integrações</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => navigate('/subscription')} className="cursor-pointer focus:bg-slate-700">
                                    <Gem className="mr-2 h-4 w-4 text-blue-400" />
                                    <span>Meu Plano / Assinatura</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                <DropdownMenuItem onSelect={handleSignOut} className="text-red-400 focus:bg-red-500/20 focus:text-red-300 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sair</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};

export default Header;
