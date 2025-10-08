import React, { useState } from 'react';
import { ClientAlert, AlertStatus, AlertPriority, AlertType } from '../../types/client-alert';
import { useUpdateClientAlert } from '../../hooks/client-alert-hooks';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Calendar, 
  Flag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientAlertsListProps {
  alerts: ClientAlert[];
  showClientInfo?: boolean;
  onEditAlert?: (alert: ClientAlert) => void;
}

const alertTypeLabels = {
  [AlertType.FOLLOW_UP]: 'Follow-up',
  [AlertType.TASK]: 'Tarefa',
  [AlertType.REMINDER]: 'Lembrete',
  [AlertType.DEADLINE]: 'Prazo'
};

const priorityLabels = {
  [AlertPriority.LOW]: 'Baixa',
  [AlertPriority.MEDIUM]: 'Média',
  [AlertPriority.HIGH]: 'Alta',
  [AlertPriority.URGENT]: 'Urgente'
};

const priorityColors = {
  [AlertPriority.LOW]: 'bg-green-100 text-green-800',
  [AlertPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [AlertPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [AlertPriority.URGENT]: 'bg-red-100 text-red-800'
};

const statusColors = {
  [AlertStatus.PENDING]: 'bg-blue-100 text-blue-800',
  [AlertStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [AlertStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  [AlertStatus.PENDING]: 'Pendente',
  [AlertStatus.COMPLETED]: 'Concluído',
  [AlertStatus.CANCELLED]: 'Cancelado'
};

export default function ClientAlertsList({ alerts, showClientInfo = false, onEditAlert }: ClientAlertsListProps) {
  const updateMutation = useUpdateClientAlert();

  const handleStatusChange = async (alertId: string, newStatus: AlertStatus) => {
    try {
      await updateMutation.mutateAsync({ id: alertId, input: { status: newStatus } });
    } catch (error) {
    }
  };

  const getDateInfo = (alertDate: string) => {
    const date = new Date(alertDate);
    const isOverdue = isPast(date) && !isToday(date);
    const isDueToday = isToday(date);
    const isUpcoming = isFuture(date);

    return { date, isOverdue, isDueToday, isUpcoming };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum alerta encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const { date, isOverdue, isDueToday, isUpcoming } = getDateInfo(alert.alertDate);
        
        return (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 ${
              isOverdue && alert.status === AlertStatus.PENDING 
                ? 'border-red-200 bg-red-50' 
                : isDueToday && alert.status === AlertStatus.PENDING
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-medium text-gray-900">{alert.title}</h3>
                  
                  {/* Status indicator */}
                  {isOverdue && alert.status === AlertStatus.PENDING && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  {isDueToday && alert.status === AlertStatus.PENDING && (
                    <Clock className="h-4 w-4 text-yellow-500" />
                  )}
                  {alert.isRecurring && (
                    <RotateCcw className="h-4 w-4 text-blue-500" />
                  )}
                </div>

                {alert.description && (
                  <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(alert.alertDate)}</span>
                  </div>
                  
                  {isOverdue && alert.status === AlertStatus.PENDING && (
                    <Badge className="bg-red-100 text-red-800">
                      Atrasado
                    </Badge>
                  )}
                  {isDueToday && alert.status === AlertStatus.PENDING && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Hoje
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <Badge className={priorityColors[alert.priority]}>
                    <Flag className="h-3 w-3 mr-1" />
                    {priorityLabels[alert.priority]}
                  </Badge>
                  
                  <Badge variant="outline">
                    {alertTypeLabels[alert.alertType]}
                  </Badge>
                  
                  <Badge className={statusColors[alert.status]}>
                    {statusLabels[alert.status]}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {alert.status === AlertStatus.PENDING && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(alert.id, AlertStatus.COMPLETED)}
                      disabled={updateMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(alert.id, AlertStatus.CANCELLED)}
                      disabled={updateMutation.isPending}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
                
                {onEditAlert && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditAlert(alert)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}