import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LeadInteraction, InteractionType, InteractionDirection } from '../../types/interactions';

const interactionSchema = z.object({
  type: z.nativeEnum(InteractionType),
  direction: z.nativeEnum(InteractionDirection),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título deve ter no máximo 200 caracteres'),
  description: z.string().min(1, 'Descrição é obrigatória').max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  scheduledAt: z.string().optional(),
});

type InteractionFormData = z.infer<typeof interactionSchema>;

interface InteractionFormProps {
  interaction?: LeadInteraction | null;
  onSubmit: (data: InteractionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const typeOptions = [
  { value: InteractionType.CALL, label: 'Ligação' },
  { value: InteractionType.EMAIL, label: 'E-mail' },
  { value: InteractionType.MEETING, label: 'Reunião' },
  { value: InteractionType.WHATSAPP, label: 'WhatsApp' },
  { value: InteractionType.PROPOSAL_SENT, label: 'Proposta Enviada' },
  { value: InteractionType.FOLLOW_UP, label: 'Follow-up' },
  { value: InteractionType.NOTE, label: 'Nota' },
  { value: InteractionType.STAGE_CHANGE, label: 'Mudança de Etapa' },
];

const directionOptions = [
  { value: InteractionDirection.INCOMING, label: 'Recebido' },
  { value: InteractionDirection.OUTGOING, label: 'Enviado' },
  { value: InteractionDirection.INTERNAL, label: 'Interno' },
];

export const InteractionForm: React.FC<InteractionFormProps> = ({
  interaction,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      type: interaction?.type || InteractionType.NOTE,
      direction: interaction?.direction || InteractionDirection.OUTGOING,
      title: interaction?.title || '',
      description: interaction?.description || '',
      scheduledAt: interaction?.scheduledAt ? 
        new Date(interaction.scheduledAt).toISOString().slice(0, 16) : '',
    },
  });

  const watchedType = watch('type');
  const watchedDirection = watch('direction');

  const handleFormSubmit = (data: InteractionFormData) => {
    const submitData = {
      ...data,
      scheduledAt: data.scheduledAt || undefined,
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Interação</Label>
          <Select 
            value={watchedType} 
            onValueChange={(value) => setValue('type', value as InteractionType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="direction">Direção</Label>
          <Select 
            value={watchedDirection} 
            onValueChange={(value) => setValue('direction', value as InteractionDirection)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a direção" />
            </SelectTrigger>
            <SelectContent>
              {directionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.direction && (
            <p className="text-sm text-red-600">{errors.direction.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Ex: Ligação de follow-up sobre proposta"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descreva os detalhes desta interação..."
          rows={4}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduledAt">Agendamento (opcional)</Label>
        <Input
          id="scheduledAt"
          type="datetime-local"
          {...register('scheduledAt')}
          className={errors.scheduledAt ? 'border-red-500' : ''}
        />
        {errors.scheduledAt && (
          <p className="text-sm text-red-600">{errors.scheduledAt.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Deixe em branco se não for uma ação agendada
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : interaction ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
};