// Sistema de notificações para aplicação

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: string;
  actionUrl?: string;
  actionText?: string;
  persistent?: boolean;
  autoHide?: boolean;
  hideAfter?: number; // milliseconds
}

export interface NotificationOptions {
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: string;
  actionUrl?: string;
  actionText?: string;
  persistent?: boolean;
  autoHide?: boolean;
  hideAfter?: number;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];
  private storage_key = 'app_notifications';

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Adicionar notificação
  addNotification(
    title: string, 
    message: string, 
    options: NotificationOptions = {}
  ): string {
    const notification: Notification = {
      id: this.generateId(),
      type: options.type || 'info',
      title,
      message,
      timestamp: new Date(),
      read: false,
      category: options.category || 'general',
      actionUrl: options.actionUrl,
      actionText: options.actionText,
      persistent: options.persistent || false,
      autoHide: options.autoHide !== false, // true by default
      hideAfter: options.hideAfter || 5000
    };

    this.notifications.unshift(notification);
    this.saveToStorage();
    this.notifyListeners();

    // Auto-hide se configurado
    if (notification.autoHide && !notification.persistent) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.hideAfter);
    }

    return notification.id;
  }

  // Métodos de conveniência
  info(title: string, message: string, options?: NotificationOptions): string {
    return this.addNotification(title, message, { ...options, type: 'info' });
  }

  success(title: string, message: string, options?: NotificationOptions): string {
    return this.addNotification(title, message, { ...options, type: 'success' });
  }

  warning(title: string, message: string, options?: NotificationOptions): string {
    return this.addNotification(title, message, { ...options, type: 'warning' });
  }

  error(title: string, message: string, options?: NotificationOptions): string {
    return this.addNotification(title, message, { 
      ...options, 
      type: 'error', 
      persistent: true,
      autoHide: false 
    });
  }

  // Notificações específicas do domínio
  calculationComplete(results: any): string {
    return this.success(
      'Cálculo Concluído!',
      `Sistema de ${results.potenciaPico?.toFixed(1)}kWp dimensionado com sucesso`,
      {
        category: 'calculation',
        actionUrl: '/results',
        actionText: 'Ver Resultados'
      }
    );
  }

  validationIssue(issueCount: number, severity: 'error' | 'warning'): string {
    const title = severity === 'error' ? 'Erros Encontrados' : 'Avisos de Validação';
    const message = `${issueCount} ${severity === 'error' ? 'erro(s)' : 'aviso(s)'} encontrado(s) no dimensionamento`;
    
    return this.addNotification(title, message, {
      type: severity,
      category: 'validation',
      persistent: severity === 'error'
    });
  }

  backupCreated(backupType: 'manual' | 'auto'): string {
    const title = backupType === 'manual' ? 'Backup Exportado' : 'Backup Automático';
    const message = backupType === 'manual' 
      ? 'Arquivo de backup baixado com sucesso'
      : 'Seus dados foram salvos automaticamente';

    return this.success(title, message, {
      category: 'backup'
    });
  }

  equipmentUpdated(count: number): string {
    return this.info(
      'Base de Equipamentos Atualizada',
      `${count} novos equipamentos foram adicionados à base`,
      {
        category: 'equipment',
        actionUrl: '/equipment',
        actionText: 'Ver Equipamentos'
      }
    );
  }

  // Gerenciar notificações
  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveToStorage();
    this.notifyListeners();
  }

  clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  clearByCategory(category: string): void {
    this.notifications = this.notifications.filter(n => n.category !== category);
    this.saveToStorage();
    this.notifyListeners();
  }

  // Getters
  getAllNotifications(): Notification[] {
    return [...this.notifications];
  }

  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  getNotificationsByCategory(category: string): Notification[] {
    return this.notifications.filter(n => n.category === category);
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getRecentNotifications(limit: number = 5): Notification[] {
    return this.notifications.slice(0, limit);
  }

  // Listeners
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Storage
  private saveToStorage(): void {
    try {
      const data = {
        notifications: this.notifications,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.storage_key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save notifications to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storage_key);
      if (data) {
        const parsed = JSON.parse(data);
        this.notifications = (parsed.notifications || []).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        
        // Cleanup old notifications (older than 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        this.notifications = this.notifications.filter(
          n => n.persistent || n.timestamp > thirtyDaysAgo
        );
      }
    } catch (error) {
      console.warn('Failed to load notifications from storage:', error);
      this.notifications = [];
    }
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility methods
  static formatTimeAgo(timestamp: Date): string {
    const now = new Date().getTime();
    const notificationTime = timestamp.getTime();
    const diffMinutes = (now - notificationTime) / (1000 * 60);

    if (diffMinutes < 1) {
      return 'Agora mesmo';
    } else if (diffMinutes < 60) {
      return `${Math.floor(diffMinutes)} min atrás`;
    } else if (diffMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h atrás`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days}d atrás`;
    }
  }

  static getNotificationColor(type: string): string {
    switch (type) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'info':
      default: return 'text-blue-600 dark:text-blue-400';
    }
  }

  static getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      case 'info':
      default: return 'ℹ';
    }
  }
}

import { useState, useEffect } from 'react';

// Hook para React
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    const manager = NotificationManager.getInstance();
    setNotifications(manager.getAllNotifications());
    
    const unsubscribe = manager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const manager = NotificationManager.getInstance();

  return {
    notifications,
    unreadCount: manager.getUnreadCount(),
    addNotification: manager.addNotification.bind(manager),
    info: manager.info.bind(manager),
    success: manager.success.bind(manager),
    warning: manager.warning.bind(manager),
    error: manager.error.bind(manager),
    removeNotification: manager.removeNotification.bind(manager),
    markAsRead: manager.markAsRead.bind(manager),
    markAllAsRead: manager.markAllAsRead.bind(manager),
    clearAll: manager.clearAll.bind(manager)
  };
}