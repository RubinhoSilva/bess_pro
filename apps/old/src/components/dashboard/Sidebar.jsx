
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, RotateCcw, LogOut } from 'lucide-react';
import { useNewAuth } from '@/contexts/NewAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ navItems, activeView, setActiveView, onNewSimulation }) => {
    const { signOut } = useNewAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

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
    <aside className="w-64 bg-slate-800/50 backdrop-blur-lg border-r border-slate-700 flex flex-col p-4">
      <div className="flex items-center gap-3 mb-10 p-2">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">BESS Pro</h1>
      </div>
      <nav className="flex-1 flex flex-col">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <Button
                variant={activeView === item.id ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => setActiveView(item.id)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-auto space-y-2">
           <Button
            variant="outline"
            className="w-full justify-start gap-3 border-blue-500/50 text-blue-300 hover:bg-blue-500/10 hover:text-blue-200"
            onClick={onNewSimulation}
          >
            <RotateCcw className="w-5 h-5" />
            Nova Simulação
          </Button>
           <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            Sair
          </Button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
