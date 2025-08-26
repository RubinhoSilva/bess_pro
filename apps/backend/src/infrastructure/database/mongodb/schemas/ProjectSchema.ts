import { Schema, model, Document, Types } from 'mongoose';

export interface ProjectDocument extends Document {
  _id: Types.ObjectId;
  projectName: string;
  projectData: Record<string, any>;
  savedAt: Date;
  userId: Types.ObjectId;
  projectType: 'pv' | 'bess' | 'hybrid';
  address?: string;
  leadId?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectDocument>({
  projectName: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  projectData: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
  savedAt: { 
    type: Date, 
    default: Date.now 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true,
  },
  projectType: { 
    type: String, 
    required: true, 
    enum: ['pv', 'bess', 'hybrid'],
  },
  address: { 
    type: String, 
    trim: true,
    maxlength: 200,
  },
  leadId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Lead',
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
  collection: 'projects',
});

// Indexes
projectSchema.index({ userId: 1, projectName: 1 }); // Removido unique: true para permitir nomes duplicados
projectSchema.index({ userId: 1, projectType: 1 });
projectSchema.index({ userId: 1, savedAt: -1 });
projectSchema.index({ leadId: 1 });
projectSchema.index({ 'projectData.location': '2dsphere' });
projectSchema.index({ isDeleted: 1 });
projectSchema.index({ isDeleted: 1, deletedAt: -1 });

export const ProjectModel = model<ProjectDocument>('Project', projectSchema);