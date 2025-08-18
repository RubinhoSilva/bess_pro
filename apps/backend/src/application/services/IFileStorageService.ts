export interface IFileStorageService {
  uploadFile(file: Buffer, path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  getSignedUrl(path: string, expiresIn: number): Promise<string>;
  fileExists(path: string): Promise<boolean>;
}
