import { Schema, model, Document, Types } from 'mongoose';

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  company?: string;
  role: string;
  teamId?: string;
  lastTeamId?: string; // Para histórico quando usuário é removido
  logoUrl?: string;
  status: 'active' | 'pending' | 'inactive' | 'removed';
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
  },
  passwordHash: { 
    type: String, 
    required: false // Permite usuários convidados sem senha inicial
  },
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  company: { 
    type: String, 
    trim: true,
    maxlength: 100,
  },
  role: { 
    type: String, 
    required: true, 
    enum: ['super_admin', 'team_owner', 'admin', 'vendedor', 'viewer'],
    default: 'vendedor',
  },
  teamId: {
    type: String,
    index: true
  },
  lastTeamId: {
    type: String,
    index: true
  },
  logoUrl: { 
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'URL da logo deve ser uma URL válida de imagem'
    }
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive', 'removed'],
    default: 'pending'
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
  collection: 'users',
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ teamId: 1 });
userSchema.index({ company: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ isDeleted: 1, deletedAt: -1 });

export const UserModel = model<UserDocument>('User', userSchema);