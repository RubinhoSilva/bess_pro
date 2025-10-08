import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/use-toast';
import { 
  BarChart3, 
  Download, 
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  Filter,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../hooks/auth-hooks';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  type: 'financial' | 'sales' | 'project' | 'equipment';
  icon: React.ReactNode;
  lastGenerated?: string;
  status: 'available' | 'generating' | 'error';
}

interface StatsData {
  projects: number;
  revenue: number;
  clients: number;
  conversion: number;
}

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Carregar dados dos relatórios na inicialização
  useEffect(() => {
    loadReportsData();
  }, [selectedPeriod]);

  const loadReportsData = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de dados da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Em implementação real, faria chamadas para:
      // - /api/v1/reports/stats
      // - /api/v1/projects/summary
      // - /api/v1/leads/analytics
      
      setStats({
        projects: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 500) + 200,
        clients: Math.floor(Math.random() * 15) + 3,
        conversion: Math.floor(Math.random() * 30) + 60
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados dos relatórios.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reports: ReportCard[] = [
    {
      id: '1',
      title: 'Relatório de Vendas',
      description: 'Análise completa das vendas por período, cliente e projeto',
      type: 'sales',
      icon: <TrendingUp className="w-6 h-6" />,
      lastGenerated: '2025-08-08',
      status: 'available'
    },
    {
      id: '2',
      title: 'Relatório Financeiro',
      description: 'Receitas, custos e margem de lucro por projeto',
      type: 'financial',
      icon: <DollarSign className="w-6 h-6" />,
      lastGenerated: '2025-08-07',
      status: 'available'
    },
    {
      id: '3',
      title: 'Performance de Projetos',
      description: 'Status, prazos e produtividade dos projetos em andamento',
      type: 'project',
      icon: <BarChart3 className="w-6 h-6" />,
      lastGenerated: '2025-08-06',
      status: 'available'
    },
    {
      id: '4',
      title: 'Análise de Clientes',
      description: 'Segmentação e comportamento da base de clientes',
      type: 'sales',
      icon: <Users className="w-6 h-6" />,
      status: 'generating'
    },
    {
      id: '5',
      title: 'Utilização de Equipamentos',
      description: 'Inventário e uso de módulos solares e inversores',
      type: 'equipment',
      icon: <FileText className="w-6 h-6" />,
      lastGenerated: '2025-08-05',
      status: 'available'
    }
  ];

  const quickStats = stats ? [
    { label: 'Projetos Ativos', value: stats.projects?.toString() || '0', change: '+2 este mês', color: 'bg-blue-500' },
    { label: 'Receita Total', value: `R$ ${stats.revenue || 0}k`, change: '+12% vs mês anterior', color: 'bg-green-500' },
    { label: 'Novos Clientes', value: stats.clients?.toString() || '0', change: '+3 esta semana', color: 'bg-purple-500' },
    { label: 'Taxa Conversão', value: `${stats.conversion || 0}%`, change: '+5% vs mês anterior', color: 'bg-orange-500' }
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'generating': return 'bg-yellow-100 text-yellow-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'generating': return 'Gerando...';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  const filteredReports = reports.filter(report => 
    selectedType === 'all' || report.type === selectedType
  );

  const handleGenerateReport = async (reportId: string) => {
    if (isGenerating) {
      toast({
        title: "Relatório em processo",
        description: "Aguarde a conclusão do relatório atual.",
        variant: "destructive"
      });
      return;
    }

    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    setIsGenerating(reportId);
    
    try {
      toast({
        title: "Iniciando geração",
        description: `Gerando ${report.title}...`,
      });

      // Simular processo de geração
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Em implementação real, faria:
      // const response = await fetch(`/api/v1/reports/${reportId}/generate`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      
      toast({
        title: "✅ Relatório gerado!",
        description: `${report.title} está pronto para download.`,
      });
      
      // Atualizar status do relatório
      // Aqui poderia atualizar o estado local ou recarregar dados
      
    } catch (error) {
      toast({
        title: "Erro na geração",
        description: "Não foi possível gerar o relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    try {
      toast({
        title: "Iniciando download",
        description: `Baixando ${report.title}...`,
      });

      // Simular download
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Em implementação real, faria:
      // const response = await fetch(`/api/v1/reports/${reportId}/download`);
      // const blob = await response.blob();
      // downloadFile(blob, `${report.title}.pdf`);
      
      // Para demonstração, criar um arquivo JSON
      const reportData = {
        title: report.title,
        generatedAt: new Date().toISOString(),
        period: selectedPeriod,
        user: user?.name,
        data: {
          // Dados simulados do relatório
          summary: "Relatório gerado com sucesso",
          details: []
        }
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/\s+/g, '_')}_${selectedPeriod}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "✅ Download concluído!",
        description: `${report.title} foi baixado com sucesso.`,
      });
      
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o relatório. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Relatórios</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análises e relatórios do sistema • Acesso exclusivo para donos de equipe
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={loadReportsData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User Info Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Bem-vindo, <strong>{user?.name || 'Usuário'}</strong>! Você tem acesso completo aos relatórios da equipe.
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array(4).fill(0).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          quickStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stat.change}</p>
                  </div>
                <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Reports Section */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="sales">Vendas</SelectItem>
                <SelectItem value="project">Projetos</SelectItem>
                <SelectItem value="equipment">Equipamentos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => {
              const isCurrentlyGenerating = isGenerating === report.id;
              
              return (
                <Card 
                  key={report.id} 
                  className={`hover:shadow-lg transition-all duration-200 ${
                    isCurrentlyGenerating ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isCurrentlyGenerating ? 'bg-blue-200' : 'bg-blue-100'
                        } dark:bg-blue-900/50`}>
                          {isCurrentlyGenerating ? (
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          ) : (
                            report.icon
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                            {report.title}
                          </CardTitle>
                          <Badge className={`mt-1 ${getStatusColor(report.status)}`}>
                            {isCurrentlyGenerating ? (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Gerando...
                              </>
                            ) : (
                              <>
                                {report.status === 'available' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {report.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                                {getStatusText(report.status)}
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {report.description}
                    </p>
                    
                    {report.lastGenerated && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        📅 Último: {new Date(report.lastGenerated).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                    
                    {isCurrentlyGenerating && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gerando relatório, aguarde...
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={isCurrentlyGenerating || isGenerating !== null}
                        className="flex-1"
                        variant={isCurrentlyGenerating ? "secondary" : "default"}
                      >
                        {isCurrentlyGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Gerar
                          </>
                        )}
                      </Button>
                      
                      {report.status === 'available' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadReport(report.id)}
                          disabled={isCurrentlyGenerating}
                          className="hover:bg-green-50 hover:border-green-200"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default ReportsPage;