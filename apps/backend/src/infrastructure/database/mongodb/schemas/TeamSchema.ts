import { Schema, model } from 'mongoose';

export interface TeamDocument {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerEmail: string;
  isActive: boolean;
  planType: string;
  maxUsers: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<TeamDocument>({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  ownerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  planType: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    default: 'basic'
  },
  maxUsers: {
    type: Number,
    default: 10,
    min: 1,
    max: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'teams'
});

// Indexes
TeamSchema.index({ ownerId: 1 });
TeamSchema.index({ isActive: 1 });
TeamSchema.index({ planType: 1 });
TeamSchema.index({ isDeleted: 1 });
TeamSchema.index({ isDeleted: 1, deletedAt: -1 });

export const TeamModel = model<TeamDocument>('Team', TeamSchema);