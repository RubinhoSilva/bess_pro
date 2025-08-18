import { Types, Schema, model } from "mongoose";

export interface Model3DDocument extends Document {
  _id: string;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  name: string;
  description?: string;
  modelPath: string;
  fileSize?: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const model3dSchema = new Schema<Model3DDocument>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true,
  },
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 500,
  },
  modelPath: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v: string) {
        return /\.(obj|gltf|glb|fbx)$/i.test(v);
      },
      message: 'Formato de arquivo não suportado'
    }
  },
  fileSize: { 
    type: Number,
    min: 0,
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
  collection: 'models_3d',
});

// Indexes
model3dSchema.index({ userId: 1, name: 1 });
model3dSchema.index({ projectId: 1 });
model3dSchema.index({ userId: 1, createdAt: -1 });
model3dSchema.index({ isDeleted: 1 });
model3dSchema.index({ isDeleted: 1, deletedAt: -1 });

export const Model3DModel = model<Model3DDocument>('Model3D', model3dSchema);