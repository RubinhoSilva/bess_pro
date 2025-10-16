import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  BarChart3, 
  Users, 
  Briefcase,
  Calendar,
  Star,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../hooks/auth-hooks';

const services = [
  {
    title: 'Dimensionamento FV',
    description: 'Calcule e dimensione sistemas fotovoltaicos com precisão.',
    icon: <Zap className="w-10 h-10 text-yellow-400" />,
    path: '/dashboard/pv-design',
    color: 'hover:border-yellow-400/50',
    gradient: 'from-yellow-500/20 to-orange-500/20',
  },
  {
    title: 'CRM de Vendas',
    description: 'Gerencie seu funil de vendas e leads de forma integrada.',
    icon: <Briefcase className="w-10 h-10 text-blue-400" />,
    path: '/dashboard/crm',
    color: 'hover:border-blue-400/50',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    title: 'Gestão de Clientes',
    description: 'Acesse e gerencie sua base de clientes cadastrados.',
    icon: <Users className="w-10 h-10 text-cyan-400" />,
    path: '/dashboard/clients',
    color: 'hover:border-cyan-400/50',
    gradient: 'from-cyan-500/20 to-teal-500/20',
  },
];

const TrialFooter = () => {
  const { user } = useAuth();

  // Mock trial data - in real app, this would come from user subscription
  const trialDaysRemaining: number = 7; // Example

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-4 border-t border-blue-500/30 z-50"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-4 text-center">
        <div className="flex items-center gap-2 text-blue-300">
          <Calendar className="w-5 h-5" />
          <p className="font-semibold">
            Você está no período de teste gratuito.
          </p>
        </div>
        <p className="text-white">
          Você tem <span className="font-bold text-lg text-yellow-400">{trialDaysRemaining}</span>{' '}
          {trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes'} para testar.
        </p>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
          size="sm"
        >
          <Star className="w-4 h-4 mr-2" />
          Escolha seu Plano Agora
        </Button>
      </div>
    </motion.div>
  );
};

export default function ServiceSelectionPage() {
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="flex flex-col items-center justify-center pt-20 pb-24">
        <div className="text-center p-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Bem-vindo, {user?.name?.split(' ')[0]}! 🚀
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-6"></div>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Escolha uma das ferramentas abaixo para iniciar seu trabalho. 
              Cada módulo foi projetado para otimizar uma parte do seu processo.
            </p>
          </motion.div>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 pb-8 max-w-7xl w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {services.map((service) => (
            <motion.div key={service.title} variants={itemVariants}>
              <Link to={service.path} className="block group">
                <Card className={`
                  bg-white/80 backdrop-blur-sm border border-slate-200 
                  text-slate-900 cursor-pointer transition-all duration-300 
                  ease-in-out transform hover:-translate-y-2 hover:shadow-2xl 
                  ${service.color} group-hover:bg-white
                `}>
                  <CardHeader className="flex flex-col items-center text-center p-8">
                    <div className={`
                      p-6 bg-gradient-to-br ${service.gradient} 
                      rounded-2xl mb-6 group-hover:scale-110 
                      transition-transform duration-300
                    `}>
                      {service.icon}
                    </div>
                    <CardTitle className="text-xl font-bold mb-2 group-hover:text-slate-800">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600 text-sm leading-relaxed mb-4">
                      {service.description}
                    </CardDescription>
                    <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                      <span className="mr-2">Acessar</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-8 px-6"
        >
          <p className="text-slate-500 mb-4">
            Precisa de ajuda? Confira nossa documentação ou entre em contato
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="sm">
              📖 Documentação
            </Button>
            <Button variant="outline" size="sm">
              💬 Suporte
            </Button>
          </div>
        </motion.div>
      </main>
      
      <TrialFooter />
    </div>
  );
}