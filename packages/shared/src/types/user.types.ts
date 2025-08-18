export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: UserRole;
  subscription: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager'
}

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELED = 'canceled'
}
