export interface UploadModel3DCommand {
  userId: string;
  projectId: string;
  name: string;
  description?: string;
  modelPath: string;
}