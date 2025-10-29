import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateCompanyProfileUseCase } from '../../application/use-cases/company-profile/CreateCompanyProfileUseCase';
import { GetCompanyProfileUseCase } from '../../application/use-cases/company-profile/GetCompanyProfileUseCase';
import { UpdateCompanyProfileUseCase } from '../../application/use-cases/company-profile/UpdateCompanyProfileUseCase';
import { DeleteCompanyProfileUseCase } from '../../application/use-cases/company-profile/DeleteCompanyProfileUseCase';
import { UploadCompanyLogoUseCase, UploadCompanyLogoRequest } from '../../application/use-cases/company-profile/UploadCompanyLogoUseCase';
import { DeleteCompanyLogoUseCase } from '../../application/use-cases/company-profile/DeleteCompanyLogoUseCase';
import type {
  CreateCompanyProfileRequest as SharedCreateCompanyProfileRequest,
  UpdateCompanyProfileRequest as SharedUpdateCompanyProfileRequest,
  CompanyProfileResponse as SharedCompanyProfileResponse,
  CompanyProfileListResponse as SharedCompanyProfileListResponse,
  UploadCompanyLogoRequest as SharedUploadCompanyLogoRequest,
  UploadCompanyLogoResponse as SharedUploadCompanyLogoResponse
} from '@bess-pro/shared';

export class CompanyProfileController extends BaseController {
  constructor(
    private createCompanyProfileUseCase: CreateCompanyProfileUseCase,
    private getCompanyProfileUseCase: GetCompanyProfileUseCase,
    private updateCompanyProfileUseCase: UpdateCompanyProfileUseCase,
    private deleteCompanyProfileUseCase: DeleteCompanyProfileUseCase,
    private uploadCompanyLogoUseCase: UploadCompanyLogoUseCase,
    private deleteCompanyLogoUseCase: DeleteCompanyLogoUseCase
  ) {
    super();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { teamId } = (req as any).user;
      const result = await this.createCompanyProfileUseCase.execute(teamId, req.body);
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }


  async getMy(req: Request, res: Response): Promise<Response> {
    try {
      const { teamId } = (req as any).user;
      const result = await this.getCompanyProfileUseCase.execute(teamId);
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }

  async updateMy(req: Request, res: Response): Promise<Response> {
    try {
      const { teamId } = (req as any).user;
      
      // Verificar se CompanyProfile já existe
      const existingProfileResult = await this.getCompanyProfileUseCase.execute(teamId);

      let result;
      if (existingProfileResult.value == null) {
        // Se não existe, criar novo
        result = await this.createCompanyProfileUseCase.execute(teamId, req.body);
      } else {
        // Se existe, atualizar
        result = await this.updateCompanyProfileUseCase.execute(teamId, req.body);
      }
      
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }

  async deleteMy(req: Request, res: Response): Promise<Response> {
    try {
      const { teamId } = (req as any).user;
      const hardDelete = req.query.hard === 'true';
      const result = await this.deleteCompanyProfileUseCase.execute(teamId, hardDelete);
      
      if (result.isSuccess) {
        return res.status(204).send();
      }
      
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }

  async uploadLogo(req: Request, res: Response): Promise<Response> {
    try {
      const { teamId } = (req as any).user;
      
      if (!req.file) {
        return this.badRequest(res, 'Arquivo não fornecido');
      }

      // Buscar CompanyProfile do Team para obter o ID
      const companyProfileResult = await this.getCompanyProfileUseCase.execute(teamId);
      if (!companyProfileResult.isSuccess || !companyProfileResult.value) {
        return this.badRequest(res, 'Team não possui perfil de empresa');
      }

      const uploadRequest: UploadCompanyLogoRequest = {
        file: req.file,
        companyProfileId: companyProfileResult.value.id
      };

      const result = await this.uploadCompanyLogoUseCase.execute(uploadRequest);
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }

  async deleteLogo(req: Request, res: Response): Promise<Response> {
    try {
      const { teamId } = (req as any).user;
      
      // Buscar CompanyProfile do Team para obter o ID
      const companyProfileResult = await this.getCompanyProfileUseCase.execute(teamId);
      if (!companyProfileResult.isSuccess || !companyProfileResult.value) {
        return this.badRequest(res, 'Team não possui perfil de empresa');
      }

      const result = await this.deleteCompanyLogoUseCase.execute(companyProfileResult.value.id);
      
      if (result.isSuccess) {
        return res.status(204).send();
      }
      
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }
}