import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useCreateTeam, useUpdateTeam } from '../../hooks/team-hooks';
import { Team } from '../../types/team';

const teamSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  ownerEmail: z.string().email('Email inválido'),
  planType: z.enum(['basic', 'premium', 'enterprise']),
  maxUsers: z.number().min(1, 'Mínimo 1 usuário').max(1000, 'Máximo 1000 usuários'),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormProps {
  team?: Team | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({ team, onSubmit, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: team?.name || '',
      description: team?.description || '',
      ownerEmail: team?.ownerEmail || '',
      planType: (team?.planType as any) || 'basic',
      maxUsers: team?.maxUsers || 10,
    }
  });

  const planType = watch('planType');

  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
        description: team.description || '',
        ownerEmail: team.ownerEmail,
        planType: team.planType as any,
        maxUsers: team.maxUsers,
      });
    }
  }, [team, reset]);

  const onFormSubmit = async (data: TeamFormData) => {
    setIsLoading(true);
    
    try {
      if (team) {
        // Update existing team
        await updateTeamMutation.mutateAsync({
          id: team.id,
          data: {
            name: data.name,
            description: data.description,
            planType: data.planType,
            maxUsers: data.maxUsers,
          }
        });
      } else {
        // Create new team - backend will create user if needed
        await createTeamMutation.mutateAsync({
          name: data.name,
          description: data.description,
          ownerId: '1', // Usar ID simulado por enquanto
          ownerEmail: data.ownerEmail,
          planType: data.planType,
          maxUsers: data.maxUsers,
        });
      }
      
      onSubmit();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanLimits = (plan: string) => {
    switch (plan) {
      case 'basic': return { maxUsers: 10, features: 'Funcionalidades básicas' };
      case 'premium': return { maxUsers: 50, features: 'Todas as funcionalidades + relatórios avançados' };
      case 'enterprise': return { maxUsers: 1000, features: 'Funcionalidades completas + suporte prioritário' };
      default: return { maxUsers: 10, features: 'Funcionalidades básicas' };
    }
  };

  const planLimits = getPlanLimits(planType);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome do Team
        </label>
        <Input
          {...register('name')}
          placeholder="Ex: Empresa Solar ABC"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição (opcional)
        </label>
        <Input
          {...register('description')}
          placeholder="Descrição do team..."
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email do Owner
        </label>
        <Input
          {...register('ownerEmail')}
          type="email"
          placeholder="owner@exemplo.com"
          disabled={isLoading || !!team} // Não permitir editar email se editando
        />
        {errors.ownerEmail && (
          <p className="text-sm text-red-600 mt-1">{errors.ownerEmail.message}</p>
        )}
        {team && (
          <p className="text-xs text-gray-500 mt-1">Email do owner não pode ser alterado</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Plano
        </label>
        <Select
          value={planType}
          onValueChange={(value) => setValue('planType', value as any)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Básico</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">{planLimits.features}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Máximo de Usuários
        </label>
        <Input
          {...register('maxUsers', { valueAsNumber: true })}
          type="number"
          min={1}
          max={planLimits.maxUsers}
          disabled={isLoading}
        />
        {errors.maxUsers && (
          <p className="text-sm text-red-600 mt-1">{errors.maxUsers.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Máximo permitido para o plano {planType}: {planLimits.maxUsers} usuários
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : team ? 'Atualizar' : 'Criar Team'}
        </Button>
      </div>
    </form>
  );
};