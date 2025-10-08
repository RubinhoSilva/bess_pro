import React, { useState } from 'react';
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertType, AlertStatus, AlertInput, useCreateAlert, useUserAlerts, useUpdateAlertStatus } from '@/hooks/alert-hooks';
import { format, isAfter, isBefore, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertManagerProps {
  leadId?: string;
  showCreateButton?: boolean;
}

export function AlertManager({ leadId, showCreateButton = true }: AlertManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AlertInput>>({
    type: AlertType.FOLLOW_UP,
    leadId: leadId || '',
    title: '',
    message: '',
    alertTime: ''
  });

  const { data: alerts, isLoading } = useUserAlerts({
    includeOverdue: true,
    includeUpcoming: true,
    minutesAhead: 60
  });

  const createAlert = useCreateAlert();
  const updateAlertStatus = useUpdateAlertStatus();

  const handleCreateAlert = async () => {
    if (!formData.leadId || !formData.title || !formData.message || !formData.alertTime || !formData.type) {
      return;
    }

    try {
      await createAlert.mutateAsync({
        leadId: formData.leadId,
        type: formData.type,
        title: formData.title,
        message: formData.message,
        alertTime: formData.alertTime
      });

      setIsCreateDialogOpen(false);
      setFormData({
        type: AlertType.FOLLOW_UP,
        leadId: leadId || '',
        title: '',
        message: '',
        alertTime: ''
      });
    } catch (error) {
    }
  };

  const handleStatusUpdate = async (alertId: string, status: AlertStatus) => {
    try {
      await updateAlertStatus.mutateAsync({ alertId, status });
    } catch (error) {
    }
  };

  const getAlertTypeIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.FOLLOW_UP:
        return <Calendar className="h-4 w-4" />;
      case AlertType.REMINDER:
        return <Clock className="h-4 w-4" />;
      case AlertType.DEADLINE:
        return <AlertTriangle className="h-4 w-4" />;
      case AlertType.CALLBACK:
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getAlertTypeLabel = (type: AlertType) => {
    switch (type) {
      case AlertType.FOLLOW_UP:
        return 'Follow-up';
      case AlertType.REMINDER:
        return 'Lembrete';
      case AlertType.DEADLINE:
        return 'Prazo';
      case AlertType.CALLBACK:
        return 'Retorno';
      default:
        return type;
    }
  };

  const getAlertStatusBadge = (alert: Alert) => {
    const alertTime = new Date(alert.alertTime);
    const now = new Date();
    const isOverdue = isBefore(alertTime, now) && alert.status === AlertStatus.ACTIVE;
    const isUpcoming = isAfter(alertTime, now) && isBefore(alertTime, addMinutes(now, 60)) && alert.status === AlertStatus.ACTIVE;

    if (alert.status === AlertStatus.COMPLETED) {
      return <Badge variant="outline" className="text-green-600">Concluído</Badge>;
    }
    if (alert.status === AlertStatus.CANCELLED) {
      return <Badge variant="outline" className="text-gray-600">Cancelado</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive">Atrasado</Badge>;
    }
    if (isUpcoming) {
      return <Badge variant="default" className="bg-orange-500">Próximo</Badge>;
    }
    return <Badge variant="outline">Ativo</Badge>;
  };

  const filteredAlerts = leadId 
    ? alerts?.filter((alert: Alert) => alert.leadId === leadId) || []
    : alerts || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Alertas & Lembretes</h3>
        {showCreateButton && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Alerta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Alerta</DialogTitle>
                <DialogDescription>
                  Configure um alerta ou lembrete para follow-up com leads.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leadId" className="text-right">
                    Lead ID
                  </Label>
                  <Input
                    id="leadId"
                    value={formData.leadId}
                    onChange={(e) => setFormData(prev => ({ ...prev, leadId: e.target.value }))}
                    className="col-span-3"
                    placeholder="ID do lead"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as AlertType }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AlertType.FOLLOW_UP}>Follow-up</SelectItem>
                      <SelectItem value={AlertType.REMINDER}>Lembrete</SelectItem>
                      <SelectItem value={AlertType.DEADLINE}>Prazo</SelectItem>
                      <SelectItem value={AlertType.CALLBACK}>Retorno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Título
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="col-span-3"
                    placeholder="Título do alerta"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="message" className="text-right">
                    Mensagem
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="col-span-3"
                    placeholder="Detalhes do alerta"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="alertTime" className="text-right">
                    Data/Hora
                  </Label>
                  <Input
                    id="alertTime"
                    type="datetime-local"
                    value={formData.alertTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, alertTime: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={handleCreateAlert}
                  disabled={createAlert.isPending}
                >
                  {createAlert.isPending ? 'Criando...' : 'Criar Alerta'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando alertas...</div>
      ) : filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum alerta encontrado</p>
              <p className="text-sm">Crie alertas para acompanhar seus leads</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert: Alert) => (
            <Card key={alert.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getAlertTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        {getAlertStatusBadge(alert)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{getAlertTypeLabel(alert.type)}</span>
                        <span>
                          {format(new Date(alert.alertTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {alert.status === AlertStatus.ACTIVE && (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(alert.id, AlertStatus.COMPLETED)}
                        disabled={updateAlertStatus.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(alert.id, AlertStatus.CANCELLED)}
                        disabled={updateAlertStatus.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}