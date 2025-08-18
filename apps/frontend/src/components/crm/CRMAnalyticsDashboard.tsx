import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Target,
  Activity,
  Calendar,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Zap
} from 'lucide-react';
import { Lead, LeadStage, DefaultLeadStage, LEAD_STAGE_LABELS } from '../../types/lead';
import { CRMAdvancedFilters, CRMFilterState } from './CRMAdvancedFilters';

interface CRMAnalyticsProps {
  leads: Lead[];
  isLoading?: boolean;
}

interface StageStats {
  stage: LeadStage;
  count: number;
  value: number;
  conversionRate?: number;
}

const initialFilters: CRMFilterState = {
  searchTerm: '',
  stages: [],
  sources: [],
  clientTypes: [],
  tags: [],
  dateRange: { start: null, end: null },
  valueRange: { min: 0, max: 1000000 },
  powerRange: { min: 0, max: 100 },
  hasNotes: null,
  hasDeadline: null,
  isActive: false
};

export const CRMAnalyticsDashboard: React.FC<CRMAnalyticsProps> = ({ 
  leads, 
  isLoading = false 
}) => {
  const [filters, setFilters] = useState<CRMFilterState>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Aplicar filtros aos leads
  const filteredLeads = useMemo(() => {
    if (!filters.isActive) return leads;

    return leads.filter(lead => {
      // Filtro por texto
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const searchFields = [
          lead.name,
          lead.email,
          lead.company || '',
          lead.notes || ''
        ].join(' ').toLowerCase();
        
        if (!searchFields.includes(searchLower)) return false;
      }

      // Filtro por estágios
      if (filters.stages.length > 0 && !filters.stages.includes(lead.stage)) {
        return false;
      }

      // Filtro por fontes
      if (filters.sources.length > 0 && !filters.sources.includes(lead.source)) {
        return false;
      }

      // Filtro por tipo de cliente
      if (filters.clientTypes.length > 0) {
        if (!filters.clientTypes.includes(lead.clientType as 'B2B' | 'B2C')) {
          return false;
        }
      }

      // Filtro por tags
      if (filters.tags.length > 0) {
        const leadTags = lead.tags || [];
        const hasMatchingTag = filters.tags.some(filterTag => 
          leadTags.includes(filterTag)
        );
        if (!hasMatchingTag) return false;
      }

      // Filtro por data
      if (filters.dateRange.start || filters.dateRange.end) {
        const leadDate = new Date(lead.createdAt);
        if (filters.dateRange.start && leadDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && leadDate > filters.dateRange.end) return false;
      }

      // Filtro por valor
      const leadValue = lead.estimatedValue || lead.value || 0;
      if (leadValue < filters.valueRange.min || leadValue > filters.valueRange.max) {
        return false;
      }

      // Filtro por potência
      const leadPower = lead.powerKwp || 0;
      if (leadPower < filters.powerRange.min || leadPower > filters.powerRange.max) {
        return false;
      }

      // Filtro por notas
      if (filters.hasNotes !== null) {
        const hasNotes = !!(lead.notes && lead.notes.trim());
        if (filters.hasNotes !== hasNotes) return false;
      }

      // Filtro por deadline
      if (filters.hasDeadline !== null) {
        const hasDeadline = !!lead.expectedCloseDate;
        if (filters.hasDeadline !== hasDeadline) return false;
      }

      return true;
    });
  }, [leads, filters]);

  // Calcular métricas principais baseadas nos leads filtrados
  const totalLeads = filteredLeads.length;
  const totalValue = filteredLeads.reduce((sum, lead) => sum + (lead.value || lead.estimatedValue || 0), 0);
  const convertedLeads = filteredLeads.filter(lead => lead.stage === DefaultLeadStage.SISTEMA_ENTREGUE).length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  // Métricas por estágio baseadas nos leads filtrados
  const stageStats: StageStats[] = Object.values(DefaultLeadStage).map(stage => {
    const stageLeads = filteredLeads.filter(lead => lead.stage === stage);
    const stageValue = stageLeads.reduce((sum, lead) => sum + (lead.value || lead.estimatedValue || 0), 0);
    
    return {
      stage,
      count: stageLeads.length,
      value: stageValue,
    };
  });

  // Leads criados nos últimos 30 dias (baseado nos leads filtrados)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentLeads = filteredLeads.filter(lead => 
    new Date(lead.createdAt) >= thirtyDaysAgo
  ).length;

  // Leads com data de fechamento próxima (próximos 7 dias) - baseado nos filtrados
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const upcomingDeadlines = filteredLeads.filter(lead => 
    lead.expectedCloseDate && 
    new Date(lead.expectedCloseDate) <= sevenDaysFromNow &&
    new Date(lead.expectedCloseDate) >= new Date() &&
    lead.stage !== DefaultLeadStage.SISTEMA_ENTREGUE
  ).length;

  // Valor médio por lead
  const averageLeadValue = totalLeads > 0 ? totalValue / totalLeads : 0;

  // Distribuição por tipo de cliente (baseado nos filtrados)
  const clientTypeStats = {
    B2B: filteredLeads.filter(lead => lead.clientType === 'B2B').length,
    B2C: filteredLeads.filter(lead => lead.clientType === 'B2C').length,
    undefined: filteredLeads.filter(lead => !lead.clientType).length,
  };

  // Análise de potência por faixa (kWp) - baseado nos filtrados
  const powerRanges = {
    'Até 5 kWp': filteredLeads.filter(lead => (lead.powerKwp || 0) <= 5).length,
    '5-15 kWp': filteredLeads.filter(lead => (lead.powerKwp || 0) > 5 && (lead.powerKwp || 0) <= 15).length,
    '15-50 kWp': filteredLeads.filter(lead => (lead.powerKwp || 0) > 15 && (lead.powerKwp || 0) <= 50).length,
    'Acima de 50 kWp': filteredLeads.filter(lead => (lead.powerKwp || 0) > 50).length,
  };

  // Total de potência (kWp) - baseado nos filtrados
  const totalPowerKwp = filteredLeads.reduce((sum, lead) => sum + (lead.powerKwp || 0), 0);
  const averagePowerKwp = totalLeads > 0 ? totalPowerKwp / totalLeads : 0;

  // Análise temporal - últimos 12 meses (baseado nos filtrados)
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthLeads = filteredLeads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return leadDate.getMonth() === date.getMonth() && leadDate.getFullYear() === date.getFullYear();
    });
    
    monthlyData.push({
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      leads: monthLeads.length,
      value: monthLeads.reduce((sum, lead) => sum + (lead.value || lead.estimatedValue || 0), 0),
      converted: monthLeads.filter(lead => lead.stage === DefaultLeadStage.SISTEMA_ENTREGUE).length
    });
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros Avançados */}
      <CRMAdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
      />
      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ChevronUp className="h-3 w-3" />
                {recentLeads} novos (30 dias)
              </span>
              {filters.isActive && (
                <span className="text-blue-600 text-xs mt-1 block">
                  De {leads.length} leads totais
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: R$ {averageLeadValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <Progress value={conversionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prazos Próximos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingDeadlines}</div>
            <p className="text-xs text-muted-foreground">
              Próximos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline por estágio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Pipeline de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stageStats.map(({ stage, count, value }) => {
              const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              
              return (
                <div key={stage} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {LEAD_STAGE_LABELS[stage as DefaultLeadStage] || stage}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% do total
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Análise de Potência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Análise por Potência (kWp)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalPowerKwp.toFixed(1)} kWp
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {averagePowerKwp.toFixed(1)} kWp
              </div>
              <p className="text-xs text-muted-foreground">Média</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {Object.entries(powerRanges).map(([range, count]) => {
              const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              
              return (
                <div key={range} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{range}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{count}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Análise Temporal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Análise Temporal (12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">
                  {monthlyData.slice(-3).reduce((sum, month) => sum + month.leads, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Últimos 3 meses</p>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {monthlyData.slice(-3).reduce((sum, month) => sum + month.converted, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Conversões</p>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  R$ {monthlyData.slice(-3).reduce((sum, month) => sum + month.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground">Valor</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Últimos 6 meses:</p>
              <div className="flex justify-between items-center text-xs">
                {monthlyData.slice(-6).map((month, index) => (
                  <div key={index} className="text-center">
                    <div className="font-medium">{month.leads}</div>
                    <div className="text-muted-foreground">{month.month}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por tipo de cliente */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Distribuição por Tipo de Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Empresas (B2B)</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{clientTypeStats.B2B}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {totalLeads > 0 ? ((clientTypeStats.B2B / totalLeads) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Pessoa Física (B2C)</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{clientTypeStats.B2C}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {totalLeads > 0 ? ((clientTypeStats.B2C / totalLeads) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              
              {clientTypeStats.undefined > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Não definido</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{clientTypeStats.undefined}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {((clientTypeStats.undefined / totalLeads) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {conversionRate < 10 && (
                <div className="flex items-start space-x-2">
                  <ChevronDown className="h-4 w-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700">Taxa de conversão baixa</p>
                    <p className="text-muted-foreground">
                      Apenas {conversionRate.toFixed(1)}% dos leads estão sendo convertidos
                    </p>
                  </div>
                </div>
              )}
              
              {upcomingDeadlines > 0 && (
                <div className="flex items-start space-x-2">
                  <Calendar className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-700">Prazos próximos</p>
                    <p className="text-muted-foreground">
                      {upcomingDeadlines} leads com data de fechamento nos próximos 7 dias
                    </p>
                  </div>
                </div>
              )}
              
              {recentLeads > totalLeads * 0.3 && (
                <div className="flex items-start space-x-2">
                  <ChevronUp className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700">Crescimento acelerado</p>
                    <p className="text-muted-foreground">
                      {((recentLeads / totalLeads) * 100).toFixed(1)}% dos leads foram criados nos últimos 30 dias
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};