import { Schema, Document } from 'mongoose';
import { InteractionType, InteractionDirection } from '@/domain/entities/LeadInteraction';

export interface LeadInteractionDocument extends Document {
  leadId: string;
  userId: string;
  type: InteractionType;
  direction: InteractionDirection;
  title: string;
  description: string;
  scheduledAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const LeadInteractionSchema = new Schema<LeadInteractionDocument>({
  leadId: {
    type: String,
    required: true,
    index: true,
    ref: 'Lead'
  },
  userId: {
    type: String,
    required: true,
    index: true,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(InteractionType),
    index: true
  },
  direction: {
    type: String,
    required: true,
    enum: Object.values(InteractionDirection)
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  description: {
    type: String,
    required: true,
    maxLength: 2000
  },
  scheduledAt: {
    type: Date,
    index: true
  },
  completedAt: {
    type: Date,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  versionKey: false
});

// Compound indexes for efficient queries
LeadInteractionSchema.index({ leadId: 1, createdAt: -1 });
LeadInteractionSchema.index({ userId: 1, scheduledAt: 1 });
LeadInteractionSchema.index({ type: 1, createdAt: -1 });
LeadInteractionSchema.index({ scheduledAt: 1, completedAt: 1 });