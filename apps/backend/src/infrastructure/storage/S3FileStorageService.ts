import AWS from 'aws-sdk';
import { IFileStorageService } from '../../application/services/IFileStorageService';

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  cloudFrontUrl?: string;
}

export class S3FileStorageService implements IFileStorageService {
  private s3: AWS.S3;

  constructor(private config: S3Config) {
    this.s3 = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
    });
  }

  async uploadFile(file: Buffer, path: string, contentType?: string): Promise<string> {
    const params = {
      Bucket: this.config.bucket,
      Key: path,
      Body: file,
      ContentType: contentType,
    };

    const result = await this.s3.upload(params).promise();
    
    // Return CloudFront URL if available, otherwise S3 URL
    if (this.config.cloudFrontUrl) {
      return `${this.config.cloudFrontUrl}/${path}`;
    }
    
    return result.Location;
  }

  async deleteFile(path: string): Promise<void> {
    const params = {
      Bucket: this.config.bucket,
      Key: path,
    };

    await this.s3.deleteObject(params).promise();
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const params = {
      Bucket: this.config.bucket,
      Key: path,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrl('getObject', params);
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await this.s3.headObject({
        Bucket: this.config.bucket,
        Key: path,
      }).promise();
      return true;
    } catch (error) {
      return false;
    }
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<string> {
    const params = {
      Bucket: this.config.bucket,
      CopySource: `${this.config.bucket}/${sourcePath}`,
      Key: destinationPath,
    };

    await this.s3.copyObject(params).promise();
    
    if (this.config.cloudFrontUrl) {
      return `${this.config.cloudFrontUrl}/${destinationPath}`;
    }
    
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${destinationPath}`;
  }

  async listFiles(prefix: string): Promise<string[]> {
    const params = {
      Bucket: this.config.bucket,
      Prefix: prefix,
    };

    const result = await this.s3.listObjectsV2(params).promise();
    return result.Contents?.map(obj => obj.Key!) || [];
  }
}