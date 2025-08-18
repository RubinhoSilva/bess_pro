import { Schema, model, Document } from 'mongoose';

export interface InvitationTokenDocument extends Document {
  token: string;
  email: string;
  userId: string;
  teamId: string;
  inviterId?: string;
  role?: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const invitationTokenSchema = new Schema<InvitationTokenDocument>({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  teamId: {
    type: String,
    required: true,
    index: true,
  },
  inviterId: {
    type: String,
    required: false,
    index: true,
  },
  role: {
    type: String,
    required: false,
    enum: ['admin', 'vendedor', 'viewer'],
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  used: {
    type: Boolean,
    default: false,
    index: true,
  }
}, {
  timestamps: true,
  collection: 'invitation_tokens',
});

// TTL index - remove expired tokens automatically
invitationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const InvitationTokenModel = model<InvitationTokenDocument>('InvitationToken', invitationTokenSchema);