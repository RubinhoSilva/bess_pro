export interface ClientAlert {
  id: string;
  clientId: string;
  title: string;
  description: string;
  alertDate: string; // ISO string
  alertType: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  isRecurring: boolean;
  recurringPattern: string | null;
  isOverdue: boolean;
  isDue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientAlertInput {
  clientId: string;
  title: string;
  description?: string;
  alertDate: string; // ISO string
  alertType: AlertType;
  priority: AlertPriority;
  isRecurring?: boolean;
  recurringPattern?: string;
}

export interface UpdateClientAlertInput {
  title?: string;
  description?: string;
  alertDate?: string; // ISO string
  alertType?: AlertType;
  priority?: AlertPriority;
  status?: AlertStatus;
  isRecurring?: boolean;
  recurringPattern?: string;
}

export enum AlertType {
  FOLLOW_UP = 'follow_up',
  TASK = 'task',
  REMINDER = 'reminder',
  DEADLINE = 'deadline'
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum AlertStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ClientAlertFilters {
  clientId?: string;
  alertType?: AlertType;
  priority?: AlertPriority;
  status?: AlertStatus;
  dateFrom?: string;
  dateTo?: string;
  isOverdue?: boolean;
}

export interface DashboardAlerts {
  dueAlerts: ClientAlert[];
  overdueAlerts: ClientAlert[];
  upcomingAlerts: ClientAlert[];
}

// Tipos paginados
export interface PaginatedClientAlerts {
  data: ClientAlert[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
    totalCount?: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export interface OffsetPaginatedClientAlerts {
  data: ClientAlert[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

export interface PaginatedDashboardAlerts {
  dueAlerts: PaginatedClientAlerts;
  overdueAlerts: PaginatedClientAlerts;
  upcomingAlerts: PaginatedClientAlerts;
}