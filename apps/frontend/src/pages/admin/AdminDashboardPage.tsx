import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building2, 
  Shield, 
  Activity, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import { useTeams, useInactivateTeam } from '../../hooks/team-hooks';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { TeamForm } from '../../components/teams/TeamForm';
import { TeamUserManagement } from '../../components/teams/TeamUserManagement';
import { Team } from '../../types/team';

const AdminDashboardPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [managingUsersTeam, setManagingUsersTeam] = useState<Team | null>(null);

  const { data: teams = [], isLoading, error } = useTeams({
    isActive: showActiveOnly ? true : undefined
  });

  const inactivateTeamMutation = useInactivateTeam();

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.ownerName && team.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    totalTeams: teams.length,
    activeTeams: teams.filter(t => t.isActive).length,
    totalUsers: teams.reduce((sum, team) => sum + (team.currentUsers || 0), 0),
    premiumTeams: teams.filter(t => t.planType === 'premium').length
  };

  const openTeamForm = (team?: Team) => {
    setEditingTeam(team || null);
    setIsTeamFormOpen(true);
  };

  const closeTeamForm = () => {
    setEditingTeam(null);
    setIsTeamFormOpen(false);
  };

  const openDeleteDialog = (team: Team) => {
    setDeletingTeam(team);
  };

  const openUserManagement = (team: Team) => {
    setManagingUsersTeam(team);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar dashboard de admin</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard Administrativo
          </h1>
          <p className="text-gray-500 mt-2">
            Gerencie teams e usuários da plataforma
          </p>
        </div>
        
        <Button onClick={() => openTeamForm()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Team
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Teams Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Teams Premium</p>
              <p className="text-2xl font-bold text-gray-900">{stats.premiumTeams}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg p-4 shadow-sm border"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Apenas ativos</span>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Teams Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuários
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{team.name}</div>
                      {team.description && (
                        <div className="text-sm text-gray-500">{team.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {team.ownerName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">{team.ownerEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      team.planType === 'premium' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : team.planType === 'enterprise'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {team.planType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {team.currentUsers || 0} / {team.maxUsers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      team.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {team.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(team.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUserManagement(team)}
                        title="Gerenciar usuários"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTeamForm(team)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {team.ownerRole !== 'super_admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(team)}
                          className="text-red-600 hover:text-red-700"
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

        {filteredTeams.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum team encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando um novo team'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Team Form Dialog */}
      <Dialog open={isTeamFormOpen} onOpenChange={setIsTeamFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? 'Editar Team' : 'Novo Team'}
            </DialogTitle>
          </DialogHeader>
          <TeamForm
            team={editingTeam}
            onSubmit={closeTeamForm}
            onCancel={closeTeamForm}
          />
        </DialogContent>
      </Dialog>

      {/* Inactivate Confirmation Dialog */}
      <AlertDialog open={!!deletingTeam} onOpenChange={() => setDeletingTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar Team</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja inativar o team "{deletingTeam?.name}"?
              O team ficará inativo mas poderá ser reativado posteriormente. 
              Usuários do team não conseguirão acessar a plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingTeam(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deletingTeam) {
                  inactivateTeamMutation.mutate(deletingTeam.id, {
                    onSuccess: () => {
                      setDeletingTeam(null);
                    }
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={inactivateTeamMutation.isPending}
            >
              {inactivateTeamMutation.isPending ? 'Inativando...' : 'Inativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Management Dialog */}
      <Dialog open={!!managingUsersTeam} onOpenChange={() => setManagingUsersTeam(null)}>
        <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Usuários</DialogTitle>
          </DialogHeader>
          {managingUsersTeam && (
            <TeamUserManagement
              teamId={managingUsersTeam.id}
              teamName={managingUsersTeam.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardPage;