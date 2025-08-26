import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuthStore } from '../../store/auth-store';

const stats = [
  {
    title: 'Projetos Ativos',
    value: '24',
    description: '+12% desde o mês passado',
    icon: BarChart3,
    trend: 'up',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Leads',
    value: '156',
    description: '+5 novos esta semana',
    icon: Users,
    trend: 'up',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Potência Total',
    value: '2.4 MWp',
    description: 'Capacidade instalada',
    icon: Zap,
    trend: 'up',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    title: 'Receita',
    value: 'R$ 1.2M',
    description: '-2% vs mês anterior',
    icon: DollarSign,
    trend: 'down',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
];


export default function DashboardPage() {
  const { user } = useAuthStore();

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
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Olá, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              Aqui está um resumo dos seus projetos de energia solar
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Agendar reunião
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo projeto
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                
                <div className="flex items-center mt-4 text-sm">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {stat.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex-col">
                <BarChart3 className="h-6 w-6 mb-2" />
                <span className="text-sm">Novo Projeto</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col">
                <Users className="h-6 w-6 mb-2" />
                <span className="text-sm">Adicionar Lead</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col">
                <Zap className="h-6 w-6 mb-2" />
                <span className="text-sm">Upload 3D</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col">
                <TrendingUp className="h-6 w-6 mb-2" />
                <span className="text-sm">Relatórios</span>
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <h4 className="font-medium text-blue-900 mb-2">
                💡 Dica do dia
              </h4>
              <p className="text-sm text-blue-700">
                Use a análise 3D para aumentar a precisão dos seus orçamentos em até 15%
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}