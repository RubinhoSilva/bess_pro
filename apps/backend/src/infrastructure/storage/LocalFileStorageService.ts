import fs from 'fs/promises';
import path from 'path';
import { IFileStorageService } from '../../application/services/IFileStorageService';

export interface LocalStorageConfig {
  uploadDir: string;
  baseUrl: string;
}

export class LocalFileStorageService implements IFileStorageService {
  constructor(private config: LocalStorageConfig) {}

  async uploadFile(file: Buffer, filePath: string): Promise<string> {
    const fullPath = path.join(this.config.uploadDir, filePath);
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, file);
    
    return `${this.config.baseUrl}/${filePath}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.config.uploadDir, filePath);
    
    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      // File doesn't exist, ignore
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    // For local storage, just return the public URL
    return `${this.config.baseUrl}/${filePath}`;
  }

  async fileExists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.config.uploadDir, filePath);
    
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}