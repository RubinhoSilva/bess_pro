// Sistema de backup e restore para dimensionamentos

export interface BackupData {
  version: string;
  timestamp: string;
  userInfo: {
    userId?: string;
    userName?: string;
    email?: string;
  };
  dimensioning: any;
  metadata: {
    systemVersion: string;
    calculatorVersion: string;
    equipmentVersion?: string;
  };
  checksum?: string;
}

export interface RestoreOptions {
  validateVersion?: boolean;
  mergeMode?: 'replace' | 'merge' | 'append';
  skipValidation?: boolean;
}

export class BackupRestoreManager {
  private static readonly CURRENT_VERSION = '1.0';
  private static readonly SYSTEM_VERSION = '2024.1';

  // Criar backup completo
  static createBackup(dimensioning: any, userInfo?: any): BackupData {
    const timestamp = new Date().toISOString();
    
    const backupData: BackupData = {
      version: this.CURRENT_VERSION,
      timestamp,
      userInfo: {
        userId: userInfo?.userId,
        userName: userInfo?.name,
        email: userInfo?.email
      },
      dimensioning: this.sanitizeDimensioning(dimensioning),
      metadata: {
        systemVersion: this.SYSTEM_VERSION,
        calculatorVersion: this.CURRENT_VERSION,
        equipmentVersion: this.getEquipmentVersion()
      }
    };

    // Calcular checksum para integridade
    backupData.checksum = this.calculateChecksum(backupData);

    return backupData;
  }

  // Exportar backup como arquivo JSON
  static exportBackup(dimensioning: any, userInfo?: any, filename?: string): void {
    const backup = this.createBackup(dimensioning, userInfo);
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    
    const defaultFilename = `dimensionamento_backup_${this.formatDateForFilename(backup.timestamp)}.json`;
    const finalFilename = filename || defaultFilename;
    
    this.downloadFile(blob, finalFilename);
  }

  // Importar backup de arquivo
  static async importBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const backupData: BackupData = JSON.parse(content);
          
          // Validar estrutura básica
          if (!this.validateBackupStructure(backupData)) {
            throw new Error('Arquivo de backup inválido ou corrompido');
          }
          
          // Verificar checksum se disponível
          if (backupData.checksum) {
            const originalChecksum = backupData.checksum;
            const tempData = { ...backupData };
            delete tempData.checksum;
            const calculatedChecksum = this.calculateChecksum(tempData);
            
            if (originalChecksum !== calculatedChecksum) {
              throw new Error('Checksum do backup não confere - arquivo pode estar corrompido');
            }
          }
          
          resolve(backupData);
        } catch (error) {
          reject(new Error(`Erro ao processar backup: ${error}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }

  // Restaurar dimensionamento do backup
  static restoreDimensioning(
    backupData: BackupData, 
    options: RestoreOptions = {}
  ): any {
    const { validateVersion = true, mergeMode = 'replace', skipValidation = false } = options;

    if (!skipValidation) {
      this.validateBackupForRestore(backupData, validateVersion);
    }

    const restoredDimensioning = this.processRestoreData(
      backupData.dimensioning,
      mergeMode
    );

    // Aplicar migrações se necessário
    if (backupData.version !== this.CURRENT_VERSION) {
      return this.migrateData(restoredDimensioning, backupData.version, this.CURRENT_VERSION);
    }

    return restoredDimensioning;
  }

  // Criar backup automático local
  static createAutoBackup(dimensioning: any, userInfo?: any): void {
    const backup = this.createBackup(dimensioning, userInfo);
    const key = `auto_backup_${Date.now()}`;
    
    try {
      localStorage.setItem(key, JSON.stringify(backup));
      
      // Manter apenas os 5 backups mais recentes
      this.cleanupAutoBackups();
    } catch (error) {
      // Silently fail for auto backup
    }
  }

  // Listar backups automáticos disponíveis
  static listAutoBackups(): Array<{ key: string; backup: BackupData }> {
    const backups: Array<{ key: string; backup: BackupData }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('auto_backup_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const backup = JSON.parse(data);
            backups.push({ key, backup });
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    }
    
    return backups.sort((a, b) => 
      new Date(b.backup.timestamp).getTime() - new Date(a.backup.timestamp).getTime()
    );
  }

  // Restaurar backup automático
  static restoreAutoBackup(backupKey: string, options?: RestoreOptions): any {
    const data = localStorage.getItem(backupKey);
    if (!data) {
      throw new Error('Backup não encontrado');
    }

    const backup: BackupData = JSON.parse(data);
    return this.restoreDimensioning(backup, options);
  }

  // Comparar dois dimensionamentos
  static compareDimensionings(dim1: any, dim2: any): {
    differences: Array<{ path: string; oldValue: any; newValue: any }>;
    summary: { added: number; modified: number; removed: number };
  } {
    const differences: Array<{ path: string; oldValue: any; newValue: any }> = [];
    
    const compare = (obj1: any, obj2: any, path: string = '') => {
      if (obj1 === obj2) return;
      
      if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        differences.push({ path, oldValue: obj1, newValue: obj2 });
        return;
      }
      
      const keys1 = Object.keys(obj1 || {});
      const keys2 = Object.keys(obj2 || {});
      const allKeys = [...keys1, ...keys2];
      const uniqueKeys = Array.from(new Set(allKeys));
      
      for (const key of uniqueKeys) {
        const newPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj1)) {
          differences.push({ path: newPath, oldValue: undefined, newValue: obj2[key] });
        } else if (!(key in obj2)) {
          differences.push({ path: newPath, oldValue: obj1[key], newValue: undefined });
        } else {
          compare(obj1[key], obj2[key], newPath);
        }
      }
    };
    
    compare(dim1, dim2);
    
    const summary = {
      added: differences.filter(d => d.oldValue === undefined).length,
      modified: differences.filter(d => d.oldValue !== undefined && d.newValue !== undefined).length,
      removed: differences.filter(d => d.newValue === undefined).length
    };
    
    return { differences, summary };
  }

  // Utility functions
  private static sanitizeDimensioning(dimensioning: any): any {
    const sanitized = { ...dimensioning };
    
    // Remover dados sensíveis ou desnecessários
    delete sanitized.id;
    delete sanitized.userId;
    delete sanitized.createdAt;
    delete sanitized.updatedAt;
    
    // Sanitizar campos específicos
    if (sanitized.customer) {
      const customer = { ...sanitized.customer };
      // Remover informações sensíveis se necessário
      sanitized.customer = customer;
    }
    
    return sanitized;
  }

  private static validateBackupStructure(backup: any): boolean {
    return (
      backup &&
      typeof backup === 'object' &&
      backup.version &&
      backup.timestamp &&
      backup.dimensioning &&
      backup.metadata
    );
  }

  private static validateBackupForRestore(backup: BackupData, validateVersion: boolean): void {
    if (validateVersion && backup.version !== this.CURRENT_VERSION) {
      const isCompatible = this.isVersionCompatible(backup.version, this.CURRENT_VERSION);
      if (!isCompatible) {
        throw new Error(
          `Versão do backup (${backup.version}) incompatível com a versão atual (${this.CURRENT_VERSION})`
        );
      }
    }
    
    // Validações adicionais
    const age = Date.now() - new Date(backup.timestamp).getTime();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 ano
    
    if (age > maxAge) {
      // Backup muito antigo - pode haver problemas de compatibilidade
    }
  }

  private static processRestoreData(data: any, mergeMode: string): any {
    switch (mergeMode) {
      case 'replace':
        return { ...data };
      case 'merge':
        // Em implementação real, faria merge inteligente
        return { ...data };
      case 'append':
        // Em implementação real, faria append de arrays/listas
        return { ...data };
      default:
        return { ...data };
    }
  }

  private static migrateData(data: any, fromVersion: string, toVersion: string): any {
    // Sistema de migração - implementar conforme necessário
    let migrated = { ...data };
    
    // Exemplo de migração
    if (fromVersion < '1.0' && toVersion >= '1.0') {
      // Migrar estrutura antiga para nova
      migrated = this.migrateFrom0_9To1_0(migrated);
    }
    
    return migrated;
  }

  private static migrateFrom0_9To1_0(data: any): any {
    // Exemplo de migração específica
    const migrated = { ...data };
    
    // Migrar campos renomeados
    if (migrated.oldFieldName) {
      migrated.newFieldName = migrated.oldFieldName;
      delete migrated.oldFieldName;
    }
    
    return migrated;
  }

  private static cleanupAutoBackups(): void {
    const backups = this.listAutoBackups();
    
    // Manter apenas os 5 mais recentes
    if (backups.length > 5) {
      const toDelete = backups.slice(5);
      toDelete.forEach(backup => {
        localStorage.removeItem(backup.key);
      });
    }
  }

  private static calculateChecksum(data: any): string {
    // Implementação simples de checksum - em produção usar biblioteca específica
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  private static isVersionCompatible(version1: string, version2: string): boolean {
    // Implementação simplificada de compatibilidade de versões
    const [major1] = version1.split('.').map(Number);
    const [major2] = version2.split('.').map(Number);
    
    return major1 === major2;
  }

  private static getEquipmentVersion(): string {
    // Retornar versão da base de equipamentos
    return '2024.1';
  }

  private static formatDateForFilename(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toISOString().replace(/[:.]/g, '-').split('T')[0];
  }

  private static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Método para criar snapshot rápido (apenas dados essenciais)
  static createQuickSnapshot(dimensioning: any): string {
    const essential = {
      customer: dimensioning.customer?.name || 'Cliente',
      potenciaPico: dimensioning.potenciaModulo * dimensioning.numeroModulos / 1000,
      numeroModulos: dimensioning.numeroModulos,
      investimento: (dimensioning.custoEquipamento || 0) + 
                   (dimensioning.custoMateriais || 0) + 
                   (dimensioning.custoMaoDeObra || 0),
      timestamp: new Date().toISOString()
    };

    return btoa(JSON.stringify(essential));
  }

  // Decodificar snapshot rápido
  static decodeQuickSnapshot(snapshot: string): any {
    try {
      return JSON.parse(atob(snapshot));
    } catch {
      return null;
    }
  }
}
