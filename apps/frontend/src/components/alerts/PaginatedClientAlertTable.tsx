import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Edit, Trash2, Calendar, AlertTriangle, Bell, CheckCircle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataPagination } from '@/components/ui/data-pagination';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientAlertsOffsetPaginated } from '@/hooks/client-alert-hooks';
import { useDebounceFilters } from '@/hooks/useDebounce';
import { AlertType, AlertPriority, AlertStatus } from '@/types/client-alert';
import type { OffsetPaginationRequest } from '@/types/pagination';

interface ClientAlertFilters {
  search?: string;
  alertType?: AlertType;
  priority?: AlertPriority;
  status?: AlertStatus;
  clientId?: string;
}

interface PaginatedClientAlertTableProps {
  clientId?: string;
  onEdit?: (alertId: string) => void;
  onDelete?: (alertId: string) => void;
  onView?: (alertId: string) => void;
}

const priorityIcons = {
  [AlertPriority.LOW]: <Bell className="h-4 w-4" />,
  [AlertPriority.MEDIUM]: <AlertTriangle className="h-4 w-4" />,
  [AlertPriority.HIGH]: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  [AlertPriority.URGENT]: <AlertTriangle className="h-4 w-4 text-red-500" />
};

const statusIcons = {
  [AlertStatus.PENDING]: <Calendar className="h-4 w-4" />,
  [AlertStatus.COMPLETED]: <CheckCircle className="h-4 w-4 text-green-500" />,
  [AlertStatus.CANCELLED]: <CheckCircle className="h-4 w-4 text-gray-500" />
};

const typeLabels = {
  [AlertType.REMINDER]: 'Lembrete',
  [AlertType.FOLLOW_UP]: 'Follow-up',
  [AlertType.DEADLINE]: 'Prazo',
  [AlertType.TASK]: 'Tarefa'
};

const priorityLabels = {
  [AlertPriority.LOW]: 'Baixa',
  [AlertPriority.MEDIUM]: 'Média',
  [AlertPriority.HIGH]: 'Alta',
  [AlertPriority.URGENT]: 'Urgente'
};

const statusLabels = {
  [AlertStatus.PENDING]: 'Pendente',
  [AlertStatus.COMPLETED]: 'Concluído',
  [AlertStatus.CANCELLED]: 'Cancelado'
};

const priorityColors = {
  [AlertPriority.LOW]: 'bg-gray-100 text-gray-800',
  [AlertPriority.MEDIUM]: 'bg-blue-100 text-blue-800',
  [AlertPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [AlertPriority.URGENT]: 'bg-red-100 text-red-800'
};

const statusColors = {
  [AlertStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [AlertStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [AlertStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
};

export function PaginatedClientAlertTable({
  clientId,
  onEdit,
  onDelete,
  onView
}: PaginatedClientAlertTableProps) {
  const [pagination, setPagination] = useState<OffsetPaginationRequest>({
    page: 1,
    limit: 20
  });
  
  const [filters, setFilters] = useState<ClientAlertFilters>({
    clientId
  });

  // Debounce dos filtros para otimizar performance
  const { debouncedFilters, isDebouncing } = useDebounceFilters(filters, 500);

  const { data, isLoading, error } = useClientAlertsOffsetPaginated(
    pagination,
    debouncedFilters
  );

  // Memoizar indicadores de loading para melhor UX
  const isSearching = useMemo(() => {
    return isLoading || isDebouncing;
  }, [isLoading, isDebouncing]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleFilterChange = (key: keyof ClientAlertFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (isSearching) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">
              {isDebouncing ? 'Processando filtros...' : 'Carregando alertas...'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            Erro ao carregar alertas: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas do Cliente</CardTitle>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por título ou descrição..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
            {isDebouncing && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          
          <Select
            value={filters.alertType || 'all'}
            onValueChange={(value) => handleFilterChange('alertType', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority || 'all'}
            onValueChange={(value) => handleFilterChange('priority', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {data.data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum alerta encontrado
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Título</th>
                    <th className="text-left p-4 font-medium">Tipo</th>
                    <th className="text-left p-4 font-medium">Prioridade</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Data/Hora</th>
                    <th className="text-right p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((alert) => (
                    <tr key={alert.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          {alert.description && (
                            <div className="text-sm text-muted-foreground mt-1 truncate max-w-[200px]">
                              {alert.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="gap-1">
                          {typeLabels[alert.alertType]}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={`gap-1 ${priorityColors[alert.priority]}`}>
                          {priorityIcons[alert.priority]}
                          {priorityLabels[alert.priority]}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={`gap-1 ${statusColors[alert.status]}`}>
                          {statusIcons[alert.status]}
                          {statusLabels[alert.status]}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {format(new Date(alert.alertDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(alert.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(alert.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(alert.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <DataPagination
                data={data}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                type="offset"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}