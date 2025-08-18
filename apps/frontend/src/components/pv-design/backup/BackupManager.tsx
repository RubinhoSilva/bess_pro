import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Upload, 
  Download, 
  History, 
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { BackupRestoreManager, BackupData } from '@/lib/backupRestore';
import { formatNumber } from '@/lib/formatters';

interface BackupManagerProps {
  dimensioning: any;
  onRestore?: (restoredData: any) => void;
  userInfo?: {
    userId?: string;
    name?: string;
    email?: string;
  };
  autoSaveEnabled?: boolean;
  maxAutoBackups?: number;
}

const BackupManager: React.FC<BackupManagerProps> = ({
  dimensioning,
  onRestore,
  userInfo,
  autoSaveEnabled = true,
  maxAutoBackups = 10
}) => {
  const { toast } = useToast();
  const [autoBackups, setAutoBackups] = useState<Array<{ key: string; backup: BackupData }>>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    loadAutoBackups();
  }, []);

  // Auto-save when dimensioning changes
  React.useEffect(() => {
    if (!autoSaveEnabled || !dimensioning.dimensioningName) return;
    
    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (delay to avoid saving on every keystroke)
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleCreateAutoBackup(true); // silent auto-save
    }, 30000); // 30 seconds delay
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [dimensioning, autoSaveEnabled]);

  const loadAutoBackups = () => {
    const backups = BackupRestoreManager.listAutoBackups();
    setAutoBackups(backups);
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      BackupRestoreManager.exportBackup(dimensioning, userInfo);
      
      toast({
        title: "Backup exportado com sucesso!",
        description: "O arquivo foi baixado para seu computador.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao exportar backup",
        description: "Não foi possível criar o arquivo de backup.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const backupData = await BackupRestoreManager.importBackup(file);
      const restoredData = BackupRestoreManager.restoreDimensioning(backupData);
      
      if (onRestore) {
        onRestore(restoredData);
      }
      
      toast({
        title: "Backup restaurado com sucesso!",
        description: `Dados de ${backupData.timestamp ? new Date(backupData.timestamp).toLocaleDateString() : 'data desconhecida'} foram carregados.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao importar backup",
        description: `${error}`,
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreateAutoBackup = (silent = false) => {
    // Clean old backups if we exceed the limit
    const currentBackups = BackupRestoreManager.listAutoBackups();
    if (currentBackups.length >= maxAutoBackups) {
      // Sort by timestamp and remove the oldest ones
      const sortedBackups = currentBackups.sort((a, b) => 
        new Date(b.backup.timestamp).getTime() - new Date(a.backup.timestamp).getTime()
      );
      
      // Remove excess backups
      for (let i = maxAutoBackups - 1; i < sortedBackups.length; i++) {
        localStorage.removeItem(sortedBackups[i].key);
      }
    }
    
    BackupRestoreManager.createAutoBackup(dimensioning, userInfo);
    loadAutoBackups();
    setLastAutoSave(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    
    if (!silent) {
      toast({
        title: "Backup automático criado!",
        description: "Seus dados foram salvos localmente.",
      });
    }
  };

  const handleRestoreAutoBackup = (backupKey: string) => {
    try {
      const restoredData = BackupRestoreManager.restoreAutoBackup(backupKey);
      
      if (onRestore) {
        onRestore(restoredData);
      }
      
      toast({
        title: "Backup restaurado!",
        description: "Os dados foram carregados com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao restaurar backup",
        description: `${error}`,
      });
    }
  };

  const handleDeleteAutoBackup = (backupKey: string) => {
    localStorage.removeItem(backupKey);
    loadAutoBackups();
    
    toast({
      title: "Backup removido",
      description: "O backup foi excluído permanentemente.",
    });
  };

  const formatBackupInfo = (backup: BackupData) => {
    const date = new Date(backup.timestamp);
    const customerName = backup.dimensioning?.customer?.name || 'Cliente não identificado';
    const projectName = backup.dimensioning?.projectName || backup.dimensioning?.dimensioningName || 'Sem nome';
    const modules = backup.dimensioning?.numeroModulos || 0;
    const power = backup.dimensioning?.potenciaModulo ? 
      (backup.dimensioning.numeroModulos * backup.dimensioning.potenciaModulo / 1000) : 0;
    const location = backup.dimensioning?.cidade ? 
      `${backup.dimensioning.cidade}, ${backup.dimensioning.estado || ''}`.trim().replace(/,$/, '') : 'Localização não definida';
    const hasFinancialData = !!(backup.dimensioning?.custoEquipamento || backup.dimensioning?.custoMateriais);
    const hasLocationData = !!(backup.dimensioning?.latitude && backup.dimensioning?.longitude);

    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      customerName,
      projectName,
      modules,
      power: formatNumber(power, 1),
      location,
      hasFinancialData,
      hasLocationData
    };
  };

  const getBackupAge = (timestamp: string) => {
    const now = new Date().getTime();
    const backupTime = new Date(timestamp).getTime();
    const diffHours = (now - backupTime) / (1000 * 60 * 60);

    if (diffHours < 1) {
      return 'Há menos de 1 hora';
    } else if (diffHours < 24) {
      return `Há ${Math.floor(diffHours)} horas`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
          <Save className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gerenciador de Backups
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Faça backup e restaure seus dimensionamentos
            {autoSaveEnabled && (
              <span className="ml-2 text-green-600 dark:text-green-400">
                • Auto-save ativo
                {lastAutoSave && ` (último: ${lastAutoSave})`}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Button
          onClick={handleExportBackup}
          disabled={isExporting}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {isExporting ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportar Backup
        </Button>

        <Button
          onClick={handleImportBackup}
          disabled={isImporting}
          variant="outline"
        >
          {isImporting ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Importar Backup
        </Button>

        <Button
          onClick={() => handleCreateAutoBackup()}
          variant="outline"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Local
        </Button>

        <Button
          onClick={() => setShowBackups(!showBackups)}
          variant="outline"
        >
          <History className="w-4 h-4 mr-2" />
          Histórico ({autoBackups.length})
        </Button>
      </div>

      {/* File input hidden */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      {/* Backup History */}
      {showBackups && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-200 dark:border-slate-700 pt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Backups Locais
            </h4>
            <Button
              onClick={loadAutoBackups}
              size="sm"
              variant="ghost"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {autoBackups.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-slate-400">
                Nenhum backup local encontrado
              </p>
              <p className="text-sm text-gray-400 dark:text-slate-500">
                Clique em "Salvar Local" para criar seu primeiro backup
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {autoBackups.map(({ key, backup }) => {
                const info = formatBackupInfo(backup);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {info.projectName}
                        </p>
                        {info.hasFinancialData && (
                          <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                            💰
                          </span>
                        )}
                        {info.hasLocationData && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                            📍
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-400 truncate mt-1">
                        Cliente: {info.customerName}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{info.date} às {info.time}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {info.modules} módulos • {info.power} kWp
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {info.location}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {getBackupAge(backup.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => handleRestoreAutoBackup(key)}
                        size="sm"
                        variant="outline"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Restaurar
                      </Button>
                      <Button
                        onClick={() => handleDeleteAutoBackup(key)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Info Panel */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Informações sobre Backups
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
              <li>• Auto-save automático a cada 30 segundos quando há mudanças</li>
              <li>• Máximo de {maxAutoBackups} backups locais (mais antigos são removidos)</li>
              <li>• Backups exportados (.json) podem ser compartilhados entre dispositivos</li>
              <li>• Ícones: 💰 = dados financeiros, 📍 = localização definida</li>
              <li>• Informações pessoais sensíveis são removidas automaticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;