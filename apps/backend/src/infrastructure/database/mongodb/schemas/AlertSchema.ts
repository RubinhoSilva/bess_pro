import { Types, Schema, model, Document } from "mongoose";

export interface AlertDocument extends Document {
  _id: Types.ObjectId;
  leadId: Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  alertTime: Date;
  status: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<AlertDocument>({
  leadId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Lead', 
    required: true,
    index: true,
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['follow-up', 'reminder', 'deadline', 'callback'],
    index: true,
  },
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200,
  },
  message: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 1000,
  },
  alertTime: {
    type: Date,
    required: true,
    index: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
    index: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
}, {
  timestamps: true,
  collection: 'alerts',
});

// Indexes
alertSchema.index({ userId: 1, leadId: 1 });
alertSchema.index({ userId: 1, status: 1 });
alertSchema.index({ userId: 1, alertTime: 1 });
alertSchema.index({ userId: 1, type: 1 });
alertSchema.index({ userId: 1, status: 1, alertTime: 1 });
alertSchema.index({ leadId: 1, status: 1 });
alertSchema.index({ isDeleted: 1 });
alertSchema.index({ isDeleted: 1, deletedAt: -1 });

export const AlertModel = model<AlertDocument>('Alert', alertSchema);