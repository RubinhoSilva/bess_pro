import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateCompanyProfileUseCase } from '../../application/use-cases/company-profile/CreateCompanyProfileUseCase';
import { GetCompanyProfileUseCase } from '../../application/use-cases/company-profile/GetCompanyProfileUseCase';
import { GetCompanyProfilesUseCase } from '../../application/use-cases/company-profile/GetCompanyProfilesUseCase';
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
    private getCompanyProfilesUseCase: GetCompanyProfilesUseCase,
    private updateCompanyProfileUseCase: UpdateCompanyProfileUseCase,
    private deleteCompanyProfileUseCase: DeleteCompanyProfileUseCase,
    private uploadCompanyLogoUseCase: UploadCompanyLogoUseCase,
    private deleteCompanyLogoUseCase: DeleteCompanyLogoUseCase
  ) {
    super();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.createCompanyProfileUseCase.execute(req.body);
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const { page, pageSize } = this.extractPagination(req);
      const activeOnly = req.query.activeOnly !== 'false';
      const searchTerm = req.query.searchTerm as string;

      if (req.query.all === 'true') {
        const result = await this.getCompanyProfilesUseCase.executeAll(activeOnly);
        return this.handleResult(res, result);
      }

      const result = await this.getCompanyProfilesUseCase.execute(
        page,
        pageSize,
        activeOnly,
        searchTerm
      );
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const companyProfileId = req.params.id;
      const result = await this.getCompanyProfileUseCase.execute(companyProfileId);
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const companyProfileId = req.params.id;
      const result = await this.updateCompanyProfileUseCase.execute(companyProfileId, req.body);
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const companyProfileId = req.params.id;
      const hardDelete = req.query.hard === 'true';
      const result = await this.deleteCompanyProfileUseCase.execute(companyProfileId, hardDelete);
      
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
      const companyProfileId = req.params.id;
      
      if (!req.file) {
        return this.badRequest(res, 'Arquivo não fornecido');
      }

      const uploadRequest: UploadCompanyLogoRequest = {
        file: req.file,
        companyProfileId
      };

      const result = await this.uploadCompanyLogoUseCase.execute(uploadRequest);
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }

  async deleteLogo(req: Request, res: Response): Promise<Response> {
    try {
      const companyProfileId = req.params.id;
      const result = await this.deleteCompanyLogoUseCase.execute(companyProfileId);
      
      if (result.isSuccess) {
        return res.status(204).send();
      }
      
      return this.handleResult(res, result);
    } catch (error: any) {
      return this.internalServerError(res, error.message);
    }
  }
}