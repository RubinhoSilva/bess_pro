import { Schema, model } from 'mongoose';

export interface TeamInviteDocument {
  _id: string;
  teamId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  invitedBy: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const teamInviteSchema = new Schema<TeamInviteDocument>(
  {
    teamId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['ADMIN', 'MEMBER', 'VIEWER'],
      default: 'MEMBER',
    },
    invitedBy: {
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
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index para auto-cleanup
    },
  },
  {
    timestamps: true,
    collection: 'team_invites',
  }
);

// Índice composto para evitar convites duplicados
teamInviteSchema.index({ teamId: 1, email: 1, status: 1 });

export const TeamInviteModel = model<TeamInviteDocument>('TeamInvite', teamInviteSchema);