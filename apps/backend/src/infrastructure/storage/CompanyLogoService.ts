import { S3FileStorageService, S3Config } from './S3FileStorageService';
import { IFileStorageService } from '../../application/services/IFileStorageService';

export interface UploadResult {
  Location: string;
  Key: string;
  ETag?: string;
  Bucket?: string;
}

export class CompanyLogoService extends S3FileStorageService {
  constructor(config: S3Config) {
    super(config);
  }

  async uploadLogo(file: Express.Multer.File, folder: string = 'company-logos'): Promise<UploadResult> {
    // Gerar nome único para o arquivo
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Validar tipo de arquivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Tipo de arquivo inválido. Apenas imagens são permitidas');
    }

    // Validar tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo permitido: 5MB');
    }

    // Fazer upload usando o método da classe pai
    const url = await super.uploadFile(file.buffer, filePath, file.mimetype);

    // Retornar objeto completo com informações do upload
    return {
      Location: url,
      Key: filePath,
      ETag: undefined, // Poderia ser retornado pelo S3 se necessário
      Bucket: (this as any).config.bucket
    };
  }

  async deleteFile(keyOrPath: string): Promise<void> {
    // Se for uma URL completa, extrair apenas a chave
    let key = keyOrPath;
    
    if (keyOrPath.startsWith('http')) {
      // Extrair chave da URL S3 ou CloudFront
      const urlParts = keyOrPath.split('/');
      key = urlParts.slice(-2).join('/'); // Pega os últimos 2 segmentos (pasta/arquivo)
    }

    await super.deleteFile(key);
  }

  async optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    // TODO: Implementar otimização de imagem
    // Por enquanto, retorna o buffer original
    // Futuramente pode usar sharp ou similar para otimizar
    return buffer;
  }

  generateThumbnail(buffer: Buffer, mimeType: string): Buffer {
    // TODO: Implementar geração de thumbnail
    // Por enquanto, retorna o buffer original
    // Futuramente pode usar sharp para gerar thumbnail
    return buffer;
  }

  validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Tipo de arquivo não permitido: ${file.mimetype}`);
    }
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`Extensão de arquivo não permitida: ${fileExtension}`);
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: 5MB, atual: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  extractKeyFromUrl(url: string): string {
    // Extrair chave da URL S3 ou CloudFront
    const urlParts = url.split('/');
    return urlParts.slice(-2).join('/'); // Pega os últimos 2 segmentos (pasta/arquivo)
  }
}