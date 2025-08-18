export interface RepositoryEvent {
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface IRepositoryEventPublisher {
  publish(event: RepositoryEvent): Promise<void>;
  subscribe(entityType: string, callback: (event: RepositoryEvent) => void): void;
}