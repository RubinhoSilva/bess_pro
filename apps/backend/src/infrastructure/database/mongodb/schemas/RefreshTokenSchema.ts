import { Schema, model, Document } from 'mongoose';

export interface RefreshTokenDocument extends Document {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  isRevoked: boolean;
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>({
  _id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  deviceInfo: {
    type: String,
    required: true,
    default: 'Unknown Device'
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: false,
  versionKey: false
});

// Índices compostos para otimização de consultas
refreshTokenSchema.index({ userId: 1, isRevoked: 1, expiresAt: 1 });
refreshTokenSchema.index({ userId: 1, deviceInfo: 1, ipAddress: 1, userAgent: 1 });
refreshTokenSchema.index({ expiresAt: 1, isRevoked: 1 });
refreshTokenSchema.index({ createdAt: 1, ipAddress: 1 });

// TTL index para limpeza automática de tokens expirados
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 * 7 }); // 7 dias após expiração

export const RefreshTokenModel = model<RefreshTokenDocument>('RefreshToken', refreshTokenSchema);