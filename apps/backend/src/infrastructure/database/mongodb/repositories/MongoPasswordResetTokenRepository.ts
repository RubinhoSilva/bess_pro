import { IPasswordResetTokenRepository, PasswordResetToken } from '../../../../domain/repositories/IPasswordResetTokenRepository';
import { Email } from '../../../../domain/value-objects/Email';
import { PasswordResetTokenModel } from '../schemas/PasswordResetTokenSchema';

export class MongoPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  async save(token: PasswordResetToken): Promise<PasswordResetToken> {
    const doc = new PasswordResetTokenModel(token);
    const savedDoc = await doc.save();
    
    return {
      email: savedDoc.email,
      userId: savedDoc.userId,
      token: savedDoc.token,
      expiresAt: savedDoc.expiresAt,
      used: savedDoc.used,
      createdAt: savedDoc.createdAt,
    };
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    const doc = await PasswordResetTokenModel.findOne({ 
      token, 
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!doc) return null;
    
    return {
      email: doc.email,
      userId: doc.userId,
      token: doc.token,
      expiresAt: doc.expiresAt,
      used: doc.used,
      createdAt: doc.createdAt,
    };
  }

  async findByEmailAndNotUsed(email: Email): Promise<PasswordResetToken | null> {
    const doc = await PasswordResetTokenModel.findOne({ 
      email: email.getValue(), 
      used: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    if (!doc) return null;
    
    return {
      email: doc.email,
      userId: doc.userId,
      token: doc.token,
      expiresAt: doc.expiresAt,
      used: doc.used,
      createdAt: doc.createdAt,
    };
  }

  async markAsUsed(token: string): Promise<void> {
    await PasswordResetTokenModel.findOneAndUpdate(
      { token },
      { used: true, updatedAt: new Date() }
    );
  }

  async deleteExpired(): Promise<void> {
    await PasswordResetTokenModel.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await PasswordResetTokenModel.deleteMany({ userId });
  }
}