import { Types, Schema, model } from "mongoose";

export interface GoogleApiKeyDocument extends Document {
  _id: string;
  userId: Types.ObjectId;
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const googleApiKeySchema = new Schema<GoogleApiKeyDocument>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true,
    index: true,
  },
  apiKey: { 
    type: String, 
    required: true,
    minlength: 10,
  },
}, {
  timestamps: true,
  collection: 'google_api_keys',
});

export const GoogleApiKeyModel = model<GoogleApiKeyDocument>('GoogleApiKey', googleApiKeySchema);