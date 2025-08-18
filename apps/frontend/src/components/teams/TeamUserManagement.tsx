import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Mail,
  Shield,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../ui/alert-dialog';
import { InviteUserForm } from './InviteUserForm';
import { 
  useTeamUsers, 
  useUpdateUserRole, 
  useRemoveUserFromTeam,
  TeamUser 
} from '../../hooks/team-user-hooks';

interface TeamUserManagementProps {
  teamId: string;
  teamName: string;
}

export const TeamUserManagement: React.FC<TeamUserManagementProps> = ({
  teamId,
  teamName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [removingUser, setRemovingUser] = useState<TeamUser | null>(null);
  const [newRole, setNewRole] = useState('');

  const { data: users = [], isLoading, error } = useTeamUsers(teamId);
  const updateRoleMutation = useUpdateUserRole();
  const removeUserMutation = useRemoveUserFromTeam();

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleNames: Record<string, string> = {
    'team_owner': 'Proprietário',
    'admin': 'Administrador',
    'vendedor': 'Vendedor',
    'viewer': 'Visualizador'
  };

  const roleColors: Record<string, string> = {
    'team_owner': 'bg-purple-100 text-purple-800',
    'admin': 'bg-blue-100 text-blue-800',
    'vendedor': 'bg-green-100 text-green-800',
    'viewer': 'bg-gray-100 text-gray-800'
  };

  const handleRoleUpdate = async (userId: string, role: string) => {
    await updateRoleMutation.mutateAsync({
      teamId,
      userId,
      roleData: { role }
    });
    setEditingUser(null);
  };

  const handleUserRemoval = async (userId: string) => {
    await removeUserMutation.mutateAsync({
      teamId,
      userId
    });
    setRemovingUser(null);
  };

  const openEditDialog = (user: TeamUser) => {
    setEditingUser(user);
    setNewRole(user.role);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar usuários do team</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 h-6 w-6" />
            Usuários - {teamName}
          </h2>
          <p className="text-gray-500 mt-1">
            Gerencie os usuários e permissões do seu team
          </p>
        </div>
        
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Convidar Usuário</DialogTitle>
            </DialogHeader>
            <InviteUserForm
              teamId={teamId}
              onSuccess={() => setIsInviteDialogOpen(false)}
              onCancel={() => setIsInviteDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adicionado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="mr-1 h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      roleColors[user.role] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {roleNames[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : user.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : user.status === 'removed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' 
                        ? 'Ativo' 
                        : user.status === 'pending' 
                        ? 'Pendente' 
                        : user.status === 'removed'
                        ? 'Removido do Team'
                        : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.role !== 'team_owner' && user.status !== 'removed' && (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Alterar Função
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setRemovingUser(user)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover do Team
                            </DropdownMenuItem>
                          </>
                        )}
                        {user.status === 'removed' && (
                          <DropdownMenuItem disabled className="text-gray-400">
                            <Shield className="mr-2 h-4 w-4" />
                            Usuário Removido
                          </DropdownMenuItem>
                        )}
                        {user.role === 'team_owner' && (
                          <DropdownMenuItem disabled>
                            <Shield className="mr-2 h-4 w-4" />
                            Proprietário do Team
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece convidando um usuário'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Função</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Alterar a função de <strong>{editingUser?.name}</strong>:</p>
            <select 
              value={newRole} 
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
              <option value="viewer">Visualizador</option>
            </select>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => editingUser && handleRoleUpdate(editingUser.id, newRole)}
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove User Dialog */}
      <AlertDialog open={!!removingUser} onOpenChange={() => setRemovingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{removingUser?.name}</strong> do team?
              O usuário perderá acesso a todos os recursos do team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemovingUser(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingUser && handleUserRemoval(removingUser.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeUserMutation.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};