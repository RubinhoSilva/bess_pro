import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useInviteUserToTeam, InviteUserRequest } from '../../hooks/team-user-hooks';

interface InviteUserFormProps {
  teamId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const InviteUserForm: React.FC<InviteUserFormProps> = ({
  teamId,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<InviteUserRequest>({
    email: '',
    role: 'viewer',
    name: ''
  });

  const inviteUserMutation = useInviteUserToTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      return;
    }

    try {
      await inviteUserMutation.mutateAsync({
        teamId,
        userData: {
          ...formData,
          name: formData.name?.trim() || undefined
        }
      });
      
      // Reset form
      setFormData({ email: '', role: 'viewer', name: '' });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleInputChange = (field: keyof InviteUserRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'viewer', label: 'Visualizador' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="usuario@exemplo.com"
          required
        />
      </div>

      <div>
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Nome completo (opcional)"
        />
      </div>

      <div>
        <Label htmlFor="role">Função *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => handleInputChange('role', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a função" />
          </SelectTrigger>
          <SelectContent>
            {roles.map(role => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={inviteUserMutation.isPending}
          >
            Cancelar
          </Button>
        )}
        
        <Button
          type="submit"
          disabled={inviteUserMutation.isPending || !formData.email.trim()}
        >
          {inviteUserMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
        </Button>
      </div>
    </form>
  );
};