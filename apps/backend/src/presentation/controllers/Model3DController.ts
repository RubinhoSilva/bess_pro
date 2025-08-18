import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import multer from 'multer';
import { Container } from '@/infrastructure/di/Container';
import { UploadModel3DUseCase } from '@/application';
import { ServiceTokens } from '@/infrastructure';

export class Model3DController extends BaseController {
  constructor(private container: Container) {
    super();
  }

  async upload(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { projectId, name, description } = req.body;
      const file = req.file;

      if (!file) {
        return this.badRequest(res, 'Arquivo é obrigatório');
      }

      // Upload file to storage
      const fileStorageService = this.container.resolve<any>(ServiceTokens.FILE_STORAGE_SERVICE);
      const fileName = `models/${userId}/${projectId}/${Date.now()}_${file.originalname}`;
      const modelPath = await fileStorageService.uploadFile(file.buffer, fileName, file.mimetype);

      const useCase = this.container.resolve<UploadModel3DUseCase>(ServiceTokens.UPLOAD_MODEL3D_USE_CASE);
      
      const result = await useCase.execute({
        userId,
        projectId,
        name,
        description,
        modelPath,
      });

      if (result.isSuccess) {
        return this.created(res, result.value);
      }

      return this.handleResult(res, result);
    } catch (error) {
      console.error('Upload model error:', error);
      return this.internalServerError(res, 'Erro ao fazer upload do modelo');
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const { projectId } = req.query;

      const modelRepository = this.container.resolve<any>(ServiceTokens.Model3DRepository);
      
      let models;
      if (projectId) {
        models = await modelRepository.findByProjectId(projectId as string, userId);
      } else {
        models = await modelRepository.findByUserId(userId);
      }

      const Model3DMapper = require('../../application/mappers/Model3DMapper').Model3DMapper;
      const modelDtos = Model3DMapper.toResponseDtoList(models);

      return this.ok(res, modelDtos);
    } catch (error) {
      console.error('List models error:', error);
      return this.internalServerError(res, 'Erro ao listar modelos');
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const modelId = req.params.id;

      const modelRepository = this.container.resolve<any>(ServiceTokens.Model3DRepository);
      const model = await modelRepository.findById(modelId);

      if (!model || !model.isOwnedBy(userId)) {
        return this.notFound(res, 'Modelo não encontrado');
      }

      const Model3DMapper = require('../../application/mappers/Model3DMapper').Model3DMapper;
      const modelDto = Model3DMapper.toResponseDto(model);

      return this.ok(res, modelDto);
    } catch (error) {
      console.error('Get model error:', error);
      return this.internalServerError(res, 'Erro ao buscar modelo');
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const modelId = req.params.id;

      const modelRepository = this.container.resolve<any>(ServiceTokens.Model3DRepository);
      await modelRepository.deleteWithFiles(modelId);

      return this.ok(res, { message: 'Modelo deletado com sucesso' });
    } catch (error) {
      console.error('Delete model error:', error);
      return this.internalServerError(res, 'Erro ao deletar modelo');
    }
  }

  async getSignedUrl(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const modelId = req.params.id;

      const modelRepository = this.container.resolve<any>(ServiceTokens.Model3DRepository);
      const model = await modelRepository.findById(modelId);

      if (!model || !model.isOwnedBy(userId)) {
        return this.notFound(res, 'Modelo não encontrado');
      }

      const fileStorageService = this.container.resolve<any>(ServiceTokens.FILE_STORAGE_SERVICE);
      const signedUrl = await fileStorageService.getSignedUrl(model.getModelPath(), 3600); // 1 hour

      return this.ok(res, { signedUrl });
    } catch (error) {
      console.error('Get signed URL error:', error);
      return this.internalServerError(res, 'Erro ao gerar URL do modelo');
    }
  }
}
