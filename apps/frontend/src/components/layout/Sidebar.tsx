import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  BarChart3, 
  Zap, 
  Users, 
  Briefcase,
  Settings,
  User,
  LogOut,
  TrendingUp,
  Battery,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCog,
  Package,
  MapPin,
  Box,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';
import { useAuth } from '../../hooks/auth-hooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const navigation = [
  { name: 'Dashboard', href: '/dashboard/services', icon: Home },
  { name: 'CRM', href: '/dashboard/crm', icon: Briefcase },
  { name: 'Projetos', href: '/dashboard/projects', icon: Zap },
  { name: 'Análise BESS', href: '/dashboard/bess-analysis', icon: Battery },
  { name: 'Dimensionamento PV', href: '/dashboard/pv-design', icon: TrendingUp },
  // { name: 'Visualizador 3D', href: '/dashboard/model3d-viewer', icon: Box }, // Temporariamente desabilitado
  // { name: 'Mapas & Localização', href: '/dashboard/geo-map', icon: MapPin }, // Temporariamente desabilitado
  { name: 'Clientes', href: '/dashboard/clients', icon: Users },
  { name: 'Equipamentos', href: '/dashboard/equipment', icon: Package },
  // { name: 'Templates de Proposta', href: '/dashboard/proposal-templates', icon: FileText }, // Temporariamente desabilitado
  { name: 'Relatórios', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Agenda', href: '/dashboard/calendar', icon: Calendar },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Verificar se o usuário é super admin (acesso ao menu admin)
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Verificar se o usuário pode gerenciar seu próprio team
  const canManageTeam = user?.role === 'team_owner' || user?.role === 'admin';
  
  // Verificar se o usuário pode acessar relatórios (apenas team_owner ou superior)
  const canAccessReports = user?.role === 'team_owner' || user?.role === 'admin' || user?.role === 'super_admin';

  // Filtrar navegação baseado nas permissões do usuário
  const filteredNavigation = navigation.filter(item => {
    // Restringir relatórios apenas para donos de team
    if (item.href === '/dashboard/reports') {
      return canAccessReports;
    }
    return true; // Outros itens são acessíveis por todos
  });

  return (
    <div className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link to="/dashboard/services" className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">BESS Pro</span>
            </Link>
          )}
          
          {isCollapsed && (
            <div className="flex justify-center w-full">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
        
        {/* Admin menu item */}
        {isSuperAdmin && (
          <Link
            to="/dashboard/admin"
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
              location.pathname === '/dashboard/admin'
                ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            title={isCollapsed ? 'Admin' : undefined}
          >
            <Shield className={`w-5 h-5 ${location.pathname === '/dashboard/admin' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
            {!isCollapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {isCollapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full p-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.name}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              {canManageTeam && (
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/team" className="flex items-center gap-2">
                    <UserCog className="w-4 h-4" />
                    Meu Time
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              {canManageTeam && (
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/team" className="flex items-center gap-2">
                    <UserCog className="w-4 h-4" />
                    Meu Time
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Theme Toggle & Collapse */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Theme Toggle */}
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
        
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Recolher
            </>
          )}
        </Button>
      </div>
    </div>
  );
}