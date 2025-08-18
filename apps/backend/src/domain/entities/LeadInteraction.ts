export enum InteractionType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  WHATSAPP = 'whatsapp',
  PROPOSAL_SENT = 'proposal_sent',
  FOLLOW_UP = 'follow_up',
  NOTE = 'note',
  STAGE_CHANGE = 'stage_change'
}

export enum InteractionDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
  INTERNAL = 'internal'
}

export interface LeadInteractionProps {
  leadId: string;
  userId: string;
  type: InteractionType;
  direction: InteractionDirection;
  title: string;
  description: string;
  scheduledAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class LeadInteraction {
  private constructor(
    private readonly id: string,
    private leadId: string,
    private userId: string,
    private type: InteractionType,
    private direction: InteractionDirection,
    private title: string,
    private description: string,
    private scheduledAt?: Date,
    private completedAt?: Date,
    private metadata?: Record<string, any>,
    private createdAt?: Date,
    private updatedAt?: Date
  ) {}

  public getId(): string {
    return this.id;
  }

  public getLeadId(): string {
    return this.leadId;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getType(): InteractionType {
    return this.type;
  }

  public getDirection(): InteractionDirection {
    return this.direction;
  }

  public getTitle(): string {
    return this.title;
  }

  public getDescription(): string {
    return this.description;
  }

  public getScheduledAt(): Date | undefined {
    return this.scheduledAt;
  }

  public getCompletedAt(): Date | undefined {
    return this.completedAt;
  }

  public getMetadata(): Record<string, any> | undefined {
    return this.metadata;
  }

  public getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  public getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  public isCompleted(): boolean {
    return !!this.completedAt;
  }

  public markAsCompleted(): void {
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  public updateDescription(description: string): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  public updateMetadata(metadata: Record<string, any>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  public static create(props: Omit<LeadInteractionProps, 'createdAt' | 'updatedAt'>, id?: string): LeadInteraction {
    const now = new Date();
    const interactionId = id || this.generateId();
    
    return new LeadInteraction(
      interactionId,
      props.leadId,
      props.userId,
      props.type,
      props.direction,
      props.title,
      props.description,
      props.scheduledAt,
      props.completedAt,
      props.metadata,
      now,
      now
    );
  }

  public static fromProps(props: LeadInteractionProps, id: string): LeadInteraction {
    return new LeadInteraction(
      id,
      props.leadId,
      props.userId,
      props.type,
      props.direction,
      props.title,
      props.description,
      props.scheduledAt,
      props.completedAt,
      props.metadata,
      props.createdAt,
      props.updatedAt
    );
  }

  private static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}