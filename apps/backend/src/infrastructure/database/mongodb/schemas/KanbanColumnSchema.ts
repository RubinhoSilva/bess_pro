import { Schema, model } from 'mongoose';

export interface KanbanColumnDocument {
  _id: string;
  teamId: string;
  name: string;
  key: string;
  position: number;
  color?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const kanbanColumnSchema = new Schema<KanbanColumnDocument>(
  {
    teamId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    position: {
      type: Number,
      required: true,
      min: 0,
    },
    color: {
      type: String,
      trim: true,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'kanban_columns',
  }
);

// Índices compostos
kanbanColumnSchema.index({ teamId: 1, position: 1 });
kanbanColumnSchema.index({ teamId: 1, key: 1 }, { unique: true });
kanbanColumnSchema.index({ teamId: 1, isActive: 1 });

export const KanbanColumnModel = model<KanbanColumnDocument>('KanbanColumn', kanbanColumnSchema);