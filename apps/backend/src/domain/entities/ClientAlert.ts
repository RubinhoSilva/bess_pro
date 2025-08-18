import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

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

export interface ClientAlertProps extends SoftDeleteProps {
  id?: string;
  clientId: string;
  userId: string;
  title: string;
  description?: string;
  alertDate: Date;
  alertType: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  isRecurring?: boolean;
  recurringPattern?: string; // 'daily', 'weekly', 'monthly', 'yearly'
  createdAt?: Date;
  updatedAt?: Date;
}

export class ClientAlert extends BaseEntity {
  private constructor(
    private readonly id: string,
    private readonly clientId: string,
    private readonly userId: string,
    private title: string,
    private description: string,
    private alertDate: Date,
    private alertType: AlertType,
    private priority: AlertPriority,
    private status: AlertStatus,
    private isRecurring: boolean,
    private recurringPattern: string | null,
    softDeleteProps?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }
  ) {
    super(softDeleteProps);
  }

  static create(props: ClientAlertProps): ClientAlert {
    const id = props.id || crypto.randomUUID();

    return new ClientAlert(
      id,
      props.clientId,
      props.userId,
      props.title,
      props.description || '',
      props.alertDate,
      props.alertType,
      props.priority,
      props.status,
      props.isRecurring || false,
      props.recurringPattern || null,
      {
        isDeleted: props.isDeleted,
        deletedAt: props.deletedAt,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date()
      }
    );
  }

  updateTitle(newTitle: string): void {
    this.title = newTitle;
    this.markAsUpdated();
  }

  updateDescription(newDescription: string): void {
    this.description = newDescription;
    this.markAsUpdated();
  }

  updateAlertDate(newDate: Date): void {
    this.alertDate = newDate;
    this.markAsUpdated();
  }

  updateAlertType(newType: AlertType): void {
    this.alertType = newType;
    this.markAsUpdated();
  }

  updatePriority(newPriority: AlertPriority): void {
    this.priority = newPriority;
    this.markAsUpdated();
  }

  updateStatus(newStatus: AlertStatus): void {
    this.status = newStatus;
    this.markAsUpdated();
  }

  markAsCompleted(): void {
    this.status = AlertStatus.COMPLETED;
    this.markAsUpdated();
  }

  markAsCancelled(): void {
    this.status = AlertStatus.CANCELLED;
    this.markAsUpdated();
  }

  updateRecurringSettings(isRecurring: boolean, pattern?: string): void {
    this.isRecurring = isRecurring;
    this.recurringPattern = pattern || null;
    this.markAsUpdated();
  }

  protected markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  isPending(): boolean {
    return this.status === AlertStatus.PENDING;
  }

  isCompleted(): boolean {
    return this.status === AlertStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === AlertStatus.CANCELLED;
  }

  isOverdue(): boolean {
    return this.isPending() && this.alertDate < new Date();
  }

  isDue(): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const alertDay = new Date(this.alertDate.getFullYear(), this.alertDate.getMonth(), this.alertDate.getDate());
    return this.isPending() && alertDay.getTime() === today.getTime();
  }

  // Getters
  getId(): string { return this.id; }
  getClientId(): string { return this.clientId; }
  getUserId(): string { return this.userId; }
  getTitle(): string { return this.title; }
  getDescription(): string { return this.description; }
  getAlertDate(): Date { return this.alertDate; }
  getAlertType(): AlertType { return this.alertType; }
  getPriority(): AlertPriority { return this.priority; }
  getStatus(): AlertStatus { return this.status; }
  getIsRecurring(): boolean { return this.isRecurring; }
  getRecurringPattern(): string | null { return this.recurringPattern; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }
}