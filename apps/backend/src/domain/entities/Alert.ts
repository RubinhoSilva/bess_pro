import { UserId } from "../value-objects/UserId";
import { BaseEntity } from "./base/BaseEntity";
import { SoftDeleteProps } from "./base/ISoftDeletable";

export enum AlertType {
  FOLLOW_UP = 'follow-up',
  REMINDER = 'reminder',
  DEADLINE = 'deadline',
  CALLBACK = 'callback'
}

export enum AlertStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface AlertProps extends SoftDeleteProps {
  id?: string;
  leadId: string;
  userId: string;
  type: AlertType;
  title: string;
  message: string;
  alertTime: Date;
  status?: AlertStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Alert extends BaseEntity {
  private constructor(
    private readonly id: string,
    private readonly leadId: string,
    private readonly userId: UserId,
    private type: AlertType,
    private title: string,
    private message: string,
    private alertTime: Date,
    private status: AlertStatus,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    isDeleted: boolean = false,
    deletedAt: Date | null = null
  ) {
    super({ isDeleted, deletedAt, createdAt, updatedAt });
  }

  static create(props: AlertProps): Alert {
    const id = props.id || crypto.randomUUID();
    const userId = UserId.create(props.userId);

    return new Alert(
      id,
      props.leadId,
      userId,
      props.type,
      props.title,
      props.message,
      props.alertTime,
      props.status || AlertStatus.ACTIVE,
      props.createdAt || new Date(),
      props.updatedAt || new Date(),
      props.isDeleted || false,
      props.deletedAt || null
    );
  }

  markAsCompleted(): void {
    this.status = AlertStatus.COMPLETED;
    this.markAsUpdated();
  }

  markAsCancelled(): void {
    this.status = AlertStatus.CANCELLED;
    this.markAsUpdated();
  }

  updateMessage(newMessage: string): void {
    this.message = newMessage;
    this.markAsUpdated();
  }

  updateTitle(newTitle: string): void {
    this.title = newTitle;
    this.markAsUpdated();
  }

  updateAlertTime(newTime: Date): void {
    this.alertTime = newTime;
    this.markAsUpdated();
  }

  updateType(newType: AlertType): void {
    this.type = newType;
    this.markAsUpdated();
  }

  updateStatus(newStatus: AlertStatus): void {
    this.status = newStatus;
    this.markAsUpdated();
  }

  protected markAsUpdated(): void {
    this.updatedAt = new Date();
    super.markAsUpdated();
  }

  isOwnedBy(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  isPastDue(): boolean {
    return this.alertTime < new Date() && this.status === AlertStatus.ACTIVE;
  }

  isUpcoming(minutesAhead: number = 30): boolean {
    const now = new Date();
    const upcomingTime = new Date(now.getTime() + (minutesAhead * 60 * 1000));
    return this.alertTime <= upcomingTime && this.alertTime > now && this.status === AlertStatus.ACTIVE;
  }

  // Getters
  getId(): string { return this.id; }
  getLeadId(): string { return this.leadId; }
  getUserId(): UserId { return this.userId; }
  getType(): AlertType { return this.type; }
  getTitle(): string { return this.title; }
  getMessage(): string { return this.message; }
  getAlertTime(): Date { return this.alertTime; }
  getStatus(): AlertStatus { return this.status; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
}