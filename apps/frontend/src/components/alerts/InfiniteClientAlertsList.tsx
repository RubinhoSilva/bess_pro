import React, { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Bell, Calendar, CheckCircle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { InfinitePagination } from '@/components/ui/data-pagination';
import { useClientAlertsInfinite } from '@/hooks/client-alert-hooks';
import { useInfiniteScroll, useVirtualizedLoading } from '@/hooks/useLazyLoading';
import { useDebounceFilters } from '@/hooks/useDebounce';
import { AlertType, AlertPriority, AlertStatus } from '@/types/client-alert';

interface ClientAlertFilters {
  search?: string;
  alertType?: AlertType;
  priority?: AlertPriority;
  status?: AlertStatus;
  clientId?: string;
}

interface InfiniteClientAlertsListProps {
  filters?: ClientAlertFilters;
  onAlertClick?: (alertId: string) => void;
  className?: string;
  enableVirtualization?: boolean;
  batchSize?: number;
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

export function InfiniteClientAlertsList({
  filters = {},
  onAlertClick,
  className,
  enableVirtualization = true,
  batchSize = 20
}: InfiniteClientAlertsListProps) {
  // Debounce dos filtros para otimizar performance
  const { debouncedFilters, isDebouncing } = useDebounceFilters(filters, 500);
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useClientAlertsInfinite(debouncedFilters);

  // Processar dados para virtualização
  const allAlerts = useMemo(() => 
    data?.pages.flatMap(page => page.data) || [], 
    [data]
  );

  // Virtualização para listas grandes
  const {
    visibleItems: visibleAlerts,
    hasMore: hasMoreVirtual,
    loadMore: loadMoreVirtual
  } = useVirtualizedLoading(allAlerts, batchSize);

  // Scroll infinito otimizado
  const scrollRef = useInfiniteScroll(
    hasNextPage || false,
    fetchNextPage,
    {
      enabled: !isDebouncing && !isFetchingNextPage,
      rootMargin: '200px'
    }
  );

  // Usar dados virtualizados ou completos baseado na configuração
  const displayAlerts = enableVirtualization ? visibleAlerts : allAlerts;
  const showLoadMore = enableVirtualization ? hasMoreVirtual : (hasNextPage && !isFetchingNextPage);

  // Loading otimizado com debounce
  const isSearching = useMemo(() => {
    return isLoading || isDebouncing;
  }, [isLoading, isDebouncing]);

  if (isSearching) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-red-600">
          Erro ao carregar alertas: {error.message}
        </CardContent>
      </Card>
    );
  }

  if (displayAlerts.length === 0 && !isSearching) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Nenhum alerta encontrado
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {displayAlerts.map((alert) => (
          <Card 
            key={alert.id} 
            className={`transition-colors hover:bg-muted/50 ${
              onAlertClick ? 'cursor-pointer' : ''
            }`}
            onClick={onAlertClick ? () => onAlertClick(alert.id) : undefined}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium truncate">{alert.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[alert.alertType]}
                    </Badge>
                  </div>
                  
                  {alert.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {alert.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(alert.alertDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`gap-1 ${priorityColors[alert.priority]}`}>
                    {priorityIcons[alert.priority]}
                    {priorityLabels[alert.priority]}
                  </Badge>
                  
                  <Badge className={`gap-1 ${statusColors[alert.status]}`}>
                    {statusIcons[alert.status]}
                    {statusLabels[alert.status]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sentinel para scroll infinito */}
      <div ref={scrollRef} className="h-4" />
      
      <InfinitePagination
        hasNextPage={showLoadMore}
        isFetchingNextPage={isFetchingNextPage || isDebouncing}
        onLoadMore={enableVirtualization ? loadMoreVirtual : fetchNextPage}
        className="mt-6"
      />
      
      {/* Indicador de busca */}
      {isDebouncing && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          <span className="text-sm text-muted-foreground">Atualizando resultados...</span>
        </div>
      )}
    </div>
  );
}