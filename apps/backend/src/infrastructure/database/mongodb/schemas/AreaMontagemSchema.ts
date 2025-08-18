import { Types, Schema, model } from "mongoose";

export interface AreaMontagemDocument extends Document {
  _id: string;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  nome: string;
  coordinates: Record<string, any>;
  moduleLayout: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const areaMontagemSchema = new Schema<AreaMontagemDocument>({
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true,
    index: true,
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true,
  },
  nome: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  coordinates: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
  moduleLayout: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
}, {
  timestamps: true,
  collection: 'areas_montagem',
});

// Indexes
areaMontagemSchema.index({ projectId: 1, nome: 1 }, { unique: true });
areaMontagemSchema.index({ userId: 1 });

export const AreaMontagemModel = model<AreaMontagemDocument>('AreaMontagem', areaMontagemSchema);