import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../ui/use-toast';
import { useExportProjectBackup, useImportProjectBackup, downloadBackupFromFile, ProjectBackupData } from '../../hooks/project-backup-hooks';
import { Download, Upload, FileDown, FileUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Project } from '../../types/project';

interface ProjectBackupManagerProps {
  project?: Project;
  onImportSuccess?: () => void;
}

export const ProjectBackupManager: React.FC<ProjectBackupManagerProps> = ({ 
  project, 
  onImportSuccess 
}) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<ProjectBackupData | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const exportBackupMutation = useExportProjectBackup();
  const importBackupMutation = useImportProjectBackup();

  const handleExportBackup = async () => {
    if (!project) {
      toast({
        title: 'Erro',
        description: 'Nenhum projeto selecionado para exportar',
        variant: 'destructive',
      });
      return;
    }

    try {
      await exportBackupMutation.mutateAsync(project.id);
      toast({
        title: 'Backup exportado com sucesso',
        description: 'O arquivo de backup foi baixado automaticamente',
      });
    } catch (error) {
      toast({
        title: 'Erro ao exportar backup',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    try {
      const data = await downloadBackupFromFile(file);
      setBackupData(data);
      setNewProjectName(`${data.project.name} (Importado)`);
      
      toast({
        title: 'Arquivo carregado com sucesso',
        description: 'Backup validado e pronto para importação',
      });
    } catch (error) {
      toast({
        title: 'Erro ao carregar arquivo',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setSelectedFile(null);
      setBackupData(null);
    }
  };

  const handleImportBackup = async () => {
    if (!backupData) {
      toast({
        title: 'Erro',
        description: 'Nenhum backup carregado',
        variant: 'destructive',
      });
      return;
    }

    try {
      await importBackupMutation.mutateAsync({
        backupData,
        newProjectName: newProjectName.trim() || undefined,
      });
      
      toast({
        title: 'Projeto importado com sucesso',
        description: `O projeto "${newProjectName}" foi criado a partir do backup`,
      });

      // Reset form
      setSelectedFile(null);
      setBackupData(null);
      setNewProjectName('');
      setIsImportDialogOpen(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onImportSuccess?.();
    } catch (error) {
      toast({
        title: 'Erro ao importar backup',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setBackupData(null);
    setNewProjectName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      {/* Export Backup Button */}
      {project && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={!project || exportBackupMutation.isPending}
            >
              {exportBackupMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar Backup
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Exportar Backup do Projeto</AlertDialogTitle>
              <AlertDialogDescription>
                Isso criará um arquivo de backup completo do projeto "{project.projectName}" incluindo:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Dados do projeto</li>
                  <li>Áreas de montagem</li>
                  <li>Modelos 3D (metadados)</li>
                  <li>Configurações</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleExportBackup}>
                Exportar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Import Backup Button */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar Backup
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Backup de Projeto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Selection */}
            <div className="space-y-2">
              <Label htmlFor="backup-file">Arquivo de Backup</Label>
              <Input
                ref={fileInputRef}
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={importBackupMutation.isPending}
              />
            </div>

            {/* Backup Info */}
            {backupData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Backup Validado
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Projeto:</strong> {backupData.project.name}
                    </div>
                    <div>
                      <strong>Tipo:</strong> {backupData.project.type}
                    </div>
                    <div>
                      <strong>Áreas:</strong> {backupData.areas.length}
                    </div>
                    <div>
                      <strong>Modelos 3D:</strong> {backupData.models3d.length}
                    </div>
                    <div>
                      <strong>Exportado em:</strong> {new Date(backupData.metadata.exportedAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* New Project Name */}
            {backupData && (
              <div className="space-y-2">
                <Label htmlFor="new-project-name">Nome do Novo Projeto</Label>
                <Input
                  id="new-project-name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Digite o nome do novo projeto"
                  disabled={importBackupMutation.isPending}
                />
              </div>
            )}

            {/* Warning */}
            {backupData && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Um novo projeto será criado. O backup não modificará projetos existentes.
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClearSelection}>
              Limpar
            </Button>
            <Button 
              onClick={handleImportBackup}
              disabled={!backupData || !newProjectName.trim() || importBackupMutation.isPending}
            >
              {importBackupMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4 mr-2" />
              )}
              Importar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};