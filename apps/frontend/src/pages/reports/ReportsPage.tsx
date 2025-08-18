import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  Filter,
  ChevronDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  type: 'financial' | 'sales' | 'project' | 'equipment';
  icon: React.ReactNode;
  lastGenerated?: string;
  status: 'available' | 'generating' | 'error';
}

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState('all');

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

  const quickStats = [
    { label: 'Projetos Ativos', value: '12', change: '+2 este mês', color: 'bg-blue-500' },
    { label: 'Receita Total', value: 'R$ 485.2k', change: '+12% vs mês anterior', color: 'bg-green-500' },
    { label: 'Novos Clientes', value: '8', change: '+3 esta semana', color: 'bg-purple-500' },
    { label: 'Taxa Conversão', value: '68%', change: '+5% vs mês anterior', color: 'bg-orange-500' }
  ];

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

  const handleGenerateReport = (reportId: string) => {
    console.log('Generating report:', reportId);
  };

  const handleDownloadReport = (reportId: string) => {
    console.log('Downloading report:', reportId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análises e relatórios do sistema</p>
        </div>
        <div className="flex gap-3">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports Section */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
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
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {report.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <Badge className={`mt-1 ${getStatusColor(report.status)}`}>
                          {getStatusText(report.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{report.description}</p>
                  
                  {report.lastGenerated && (
                    <p className="text-xs text-gray-500">
                      Último: {new Date(report.lastGenerated).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleGenerateReport(report.id)}
                      disabled={report.status === 'generating'}
                      className="flex-1"
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Gerar
                    </Button>
                    
                    {report.status === 'available' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadReport(report.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Relatórios Agendados
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                Configure relatórios para serem gerados automaticamente em intervalos regulares.
              </p>
              <Button className="mt-4">
                Criar Agendamento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;