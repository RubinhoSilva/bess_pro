import { Schema, Document, model } from 'mongoose';

export interface PasswordResetTokenDocument extends Document {
  email: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetTokenSchema = new Schema<PasswordResetTokenDocument>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
  used: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
  collection: 'password_reset_tokens',
});

// Compound index for efficient queries
passwordResetTokenSchema.index({ email: 1, used: 1 });
passwordResetTokenSchema.index({ token: 1, used: 1 });

export const PasswordResetTokenModel = model<PasswordResetTokenDocument>('PasswordResetToken', passwordResetTokenSchema);