import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, 
  Battery, 
  MapPin, 
  Calendar,
  FileText,
  Zap,
  User,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import { ProjectSummary, ProjectType } from '@/types/project';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectCardProps {
  project: ProjectSummary;
  onOpen: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getProjectTypeColor = () => {
    switch (project.projectType) {
      case ProjectType.PV: return 'from-yellow-500 to-orange-500';
      case ProjectType.BESS: return 'from-green-500 to-blue-500';
      case ProjectType.HYBRID: return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getProjectTypeIcon = () => {
    switch (project.projectType) {
      case ProjectType.PV: return <Sun className="w-4 h-4 text-white" />;
      case ProjectType.BESS: return <Battery className="w-4 h-4 text-white" />;
      case ProjectType.HYBRID: return <Zap className="w-4 h-4 text-white" />;
      default: return <FileText className="w-4 h-4 text-white" />;
    }
  };

  const getProjectTypeName = () => {
    switch (project.projectType) {
      case ProjectType.PV: return 'Fotovoltaico';
      case ProjectType.BESS: return 'BESS';
      case ProjectType.HYBRID: return 'Híbrido';
      default: return project.projectType;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'calculated': case 'simulated': return 'text-blue-600';
      case 'draft': return 'text-yellow-600';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getStatusText = (status?: string, type?: 'pv' | 'bess') => {
    if (!status) return null;
    
    if (type === 'pv') {
      switch (status) {
        case 'approved': return 'Aprovado';
        case 'calculated': return 'Calculado';
        case 'draft': return 'Rascunho';
        default: return status;
      }
    } else {
      switch (status) {
        case 'approved': return 'Aprovado';
        case 'simulated': return 'Simulado';
        case 'draft': return 'Rascunho';
        default: return status;
      }
    }
  };

  const hasAnalyses = project.totalPVDimensionings > 0 || project.totalBESSAnalyses > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 bg-gradient-to-r ${getProjectTypeColor()} rounded-lg shadow-sm`}>
                  {getProjectTypeIcon()}
                </div>
                <div>
                  <CardTitle 
                    className="text-lg font-semibold text-foreground group-hover:text-blue-600 transition-colors cursor-pointer"
                    onClick={onOpen}
                  >
                    {project.projectName}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {getProjectTypeName()}
                    </Badge>
                    {project.hasLocation && (
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        Localização
                      </Badge>
                    )}
                    {project.hasLead && (
                      <Badge variant="outline" className="text-xs">
                        <User className="w-3 h-3 mr-1" />
                        Lead
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.()}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.()}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => onDelete?.()}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent onClick={onOpen}>
          <div className="space-y-4">
            {/* Address and Date */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{project.address}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(project.savedAt)}</span>
              </div>
            </div>

            {/* Analysis Preview */}
            <div className="grid grid-cols-2 gap-4">
              {/* PV Dimensionings */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Dimensionamentos PV</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">
                    {project.totalPVDimensionings}
                  </span>
                  {project.lastPVStatus && (
                    <Badge variant="outline" className="text-xs">
                      <span className={`w-2 h-2 rounded-full mr-1 ${
                        project.lastPVStatus === 'approved' ? 'bg-green-500' : 
                        project.lastPVStatus === 'calculated' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`} />
                      {getStatusText(project.lastPVStatus, 'pv')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* BESS Analyses */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Análises BESS</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">
                    {project.totalBESSAnalyses}
                  </span>
                  {project.lastBESSStatus && (
                    <Badge variant="outline" className="text-xs">
                      <span className={`w-2 h-2 rounded-full mr-1 ${
                        project.lastBESSStatus === 'approved' ? 'bg-green-500' : 
                        project.lastBESSStatus === 'simulated' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`} />
                      {getStatusText(project.lastBESSStatus, 'bess')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions or Status */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              {hasAnalyses ? (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  <span>
                    {project.totalPVDimensionings + project.totalBESSAnalyses} análises total
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  <span>Nenhuma análise criada</span>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Abrir projeto
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;