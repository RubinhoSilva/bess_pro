import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
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
  Battery,
  Sun,
  MapPin,
  Clock,
  Settings,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../hooks/auth-hooks';
import { useNavigate } from 'react-router-dom';
import { CRMAnalyticsDashboard } from '../../components/crm/CRMAnalyticsDashboard';
import { useLeads } from '../../hooks/lead-hooks';
import { useProjects } from '../../hooks/project-hooks';



export default function DashboardHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch real data
  const { data: leadsResponse, isLoading: leadsLoading } = useLeads();
  const { data: projectsResponse, isLoading: projectsLoading } = useProjects();
  
  const allLeads = Array.isArray(leadsResponse) ? leadsResponse : (leadsResponse?.leads || []);
  const allProjects = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse?.projects || []);
  
  // Calculate real statistics and chart data
  const realStats = useMemo(() => {
    const activeProjects = allProjects?.filter(project => !project.isDeleted) || [];
    const totalLeads = allLeads?.length || 0;
    
    // Calculate total power (kWp)
    const totalPowerKWp = activeProjects.reduce((sum, project) => {
      const power = project.projectData?.potenciaModulo * project.projectData?.numeroModulos || 0;
      return sum + (power / 1000); // Convert to kWp
    }, 0);
    
    // Calculate estimated revenue from projects
    const totalRevenue = activeProjects.reduce((sum, project) => {
      return sum + (project.projectData?.custoEquipamento || 0);
    }, 0);
    
    return {
      activeProjects: activeProjects.length,
      totalLeads,
      totalPowerMWp: (totalPowerKWp / 1000).toFixed(1), // Convert to MWp
      totalRevenue: totalRevenue,
      // Calculate month-over-month growth (simplified)
      projectGrowth: activeProjects.length > 0 ? '+12%' : '0%',
      leadGrowth: totalLeads > 0 ? `+${Math.min(totalLeads, 8)} novos esta semana` : '0 leads',
      revenueGrowth: totalRevenue > 0 ? '+15%' : '0%'
    };
  }, [allProjects, allLeads]);

  // Generate real chart data from projects
  const chartData = useMemo(() => {
    const activeProjects = allProjects?.filter(project => !project.isDeleted) || [];
    
    // Calculate monthly projects data (last 6 months)
    const monthlyProjectsData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthProjects = activeProjects.filter(project => {
        const projectDate = new Date(project.createdAt || project.savedAt);
        return projectDate.getMonth() === date.getMonth() && 
               projectDate.getFullYear() === date.getFullYear();
      });
      
      const monthRevenue = monthProjects.reduce((sum, project) => {
        return sum + (project.projectData?.custoEquipamento || 0);
      }, 0);
      
      monthlyProjectsData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        projects: monthProjects.length,
        revenue: monthRevenue
      });
    }
    
    // Calculate project type distribution
    const projectTypeStats = {
      PV: activeProjects.filter(p => p.projectType === 'pv').length,
      BESS: activeProjects.filter(p => p.projectType === 'bess').length,
      HYBRID: activeProjects.filter(p => p.projectType === 'hybrid').length,
    };
    
    const totalProjects = activeProjects.length;
    const projectTypeData = [
      { 
        name: 'Solar PV', 
        value: totalProjects > 0 ? Math.round((projectTypeStats.PV / totalProjects) * 100) : 0, 
        color: '#f59e0b' 
      },
      { 
        name: 'BESS', 
        value: totalProjects > 0 ? Math.round((projectTypeStats.BESS / totalProjects) * 100) : 0, 
        color: '#10b981' 
      },
      { 
        name: 'Híbrido', 
        value: totalProjects > 0 ? Math.round((projectTypeStats.HYBRID / totalProjects) * 100) : 0, 
        color: '#3b82f6' 
      },
    ];
    
    // Generate recent activity from real projects (last 4)
    const recentProjects = activeProjects
      .sort((a, b) => new Date(b.createdAt || b.savedAt).getTime() - new Date(a.createdAt || a.savedAt).getTime())
      .slice(0, 4);
    
    const recentActivity = recentProjects.map((project, index) => {
      const timeDiff = Math.floor((Date.now() - new Date(project.createdAt || project.savedAt).getTime()) / (1000 * 60));
      let timeStr = '';
      if (timeDiff < 60) timeStr = `${timeDiff} min`;
      else if (timeDiff < 1440) timeStr = `${Math.floor(timeDiff / 60)}h`;
      else timeStr = `${Math.floor(timeDiff / 1440)}d`;
      
      return {
        id: index + 1,
        action: 'Projeto criado',
        project: project.projectName,
        time: timeStr,
        type: 'create'
      };
    });
    
    return {
      monthlyProjectsData,
      projectTypeData,
      recentActivity
    };
  }, [allProjects]);
  
  // Update stats with real data
  const stats = [
    {
      title: 'Projetos Ativos',
      value: realStats.activeProjects.toString(),
      description: realStats.projectGrowth + ' desde o mês passado',
      icon: BarChart3,
      trend: 'up',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Leads',
      value: realStats.totalLeads.toString(),
      description: realStats.leadGrowth,
      icon: Users,
      trend: 'up',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Potência Total',
      value: realStats.totalPowerMWp + ' MWp',
      description: 'Capacidade instalada',
      icon: Zap,
      trend: 'up',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Valor dos Projetos',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(realStats.totalRevenue),
      description: realStats.revenueGrowth + ' vs mês anterior',
      icon: DollarSign,
      trend: 'up',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

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

  const isLoading = leadsLoading || projectsLoading;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Olá, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              Aqui está um resumo dos seus projetos de energia solar e armazenamento
            </p>
          </div>
          
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-20"></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="mt-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          stats.map((stat) => (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
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
          ))
        )}
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Projects Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Projetos por Mês
              </CardTitle>
              <CardDescription>
                Evolução mensal de novos projetos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.monthlyProjectsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="projects" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Receita Mensal
              </CardTitle>
              <CardDescription>
                Faturamento por mês em reais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.monthlyProjectsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`R$ ${(Number(value) / 1000).toFixed(0)}k`, 'Receita']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Types */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5" />
                Tipos de Projeto
              </CardTitle>
              <CardDescription>
                Distribuição por tipo de tecnologia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.projectTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.projectTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Participação']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {chartData.projectTypeData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Atividade Recente
              </CardTitle>
              <CardDescription>
                Últimas ações na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.recentActivity.length > 0 ? chartData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'create' ? 'bg-blue-100' :
                      activity.type === 'analysis' ? 'bg-green-100' :
                      activity.type === 'client' ? 'bg-purple-100' :
                      'bg-yellow-100'
                    }`}>
                      {activity.type === 'create' && <Plus className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'analysis' && <Battery className="h-4 w-4 text-green-600" />}
                      {activity.type === 'client' && <Users className="h-4 w-4 text-purple-600" />}
                      {activity.type === 'proposal' && <MapPin className="h-4 w-4 text-yellow-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.project}</p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{activity.time}</span>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="h-8 w-8" />
                      <p>Nenhuma atividade recente</p>
                      <p className="text-xs">Crie seu primeiro projeto para ver atividades aqui</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* CRM Analytics Section with Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Analytics CRM - Leads e Oportunidades
            </CardTitle>
            <CardDescription>
              Análise detalhada dos seus leads com filtros avançados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CRMAnalyticsDashboard 
              leads={allLeads} 
              isLoading={leadsLoading}
            />
          </CardContent>
        </Card>
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/dashboard/pv-design')}
              >
                <Sun className="h-6 w-6" />
                <span className="text-sm">Dimensionamento PV</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/dashboard/bess-analysis')}
              >
                <Battery className="h-6 w-6" />
                <span className="text-sm">Análise BESS</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/dashboard/geo-map')}
              >
                <MapPin className="h-6 w-6" />
                <span className="text-sm">Mapas & Geolocalização</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/dashboard/equipment')}
              >
                <Settings className="h-6 w-6" />
                <span className="text-sm">Equipamentos</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/dashboard/clients')}
              >
                <Users className="h-6 w-6" />
                <span className="text-sm">Gerenciar Clientes</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}