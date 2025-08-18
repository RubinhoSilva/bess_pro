import { Email } from '../value-objects/Email';

export interface PasswordResetToken {
  email: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface IPasswordResetTokenRepository {
  save(token: PasswordResetToken): Promise<PasswordResetToken>;
  findByToken(token: string): Promise<PasswordResetToken | null>;
  findByEmailAndNotUsed(email: Email): Promise<PasswordResetToken | null>;
  markAsUsed(token: string): Promise<void>;
  deleteExpired(): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}