import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useAuth } from '../../hooks/auth-hooks';
import { TeamUserManagement } from '../../components/teams/TeamUserManagement';

const TeamManagementPage: React.FC = () => {
  const { user } = useAuth();

  // Se o usuário não tem teamId, não pode gerenciar team
  if (!user?.teamId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum team encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Você não está associado a nenhum team ou não tem permissões para gerenciá-lo.
          </p>
        </div>
      </div>
    );
  }

  // Se não é admin ou team_owner, não pode gerenciar
  if (user.role !== 'team_owner' && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso negado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Você não tem permissões para gerenciar usuários do team.
          </p>
        </div>
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
            Gerenciar Meu Time
          </h1>
          <p className="text-gray-500 mt-2">
            Gerencie os usuários e permissões do seu team
          </p>
        </div>
      </motion.div>

      {/* Team User Management Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TeamUserManagement
          teamId={user.teamId}
          teamName={user.company || 'Meu Time'}
        />
      </motion.div>
    </div>
  );
};

export default TeamManagementPage;