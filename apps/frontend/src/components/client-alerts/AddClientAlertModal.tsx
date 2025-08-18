import React, { useState } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { useCreateClientAlert } from '../../hooks/client-alert-hooks';
import { AlertType, AlertPriority, CreateClientAlertInput } from '../../types/client-alert';
import { X, Calendar, Flag, Type } from 'lucide-react';

interface AddClientAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string;
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
  [AlertPriority.LOW]: 'text-green-600',
  [AlertPriority.MEDIUM]: 'text-yellow-600',
  [AlertPriority.HIGH]: 'text-orange-600',
  [AlertPriority.URGENT]: 'text-red-600'
};

export default function AddClientAlertModal({ isOpen, onClose, clientId, clientName }: AddClientAlertModalProps) {
  const [formData, setFormData] = useState<CreateClientAlertInput>({
    clientId,
    title: '',
    description: '',
    alertDate: '',
    alertType: AlertType.REMINDER,
    priority: AlertPriority.MEDIUM,
    isRecurring: false,
    recurringPattern: ''
  });

  const createMutation = useCreateClientAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.alertDate) {
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId,
      title: '',
      description: '',
      alertDate: '',
      alertType: AlertType.REMINDER,
      priority: AlertPriority.MEDIUM,
      isRecurring: false,
      recurringPattern: ''
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Novo Alerta
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {clientName && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Cliente:</strong> {clientName}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Enviar proposta comercial"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes do alerta..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="alertDate">Data do Alerta *</Label>
              <Input
                id="alertDate"
                type="datetime-local"
                value={formData.alertDate}
                onChange={(e) => setFormData({ ...formData, alertDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="alertType">Tipo de Alerta</Label>
              <Select
                value={formData.alertType}
                onValueChange={(value) => setFormData({ ...formData, alertType: value as AlertType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(alertTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center space-x-2">
                        <Type className="h-4 w-4" />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as AlertPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center space-x-2">
                        <Flag className={`h-4 w-4 ${priorityColors[value as AlertPriority]}`} />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: !!checked })}
              />
              <Label htmlFor="isRecurring">Alerta recorrente</Label>
            </div>

            {formData.isRecurring && (
              <div>
                <Label htmlFor="recurringPattern">Padrão de Recorrência</Label>
                <Select
                  value={formData.recurringPattern || ''}
                  onValueChange={(value) => setFormData({ ...formData, recurringPattern: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !formData.title || !formData.alertDate}
              >
                {createMutation.isPending ? 'Criando...' : 'Criar Alerta'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}