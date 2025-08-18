import multer from 'multer';
import { Request } from 'express';

export class FileUploadMiddleware {
  static model3D() {
    const storage = multer.memoryStorage();
    
    const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedMimes = [
        'model/obj',
        'model/gltf+json',
        'model/gltf-binary',
        'application/octet-stream', // For .glb and .fbx files
      ];
      
      const allowedExts = ['.obj', '.gltf', '.glb', '.fbx'];
      const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (allowedExts.includes(fileExt)) {
        cb(null, true);
      } else {
        cb(new Error('Formato de arquivo não suportado. Use: .obj, .gltf, .glb, .fbx'));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    });
  }

  static images() {
    const storage = multer.memoryStorage();
    
    const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos de imagem são permitidos'));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    });
  }
}
